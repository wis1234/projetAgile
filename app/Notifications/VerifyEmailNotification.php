<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Auth\Notifications\VerifyEmail;

class VerifyEmailNotification extends VerifyEmail
{
    use Queueable;

    /**
     * Get the verification URL for the given notifiable.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function verificationUrl($notifiable)
    {
        return parent::verificationUrl($notifiable);
    }

    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        
        return (new MailMessage)
            ->subject('Vérifiez votre adresse email')
            ->line('Merci de vous être inscrit sur ' . config('app.name') . ' !')
            ->line('Pour commencer à utiliser votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.')
            ->action('Vérifier mon adresse email', $verificationUrl)
            ->line('Si vous n\'avez pas créé de compte, aucune autre action n\'est requise.');
    }
}
