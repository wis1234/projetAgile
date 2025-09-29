<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubscriptionStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $subscription;
    protected $oldStatus;

    /**
     * Create a new notification instance.
     *
     * @param Subscription $subscription
     * @param string $oldStatus
     * @return void
     */
    public function __construct(Subscription $subscription, $oldStatus)
    {
        $this->subscription = $subscription;
        $this->oldStatus = $oldStatus;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
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
            ->subject('Mise à jour de votre abonnement - ' . config('app.name'))
            ->view('emails.subscription-status-updated', [
                'subscription' => $this->subscription,
                'oldStatus' => $this->oldStatus
            ]);
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
            'subscription_id' => $this->subscription->id,
            'old_status' => $this->oldStatus,
            'new_status' => $this->subscription->status,
        ];
    }
}
