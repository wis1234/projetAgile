<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification d'email - {{ config('app.name') }}</title>
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

        .email-wrapper {
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }

        .footer {
            text-align: center;
            padding: 24px 30px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 13px;
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

        @media (max-width: 600px) {
            .container {
                padding: 0;
            }

            .header {
                padding: 24px 20px 18px 20px;
            }

            .header-title {
                font-size: 17px;
            }

            .content {
                padding: 25px 20px;
            }

            .button {
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">

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
                                Vérification de votre adresse email
                            </div>

                        </td>
                    </tr>
                </table>
            </div>

            <div class="content">
                <h1>Bonjour {{ $user->name }} !</h1>

                <p>Merci de vous être inscrit sur <strong>{{ config('app.name') }}</strong> !</p>

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
                    <p>Cordialement,<br>L'équipe {{ config('app.name') }}</p>
                </div>
            </div>

            <div class="footer">
                <p>© {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
            </div>
        </div>
    </div>
</body>
</html>