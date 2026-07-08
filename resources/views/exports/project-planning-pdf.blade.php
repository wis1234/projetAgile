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
            margin: 2.6cm 1.9cm 2.4cm 1.9cm;
            size: A4 landscape;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica', Arial, sans-serif;
            font-size: 9.5pt;
            line-height: 1.5;
            color: #000000;
            background: #ffffff;
        }

        a {
            color: #000000;
            text-decoration: underline;
        }

        /* ===== HEADER ===== */
        .header {
            padding: 0 0 12px 0;
            margin-bottom: 18px;
            border-bottom: 1.5px solid #000000;
        }

        .eyebrow {
            font-size: 8pt;
            font-style: italic;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #000000;
            margin-bottom: 8px;
        }

        .title {
            font-size: 19pt;
            font-weight: bold;
            color: #000000;
            margin-bottom: 4px;
        }

        .title .title-project {
            font-weight: bold;
        }

        /* ===== META BLOCK ===== */
        .meta-block {
            margin-bottom: 18px;
            font-size: 8.7pt;
            color: #222222;
        }

        .meta-block .meta-line {
            margin-bottom: 3px;
        }

        .meta-block .meta-label {
            font-weight: bold;
        }

        .meta-block .meta-sep {
            color: #999999;
            margin: 0 8px;
        }

        /* ===== TABLE OF CONTENTS (navigation) ===== */
        .toc {
            margin-bottom: 22px;
            padding: 12px 16px;
            border: 1px solid #000000;
        }

        .toc-title {
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-bottom: 8px;
        }

        .toc ol {
            margin: 0;
            padding-left: 18px;
        }

        .toc li {
            font-size: 8.7pt;
            margin-bottom: 4px;
        }

        .toc .toc-dates {
            color: #555555;
            font-size: 8pt;
        }

        /* ===== SECTION TITLES ===== */
        .section {
            margin-bottom: 22px;
        }

        .section-title {
            font-size: 11.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #000000;
            margin-bottom: 4px;
            padding-bottom: 6px;
            border-bottom: 1px solid #000000;
        }

        .section-note {
            font-size: 8pt;
            font-style: italic;
            color: #555555;
            margin-bottom: 12px;
        }

        /* ===== LEGEND ===== */
        .legend {
            width: 100%;
            margin-bottom: 14px;
            font-size: 7.8pt;
            color: #333333;
            border-top: 1px solid #cccccc;
            border-bottom: 1px solid #cccccc;
            padding: 8px 4px;
        }

        .legend .legend-group {
            display: inline-block;
            margin-right: 26px;
        }

        .legend .legend-title {
            font-weight: bold;
            margin-right: 6px;
        }

        /* ===== PLANNING TABLE ===== */
        /* NOTE : conçue SANS rowspan. Un rowspan qui s'étend sur plusieurs
           tâches se casse mal quand le tableau change de page (dompdf duplique
           alors le contenu de la cellule fusionnée de façon incohérente — c'est
           ce qui causait le chevauchement du rendu précédent). Chaque ligne est
           donc autonome : Projet + Sprint sont répétés sur chaque tâche, ce qui
           garantit que la hiérarchie Projet → Sprint → Tâche → Responsable reste
           toujours correcte, quel que soit l'endroit où la page se coupe. */
        .planning-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .planning-table thead th {
            background: #efefef;
            color: #000000;
            font-size: 7.8pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            text-align: left;
            padding: 10px 12px;
            border: 1px solid #000000;
        }

        .planning-table td {
            border: 1px solid #999999;
            padding: 10px 12px;
            vertical-align: top;
            font-size: 8.6pt;
        }

        .planning-table tr {
            page-break-inside: avoid;
        }

        .col-project  { width: 12%; }
        .col-sprint   { width: 18%; }
        .col-task     { width: 31%; }
        .col-owner    { width: 15%; }
        .col-priority { width: 12%; }
        .col-status   { width: 12%; }

        /* Ligne "séparateur de sprint" : une seule ligne pleine largeur,
           jamais fusionnée sur plusieurs lignes → aucun risque de coupure. */
        .sprint-divider td {
            background: #e4e4e4 !important;
            border: 1px solid #000000;
            padding: 9px 12px;
        }

        .sprint-divider .sprint-name {
            font-weight: bold;
            font-size: 9.3pt;
        }

        .sprint-divider .sprint-dates {
            font-size: 8pt;
            color: #333333;
            margin-top: 2px;
        }

        .sprint-divider .sprint-desc {
            font-size: 7.8pt;
            color: #444444;
            font-style: italic;
            margin-top: 4px;
        }

        .group-a td { background: #ffffff; }
        .group-b td { background: #f6f6f6; }

        .cell-project {
            font-weight: bold;
        }

        .cell-sprint-name {
            font-weight: bold;
            font-size: 8.4pt;
        }

        .task-title {
            font-weight: bold;
            margin-bottom: 3px;
            line-height: 1.3;
        }

        .task-desc {
            color: #444444;
            font-size: 7.6pt;
            line-height: 1.35;
            margin-bottom: 3px;
        }

        .task-due {
            font-size: 7.6pt;
            color: #333333;
        }

        .task-due.overdue {
            font-weight: bold;
            text-decoration: underline;
        }

        .owner-name {
            font-weight: bold;
        }

        .owner-none {
            color: #777777;
            font-style: italic;
            font-size: 8.2pt;
        }

        .priority-stars {
            font-size: 9pt;
            letter-spacing: 1px;
        }

        .priority-label {
            display: block;
            font-size: 7.4pt;
            color: #333333;
            margin-top: 2px;
        }

        .status-box {
            font-size: 9pt;
            margin-right: 4px;
        }

        .empty-cell {
            font-size: 8.6pt;
            color: #777777;
            font-style: italic;
            text-align: center;
            padding: 12px 0;
        }

        /* ===== MEMBERS ===== */
        .members-box {
            font-size: 9pt;
            color: #000000;
            padding: 12px 14px;
            border: 1px solid #000000;
            line-height: 1.6;
        }

        /* ===== FOOTER ===== */
        .footer {
            position: fixed;
            bottom: -1.8cm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7.8pt;
            color: #333333;
            padding-top: 6px;
            border-top: 1px solid #000000;
        }

        .footer .footer-brand {
            font-weight: bold;
            letter-spacing: 0.1em;
        }

        .footer .dot {
            color: #999999;
            margin: 0 6px;
        }

        .footer .page-current:before {
            content: counter(page);
        }

        .footer .page-total:before {
            content: counter(pages);
        }
    </style>
</head>
<body>
    <div id="top"></div>
    <div class="header">
        <div class="eyebrow">Rapport de projet</div>
        <div class="title">Planification de projet <span class="title-project">{{ $project->name }}</span></div>
    </div>

    <div class="meta-block">
        <div class="meta-line"><span class="meta-label">Généré le :</span> {{ $generated_at }}</div>
        <div class="meta-line">
            <span class="meta-label">Sprints (objectifs) :</span> {{ $sprints->count() }}
            <span class="meta-sep">·</span>
            <span class="meta-label">Tâches totales :</span> {{ $taskStats['total'] }}
        </div>
        <div class="meta-line">
            <span class="meta-label">Terminées :</span> {{ $taskStats['completed'] }}
            <span class="meta-sep">·</span>
            <span class="meta-label">En cours :</span> {{ $taskStats['pending'] }}
            <span class="meta-sep">·</span>
            <span class="meta-label">En retard :</span> {{ $taskStats['late'] }}
        </div>
    </div>

    {{-- ===== Sommaire cliquable : navigation rapide vers chaque sprint ===== --}}
    @if($sprints->count() > 0)
        <div class="toc">
            <div class="toc-title">Sommaire</div>
            <ol>
                @foreach($sprints as $sprint)
                    @php
                        $sStart = $sprint->start_date ? \Illuminate\Support\Carbon::parse($sprint->start_date)->format('d/m/Y') : '—';
                        $sEnd = $sprint->end_date ? \Illuminate\Support\Carbon::parse($sprint->end_date)->format('d/m/Y') : '—';
                    @endphp
                    <li>
                        <a href="#sprint-{{ $sprint->id }}">{{ $sprint->name }}</a>
                        <span class="toc-dates">({{ $sStart }} &rarr; {{ $sEnd }})</span>
                    </li>
                @endforeach
            </ol>
        </div>
    @endif

    <div class="section">
        <div class="section-title">Structure du planning</div>
        <div class="section-note">Chaque sprint correspond à un objectif du projet. Toutes les colonnes (Projet, Sprint, Tâche, Responsable) sont répétées sur chaque ligne pour rester lisibles même si le tableau se poursuit sur plusieurs pages.</div>

        <div class="legend">
            <span class="legend-group">
                <span class="legend-title">Priorité :</span>
                &#9733;&#9733;&#9733; Haute &nbsp;&nbsp; &#9733;&#9733;&#9734; Moyenne &nbsp;&nbsp; &#9733;&#9734;&#9734; Faible
            </span>
            <span class="legend-group">
                <span class="legend-title">Statut :</span>
                &#9744; À faire &nbsp;&nbsp; &#9632; En cours &nbsp;&nbsp; &#9745; Terminé
            </span>
        </div>

        <table class="planning-table">
            <thead>
                <tr>
                    <th class="col-project">Projet</th>
                    <th class="col-sprint">Sprint / Objectif</th>
                    <th class="col-task">Tâche</th>
                    <th class="col-owner">Responsable</th>
                    <th class="col-priority">Priorité</th>
                    <th class="col-status">Statut</th>
                </tr>
            </thead>
            <tbody>
                @forelse($sprints as $sprintIndex => $sprint)
                    @php
                        $sprintTasks = $taskGroups->get($sprint->id, collect());
                        $groupClass = $sprintIndex % 2 === 0 ? 'group-a' : 'group-b';
                        $startLabel = $sprint->start_date ? \Illuminate\Support\Carbon::parse($sprint->start_date)->format('d/m/Y') : 'Non définie';
                        $endLabel = $sprint->end_date ? \Illuminate\Support\Carbon::parse($sprint->end_date)->format('d/m/Y') : 'Non définie';
                    @endphp

                    {{-- Ligne séparateur : une seule ligne pleine largeur, jamais coupée --}}
                    <tr class="sprint-divider" id="sprint-{{ $sprint->id }}">
                        <td colspan="6">
                            <span class="sprint-name">{{ $project->name }} &nbsp;&rsaquo;&nbsp; {{ $sprint->name }}</span>
                            <span class="sprint-dates">&nbsp;&nbsp;({{ $startLabel }} &rarr; {{ $endLabel }})</span>
                            @if($sprint->description)
                                <div class="sprint-desc">{{ \Illuminate\Support\Str::limit($sprint->description, 140) }}</div>
                            @endif
                        </td>
                    </tr>

                    @if($sprintTasks->isEmpty())
                        <tr class="{{ $groupClass }}">
                            <td colspan="6" class="empty-cell">Aucune tâche assignée à ce sprint.</td>
                        </tr>
                    @else
                        @foreach($sprintTasks as $task)
                            @php
                                $isOverdue = $task->due_date
                                    && ($task->status ?? 'todo') !== 'done'
                                    && \Illuminate\Support\Carbon::parse($task->due_date)->isPast();

                                $priority = $task->priority ?? 'medium';
                                $priorityStars = [
                                    'high'   => '★★★',
                                    'medium' => '★★☆',
                                    'low'    => '★☆☆',
                                ][$priority] ?? '★★☆';
                                $priorityLabel = ['high' => 'Haute', 'medium' => 'Moyenne', 'low' => 'Faible'][$priority] ?? 'Moyenne';

                                $status = $task->status ?? 'todo';
                                $statusBox = ['todo' => '☐', 'in_progress' => '■', 'done' => '☑'][$status] ?? '☐';
                                $statusLabel = ['todo' => 'À faire', 'in_progress' => 'En cours', 'done' => 'Terminé'][$status] ?? 'À faire';
                            @endphp
                            <tr class="{{ $groupClass }}">
                                <td class="cell-project">{{ $project->name }}</td>
                                <td><span class="cell-sprint-name">{{ $sprint->name }}</span></td>
                                <td class="col-task">
                                    <div class="task-title">{{ $task->title }}</div>
                                    @if($task->description)
                                        <div class="task-desc">{{ \Illuminate\Support\Str::limit(strip_tags($task->description), 90) }}</div>
                                    @endif
                                    <div class="task-due {{ $isOverdue ? 'overdue' : '' }}">
                                        Échéance : {{ $task->due_date ? \Illuminate\Support\Carbon::parse($task->due_date)->format('d/m/Y') : 'Non définie' }}
                                        @if($isOverdue) &middot; en retard @endif
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
                                    <span class="priority-stars">{{ $priorityStars }}</span>
                                    <span class="priority-label">{{ $priorityLabel }}</span>
                                </td>
                                <td class="col-status">
                                    <span class="status-box">{{ $statusBox }}</span>{{ $statusLabel }}
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
        <span class="dot">·</span><a href="#top">&uarr; Sommaire</a>
        <span class="dot">·</span>Page <span class="page-current"></span> / <span class="page-total"></span>
    </div>
</body>
</html>