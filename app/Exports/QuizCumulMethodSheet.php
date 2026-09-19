<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class QuizCumulMethodSheet implements FromArray, WithTitle, ShouldAutoSize, WithStyles
{
    public function __construct(private array $meta, private array $data)
    {
    }

    public function title(): string
    {
        return 'Méthode de calcul';
    }

    public function array(): array
    {
        $m = $this->data['method'];

        $out = [
            ['Méthode de calcul'],
            [],
            ['Formule', 'Moyenne générale = Σ (note du quiz × coefficient) ÷ Σ coefficients'],
            ['Quiz non passé', $m['missing_policy'] === 'ignore' ? 'Ignoré dans la moyenne' : 'Compté pour 0'],
            ['Bonus de participation', $m['include_bonus'] ? 'Ajouté à la moyenne (plafond ' . $m['bonus_cap'] . ' points, note finale limitée à 100)' : 'Non pris en compte'],
            ['Seuil d\'admission', $m['pass_mark'] . ' %'],
            [],
            ['Quiz cumulés', 'Coefficient', 'Délibéré'],
        ];

        foreach ($this->data['quizzes'] as $q) {
            $out[] = [$q['title'], $q['coefficient'], $q['validated'] ? 'Oui' : 'Non'];
        }

        $out[] = [];
        $out[] = ['Détail par candidat', 'Calcul'];
        foreach ($this->data['rows'] as $r) {
            $out[] = [$r['name'], $r['calculation']];
        }

        return $out;
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A3:A6')->getFont()->setBold(true);
        $sheet->getStyle('A8:C8')->getFont()->setBold(true);

        return [];
    }
}
