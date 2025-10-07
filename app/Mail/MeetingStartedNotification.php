<?php

namespace App\Mail;

use App\Models\ZoomMeeting;
use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MeetingStartedNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $meeting;
    public $project;
    public $user;
    public $joinUrl;

    /**
     * Create a new message instance.
     *
     * @param ZoomMeeting $meeting
     * @param Project $project
     * @param User $user
     * @return void
     */
    public function __construct(ZoomMeeting $meeting, Project $project, User $user)
    {
        $this->meeting = $meeting;
        $this->project = $project;
        $this->user = $user;
        $this->joinUrl = $meeting->join_url;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $startTime = $this->meeting->start_time;
        $endTime = $startTime->copy()->addMinutes($this->meeting->duration);
        
        return $this->subject("La réunion {$this->meeting->topic} a commencé !")
                    ->view('emails.meeting-started')
                    ->with([
                        'meeting' => $this->meeting,
                        'project' => $this->project,
                        'user' => $this->user,
                        'startTime' => $startTime,
                        'endTime' => $endTime,
                        'joinUrl' => $this->joinUrl,
                    ]);
    }
}
