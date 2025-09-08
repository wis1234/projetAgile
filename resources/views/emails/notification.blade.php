<!DOCTYPE html>
<html>
<head>
    <title>{{ $subject ?? 'Notification' }}</title>
    <style type="text/css">
        /* Styles de base */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
        }
        
        /* Conteneur principal */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* En-tête */
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
        }
        
        /* Carte de contenu */
        .card {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        
        /* Bouton d'action */
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4F46E5;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 15px 0;
        }
        
        /* Pied de page */
        .footer {
            text-align: center;
            padding: 20px 0;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
        }
        
        /* Styles personnalisés passés depuis la notification */
        {!! $styles ?? '' !!}
    </style>
</head>
<body>
    <div class="email-container">
        <!-- En-tête avec logo -->
        <div class="header">
            <img src="{{ asset('logo-proja.png') }}" alt="Logo" class="logo">
        </div>
        
        <!-- Carte de contenu -->
        <div class="card">
            <!-- Salutation -->
            @if(isset($greeting) && $greeting)
                <h1 style="margin-top: 0; color: #1f2937;">{{ $greeting }}</h1>
            @endif
            
            <!-- Contenu du message -->
            {!! $content ?? 'Aucun contenu à afficher.' !!}
            
            <!-- Bouton d'action -->
            @if(isset($actionUrl) && isset($actionText) && ($showActionButton ?? true))
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{{ $actionUrl }}" class="btn">
                        {{ $actionText }}
                    </a>
                </div>
            @endif
        </div>
        
        <!-- Pied de page -->
        <div class="footer">
            <p>{{ $footer ?? 'Ceci est une notification automatique, merci de ne pas y répondre.' }}</p>
            @if(isset($unsubscribeUrl))
                <p style="font-size: 11px; margin-top: 10px;">
                    <a href="{{ $unsubscribeUrl }}" style="color: red;">
                        Se désabonner des notifications
                    </a>
                </p>
            @endif
        </div>
    </div>
</body>
</html>
