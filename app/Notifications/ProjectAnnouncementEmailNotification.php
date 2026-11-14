<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\ProjectAnnouncement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectAnnouncementEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ProjectAnnouncement $announcement,
        public Project $project,
        public string $authorName,
    ) {
    }

    public function via(object $notifiable): array
    {
        return $notifiable->shouldReceiveNotification('project_updates') ? ['mail'] : [];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $projectUrl = route('projects.show', $this->project).'#announcements';

        return (new MailMessage)
            ->subject('Nouveau communiqué : '.$this->announcement->title)
            ->view('emails.project-announcement', [
                'announcement' => $this->announcement,
                'project' => $this->project,
                'authorName' => $this->authorName,
                'notifiable' => $notifiable,
                'projectUrl' => $projectUrl,
            ]);
    }
}
