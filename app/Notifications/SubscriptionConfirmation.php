<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

class SubscriptionConfirmation extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * L'abonnement concerné.
     *
     * @var \App\Models\Subscription
     */
    public $subscription;

    /**
     * Crée une nouvelle instance de notification.
     *
     * @param  \App\Models\Subscription  $subscription
     * @return void
     */
    public function __construct(Subscription $subscription)
    {
        $this->subscription = $subscription;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    /**
     * Obtenez les canaux de livraison de la notification.
     *
     * @param  mixed  $notifiable
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Obtenez la représentation mail de la notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $plan = $this->subscription->plan;
        $user = $this->subscription->user;
        $amountPaid = number_format($this->subscription->amount_paid, 0, ',', ' ') . ' FCFA';
        $duration = $plan->formatted_duration;
        $startDate = $this->subscription->starts_at->format('d/m/Y');
        $endDate = $this->subscription->ends_at->format('d/m/Y');
        $receiptUrl = $this->subscription->receipt_url;

        $features = array_map(function ($feature) {
            return "<li>{$feature}</li>";
        }, $plan->features);

        $featuresHtml = implode("\n", $features);

        return (new MailMessage)
            ->subject('Confirmation de votre abonnement à ProJA')
            ->greeting("Félicitations {$user->name} !")
            ->line(new HtmlString("<p>Votre abonnement <strong>{$plan->name}</strong> a été activé avec succès. Voici les détails de votre abonnement :</p>"))
            ->line(new HtmlString("<ul>{$featuresHtml}</ul>"))
            ->line(new HtmlString("<p><strong>Montant payé :</strong> {$amountPaid}"))
            ->line(new HtmlString("<p><strong>Durée :</strong> {$duration}"))
            ->line(new HtmlString("<p><strong>Période :</strong> Du {$startDate} au {$endDate}</p>"))
            ->action('Accéder à mon espace', url('/dashboard'))
            ->line(new HtmlString("<p>Vous pouvez télécharger votre reçu en cliquant sur le bouton ci-dessous :</p>"))
            ->action('Télécharger le reçu', $receiptUrl)
            ->line('Merci de votre confiance et à bientôt sur ProJA !');
    }

    /**
     * Obtenez la représentation tableau de la notification.
     *
     * @param  mixed  $notifiable
     * @return array<string, mixed>
     */
    public function toArray($notifiable)
    {
        return [
            'subscription_id' => $this->subscription->id,
            'plan_name' => $this->subscription->plan->name,
            'amount_paid' => $this->subscription->amount_paid,
            'currency' => $this->subscription->currency,
            'starts_at' => $this->subscription->starts_at,
            'ends_at' => $this->subscription->ends_at,
            'receipt_url' => $this->subscription->receipt_url,
        ];
    }
}
