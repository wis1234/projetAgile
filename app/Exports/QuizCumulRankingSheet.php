<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class QuizCumulRankingSheet implements FromArray, WithTitle, ShouldAutoSize, WithStyles
{
    private int $headerRow = 6;

    public function __construct(private array $meta, private array $data)
    {
    }

    public function title(): string
    {
        return 'Résultats cumulés';
    }

    public function array(): array
    {
        $quizzes = $this->data['quizzes'];

        $headings = ['Rang', 'Candidat', 'E-mail'];
        foreach ($quizzes as $q) {
            $headings[] = $q['title'] . ' (coef. ' . $q['coefficient'] . ')';
        }
        array_push($headings, 'Moyenne générale (%)', 'Bonus participation', 'Note finale (%)', 'Décision');

        $out = [
            [$this->meta['title']],
            ['Projet : ' . $this->meta['project']],
            ['Généré le : ' . $this->meta['generated_at']],
            ['Statut : ' . $this->meta['status_label']],
            [],
            $headings,
        ];

        foreach ($this->data['rows'] as $r) {
            $notes = (array) $r['notes'];
            $line = [$r['rank'] ?? '—', $r['name'], $r['email'] ?? ''];

            foreach ($quizzes as $q) {
                $line[] = array_key_exists($q['id'], $notes) ? $notes[$q['id']] : ($r['is_pending'] ? 'En attente' : 'Absent');
            }

            $line[] = $r['average'] ?? '—';
            $line[] = $r['bonus'];
            $line[] = $r['is_pending'] ? 'En attente' : ($r['final'] ?? '—');
            $line[] = $r['is_pending'] ? 'En attente' : ($r['passed'] ? 'Admis(e)' : 'Ajourné(e)');
            $out[] = $line;
        }

        $s = $this->data['stats'];
        $out[] = [];
        $out[] = ['Candidats', $s['total']];
        $out[] = ['Moyenne générale (%)', $s['average'] ?? '—'];
        $out[] = ['Meilleure note (%)', $s['highest'] ?? '—'];
        $out[] = ['Taux de réussite (%)', $s['pass_rate'] ?? '—'];

        return $out;
    }

    public function styles(Worksheet $sheet)
    {
        $cols = 3 + count($this->data['quizzes']) + 4;
        $lastCol = Coordinate::stringFromColumnIndex($cols);
        $lastRow = $this->headerRow + count($this->data['rows']);

        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(15);
        $sheet->getStyle('A4')->getFont()->setBold(true)->getColor()->setRGB($this->meta['validated'] ? '047857' : 'B45309');

        $sheet->getStyle("A{$this->headerRow}:{$lastCol}{$this->headerRow}")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F46E5']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);

        if ($lastRow > $this->headerRow) {
            $sheet->getStyle("A{$this->headerRow}:{$lastCol}{$lastRow}")->getBorders()->getAllBorders()
                ->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('D1D5DB');
            $sheet->getStyle('A' . ($this->headerRow + 1) . ":A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('D' . ($this->headerRow + 1) . ":{$lastCol}{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $finalCol = Coordinate::stringFromColumnIndex($cols - 1);
            $sheet->getStyle("{$finalCol}" . ($this->headerRow + 1) . ":{$finalCol}{$lastRow}")->getFont()->setBold(true);
        }

        $sheet->freezePane('D' . ($this->headerRow + 1));

        return [];
    }
}
