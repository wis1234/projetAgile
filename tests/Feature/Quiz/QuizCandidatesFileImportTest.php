<?php

namespace Tests\Feature\Quiz;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;

class QuizCandidatesFileImportTest extends QuizHttpTestCase
{
    private function upload(string $content, string $name = 'candidats.csv'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, $content);
    }

    private function importUrl($quiz): string
    {
        return $this->quizUrl($quiz, '/candidates/import-excel');
    }

    private function import($user, $quiz, UploadedFile $file)
    {
        return $this->actingAs($user)->post($this->importUrl($quiz), ['file' => $file], ['Accept' => 'application/json']);
    }

    public function test_users_matching_the_email_column_are_enrolled_and_the_report_is_detailed(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $diane = User::factory()->create(['email' => 'diane@example.com']);
        User::factory()->create(['email' => 'nonverifie@example.com', 'email_verified_at' => null]);

        // Fichier « à la française » : séparateur « ; », colonne libellée « Adresse e-mail », casse variable.
        $csv = "Nom;Adresse e-mail\n"
            . "Diane;DIANE@example.com\n"
            . "Inconnu;inconnu@example.com\n"
            . "Non vérifié;nonverifie@example.com\n"
            . "Responsable;{$this->manager1->email}\n"
            . "Membre;{$this->candidate->email}\n"
            . "Doublon;diane@example.com\n"
            . "Erreur;pas-un-mail\n";

        $res = $this->import($this->manager1, $quiz, $this->upload($csv))->assertOk();

        $res->assertJsonPath('source.detected_by', 'header')->assertJsonPath('source.column', 'B');
        $this->assertEquals(
            ['emails' => 5, 'added' => 2, 'already' => 0, 'not_found' => 1, 'unverified' => 1, 'managers' => 1, 'invalid' => 1, 'duplicates' => 1],
            Arr::only($res->json('summary'), ['emails', 'added', 'already', 'not_found', 'unverified', 'managers', 'invalid', 'duplicates'])
        );
        $this->assertSame(['inconnu@example.com'], $res->json('not_found'));

        $this->assertEqualsCanonicalizing(
            [$diane->id, $this->candidate->id],
            $quiz->candidates()->pluck('user_id')->all()
        );
        $this->assertSame(1, $diane->notifications()->count());
    }

    public function test_importing_the_same_file_twice_does_not_duplicate_anyone(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        User::factory()->create(['email' => 'diane@example.com']);
        $csv = "email\ndiane@example.com\n";

        $this->import($this->manager1, $quiz, $this->upload($csv))->assertJsonPath('summary.added', 1);
        $second = $this->import($this->manager1, $quiz, $this->upload($csv))->assertOk();

        $this->assertSame(0, $second->json('summary.added'));
        $this->assertSame(1, $second->json('summary.already'));
        $this->assertSame(1, $quiz->candidates()->count());
    }

    public function test_a_file_without_any_email_is_refused_with_a_clear_message(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);

        $res = $this->import($this->manager1, $quiz, $this->upload("Nom,Prénom\nAlice,Martin\n"))->assertStatus(422);

        $this->assertStringContainsString('Aucune colonne « email »', $res->json('message'));
        $this->assertSame(0, $quiz->candidates()->count());
    }

    public function test_unsupported_formats_and_missing_files_are_refused(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);

        $this->import($this->manager1, $quiz, UploadedFile::fake()->create('notes.pdf', 10))
            ->assertStatus(422)->assertJsonValidationErrors('file');

        $this->actingAs($this->manager1)->post($this->importUrl($quiz), [], ['Accept' => 'application/json'])
            ->assertStatus(422)->assertJsonValidationErrors('file');
    }

    public function test_only_managers_can_import_and_drafts_are_refused(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        User::factory()->create(['email' => 'diane@example.com']);
        $csv = "email\ndiane@example.com\n";

        $this->import($this->candidate, $quiz, $this->upload($csv))->assertForbidden();

        $draft = $this->makeQuiz([$this->qcm()], 'Brouillon');
        $draft->update(['is_draft' => true]);
        $this->import($this->manager1, $draft, $this->upload($csv))->assertStatus(422);
        $this->assertSame(0, $draft->candidates()->count());
    }
}
