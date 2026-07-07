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
            margin: 1.2cm 1.1cm 1.6cm 1.1cm;
            size: A4 portrait;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.35;
            color: #1f2937;
            background: #ffffff;
        }

        .header {
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }

        .title {
            font-size: 20pt;
            font-weight: bold;
            color: #111827;
            margin-bottom: 4px;
        }

        .subtitle {
            font-size: 11pt;
            color: #4b5563;
            margin-bottom: 4px;
        }

        .summary {
            display: block;
            margin: 10px 0 16px;
        }

        .card {
            display: inline-block;
            width: 23%;
            min-width: 120px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px 10px;
            margin-right: 1.5%;
            margin-bottom: 6px;
            background: #f9fafb;
        }

        .card .label {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #6b7280;
            margin-bottom: 3px;
        }

        .card .value {
            font-size: 13pt;
            font-weight: bold;
            color: #111827;
        }

        .section {
            margin-bottom: 14px;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #111827;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }

        .sprint-card {
            border: 1px solid #e5e7eb;
            border-left: 4px solid #4f46e5;
            border-radius: 8px;
            padding: 9px 10px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            background: #fcfdff;
        }

        .sprint-title {
            font-size: 11pt;
            font-weight: bold;
            color: #312e81;
            margin-bottom: 2px;
        }

        .sprint-meta {
            font-size: 8.5pt;
            color: #6b7280;
            margin-bottom: 6px;
        }

        .sprint-description {
            font-size: 9pt;
            color: #374151;
            margin-bottom: 6px;
        }

        .task-table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid;
            margin-top: 4px;
        }

        .task-table th, .task-table td {
            border: 1px solid #e5e7eb;
            padding: 5px 6px;
            vertical-align: top;
            text-align: left;
            font-size: 8.5pt;
        }

        .task-table th {
            background: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }

        .task-title {
            font-weight: bold;
            color: #111827;
            margin-bottom: 2px;
        }

        .task-desc {
            color: #6b7280;
            font-size: 8pt;
        }

        .pill {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 999px;
            font-size: 8pt;
            font-weight: bold;
            color: #ffffff;
            background: #6b7280;
        }

        .pill.high { background: #dc2626; }
        .pill.medium { background: #d97706; }
        .pill.low { background: #16a34a; }
        .pill.done { background: #059669; }
        .pill.in_progress { background: #2563eb; }
        .pill.todo { background: #6b7280; }

        .empty {
            font-size: 9pt;
            color: #6b7280;
            font-style: italic;
            padding: 6px 0;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8.5pt;
            color: #9ca3af;
            padding: 5px 0;
            border-top: 1px solid #e5e7eb;
            background: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">PLANIFICATION DE PROJET</div>
        <div class="subtitle">{{ $project->name }}</div>
        <div class="subtitle">Généré le {{ $generated_at }}</div>
    </div>

    <div class="summary">
        <div class="card">
            <div class="label">Total tâches</div>
            <div class="value">{{ $taskStats['total'] }}</div>
        </div>
        <div class="card">
            <div class="label">Terminées</div>
            <div class="value">{{ $taskStats['completed'] }}</div>
        </div>
        <div class="card">
            <div class="label">En cours</div>
            <div class="value">{{ $taskStats['pending'] }}</div>
        </div>
        <div class="card">
            <div class="label">En retard</div>
            <div class="value">{{ $taskStats['late'] }}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Structure du planning</div>
        @forelse($sprints as $sprint)
            @php $sprintTasks = $taskGroups->get($sprint->id, collect()); @endphp
            <div class="sprint-card">
                <div class="sprint-title">{{ $sprint->name }}</div>
                <div class="sprint-meta">
                    {{ $sprint->start_date ? \Illuminate\Support\Carbon::parse($sprint->start_date)->format('d/m/Y') : 'Date non définie' }}
                    → {{ $sprint->end_date ? \Illuminate\Support\Carbon::parse($sprint->end_date)->format('d/m/Y') : 'Date non définie' }}
                    · {{ $sprintTasks->count() }} tâche(s)
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
                                <th style="width: 36%;">Tâche</th>
                                <th style="width: 12%;">Priorité</th>
                                <th style="width: 12%;">Statut</th>
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
        <div class="sprint-description">{{ $memberNames ?: 'Aucun membre associé à ce projet.' }}</div>
    </div>

    <div class="footer">Planning généré automatiquement pour {{ $project->name }}</div>
</body>
</html>
