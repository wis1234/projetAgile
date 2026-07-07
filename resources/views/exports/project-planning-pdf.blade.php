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
            margin: 2.2cm 1.6cm 2cm 1.6cm;
            size: A4 portrait;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #27303f;
            background: #ffffff;
        }

        /* ===== HEADER ===== */
        .header {
            padding: 0 0 14px 0;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }

        .header-top {
            width: 100%;
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
            font-size: 21pt;
            font-weight: bold;
            color: #111827;
            margin-bottom: 6px;
        }

        .subtitle {
            font-size: 9.5pt;
            color: #6b7280;
        }

        /* ===== SUMMARY CARDS ===== */
        .summary {
            width: 100%;
            margin: 0 0 24px 0;
        }

        .card {
            display: inline-block;
            width: 22.6%;
            border: 1px solid #e5e7eb;
            border-left: 3px solid #4f46e5;
            border-radius: 6px;
            padding: 12px 14px;
            margin-right: 1.8%;
            margin-bottom: 8px;
            background: #f9fafb;
        }

        .card.last { margin-right: 0; }
        .card.completed { border-left-color: #059669; }
        .card.pending { border-left-color: #2563eb; }
        .card.late { border-left-color: #dc2626; }

        .card .label {
            font-size: 7.5pt;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 5px;
        }

        .card .value {
            font-size: 17pt;
            font-weight: bold;
            color: #111827;
            line-height: 1.1;
        }

        /* ===== SECTIONS ===== */
        .section {
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 12.5pt;
            font-weight: bold;
            color: #111827;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
        }

        /* ===== SPRINT CARDS ===== */
        .sprint-card {
            border: 1px solid #e5e7eb;
            border-left: 4px solid #4f46e5;
            border-radius: 6px;
            padding: 14px 16px;
            margin-bottom: 14px;
            page-break-inside: avoid;
            background: #fcfdff;
        }

        .sprint-header {
            width: 100%;
            margin-bottom: 8px;
        }

        .sprint-title {
            font-size: 12pt;
            font-weight: bold;
            color: #312e81;
        }

        .sprint-meta {
            font-size: 8.5pt;
            color: #6b7280;
            margin-top: 3px;
        }

        .sprint-meta .dates {
            font-weight: bold;
            color: #4b5563;
        }

        .sprint-description {
            font-size: 9pt;
            color: #4b5563;
            margin: 6px 0 10px 0;
            padding: 8px 10px;
            background: #f3f4f6;
            border-radius: 4px;
        }

        /* ===== TASK TABLE ===== */
        .task-table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid;
            margin-top: 6px;
        }

        .task-table th, .task-table td {
            border: 1px solid #e9eaed;
            padding: 8px 9px;
            vertical-align: top;
            text-align: left;
            font-size: 8.5pt;
        }

        .task-table th {
            background: #eef0f4;
            font-weight: bold;
            color: #374151;
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .task-table tbody tr:nth-child(even) td {
            background: #fafbfc;
        }

        .task-title {
            font-weight: bold;
            color: #111827;
            margin-bottom: 3px;
            line-height: 1.3;
        }

        .task-desc {
            color: #6b7280;
            font-size: 7.8pt;
            line-height: 1.35;
        }

        .pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 7.8pt;
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

        .empty {
            font-size: 9pt;
            color: #9ca3af;
            font-style: italic;
            padding: 10px 0;
            text-align: center;
        }

        /* ===== MEMBERS ===== */
        .members-box {
            font-size: 9pt;
            color: #374151;
            padding: 12px 14px;
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
            font-size: 8pt;
            color: #9ca3af;
            padding-top: 6px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="eyebrow">Rapport de projet</div>
        <div class="title">Planification de projet</div>
        <div class="subtitle">{{ $project->name }} &nbsp;·&nbsp; Généré le {{ $generated_at }}</div>
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
        <div class="card late last">
            <div class="label">En retard</div>
            <div class="value">{{ $taskStats['late'] }}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Structure du planning</div>
        @forelse($sprints as $sprint)
            @php $sprintTasks = $taskGroups->get($sprint->id, collect()); @endphp
            <div class="sprint-card">
                <div class="sprint-header">
                    <div class="sprint-title">{{ $sprint->name }}</div>
                    <div class="sprint-meta">
                        <span class="dates">
                            {{ $sprint->start_date ? \Illuminate\Support\Carbon::parse($sprint->start_date)->format('d/m/Y') : 'Date non définie' }}
                            → {{ $sprint->end_date ? \Illuminate\Support\Carbon::parse($sprint->end_date)->format('d/m/Y') : 'Date non définie' }}
                        </span>
                        &nbsp;·&nbsp; {{ $sprintTasks->count() }} tâche(s)
                    </div>
                </div>
                @if($sprint->description)
                    <div class="sprint-description">{{ $sprint->description }}</div>
                @endif
                @if($sprintTasks->isEmpty())
                    <div class="empty">Aucune tâche assignée à ce sprint.</div>
                @else
                    <table class="task-table">
                        <thead>
                            <tr>
                                <th style="width: 34%;">Tâche</th>
                                <th style="width: 12%;">Priorité</th>
                                <th style="width: 14%;">Statut</th>
                                <th style="width: 20%;">Assigné</th>
                                <th style="width: 20%;">Échéance</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($sprintTasks as $task)
                                <tr>
                                    <td>
                                        <div class="task-title">{{ $task->title }}</div>
                                        @if($task->description)
                                            <div class="task-desc">{{ \Illuminate\Support\Str::limit(strip_tags($task->description), 120) }}</div>
                                        @endif
                                    </td>
                                    <td><span class="pill {{ $task->priority ?? 'medium' }}">{{ ucfirst($task->priority ?? 'medium') }}</span></td>
                                    <td><span class="pill {{ $task->status ?? 'todo' }}">{{ ucfirst(str_replace('_', ' ', $task->status ?? 'todo')) }}</span></td>
                                    <td>{{ $task->assignedUser ? $task->assignedUser->name : 'Non assigné' }}</td>
                                    <td>{{ $task->due_date ? \Illuminate\Support\Carbon::parse($task->due_date)->format('d/m/Y') : 'Non définie' }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif
            </div>
        @empty
            <div class="empty">Aucun sprint défini pour ce projet.</div>
        @endforelse
    </div>

    <div class="section">
        <div class="section-title">Responsables et membres</div>
        <div class="members-box">{{ $memberNames ?: 'Aucun membre associé à ce projet.' }}</div>
    </div>

    <div class="footer">Planning généré automatiquement pour {{ $project->name }}</div>
</body>
</html>
