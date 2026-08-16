<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rappel d'échéance - {{ config('app.name') }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f5f7fa;
            padding: 0;
        }

        .container {
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin: 20px auto;
        }

        /* ===== Header aligné sur le template "sprint-deadline extended" ===== */
        .header {
            background: #f5f7fac5;
            padding: 28px 30px 22px 30px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }

        .header-title {
            color: #1e293b;
            font-size: 19px;
            font-weight: 600;
            text-align: center;
            width: 100%;
            display: block;
            line-height: 1.35;
            margin-top: 2px;
        }
        /* ===== fin header ===== */

        .content {
            padding: 30px;
            color: #4a5568;
        }

        h2 {
            color: #1a202c;
            margin-top: 0;
            font-size: 20px;
            font-weight: 600;
        }

        .info-box {
            background-color: #f8fafc;
            border-left: 4px solid #4361ee;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .info-item {
            margin: 10px 0;
        }

        .info-item:first-child {
            margin-top: 0;
        }

        .info-item:last-child {
            margin-bottom: 0;
        }

        .info-label {
            font-weight: 600;
            color: #4a5568;
            display: block;
            margin-bottom: 4px;
        }

        .info-value {
            color: #2d3748;
        }

        .priority-high {
            background-color: #FEE2E2;
            color: #B91C1C;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            display: inline-block;
        }

        .priority-medium {
            background-color: #FEF3C7;
            color: #92400E;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            display: inline-block;
        }

        .priority-low {
            background-color: #E0F2FE;
            color: #075985;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            display: inline-block;
        }

        .button {
            display: inline-block;
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
            color: white !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
            font-size: 15px;
        }

        .footer {
            padding: 24px 30px;
            text-align: center;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
        }

        .footer a {
            color: #4361ee;
            text-decoration: none;
        }

        .footer-text {
            margin: 5px 0;
            line-height: 1.5;
            font-size: 13px;
        }

        @media (max-width: 600px) {
            .header {
                padding: 24px 20px 18px 20px;
            }

            .header-title {
                font-size: 17px;
            }

            .content {
                padding: 22px 20px;
            }

            .footer {
                padding: 20px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">

        <div class="header">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" style="text-align:center;">

                        <img src="https://proja.kemtcenter.org/storage/public/task_comments/images/proja-logo.png"
                             alt="ProJA"
                             width="140"
                             style="
                                display:block;
                                margin:0 auto 6px auto;
                                border:0;
                                outline:none;
                                text-decoration:none;
                                max-width:140px;
                                width:140px;
                                height:auto;
                                color:#4361ee;
                                font-size:20px;
                                font-weight:700;
                                font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                             ">

                        <div class="header-title">
                            Rappel d'échéance de tâche
                        </div>

                    </td>
                </tr>
            </table>
        </div>

        <div class="content">
            <p>Bonjour {{ $notifiable->name }},</p>

            @php
                $dueDate = \Carbon\Carbon::parse($task->due_date);
                $now = now();

                // Formatage de la date en WAT (West Africa Time)
                $watDate = $dueDate->copy()->setTimezone('Africa/Lagos');

                // Calcul du temps restant
                $timeLeft = '';
                $totalMinutes = $now->diffInMinutes($watDate, false);

                if ($totalMinutes < 1) {
                    // Moins d'une minute : afficher les secondes
                    $seconds = (int)$now->diffInSeconds($watDate, false);
                    $timeLeft = $seconds . ' seconde' . ($seconds > 1 ? 's' : '');
                } elseif ($totalMinutes < 60) {
                    // Moins d'une heure : afficher les minutes
                    $timeLeft = (int)$totalMinutes . ' minute' . ($totalMinutes > 1 ? 's' : '');
                } else {
                    // Plus d'une heure : afficher heures et minutes
                    $hours = (int)floor($totalMinutes / 60);
                    $minutes = (int)($totalMinutes % 60);
                    $timeLeft = $hours . ' heure' . ($hours > 1 ? 's' : '');
                    if ($minutes > 0) {
                        $timeLeft .= ' et ' . $minutes . ' minute' . ($minutes > 1 ? 's' : '');
                    }
                }

                $timeLeft = 'dans ' . $timeLeft;
            @endphp
            <p>La tâche <strong>{{ $task->title }}</strong> est à rendre <strong>{{ $timeLeft }}</strong>.</p>

            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Projet</span>
                    <span class="info-value">{{ $task->project ? $task->project->name : 'Sans projet' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date limite</span>
                    <span class="info-value">{{ $watDate->format('d/m/Y H:i') }} (Fuseau horaire : UTC+1)</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Priorité</span>
                    <span class="info-value">
                        @if($task->priority === 'high')
                            <span class="priority-high">Priorité haute</span>
                        @elseif($task->priority === 'medium')
                            <span class="priority-medium">Priorité moyenne</span>
                        @else
                            <span class="priority-low">Basse priorité</span>
                        @endif
                    </span>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="{{ route('tasks.show', $task->id) }}" class="button">Voir la tâche</a>
            </div>

            <p>Merci d'utiliser notre application !</p>

            <p>Cordialement,<br>L'équipe {{ config('app.name') }}</p>
        </div>

        <div class="footer">
            <p class="footer-text">Si vous ne parvenez pas à cliquer sur le bouton ci-dessus, copiez et collez le lien suivant dans votre navigateur :</p>
            <p class="footer-text"><a href="{{ route('tasks.show', $task->id) }}">{{ route('tasks.show', $task->id) }}</a></p>
            <p class="footer-text">© {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>