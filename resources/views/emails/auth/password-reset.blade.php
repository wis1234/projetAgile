<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Réinitialisation de votre mot de passe</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background-color: #f7fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border-radius: 12px 12px 0 0;
            color: white;
        }
        
        .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 20px;
        }
        
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        h1 {
            color: #1a365d;
            font-size: 24px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 20px;
        }
        
        p {
            margin-top: 0;
            margin-bottom: 16px;
            color: #4a5568;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.15);
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        
        .code {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            font-family: monospace;
            font-size: 18px;
            color: #2d3748;
            word-break: break-all;
        }
        
        .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 24px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ asset('logo-proja.png') }}" alt="ProjA Logo" class="logo">
            <h1 style="color: white; margin: 0;">Réinitialisation de mot de passe</h1>
        </div>
        
        <div class="content">
            <p>Bonjour {{ $user->name ?? '' }},</p>
            
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte ProjA. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</p>
            
            <p>Pour définir un nouveau mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $actionUrl }}" class="button" target="_blank">
                    Réinitialiser mon mot de passe
                </a>
            </div>
            
            <p>Ou copiez-collez ce lien dans votre navigateur :</p>
            
            <div class="code">
                {{ $actionUrl }}
            </div>
            
            <p>Ce lien de réinitialisation expirera dans {{ $expires }} minutes.</p>
            
            <div class="divider"></div>
            
            <p>Si vous rencontrez des problèmes pour cliquer sur le bouton, copiez et collez l'URL ci-dessus dans votre navigateur web.</p>
            
            <p>L'équipe ProjA</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} ProjA. Tous droits réservés.</p>
            <p>Cet email vous a été envoyé car une demande de réinitialisation de mot de passe a été effectuée pour votre compte.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
        </div>
    </div>
</body>
</html>
