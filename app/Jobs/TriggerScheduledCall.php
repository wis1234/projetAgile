<?php
namespace App\Jobs;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\ScheduledCall;
use App\Models\CallSession;
use Illuminate\Support\Facades\Mail;
use App\Mail\ScheduledCallMail;
use App\Services\FcmService;

class TriggerScheduledCall implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public $scheduleId;
    public function __construct($scheduleId) { $this->scheduleId = $scheduleId; }
    public function handle() {
        $schedule = ScheduledCall::with('project.users', 'initiator')->find($this->scheduleId);
        if (!$schedule || $schedule->status !== 'pending') return;

        $project = $schedule->project;
        $initiator = $schedule->initiator;
        $memberIds = $project->users()->pluck('users.id')->toArray();

        // Check if there is an active session
        $session = CallSession::where('project_id', $project->id)->active()->first();
        if (!$session) {
            $session = CallSession::create([
                'project_id' => $project->id,
                'initiator_id' => $initiator->id,
                'room_name' => 'project-' . $project->id,
                'invite_token' => CallSession::generateToken(),
                'invite_code' => CallSession::generateCode(),
                'status' => 'active',
                'started_at' => now(),
            ]);
        }

        // Fire event to ring users
        event(new \App\Events\LiveKitCallStarted(
            $project->id, $project->name, $initiator->id, $initiator->name, $memberIds, $session->getInviteUrl()
        ));

        $call = [
            'projectId' => $project->id,
            'projectName' => $project->name,
            'initiatorName' => $initiator->name,
            'inviteUrl' => $session->getInviteUrl(),
        ];
        $fcm = app(FcmService::class);
        $project->users
            ->where('id', '!=', $initiator->id)
            ->each(fn ($member) => $fcm->sendCallNotification($member, $call));

        // Mark as started
        $schedule->update(['status' => 'started']);

        // Send Emails
        foreach ($project->users as $user) {
            Mail::to($user->email)->send(new ScheduledCallMail($schedule, 'started'));
        }
    }
}
