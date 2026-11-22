<?php

namespace Tests\Unit;

use App\Models\User;
use App\Notifications\UserActionMailNotification;
use PHPUnit\Framework\TestCase;

class UserActionMailNotificationTest extends TestCase
{
    public function test_mail_view_receives_the_action_message_and_payment_details(): void
    {
        $user = new User();
        $user->name = 'Ronaldo AGBOHOU';

        $mail = (new UserActionMailNotification(
            'Votre retrait a été effectué',
            'Le transfert est confirmé.<br>Référence : <b>WD-123</b>',
            'https://example.test/remunerations',
            'Consulter mes retraits',
            [
                'email_header_title' => 'Suivi de votre retrait',
                'email_badges' => [['label' => 'Effectué', 'color' => '#059669']],
                'email_meta_items' => [['icon' => '💰', 'label' => 'Montant demandé', 'value' => '500 FCFA']],
            ]
        ))->toMail($user);

        $this->assertSame('emails.notification', $mail->view);
        $this->assertSame('Votre retrait a été effectué', $mail->viewData['heading']);
        $this->assertSame("Le transfert est confirmé.\nRéférence : WD-123", $mail->viewData['description']);
        $this->assertSame('Suivi de votre retrait', $mail->viewData['headerTitle']);
        $this->assertSame('Effectué', $mail->viewData['badges'][0]['label']);
        $this->assertSame('500 FCFA', $mail->viewData['metaItems'][0]['value']);
        $this->assertSame('Consulter mes retraits', $mail->viewData['actionText']);
        $this->assertSame('https://example.test/remunerations', $mail->viewData['actionUrl']);
    }
}
