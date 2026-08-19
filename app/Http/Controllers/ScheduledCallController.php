<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\ScheduledCall;
use App\Models\Project;
use App\Jobs\TriggerScheduledCall;
use App\Jobs\RemindScheduledCall;
use Carbon\Carbon;

class ScheduledCallController extends Controller {
    public function index(Project $project) {
        $calls = ScheduledCall::with('initiator:id,name')
            ->where('project_id', $project->id)
            ->where('status', 'pending')
            ->orderBy('scheduled_at', 'asc')
            ->get();
        return response()->json($calls);
    }
    public function store(Request $request, Project $project) {
        $request->validate(['scheduled_at' => 'required|date', 'title' => 'nullable|string|max:255']);
        $scheduledAt = Carbon::parse($request->scheduled_at)->utc();
        
        $schedule = ScheduledCall::create([
            'project_id' => $project->id,
            'initiator_id' => $request->user()->id,
            'title' => $request->title,
            'scheduled_at' => $scheduledAt,
        ]);

        $now = now();
        $delayStart = $now->diffInSeconds($scheduledAt, false);
        if ($delayStart < 0) $delayStart = 0; // if past, start immediately
        
        TriggerScheduledCall::dispatch($schedule->id)->delay(now()->addSeconds($delayStart));

        $delayReminder = $now->diffInSeconds($scheduledAt->copy()->subHour(), false);
        if ($delayReminder > 0) {
            RemindScheduledCall::dispatch($schedule->id)->delay(now()->addSeconds($delayReminder));
        }

        return response()->json(['status' => 'ok', 'schedule' => $schedule]);
    }
    public function destroy(Project $project, ScheduledCall $schedule) {
        if ($schedule->project_id !== $project->id) abort(403);
        $schedule->update(['status' => 'cancelled']);
        return response()->json(['status' => 'ok']);
    }
}
