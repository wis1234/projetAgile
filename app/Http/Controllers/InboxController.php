<?php

namespace App\Http\Controllers;

use App\Events\PrivateInboxMessageSent;
use App\Models\PrivateConversation;
use App\Models\PrivateInboxMessage;
use App\Models\User;
use App\Services\InboxCrypto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InboxController extends Controller
{
    public function users(Request $request): JsonResponse
    {
        $user = $request->user();

        $sharedProjectIds = $user->projects()->pluck('projects.id');

        // NB : profile_photo_url est un accessor calculé depuis profile_photo_path, pas une colonne.
        $contacts = User::query()
            ->select(['users.id', 'users.name', 'users.email', 'users.profile_photo_path'])
            ->where('users.id', '!=', $user->id)
            ->whereHas('projects', function ($query) use ($sharedProjectIds) {
                $query->whereIn('projects.id', $sharedProjectIds);
            })
            ->orderBy('users.name')
            ->get();

        $payload = $contacts->map(function (User $contact) use ($user) {
            $conversation = PrivateConversation::between((int) $user->id, (int) $contact->id);
            $lastMessage = $conversation ? $conversation->latestMessage() : null;

            return [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'profile_photo_url' => $contact->profile_photo_url,
                'last_message' => $lastMessage ? [
                    'id' => $lastMessage->id,
                    'sender_id' => $lastMessage->sender_id,
                    'receiver_id' => $lastMessage->receiver_id,
                    'content' => $lastMessage->decryptedContent(),
                    'created_at' => $lastMessage->created_at?->toIso8601String(),
                    'is_me' => (int) $lastMessage->sender_id === (int) $user->id,
                ] : null,
            ];
        });

        return response()->json($payload);
    }

    public function messages(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        if (!$this->canChat($authUser, $user)) {
            return response()->json(['message' => 'Vous ne pouvez pas discuter avec cet utilisateur.'], 403);
        }

        $conversation = PrivateConversation::ensureBetween((int) $authUser->id, (int) $user->id);

        $messages = $conversation->messages()
            ->with(['sender:id,name,profile_photo_path', 'receiver:id,name,profile_photo_path'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function (PrivateInboxMessage $message) use ($authUser) {
                return [
                    'id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'content' => $message->decryptedContent(),
                    'created_at' => $message->created_at?->toIso8601String(),
                    'is_me' => (int) $message->sender_id === (int) $authUser->id,
                ];
            });

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'user_a_id' => $conversation->user_a_id,
                'user_b_id' => $conversation->user_b_id,
            ],
            'messages' => $messages,
        ]);
    }

    public function storeMessage(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        if (!$this->canChat($authUser, $user)) {
            return response()->json(['message' => 'Vous ne pouvez pas envoyer un message à cet utilisateur.'], 403);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'min:1', 'max:5000'],
        ]);

        $conversation = PrivateConversation::ensureBetween((int) $authUser->id, (int) $user->id);
        $encrypted = InboxCrypto::encrypt(trim($validated['content']), (int) $authUser->id, (int) $user->id);

        $message = PrivateInboxMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $authUser->id,
            'receiver_id' => $user->id,
            'content_ciphertext' => $encrypted['ciphertext'],
            'iv' => $encrypted['iv'],
            'tag' => $encrypted['tag'],
        ]);

        $conversation->update(['last_message_at' => now()]);

        $payload = [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'receiver_id' => $message->receiver_id,
            'content' => $message->decryptedContent(),
            'created_at' => $message->created_at?->toIso8601String(),
            'is_me' => true,
            'encrypted' => [
                'ciphertext' => $message->content_ciphertext,
                'iv' => $message->iv,
                'tag' => $message->tag,
            ],
        ];

        broadcast(new PrivateInboxMessageSent(
            conversationId: $conversation->id,
            senderId: $authUser->id,
            receiverId: $user->id,
            message: $payload,
        ))->toOthers();

        return response()->json([
            'message' => $payload,
        ]);
    }

    private function canChat(User $currentUser, User $targetUser): bool
    {
        if ((int) $currentUser->id === (int) $targetUser->id) {
            return false;
        }

        $sharedProjects = $currentUser->projects()
            ->whereIn('projects.id', $targetUser->projects()->select('projects.id'))
            ->exists();

        return $sharedProjects;
    }
}
