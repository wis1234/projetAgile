<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rappel d'échéance - {{ config('app.name') }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Poppins', Arial, sans-serif;
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
        
        .header {
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
            color: white;
            text-decoration: none;
            display: inline-block;
        }
        
        .content {
            padding: 30px;
            color: #4a5568;
        }
        
        h1 {
            color: #f8fafc;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
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
            display: flex;
            align-items: flex-start;
        }
        
        .info-label {
            font-weight: 600;
            color: #4a5568;
            min-width: 100px;
        }
        
        .info-value {
            flex: 1;
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
            text-align: center;
            color: white;
        }
        
        .header {
            text-align: center;
            padding: 20px 0;
            background-color: #4a6cf7;
            color: white;
            border-radius: 5px 5px 0 0;
        }
        
        .header h1 {
            color: white;
            margin: 15px 0 0 0;
            text-align: center;
        }
        
        .footer a {
            color: #4361ee;
            text-decoration: none;
        
        .footer-text {
            margin: 5px 0;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
            <h1 >Rappel d'échéance de tâche</h1>
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
                    <div class="info-label">Projet : {{ $task->project ? $task->project->name : 'Sans projet' }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date limite :</div>
                        {{ $watDate->format('d/m/Y H:i') }} (Fuseau horaire : UTC+1)</p>
                </div>
                <div class="info-item">
                    <div class="info-label">Priorité :</div>
                    <div class="info-value">
                        @if($task->priority === 'high')
                        @elseif($task->priority === 'medium')
                            <span class="priority-medium">Priorité moyenne</span>
                        @else
                            <span class="priority-low">Basse priorité</span>
                        @endif
                    </div>
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
