<?php

namespace Tests\Feature\Quiz;

use App\Services\Quiz\CandidateEmailExtractor;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CandidateEmailExtractorTest extends TestCase
{
    private function extract(string $csv): array
    {
        $file = UploadedFile::fake()->createWithContent('candidats.csv', $csv);

        return app(CandidateEmailExtractor::class)->extract($file);
    }

    /** @dataProvider headerLabels */
    public function test_detects_the_email_column_whatever_its_label(string $label): void
    {
        $r = $this->extract("Nom,{$label}\nAlice,alice@example.com\nBob,BOB@Example.com\n");

        $this->assertSame('header', $r['detected_by']);
        $this->assertSame('B', $r['column']);
        $this->assertSame(['alice@example.com', 'bob@example.com'], $r['emails']);
    }

    public static function headerLabels(): array
    {
        return [
            ['email'], ['E-mail'], ['EMAIL'], ['Mail'], ['Courriel'],
            ['Adresse e-mail'], ['Adresse mail'], ['Adresse électronique'], ['Email*'], ['Email étudiant'],
        ];
    }

    public function test_skips_title_lines_above_the_header(): void
    {
        $r = $this->extract("Liste des candidats,\n,\nNom,Email\nAlice,alice@example.com\n");

        $this->assertSame('B', $r['column']);
        $this->assertSame(['alice@example.com'], $r['emails']);
    }

    public function test_falls_back_on_content_when_there_is_no_header(): void
    {
        $r = $this->extract("Alice,alice@example.com\nBob,bob@example.com\n");

        $this->assertSame('content', $r['detected_by']);
        $this->assertSame('B', $r['column']);
        $this->assertCount(2, $r['emails']);
    }

    public function test_an_address_is_never_mistaken_for_a_header(): void
    {
        // « jean@gmail.com » contient « mail » : il ne doit pas être pris pour un en-tête.
        $r = $this->extract("Jean,jean@gmail.com\nMarie,marie@gmail.com\n");

        $this->assertSame(['jean@gmail.com', 'marie@gmail.com'], $r['emails']);
    }

    public function test_reports_duplicates_and_invalid_values_and_ignores_blank_cells(): void
    {
        $r = $this->extract("Nom,Email\nA,a@x.com\nB,A@X.COM\nC,pas-un-mail\nD,\n");

        $this->assertSame(['a@x.com'], $r['emails']);
        $this->assertSame(1, $r['duplicates']);
        $this->assertSame(1, $r['invalid_count']);
        $this->assertSame(['pas-un-mail'], $r['invalid']);
    }

    public function test_accepts_several_addresses_in_one_cell(): void
    {
        $r = $this->extract("Nom,Email\nA,\"a@x.com; Bob <b@x.com>\"\n");

        $this->assertSame(['a@x.com', 'b@x.com'], $r['emails']);
    }

    public function test_throws_a_readable_error_when_no_address_is_found(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Aucune colonne « email »');

        $this->extract("Nom,Prénom\nAlice,Martin\n");
    }
}
