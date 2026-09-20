<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function fakeRecaptcha(bool $success = true, array $codes = []): void
    {
        Http::fake([
            'www.google.com/recaptcha/*' => Http::response(
                $success ? ['success' => true] : ['success' => false, 'error-codes' => $codes]
            ),
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'recaptcha_token' => 'token',
        ], $overrides);
    }

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get('/register')->assertStatus(200);
    }

    public function test_new_users_can_register_and_receive_one_verification_email(): void
    {
        $this->fakeRecaptcha();
        Notification::fake();

        $this->post('/register', $this->payload())
            ->assertRedirect(route('register.success'));

        $this->assertGuest();

        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertNull($user->email_verified_at);
        Notification::assertSentToTimes($user, VerifyEmailNotification::class, 1);
    }

    public function test_success_page_needs_a_fresh_registration_and_allows_resending(): void
    {
        $this->get(route('register.success'))->assertRedirect(route('register'));

        $this->fakeRecaptcha();
        Notification::fake();
        $this->post('/register', $this->payload());

        $this->get(route('register.success'))->assertOk();

        $this->post(route('register.resend'))->assertRedirect();

        Notification::assertSentToTimes(User::where('email', 'test@example.com')->first(), VerifyEmailNotification::class, 2);
    }

    public function test_failed_recaptcha_gives_a_clear_message_and_creates_no_account(): void
    {
        $this->fakeRecaptcha(false, ['timeout-or-duplicate']);

        $this->post('/register', $this->payload())
            ->assertSessionHasErrors(['recaptcha_token' => 'La vérification a expiré. Cochez à nouveau la case « Je ne suis pas un robot ».']);

        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
    }

    public function test_missing_recaptcha_token_is_reported(): void
    {
        $this->post('/register', $this->payload(['recaptcha_token' => '']))
            ->assertSessionHasErrors('recaptcha_token');
    }

    public function test_duplicate_email_returns_a_french_message(): void
    {
        User::factory()->create(['email' => 'test@example.com']);
        $this->fakeRecaptcha();

        $this->post('/register', $this->payload(['email' => 'TEST@example.com ']))
            ->assertSessionHasErrors(['email' => 'Cette adresse email est déjà associée à un compte. Connectez-vous ou réinitialisez votre mot de passe.']);
    }

    public function test_validation_messages_are_in_french(): void
    {
        $this->fakeRecaptcha();

        $this->post('/register', $this->payload(['password' => 'short', 'password_confirmation' => 'other']))
            ->assertSessionHasErrors('password');

        $this->assertStringContainsString(
            'au moins 8 caractères',
            session('errors')->first('password')
        );
    }

    public function test_user_can_register_as_candidate(): void
    {
        $this->fakeRecaptcha();
        Notification::fake();

        $this->post('/register', $this->payload(['role' => 'candidate']))
            ->assertRedirect(route('register.success'));

        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertSame('candidate', $user->role);
        $this->assertTrue($user->isQuizCandidateOnly());
    }

    public function test_role_defaults_to_user_and_rejects_unknown_values(): void
    {
        $this->fakeRecaptcha();
        Notification::fake();

        $this->post('/register', $this->payload());
        $this->assertSame('user', User::where('email', 'test@example.com')->value('role'));

        $this->post('/register', $this->payload(['email' => 'admin@example.com', 'role' => 'admin']))
            ->assertSessionHasErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'admin@example.com']);
    }

    public function test_candidate_lands_on_quizzes_and_cannot_open_the_dashboard(): void
    {
        $candidate = User::factory()->create(['role' => 'candidate']);

        $this->assertSame(route('quizzes.index', absolute: false), $candidate->homeUrl());

        $this->actingAs($candidate)
            ->get('/dashboard')
            ->assertRedirect(route('quizzes.index'));
    }
}
