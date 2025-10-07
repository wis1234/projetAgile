<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification d'email - ProjA</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Poppins', Arial, sans-serif;
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
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 30px 0;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .logo {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            text-decoration: none;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #1a202c;
            margin-top: 0;
            font-size: 24px;
            font-weight: 600;
        }
        p {
            margin-bottom: 20px;
            color: #4a5568;
        }
        .button {
            display: inline-block;
            background: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .button:hover {
            background: #4338ca;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        .verification-link {
            word-break: break-all;
            background: #f7fafc;
            padding: 15px;
            border-radius: 6px;
            font-size: 13px;
            color: #4a5568;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
        }
        .signature {
            margin-top: 30px;
            color: #4a5568;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="{{ config('app.url') }}" class="logo">ProjA</a>
        </div>
        
        <div class="content">
            <h1>Bonjour {{ $user->name }} !</h1>
            
            <p>Merci de vous être inscrit sur <strong>ProjA</strong> !</p>
            
            <p>Pour commencer à utiliser votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{ $verificationUrl }}" class="button">Vérifier mon adresse email</a>
            </p>
            
            <p>Si vous ne parvenez pas à cliquer sur le bouton, copiez et collez le lien ci-dessous dans votre navigateur :</p>
            
            <div class="verification-link">
                {{ $verificationUrl }}
            </div>
            
            <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
            
            <div class="signature">
                <p>Cordialement,<br>L'équipe ProjA</p>
            </div>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} ProjA. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
