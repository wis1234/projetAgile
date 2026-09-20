<?php

namespace App\Services\Quiz;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

/**
 * Extrait les adresses e-mail d'un fichier .xlsx / .xls / .csv, quelle que soit sa structure.
 *
 * Stratégie de détection de la colonne :
 *  1. En-tête : on cherche, dans les premières lignes de chaque feuille, une cellule dont le libellé
 *     est « email », « e-mail », « mail », « courriel », « adresse e-mail »… (casse, accents,
 *     tirets et espaces ignorés). Les titres de tableau au-dessus de l'en-tête sont donc tolérés.
 *  2. Repli sur le contenu : si aucun en-tête n'est reconnu (ou si la colonne est vide), on retient
 *     la colonne dont la majorité des cellules sont des adresses valides.
 *
 * Lève une \DomainException (message affichable tel quel à l'utilisateur) si le fichier est illisible,
 * ne contient aucune adresse, ou dépasse les limites.
 */
class CandidateEmailExtractor
{
    /** Lignes lues au maximum par colonne (protège la mémoire et le temps de traitement). */
    public const MAX_ROWS = 5000;

    /** Adresses distinctes acceptées par import. */
    public const MAX_EMAILS = 1000;

    /** Nombre de lignes du haut examinées pour trouver l'en-tête. */
    private const HEADER_SCAN_ROWS = 30;

    /** Nombre d'exemples de valeurs invalides renvoyés. */
    private const INVALID_SAMPLE = 100;

    /** Libellés d'en-tête reconnus (après normalisation : minuscules, sans accents ni ponctuation). */
    private const HEADER_ALIASES = [
        'email', 'emails', 'mail', 'mails', 'courriel', 'courriels',
        'adresseemail', 'adresseemails', 'adressemail', 'adressesemail',
        'adresseelectronique', 'emailaddress', 'mailaddress',
    ];

    /**
     * @return array{
     *     sheet:int, sheets:int, column:string, header:?string, detected_by:string,
     *     rows:int, emails:list<string>, invalid:list<string>, invalid_count:int,
     *     duplicates:int, truncated:bool
     * }
     *
     * @throws \DomainException
     */
    public function extract(UploadedFile $file): array
    {
        $sheets = $this->readSheets($file);

        // 1. Par en-tête : le premier libellé reconnu qui mène à de vraies adresses l'emporte.
        foreach ($this->headerCandidates($sheets) as [$s, $r, $c]) {
            $col = $this->readColumn($sheets[$s], $c, $r + 1);
            if ($col['emails']) {
                return $this->result(count($sheets), $s, $c, $col, 'header', $this->cellText($sheets[$s][$r][$c]));
            }
        }

        // 2. Par contenu : aucune colonne « email » exploitable, on cherche des adresses.
        if ($hit = $this->findByContent($sheets)) {
            [$s, $c, $col] = $hit;

            return $this->result(count($sheets), $s, $c, $col, 'content', null);
        }

        throw new \DomainException(
            'Aucune colonne « email » n\'a été trouvée dans ce fichier. '
            . 'Ajoutez une colonne intitulée « email » (ou « e-mail », « courriel ») contenant les adresses, puis réessayez.'
        );
    }

    /** @return array<int, array<int, array<int, mixed>>> */
    private function readSheets(UploadedFile $file): array
    {
        try {
            // WithCalculatedFormulas : une cellule construite par formule renvoie sa valeur, pas la formule.
            $sheets = Excel::toArray(new class implements WithCalculatedFormulas {
            }, $file);
        } catch (\Throwable $e) {
            Log::warning('Candidate import: unreadable file — ' . $e->getMessage());

            throw new \DomainException(
                'Fichier illisible. Utilisez un fichier .xlsx, .xls ou .csv valide et non protégé par un mot de passe.',
                0,
                $e
            );
        }

        return $sheets;
    }

    /**
     * Cellules d'en-tête plausibles, de la plus sûre (libellé exact) à la moins sûre (libellé
     * qui contient « mail »), à égalité dans l'ordre de lecture.
     *
     * @return list<array{0:int,1:int,2:int}> [feuille, ligne, colonne]
     */
    private function headerCandidates(array $sheets): array
    {
        $found = [];
        $seq = 0;

        foreach ($sheets as $s => $rows) {
            foreach (array_slice($rows, 0, self::HEADER_SCAN_ROWS, true) as $r => $row) {
                foreach ($row as $c => $cell) {
                    $tier = $this->headerTier($cell);
                    if ($tier !== null) {
                        $found[] = [$tier, $seq++, $s, $r, $c];
                    }
                }
            }
        }

        usort($found, fn (array $a, array $b) => [$a[0], $a[1]] <=> [$b[0], $b[1]]);

        return array_map(fn (array $f) => [$f[2], $f[3], $f[4]], $found);
    }

    /** 0 = libellé exact, 1 = libellé court contenant « mail »/« courriel », null = pas un en-tête. */
    private function headerTier(mixed $cell): ?int
    {
        $text = $this->cellText($cell);

        // Une adresse n'est jamais un en-tête (« jean@gmail.com » contient « mail »).
        if ($text === '' || str_contains($text, '@')) {
            return null;
        }

        $key = preg_replace('/[^a-z0-9]/', '', Str::ascii(mb_strtolower($text))) ?? '';
        if ($key === '') {
            return null;
        }

        if (in_array($key, self::HEADER_ALIASES, true)) {
            return 0;
        }

        if (strlen($key) <= 40 && (str_contains($key, 'mail') || str_contains($key, 'courriel'))) {
            return 1;
        }

        return null;
    }

