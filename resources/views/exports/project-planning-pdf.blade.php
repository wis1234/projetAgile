<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Planning - {{ $project->name }}</title>
    <style type="text/css">
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
        }

        @page {
            margin: 2.2cm 1.4cm 2cm 1.4cm;
            size: A4 landscape;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica', Arial, sans-serif;
            font-size: 9.5pt;
            line-height: 1.45;
            color: #27303f;
            background: #ffffff;
        }

        /* ===== HEADER ===== */
        .header {
            padding: 0 0 14px 0;
            margin-bottom: 18px;
            border-bottom: 2px solid #e5e7eb;
        }

        .eyebrow {
            font-size: 8.5pt;
            font-weight: bold;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #4f46e5;
            margin-bottom: 6px;
        }

        .title {
            font-size: 20pt;
            font-weight: bold;
            color: #111827;
            margin-bottom: 6px;
        }

        .subtitle {
            font-size: 9.5pt;
            color: #6b7280;
        }

        .subtitle .dot {
            color: #d1d5db;
            margin: 0 6px;
        }

        /* ===== SUMMARY CARDS ===== */
        .summary {
            width: 100%;
            margin: 0 0 18px 0;
        }

        .card {
            display: inline-block;
            width: 18.4%;
            border: 1px solid #e5e7eb;
            border-left: 3px solid #4f46e5;
            border-radius: 6px;
            padding: 10px 12px;
            margin-right: 1.9%;
            background: #f9fafb;
        }

        .card.last { margin-right: 0; }
        .card.completed { border-left-color: #059669; }
        .card.pending { border-left-color: #2563eb; }
        .card.late { border-left-color: #dc2626; }
        .card.sprints { border-left-color: #7c3aed; }

        .card .label {
            font-size: 7.3pt;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 4px;
        }

        .card .value {
            font-size: 15pt;
            font-weight: bold;
            color: #111827;
            line-height: 1.1;
        }

        /* ===== SECTION TITLES ===== */
        .section {
            margin-bottom: 18px;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #111827;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
        }

        /* ===== LEGEND ===== */
        .legend {
            width: 100%;
            margin-bottom: 10px;
            font-size: 7.8pt;
            color: #6b7280;
        }

        .legend .legend-group {
            display: inline-block;
            margin-right: 18px;
        }

        .legend .swatch {
            display: inline-block;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            margin-right: 4px;
        }

        .legend .swatch.high { background: #dc2626; }
        .legend .swatch.medium { background: #d97706; }
        .legend .swatch.low { background: #16a34a; }
        .legend .swatch.done { background: #059669; }
        .legend .swatch.in_progress { background: #2563eb; }
        .legend .swatch.todo { background: #6b7280; }

        /* ===== PLANNING TABLE ===== */
        .planning-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .planning-table thead th {
            background: #eef0f4;
            color: #374151;
            font-size: 7.8pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            text-align: left;
            padding: 9px 10px;
            border: 1px solid #e2e4e9;
        }

        .planning-table td {
            border: 1px solid #e9eaed;
            padding: 8px 10px;
            vertical-align: top;
            font-size: 8.6pt;
        }

        .planning-table tr {
            page-break-inside: avoid;
        }

        .col-project { width: 13%; }
        .col-sprint   { width: 20%; }
        .col-task     { width: 29%; }
        .col-owner    { width: 16%; }
        .col-priority { width: 11%; }
        .col-status   { width: 11%; }

        .group-a td { background: #ffffff; }
        .group-b td { background: #fafbfd; }

        .cell-project {
            font-weight: bold;
            color: #111827;
            vertical-align: middle !important;
        }

        .cell-sprint {
            vertical-align: middle !important;
        }

        .sprint-name {
            font-weight: bold;
            color: #312e81;
            margin-bottom: 3px;
        }

        .sprint-dates {
            font-size: 7.8pt;
            color: #6b7280;
        }

        .sprint-desc {
            font-size: 7.6pt;
            color: #6b7280;
            margin-top: 4px;
            font-style: italic;
        }

        .task-title {
            font-weight: bold;
            color: #111827;
            margin-bottom: 3px;
            line-height: 1.3;
        }

        .task-desc {
            color: #6b7280;
            font-size: 7.6pt;
            line-height: 1.35;
            margin-bottom: 3px;
        }

        .task-due {
            font-size: 7.6pt;
            color: #6b7280;
        }

        .task-due.overdue {
            color: #dc2626;
            font-weight: bold;
        }

        .owner-name {
            font-weight: bold;
            color: #374151;
        }

        .owner-none {
            color: #9ca3af;
            font-style: italic;
            font-size: 8.2pt;
        }

        .pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 7.6pt;
            font-weight: bold;
            color: #ffffff;
            background: #6b7280;
            white-space: nowrap;
        }

        .pill.high { background: #dc2626; }
        .pill.medium { background: #d97706; }
        .pill.low { background: #16a34a; }
        .pill.done { background: #059669; }
        .pill.in_progress { background: #2563eb; }
        .pill.todo { background: #6b7280; }

        .empty-cell {
            font-size: 8.6pt;
            color: #9ca3af;
            font-style: italic;
            text-align: center;
            padding: 12px 0;
        }

        /* ===== MEMBERS ===== */
        .members-box {
            font-size: 9pt;
            color: #374151;
            padding: 10px 12px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            line-height: 1.6;
        }

        /* ===== FOOTER ===== */
        .footer {
            position: fixed;
            bottom: -1.4cm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7.8pt;
            color: #9ca3af;
            padding-top: 6px;
            border-top: 1px solid #e5e7eb;
        }

        .footer .footer-brand {
            font-weight: bold;
            letter-spacing: 0.08em;
            color: #4f46e5;
        }

        .footer .dot {
            color: #d1d5db;
            margin: 0 6px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="eyebrow">Rapport de projet</div>
        <div class="title">Planification de projet</div>
        <div class="subtitle">
            {{ $project->name }}
            <span class="dot">·</span>{{ $sprints->count() }} sprint{{ $sprints->count() > 1 ? 's' : '' }}
            <span class="dot">·</span>{{ $taskStats['total'] }} tâche{{ $taskStats['total'] > 1 ? 's' : '' }}
            <span class="dot">·</span>Généré le {{ $generated_at }}
        </div>
    </div>

    <div class="summary">
        <div class="card">
            <div class="label">Total tâches</div>
            <div class="value">{{ $taskStats['total'] }}</div>
        </div>
        <div class="card completed">
            <div class="label">Terminées</div>
            <div class="value">{{ $taskStats['completed'] }}</div>
        </div>
        <div class="card pending">
            <div class="label">En cours</div>
            <div class="value">{{ $taskStats['pending'] }}</div>
        </div>
        <div class="card late">
            <div class="label">En retard</div>
            <div class="value">{{ $taskStats['late'] }}</div>
        </div>
        <div class="card sprints last">
            <div class="label">Sprints</div>
            <div class="value">{{ $sprints->count() }}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Structure du planning</div>

        <div class="legend">
            <span class="legend-group">
                <span class="swatch high"></span>Haute
                <span class="swatch medium"></span>Moyenne
                <span class="swatch low"></span>Faible
            </span>
            <span class="legend-group">
                <span class="swatch todo"></span>À faire
                <span class="swatch in_progress"></span>En cours
                <span class="swatch done"></span>Terminé
            </span>
        </div>

        <table class="planning-table">
            <thead>
                <tr>
                    <th class="col-project">Projet</th>
                    <th class="col-sprint">Sprint (intervalle)</th>
                    <th class="col-task">Tâche (échéance)</th>
                    <th class="col-owner">Responsable</th>
                    <th class="col-priority">Priorité</th>
                    <th class="col-status">Statut</th>
                </tr>
            </thead>
            <tbody>
                @forelse($sprints as $sprintIndex => $sprint)
                    @php
                        $sprintTasks = $taskGroups->get($sprint->id, collect());
                        $rowSpan = $sprintTasks->count() > 0 ? $sprintTasks->count() : 1;
                        $groupClass = $sprintIndex % 2 === 0 ? 'group-a' : 'group-b';
                        $startLabel = $sprint->start_date ? \Illuminate\Support\Carbon::parse($sprint->start_date)->format('d/m/Y') : 'Non définie';
                        $endLabel = $sprint->end_date ? \Illuminate\Support\Carbon::parse($sprint->end_date)->format('d/m/Y') : 'Non définie';
                    @endphp

                    @if($sprintTasks->isEmpty())
                        <tr class="{{ $groupClass }}">
                            <td class="cell-project">{{ $project->name }}</td>
                            <td class="cell-sprint">
                                <div class="sprint-name">{{ $sprint->name }}</div>
                                <div class="sprint-dates">{{ $startLabel }} &rarr; {{ $endLabel }}</div>
                                @if($sprint->description)
                                    <div class="sprint-desc">{{ \Illuminate\Support\Str::limit($sprint->description, 90) }}</div>
                                @endif
                            </td>
                            <td colspan="4" class="empty-cell">Aucune tâche assignée à ce sprint.</td>
                        </tr>
                    @else
                        @foreach($sprintTasks as $taskIndex => $task)
                            @php
                                $isOverdue = $task->due_date
                                    && ($task->status ?? 'todo') !== 'done'
                                    && \Illuminate\Support\Carbon::parse($task->due_date)->isPast();
                            @endphp
                            <tr class="{{ $groupClass }}">
                                @if($taskIndex === 0)
                                    <td class="cell-project" rowspan="{{ $rowSpan }}">{{ $project->name }}</td>
                                    <td class="cell-sprint" rowspan="{{ $rowSpan }}">
                                        <div class="sprint-name">{{ $sprint->name }}</div>
                                        <div class="sprint-dates">{{ $startLabel }} &rarr; {{ $endLabel }}</div>
                                        @if($sprint->description)
                                            <div class="sprint-desc">{{ \Illuminate\Support\Str::limit($sprint->description, 90) }}</div>
                                        @endif
                                    </td>
                                @endif
                                <td class="col-task">
                                    <div class="task-title">{{ $task->title }}</div>
                                    @if($task->description)
                                        <div class="task-desc">{{ \Illuminate\Support\Str::limit(strip_tags($task->description), 90) }}</div>
                                    @endif
                                    <div class="task-due {{ $isOverdue ? 'overdue' : '' }}">
                                        Échéance : {{ $task->due_date ? \Illuminate\Support\Carbon::parse($task->due_date)->format('d/m/Y') : 'Non définie' }}
                                        @if($isOverdue) &middot; En retard @endif
                                    </div>
                                </td>
                                <td class="col-owner">
                                    @if($task->assignedUser)
                                        <span class="owner-name">{{ $task->assignedUser->name }}</span>
                                    @else
                                        <span class="owner-none">Non assigné</span>
                                    @endif
                                </td>
                                <td class="col-priority">
                                    <span class="pill {{ $task->priority ?? 'medium' }}">{{ ucfirst($task->priority ?? 'medium') }}</span>
                                </td>
                                <td class="col-status">
                                    <span class="pill {{ $task->status ?? 'todo' }}">{{ ucfirst(str_replace('_', ' ', $task->status ?? 'todo')) }}</span>
                                </td>
                            </tr>
                        @endforeach
                    @endif
                @empty
                    <tr>
                        <td colspan="6" class="empty-cell">Aucun sprint défini pour ce projet.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Responsables et membres</div>
        <div class="members-box">{{ $memberNames ?: 'Aucun membre associé à ce projet.' }}</div>
    </div>

    <div class="footer">
        <span class="footer-brand">PROJA</span>
        <span class="dot">·</span>Planning généré automatiquement pour {{ $project->name }}
    </div>
</body>
</html>