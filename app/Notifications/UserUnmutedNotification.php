<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserUnmutedNotification extends Notification implements ShouldQueue
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
            ->subject('Fin de la sourdine - ' . $this->data['project_name'])
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Votre période de sourdine sur le projet **' . $this->data['project_name'] . '** a été levée par ' . $this->data['unmuted_by'] . '.')
            ->line('Vous pouvez maintenant à nouveau interagir normalement avec le projet.')
            ->action('Accéder au projet', route('projects.show', $this->data['project_id']))
            ->line('Si vous rencontrez des problèmes, veuillez contacter un administrateur du projet.')
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
            'type' => 'user_unmuted',
            'project_id' => $this->data['project_id'],
            'project_name' => $this->data['project_name'],
            'unmuted_by' => $this->data['unmuted_by'],
            'message' => 'Votre sourdine sur le projet ' . $this->data['project_name'] . ' a été levée.',
        ];
    }
}
