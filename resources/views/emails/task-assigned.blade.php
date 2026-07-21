<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle tâche assignée – {{ config('app.name') }}</title>
    <style>
        /* Reset */
        body, table, td, p, a, h1, h2 {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
        }
        body {
            background-color: #f4f5f7;
            padding: 20px;
        }
        .container {
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .header {
            padding: 32px 40px 0;
            text-align: left;
        }
        .header .logo {
            font-size: 22px;
            font-weight: 700;
            color: #1a1a1a;
            letter-spacing: -0.3px;
        }
        .header .tagline {
            font-size: 15px;
            color: #555;
            margin-top: 4px;
            font-weight: 400;
        }
        .content {
            padding: 28px 40px 20px;
        }
        .greeting {
            font-size: 15px;
            color: #222;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .intro {
            font-size: 14px;
            color: #333;
            margin-bottom: 24px;
        }
        .intro strong {
            font-weight: 600;
            color: #000;
        }
        .task-title {
            font-size: 19px;
            font-weight: 700;
            color: #000;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .tags {
            margin-bottom: 24px;
        }
        .tag {
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 20px;
            margin-right: 8px;
            letter-spacing: 0.3px;
        }
        .tag-priority-high { background: #fee2e2; color: #b91c1c; }
        .tag-priority-medium { background: #fef3c7; color: #b45309; }
        .tag-priority-low { background: #d1fae5; color: #047857; }
        .tag-priority-urgent { background: #fce7f3; color: #be123c; }
        .tag-status { background: #e0e7ff; color: #3730a3; }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
        }
        .info-table td {
            padding: 10px 0;
            vertical-align: top;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
            color: #222;
        }
        .info-label {
            font-weight: 500;
            color: #666;
            width: 110px;
        }
        .info-value {
            font-weight: 500;
        }
        .description-box {
            margin: 20px 0;
            padding: 16px 18px;
            background: #f9fafb;
            border-radius: 8px;
            font-size: 14px;
            color: #333;
            line-height: 1.6;
        }
        .description-box .desc-label {
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 6px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .button-wrapper {
            margin: 28px 0 10px;
        }
        .button {
            display: inline-block;
            background: #0064e0;
            color: #ffffff !important;
            text-decoration: none;
            padding: 13px 34px;
            border-radius: 24px;
            font-weight: 600;
            font-size: 15px;
        }
        .tip {
            background: #fff5e6;
            padding: 14px 18px;
            border-radius: 8px;
            font-size: 13px;
            color: #7c5600;
            margin: 24px 0 0;
        }
        .footer {
            padding: 24px 40px;
            font-size: 12px;
            color: #888;
            text-align: center;
            border-top: 1px solid #f0f0f0;
            line-height: 1.6;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .header, .content, .footer { padding-left: 20px; padding-right: 20px; }
            .info-table td:first-child { width: auto; display: block; padding-bottom: 2px; }
            .info-table td:last-child { display: block; padding-top: 0; padding-bottom: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
            <div class="tagline">Nouvelle tâche assignée</div>
        </div>

        <div class="content">
            @php
                $assignedUser = $task->assignedUser;
                $prenom = $assignedUser ? explode(' ', $assignedUser->name)[0] : 'Utilisateur';

                $priorities = [
                    'low' => 'Basse',
                    'medium' => 'Moyenne',
                    'high' => 'Haute',
                    'urgent' => 'Urgente'
                ];
                $statuses = [
                    'todo' => 'À faire',
                    'in_progress' => 'En cours',
                    'in_review' => 'En révision',
                    'done' => 'Terminé',
                    'cancelled' => 'Annulé',
                    'pending' => 'En attente',
                    'completed' => 'Terminé',
                    'closed' => 'Fermé'
                ];
                $priority = $priorities[strtolower($task->priority)] ?? ucfirst($task->priority);
                $status = $statuses[strtolower($task->status)] ?? ucfirst(str_replace('_', ' ', $task->status));
                $creator = \App\Models\User::find($task->created_by);
            @endphp

            <p class="greeting">Bonjour {{ $prenom }},</p>

            <p class="intro">
                Une nouvelle tâche vous a été confiée par <strong>{{ $creator ? $creator->name : 'le système' }}</strong>.
            </p>

            <div class="task-title">{{ $task->title }}</div>

            <div class="tags">
                <span class="tag tag-priority-{{ strtolower($task->priority) }}">{{ $priority }}</span>
                <span class="tag tag-status">{{ $status }}</span>
            </div>

            <table class="info-table">
                @if($task->project)
                <tr>
                    <td class="info-label">📁 Projet</td>
                    <td class="info-value">{{ $task->project->name ?? '—' }}</td>
                </tr>
                @endif
                <tr>
                    <td class="info-label">👤 Assigné à</td>
                    <td class="info-value">{{ $assignedUser ? $assignedUser->name : 'Non assigné' }}</td>
                </tr>
                <tr>
                    <td class="info-label">📅 Échéance</td>
                    <td class="info-value">{{ $task->due_date ? \Carbon\Carbon::parse($task->due_date)->format('d/m/Y') : 'Non définie' }}</td>
                </tr>
                <tr>
                    <td class="info-label">✨ Créée par</td>
                    <td class="info-value">{{ $creator ? $creator->name : 'Système' }}</td>
                </tr>
            </table>

            @if($task->description)
            <div class="description-box">
                <div class="desc-label">Description</div>
                {!! nl2br(e($task->description)) !!}
            </div>
            @endif

            <div class="button-wrapper">
                <a href="{{ route('tasks.show', $task->id) }}" class="button">Voir la tâche</a>
            </div>

            <div class="tip">
                💡 Cette tâche vous est personnellement attribuée. Consultez-la et commencez à travailler dès que possible.
            </div>
        </div>

        <div class="footer">
            © {{ date('Y') }} {{ config('app.name') }} · Cet email automatique ne nécessite pas de réponse.
        </div>
    </div>
</body>
</html>