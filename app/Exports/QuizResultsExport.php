<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Résultats finaux d'un quiz (Excel).
 */
class QuizResultsExport implements FromArray, WithTitle, ShouldAutoSize, WithStyles
{
    private int $headerRow = 6;
    private int $lastRow = 6;

    public function __construct(private array $meta, private array $rows, private array $stats)
    {
    }

    public function title(): string
    {
        return 'Résultats';
    }

    public function array(): array
    {
        $out = [
            [$this->meta['title']],
            ['Projet : ' . $this->meta['project']],
            ['Généré le : ' . $this->meta['generated_at']],
            ['Statut : ' . $this->meta['status_label']],
            [],
            ['Rang', 'Candidat', 'E-mail', 'QCM (%)', 'Écrit (%)', 'Note du quiz (%)', 'Bonus participation', 'Note finale (%)', 'Décision'],
        ];

        foreach ($this->rows as $r) {
            $out[] = [
                $r['rank'] ?? '—',
                $r['name'],
                $r['email'] ?? '',
                $r['qcm_percent'],
                $r['written_percent'],
                $r['is_pending'] ? 'En attente' : $r['score'],
                $r['bonus'] > 0 ? $r['bonus'] : 0,
                $r['is_pending'] ? 'En attente' : $r['final'],
                $r['is_pending'] ? 'En attente de correction' : ($r['passed'] ? 'Admis(e)' : 'Ajourné(e)'),
            ];
        }

        $out[] = [];
        $out[] = ['Participants', $this->stats['total']];
        $out[] = ['Moyenne générale (%)', $this->stats['average'] ?? '—'];
        $out[] = ['Note la plus haute (%)', $this->stats['highest'] ?? '—'];
        $out[] = ['Note la plus basse (%)', $this->stats['lowest'] ?? '—'];
        $out[] = ['Taux de réussite (%)', $this->stats['pass_rate'] ?? '—'];

        if (!empty($this->meta['approvers'])) {
            $out[] = [];
            $out[] = ['Avals de délibération'];
            foreach ($this->meta['approvers'] as $a) {
                $out[] = [$a['name'], 'aval donné le ' . $a['approved_at']];
            }
        }

        $this->lastRow = $this->headerRow + count($this->rows);

        return $out;
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(15);
        $sheet->getStyle('A4')->getFont()->setBold(true)->getColor()->setRGB($this->meta['validated'] ? '047857' : 'B45309');

        $sheet->getStyle("A{$this->headerRow}:I{$this->headerRow}")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563EB']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);

        if ($this->lastRow > $this->headerRow) {
            $sheet->getStyle("A" . ($this->headerRow + 1) . ":A{$this->lastRow}")
                ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D" . ($this->headerRow + 1) . ":H{$this->lastRow}")
                ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$this->headerRow}:I{$this->lastRow}")->getBorders()->getAllBorders()
                ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN)->getColor()->setRGB('D1D5DB');
            $sheet->getStyle("H" . ($this->headerRow + 1) . ":H{$this->lastRow}")->getFont()->setBold(true);
        }

        $sheet->freezePane('A' . ($this->headerRow + 1));

        return [];
    }
}
