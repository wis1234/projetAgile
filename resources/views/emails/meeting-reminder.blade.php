<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $isReminder ? '🔔 Rappel : ' : '📅 ' }}{{ $meeting->topic }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
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
            background-color: #ffffff;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .meeting-details {
            background-color: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .detail-item {
            display: flex;
            margin-bottom: 10px;
            align-items: center;
        }
        
        .detail-item i {
            margin-right: 10px;
            color: #3b82f6;
            width: 20px;
            text-align: center;
        }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            text-align: center;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #6b7280;
        }
        
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 25px 0;
        }
        
        .meeting-id {
            background-color: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            word-break: break-all;
            font-size: 14px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
        <div class="logo">{{ config('app.name') }}</div>
        <h1>{{ $isReminder ? '🔔 Rappel de réunion' : '📅 Nouvelle réunion planifiée' }}</h1>
        </div>
        
        <div class="content">
            <h2>{{ $meeting->topic }}</h2>
            
            <div class="meeting-details">
                <div class="detail-item">
                    <i>📅</i>
                    <div>
                        <strong>Date et heure :</strong><br>
                        {{ $meeting->start_time->locale('fr')->translatedFormat('l j F Y') }}<br>
                        <!-- Ligne UTC existante -->
                        De {{ $meeting->start_time->format('H:i') }} à {{ $meeting->start_time->copy()->addMinutes($meeting->duration)->format('H:i') }} (UTC)

                        <!-- Nouvelle ligne : BENIN TIME (Africa/Porto-Novo / WAT) -->
                        <br>HEURE DU BENIN: De {{ $meeting->start_time->copy()->setTimezone('Africa/Porto-Novo')->format('H:i') }}
                        à {{ $meeting->start_time->copy()->addMinutes($meeting->duration)->setTimezone('Africa/Porto-Novo')->format('H:i') }} (WAT)

                        @if($isReminder)
                            <br><span style="color: #ef4444; font-weight: 500;">(Démarre bientôt !)</span>
                        @endif
                    </div>
                </div>
                
                <div class="detail-item">
                    <i>⏱️</i>
                    <div><strong>Durée :</strong> {{ $meeting->duration }} minutes</div>
                </div>
                
                @if($meeting->agenda)
                <div class="detail-item">
                    <i>📋</i>
                    <div><strong>Ordre du jour :</strong><br>{{ $meeting->agenda }}</div>
                </div>
                @endif
                
                <div class="detail-item">
                    <i>🆔</i>
                    <div>
                        <strong>ID de réunion :</strong>
                        <div class="meeting-id">{{ $meeting->meeting_id }}</div>
                    </div>
                </div>
                
                @if($meeting->password)
                <div class="detail-item">
                    <i>🔑</i>
                    <div><strong>Mot de passe :</strong> {{ $meeting->password }}</div>
                </div>
                @endif
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $meeting->join_url }}" class="btn">
                    {{ $isReminder ? 'Rejoindre la réunion maintenant' : 'Ajouter au calendrier' }}
                </a>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                    Ou copiez ce lien : <br>
                    <span style="word-break: break-all; font-size: 12px;">{{ $meeting->join_url }}</span>
                </p>
            </div>
            
            <div class="divider"></div>
            
            <h3>📝 Instructions :</h3>
            <ol style="padding-left: 20px; margin: 15px 0;">
                <li>Cliquez sur le bouton ci-dessus pour rejoindre la réunion</li>
                <li>Assurez-vous d'avoir un casque et un microphone fonctionnels</li>
                <li>Rejoignez quelques minutes à l'avance pour tester votre configuration</li>
                @if($meeting->password)
                <li>Le mot de passe sera demandé pour accéder à la réunion</li>
                @endif
            </ol>
            
            <div class="footer">
                <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                <p>© {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
            </div>
        </div>
    </div>
</body>
</html>
