<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Résultats cumulés (Excel) : feuille 1 = classement avec la note de chaque quiz ;
 * feuille 2 = méthode et détail du calcul de chaque candidat.
 */
class QuizCumulExport implements WithMultipleSheets
{
    public function __construct(private array $meta, private array $data)
    {
    }

    public function sheets(): array
    {
        return [
            new QuizCumulRankingSheet($this->meta, $this->data),
            new QuizCumulMethodSheet($this->meta, $this->data),
        ];
    }
}
