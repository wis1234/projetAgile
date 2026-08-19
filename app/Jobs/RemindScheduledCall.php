<?php
namespace App\Jobs;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\ScheduledCall;
use Illuminate\Support\Facades\Mail;
use App\Mail\ScheduledCallMail;

class RemindScheduledCall implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public $scheduleId;
    public function __construct($scheduleId) { $this->scheduleId = $scheduleId; }
    public function handle() {
        $schedule = ScheduledCall::with('project.users')->find($this->scheduleId);
        if (!$schedule || $schedule->status !== 'pending') return;

        $schedule->update(['reminded_at' => now()]);

        foreach ($schedule->project->users as $user) {
            Mail::to($user->email)->send(new ScheduledCallMail($schedule, 'reminder'));
        }
    }
}
