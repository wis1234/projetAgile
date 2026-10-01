<?php

namespace App\Http\Controllers;

use App\Events\PrivateInboxMessageSent;
use App\Events\PrivateInboxMessagesRead;
use App\Models\PrivateConversation;
use App\Models\PrivateInboxMessage;
use App\Models\Sticker;
use App\Models\User;
use App\Services\InboxCrypto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InboxController extends Controller
{
    private const CONTACTS_PER_PAGE = 20;
    private const MESSAGES_PER_PAGE = 30;

    /**
     * Liste paginée des conversations (contacts de projets partagés), triée comme WhatsApp :
     * dernières conversations d'abord, puis les contacts sans message par ordre alphabétique.
     */
    public function users(Request $request): JsonResponse
    {
        $me = $request->user();
        $page = max(1, (int) $request->query('page', 1));
        $search = trim((string) $request->query('search', ''));

        $myProjectIds = $me->projects()->pluck('projects.id');

        $contactsQuery = User::query()
            ->select(['users.id', 'users.name', 'users.email', 'users.profile_photo_path'])
            ->where('users.id', '!=', $me->id)
            ->whereHas('projects', fn ($q) => $q->whereIn('projects.id', $myProjectIds));

        if ($search !== '') {
            $contactsQuery->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $contacts = $contactsQuery->get();
        $contactIds = $contacts->pluck('id');

        // Conversations existantes, indexées par id du contact
        $conversations = PrivateConversation::query()
            ->where(fn ($q) => $q->where('user_a_id', $me->id)->orWhere('user_b_id', $me->id))
            ->get()
            ->keyBy(fn ($c) => (int) $c->user_a_id === (int) $me->id ? (int) $c->user_b_id : (int) $c->user_a_id);

        // Dernier message de chaque conversation (1 requête, pas 1 par contact)
        $lastIds = PrivateInboxMessage::query()
            ->whereIn('conversation_id', $conversations->pluck('id'))
            ->selectRaw('MAX(id) as id')
            ->groupBy('conversation_id')
            ->pluck('id');
        $lastByConversation = PrivateInboxMessage::query()
            ->with('conversation')
            ->whereIn('id', $lastIds)
            ->get()
            ->keyBy('conversation_id');

        $unread = PrivateInboxMessage::query()
            ->where('receiver_id', $me->id)
            ->whereNull('read_at')
            ->selectRaw('sender_id, COUNT(*) as c')
            ->groupBy('sender_id')
            ->pluck('c', 'sender_id');

        $sharedProject = $this->sharedProjectMap($myProjectIds, $contactIds);

        $rows = $contacts->map(function (User $contact) use ($me, $conversations, $lastByConversation, $unread, $sharedProject) {
            $conversation = $conversations->get($contact->id);
            $last = $conversation ? $lastByConversation->get($conversation->id) : null;

            return [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'profile_photo_url' => $contact->profile_photo_url,
                'shared_project_id' => $sharedProject[$contact->id] ?? null,
                'unread_count' => (int) ($unread[$contact->id] ?? 0),
                'last_message' => $last ? $last->toPayload((int) $me->id) : null,
                '_sort' => $last?->created_at?->timestamp ?? 0,
            ];
        })->sort(function ($a, $b) {
            return [$b['_sort'], mb_strtolower($a['name'])] <=> [$a['_sort'], mb_strtolower($b['name'])];
        })->values();

        $total = $rows->count();
        $slice = $rows->slice(($page - 1) * self::CONTACTS_PER_PAGE, self::CONTACTS_PER_PAGE)
            ->map(function ($row) {
                unset($row['_sort']);
                return $row;
            })->values();

        return response()->json([
            'data' => $slice,
            'page' => $page,
            'next_page' => $page * self::CONTACTS_PER_PAGE < $total ? $page + 1 : null,
            'total' => $total,
            'unread_total' => (int) $unread->sum(),
        ]);
    }

    /**
     * Fil de conversation paginé par curseur : ?before={id} charge les messages plus anciens
     * (chargement progressif quand on remonte, comme WhatsApp).
     */
    public function messages(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        if (!$this->canChat($me, $user)) {
            return response()->json(['message' => 'Vous ne pouvez pas discuter avec cet utilisateur.'], 403);
        }

        $conversation = PrivateConversation::ensureBetween((int) $me->id, (int) $user->id);
        $before = (int) $request->query('before', 0);
        $limit = min(50, max(10, (int) $request->query('limit', self::MESSAGES_PER_PAGE)));

        $query = $conversation->messages()
            ->with(['conversation', 'replyTo'])
            ->orderByDesc('id');
        if ($before > 0) {
            $query->where('id', '<', $before);
        }

        $rows = $query->limit($limit + 1)->get();
        $hasMore = $rows->count() > $limit;
        $messages = $rows->take($limit)->reverse()->values()
            ->map(fn (PrivateInboxMessage $m) => $m->toPayload((int) $me->id));

        // Première page = la conversation vient d'être ouverte : tout ce qui m'est destiné passe en « lu »
        if ($before === 0) {
            $this->markAsRead($me, $user);
        }

        $myProjectIds = $me->projects()->pluck('projects.id');

        return response()->json([
            'conversation' => ['id' => $conversation->id],
            'contact' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile_photo_url' => $user->profile_photo_url,
                'job_title' => $user->job_title,
                'shared_project_id' => $this->sharedProjectMap($myProjectIds, collect([$user->id]))[$user->id] ?? null,
            ],
            'messages' => $messages,
            'has_more' => $hasMore,
        ]);
    }

    /** Envoi : texte, photo, vidéo, message vocal ou sticker du pack (avec réponse possible). */
    public function storeMessage(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        if (!$this->canChat($me, $user)) {
            return response()->json(['message' => 'Vous ne pouvez pas envoyer un message à cet utilisateur.'], 403);
        }

        $validated = $request->validate([
            'content' => ['nullable', 'string', 'max:5000'],
            'type' => ['nullable', 'in:text,image,audio,video'],
            'attachment' => [
                'nullable', 'file', 'max:20480',
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav,audio/x-m4a,video/mp4,video/webm,video/quicktime',
            ],
            'sticker_id' => ['nullable', 'integer'],
            'reply_to_id' => ['nullable', 'integer'],
        ]);

        $content = trim((string) ($validated['content'] ?? ''));

        if ($content === '' && !$request->hasFile('attachment') && empty($validated['sticker_id'])) {
            return response()->json(['message' => 'Écrivez un message ou joignez un fichier.'], 422);
        }

        $conversation = PrivateConversation::ensureBetween((int) $me->id, (int) $user->id);

        $replyToId = null;
        if (!empty($validated['reply_to_id'])) {
            $replyToId = $conversation->messages()->whereKey($validated['reply_to_id'])->value('id');
        }

        $type = 'text';
        $path = null;
        $kind = null;

        if (!empty($validated['sticker_id'])) {
            $sticker = Sticker::find($validated['sticker_id']);
            if (!$sticker) {
                return response()->json(['message' => "Ce sticker n'existe plus."], 422);
            }
            $type = 'sticker';
            $path = $sticker->image_path;
            $kind = $sticker->type === 'video' ? 'video' : 'image';
        } elseif ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $mime = (string) $file->getMimeType();
            $declared = $validated['type'] ?? null;

            // Un enregistrement audio WebM est souvent détecté « video/webm » : on fait confiance au type déclaré
            if ($declared === 'audio' && in_array($mime, ['video/webm', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a'], true)) {
                $type = 'audio';
            } elseif (str_starts_with($mime, 'image/')) {
                $type = 'image';
            } elseif (str_starts_with($mime, 'video/')) {
                $type = 'video';
            } elseif (str_starts_with($mime, 'audio/')) {
                $type = 'audio';
            }

            $path = $file->store('inbox/' . $type, 'public');
        }

        // Le texte (ou la légende d'un média) est chiffré ; une chaîne vide l'est aussi pour garder un schéma uniforme
        $encrypted = InboxCrypto::encrypt($content, (int) $me->id, (int) $user->id);

        $message = PrivateInboxMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $me->id,
            'receiver_id' => $user->id,
            'type' => $type,
            'content_ciphertext' => $encrypted['ciphertext'],
            'iv' => $encrypted['iv'],
            'tag' => $encrypted['tag'],
            'attachment_path' => $path,
            'attachment_kind' => $kind,
            'reply_to_id' => $replyToId,
        ]);

        $conversation->update(['last_message_at' => now()]);
        $message->load(['conversation', 'replyTo']);

        $payload = $message->toPayload((int) $me->id);

        // Côté destinataire : is_me = false (le payload diffusé est recalculé pour lui)
        $forReceiver = $message->toPayload((int) $user->id);

        broadcast(new PrivateInboxMessageSent(
            conversationId: $conversation->id,
            senderId: $me->id,
            receiverId: $user->id,
            message: $forReceiver,
        ))->toOthers();

        return response()->json(['message' => $payload]);
    }

    /** Marque comme lus les messages reçus de ce contact (appelé quand le fil est ouvert et visible). */
    public function read(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        if (!$this->canChat($me, $user)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json(['read' => $this->markAsRead($me, $user)]);
    }

    private function markAsRead(User $me, User $contact): int
    {
        $ids = PrivateInboxMessage::query()
            ->where('sender_id', $contact->id)
            ->where('receiver_id', $me->id)
            ->whereNull('read_at')
            ->pluck('id');

        if ($ids->isEmpty()) {
            return 0;
        }

        $now = now();
        PrivateInboxMessage::whereIn('id', $ids)->update(['read_at' => $now]);

        broadcast(new PrivateInboxMessagesRead(
            readerId: (int) $me->id,
            senderId: (int) $contact->id,
            messageIds: $ids->all(),
            readAt: $now->toIso8601String(),
        ))->toOthers();

        return $ids->count();
    }

    /** contact_id => id d'un projet partagé (le plus récemment rejoint) : sert à lancer l'appel direct. */
    private function sharedProjectMap($myProjectIds, $contactIds): array
    {
        if ($myProjectIds->isEmpty() || $contactIds->isEmpty()) {
            return [];
        }

        return DB::table('project_user')
            ->whereIn('project_id', $myProjectIds)
            ->whereIn('user_id', $contactIds)
            ->orderByDesc('project_id')
            ->get(['user_id', 'project_id'])
            ->unique('user_id')
            ->pluck('project_id', 'user_id')
            ->all();
    }

    private function canChat(User $currentUser, User $targetUser): bool
    {
        if ((int) $currentUser->id === (int) $targetUser->id) {
            return false;
        }

        return $currentUser->projects()
            ->whereIn('projects.id', $targetUser->projects()->select('projects.id'))
            ->exists();
    }
}
