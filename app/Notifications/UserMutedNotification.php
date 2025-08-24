<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserMutedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $data;

    /**
     * Create a new notification instance.
     *
     * @param array $data
     * @return void
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Mise en sourdine - ' . $this->data['project_name'])
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Vous avez été mis en sourdine sur le projet **' . $this->data['project_name'] . '** par ' . $this->data['muted_by'] . '.')
            ->line('**Date de fin de sourdine :** ' . $this->data['muted_until'])
            ->line('En mode sourdine, vous ne pouvez que consulter le projet sans pouvoir effectuer de modifications.')
            ->action('Voir le projet', route('projects.show', $this->data['project_id']))
            ->line('Si vous pensez qu\'il s\'agit d\'une erreur, veuillez contacter un administrateur du projet.')
            ->salutation('Cordialement, \nL\'équipe ' . config('app.name'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'type' => 'user_muted',
            'project_id' => $this->data['project_id'],
            'project_name' => $this->data['project_name'],
            'muted_by' => $this->data['muted_by'],
            'muted_until' => $this->data['muted_until'],
            'message' => 'Vous avez été mis en sourdine sur le projet ' . $this->data['project_name'] . ' jusqu\'au ' . $this->data['muted_until'],
        ];
    }
}