    /**
     * Colonne contenant majoritairement des adresses valides (la plus fournie l'emporte).
     *
     * @return array{0:int,1:int,2:array<string,mixed>}|null [feuille, colonne, résultat]
     */
    private function findByContent(array $sheets): ?array
    {
        $best = null;
        $bestScore = 0;

        foreach ($sheets as $s => $rows) {
            if (! $rows) {
                continue;
            }

            $head = array_slice($rows, 0, self::MAX_ROWS);
            $width = max(array_map('count', $head));

            for ($c = 0; $c < $width; $c++) {
                $col = $this->readColumn($head, $c, 0);
                $valid = count($col['emails']) + $col['duplicates'];

                if ($valid === 0 || $valid / ($valid + $col['invalid_count']) < 0.5) {
                    continue;
                }

                if ($valid > $bestScore) {
                    $bestScore = $valid;
                    $best = [$s, $c];
                }
            }
        }

        if (! $best) {
            return null;
        }

        [$s, $c] = $best;

        // Première cellule non vide et non valide : c'est un libellé de colonne, on la saute.
        $first = $this->cellText($sheets[$s][0][$c] ?? null);
        $from = ($first !== '' && ! $this->emailsIn($first)) ? 1 : 0;

        return [$s, $c, $this->readColumn($sheets[$s], $c, $from)];
    }

    /**
     * Lit une colonne à partir d'une ligne donnée.
     *
     * @return array{emails:list<string>, invalid:list<string>, invalid_count:int, duplicates:int, rows:int, truncated:bool}
     */
    private function readColumn(array $rows, int $col, int $from): array
    {
        $slice = array_slice($rows, $from);
        $truncated = count($slice) > self::MAX_ROWS;
        if ($truncated) {
            $slice = array_slice($slice, 0, self::MAX_ROWS);
        }

        $emails = [];
        $invalid = [];
        $invalidCount = 0;
        $duplicates = 0;
        $rowsRead = 0;

        foreach ($slice as $row) {
            $text = $this->cellText($row[$col] ?? null);
            if ($text === '') {
                continue;
            }

            $rowsRead++;
            $found = $this->emailsIn($text);

            if (! $found) {
                $invalidCount++;
                if (count($invalid) < self::INVALID_SAMPLE) {
                    $invalid[] = Str::limit($text, 80);
                }

                continue;
            }

            foreach ($found as $email) {
                if (isset($emails[$email])) {
                    $duplicates++;
                } else {
                    $emails[$email] = true;
                }
            }
        }

        return [
            'emails' => array_keys($emails),
            'invalid' => $invalid,
            'invalid_count' => $invalidCount,
            'duplicates' => $duplicates,
            'rows' => $rowsRead,
            'truncated' => $truncated,
        ];
    }

    /** @param array<string,mixed> $col */
    private function result(int $sheetsTotal, int $sheet, int $column, array $col, string $by, ?string $header): array
    {
        if (count($col['emails']) > self::MAX_EMAILS) {
            throw new \DomainException(sprintf(
                'Ce fichier contient %s adresses distinctes ; la limite est de %s par import. Scindez-le en plusieurs fichiers.',
                number_format(count($col['emails']), 0, ',', ' '),
                number_format(self::MAX_EMAILS, 0, ',', ' ')
            ));
        }

        return [
            'sheet' => $sheet + 1,
            'sheets' => $sheetsTotal,
            'column' => Coordinate::stringFromColumnIndex($column + 1),
            'header' => $header,
            'detected_by' => $by,
            'rows' => $col['rows'],
            'emails' => $col['emails'],
            'invalid' => $col['invalid'],
            'invalid_count' => $col['invalid_count'],
            'duplicates' => $col['duplicates'],
            'truncated' => $col['truncated'],
        ];
    }

    /** Texte propre d'une cellule (espaces insécables, BOM et caractères invisibles retirés). */
    private function cellText(mixed $value): string
    {
        if ($value === null || is_bool($value)) {
            return '';
        }

        if (! is_scalar($value) && ! (is_object($value) && method_exists($value, '__toString'))) {
            return '';
        }

        $text = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}\x{00A0}]/u', ' ', (string) $value) ?? (string) $value;

        return trim($text);
    }

    /**
     * Adresses valides d'une cellule, en minuscules. Accepte « a@x.fr; b@y.fr », « Nom <a@x.fr> »
     * ou « mailto:a@x.fr ».
     *
     * @return list<string>
     */
    private function emailsIn(string $text): array
    {
        $tokens = preg_split('/[\s;,<>()\[\]"\']+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $out = [];

        foreach ($tokens as $token) {
            $token = rtrim(preg_replace('/^mailto:/i', '', $token) ?? $token, '.:');

            if (str_contains($token, '@') && filter_var($token, FILTER_VALIDATE_EMAIL)) {
                $out[] = mb_strtolower($token);
            }
        }

        return $out;
    }
}
