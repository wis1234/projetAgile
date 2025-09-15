<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Support\Facades\URL;

class CustomResetPassword extends ResetPasswordNotification
{
    use Queueable;

    /**
     * Get the reset URL for the given notifiable.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function resetUrl($notifiable)
    {
        if (static::$createUrlCallback) {
            return call_user_func(static::$createUrlCallback, $notifiable, $this->token);
        }

        return URL::temporarySignedRoute(
            'password.reset',
            now()->addMinutes(config('auth.passwords.'.config('auth.defaults.passwords').'.expire')),
            [
                'token' => $this->token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]
        );
    }

    /**
     * Get the reset URL for the given notifiable.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function resetUrlForFrontend($notifiable)
    {
        return url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));
    }

    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $url = $this->resetUrl($notifiable);
        
        // Si vous utilisez une SPA, utilisez plutôt resetUrlForFrontend
        // $url = $this->resetUrlForFrontend($notifiable);
        
        $expires = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');
        $appName = config('app.name');
        
        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject("Réinitialisation de votre mot de passe $appName")
            ->view('emails.auth.password-reset', [
                'actionUrl' => $url,
                'expires' => $expires,
                'logo' => asset('logo-proja.png'),
                'user' => $notifiable // Ajout de l'utilisateur pour la personnalisation
            ]);
    }
}
