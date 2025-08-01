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
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Message::with(['project', 'user']);
        if ($request->search) {
            $query->where('content', 'like', '%'.$request->search.'%');
        }
        $messages = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
        return Inertia::render('Messages/Index', [
            'messages' => $messages,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $projects = Project::all(['id', 'name']);
        $users = User::all(['id', 'name']);
        return Inertia::render('Messages/Create', [
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'project_id' => 'required|exists:projects,id',
            'user_id' => 'required|exists:users,id',
        ]);
        $message = Message::create($validated);
        activity_log('create', 'Création message', $message);
        event(new MessageUpdated($message));
        return redirect()->route('messages.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Message $message)
    {
        $message->load(['project', 'user']);
        if ($message->project && !$message->project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        return Inertia::render('Messages/Show', [
            'message' => $message,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Message $message)
    {
        $message->load(['project', 'user']);
        if ($message->project && !$message->project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $projects = Project::all(['id', 'name']);
        $users = User::all(['id', 'name']);
        return Inertia::render('Messages/Edit', [
            'message' => $message,
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Message $message)
    {
        $message->load(['project', 'user']);
        if ($message->project && !$message->project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $validated = $request->validate([
            'content' => 'required|string',
            'project_id' => 'required|exists:projects,id',
            'user_id' => 'required|exists:users,id',
        ]);
        $message->update($validated);
        activity_log('update', 'Modification message', $message);
        event(new MessageUpdated($message));
        return redirect()->route('messages.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Message $message)
    {
        $message->load(['project', 'user']);
        if ($message->project && !$message->project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $message->delete();
        activity_log('delete', 'Suppression message', $message);
        event(new MessageUpdated($message));
        return redirect()->route('messages.index');
    }
}
