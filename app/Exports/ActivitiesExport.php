<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;

class ActivitiesExport implements FromView
{
    public $activities;
    public function __construct($activities)
    {
        $this->activities = $activities;
    }
    public function view(): View
    {
        return view('exports.activities', [
            'activities' => $this->activities
        ]);
    }
} 