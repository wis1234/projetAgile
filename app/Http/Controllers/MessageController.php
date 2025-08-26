<?php

namespace App\Http\Controllers;

use App\Events\MessageUpdated;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Notifications\UserActionMailNotification;

class MessageController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Message::class);
        
        $user = auth()->user();
        $query = Message::with(['project', 'user'])
            ->where(function($q) use ($user) {
                $q->whereHas('project.users', function($q2) use ($user) {
                    $q2->where('user_id', $user->id)->where('is_muted', false);
                })->orWhereDoesntHave('project'); // global messages
            });

        if ($request->search) {
            $query->where('content', 'like', '%'.$request->search.'%');
        }
        $messages = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Messages/Index', [
            'messages' => $messages,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        $projects = Project::whereHas('users', function($q) use ($user) {
            $q->where('user_id', $user->id)->where('is_muted', false);
        })->get(['id', 'name']);

        return Inertia::render('Messages/Create', [
            'projects' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'project_id' => 'required|exists:projects,id',
        ]);

        $project = Project::find($validated['project_id']);
        $this->authorize('create', [Message::class, $project]);

        $validated['user_id'] = auth()->id();

        $message = Message::create($validated);
        activity_log('create', 'Création message', $message);
        event(new MessageUpdated($message));
        return redirect()->route('messages.index');
    }

    public function show(Message $message)
    {
        $this->authorize('view', $message);
        $message->load(['project', 'user']);
        return Inertia::render('Messages/Show', [
            'message' => $message,
        ]);
    }

    public function edit(Message $message)
    {
        $this->authorize('update', $message);
        $message->load(['project', 'user']);
        $user = auth()->user();
        $projects = Project::whereHas('users', function($q) use ($user) {
            $q->where('user_id', $user->id)->where('is_muted', false);
        })->get(['id', 'name']);

        return Inertia::render('Messages/Edit', [
            'message' => $message,
            'projects' => $projects,
        ]);
    }

    public function update(Request $request, Message $message)
    {
        $this->authorize('update', $message);

        $validated = $request->validate([
            'content' => 'required|string',
            'project_id' => 'required|exists:projects,id',
        ]);
        
        $new_project = Project::find($validated['project_id']);
        if ($message->project_id != $new_project->id) {
            // if project is changed, user must have create permission on the new project
            $this->authorize('create', [Message::class, $new_project]);
        }

        $message->update($validated);
        activity_log('update', 'Modification message', $message);
        event(new MessageUpdated($message));
        return redirect()->route('messages.index');
    }

    public function destroy(Message $message)
    {
        $this->authorize('delete', $message);
        $message->delete();
        activity_log('delete', 'Suppression message', $message);
        event(new MessageUpdated($message));
        return redirect()->route('messages.index');
    }
}