<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>La réunion a commencé - {{ config('app.name') }}</title>
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
            margin-top: 0;
            font-size: 24px;
            font-weight: 600;
        }
        
        .greeting {
            font-size: 16px;
            margin-bottom: 25px;
        }
        
        .meeting-card {
            background-color: #f8fafc;
            border-left: 4px solid #4361ee;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .meeting-title {
            color: #2d3748;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 15px 0;
        }
        
        .meeting-details {
            margin: 0;
            padding: 0;
        }
        
        .meeting-details li {
            list-style: none;
            padding: 6px 0;
            display: flex;
            align-items: flex-start;
        }
        
        .meeting-details strong {
            color: #4a5568;
            min-width: 120px;
            display: inline-block;
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
            color: white !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: 500;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
            transition: all 0.3s ease;
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(67, 97, 238, 0.4);
        }
        
        .link-note {
            text-align: center;
            color: #718096;
            font-size: 14px;
            margin: 10px 0 30px;
        }
        
        .meeting-link {
            word-break: break-all;
            color: #4361ee;
            text-decoration: none;
            font-size: 14px;
            background-color: #f0f4ff;
            padding: 12px 15px;
            border-radius: 6px;
            display: block;
            margin: 15px 0;
            border: 1px dashed #c3dafe;
            transition: all 0.3s ease;
        }
        
        .meeting-link:hover {
            background-color: #e6edff;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #a0aec0;
            font-size: 13px;
            border-top: 1px solid #edf2f7;
            background-color: #f8fafc;
        }
        
        .signature {
            margin: 30px 0 15px;
            color: #4a5568;
        }
        
        .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 25px 0;
        }
        
        @media (max-width: 600px) {
            .content {
                padding: 20px 15px;
            }
            .meeting-details li {
                flex-direction: column;
            }
            .meeting-details strong {
                margin-bottom: 3px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
            <h1>La réunion a commencé !</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Bonjour {{ $user->name }},</p>
            
            <p>La réunion <strong>{{ $meeting->topic }}</strong> pour le projet <strong>{{ $project->name }}</strong> est en cours.</p>
            
            <div class="meeting-card">
                <h3 class="meeting-title">Détails de la réunion :</h3>
                <ul class="meeting-details">
                    <li><strong>Sujet :</strong> {{ $meeting->topic }}</li>
                    <li><strong>Heure de début :</strong> {{ $startTime->format('d/m/Y H:i') }} (UTC) / {{ $startTime->timezone('Africa/Porto-Novo')->format('H:i') }} (WAT)</li>
                    <li><strong>Heure de fin :</strong> {{ $endTime->format('d/m/Y H:i') }} (UTC) / {{ $endTime->timezone('Africa/Porto-Novo')->format('H:i') }} (WAT)</li>
                    <li><strong>Durée :</strong> {{ $meeting->duration }} minutes</li>
                    @if($meeting->agenda)
                    <li><strong>Ordre du jour :</strong> {{ $meeting->agenda }}</li>
                    @endif
                </ul>
            </div>
            
            <div class="button-container">
                <a href="{{ $joinUrl }}" class="button">Rejoindre la réunion maintenant</a>
            </div>
            
            <p class="link-note">Ou copiez ce lien dans votre navigateur :</p>
            <a href="{{ $joinUrl }}" class="meeting-link">{{ $joinUrl }}</a>
            
            <div class="divider"></div>
            
            <p class="signature">Cordialement,<br><strong>L'équipe {{ config('app.name') }}</strong></p>
        </div>
        
        <div class="footer">
            © {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.
        </div>
    </div>
</body>
</html>
