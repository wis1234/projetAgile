<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('email_title') - {{ config('app.name') }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f5f7fa;
            color: #1e293b;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
        }

        .email-wrapper {
            width: 100%;
            padding: 20px 0;
        }

        .email-card {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            overflow: hidden;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
        }

        .header {
            padding: 26px 24px 20px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
        }

        .logo {
            display: block;
            width: 140px;
            max-width: 100%;
            height: auto;
            margin: 0 auto 8px;
            border: 0;
        }

        .header-title {
            margin: 0;
            color: #1e293b;
            font-size: 19px;
            font-weight: 700;
        }

        .content {
            padding: 28px 30px;
        }

        .greeting {
            margin: 0 0 16px;
            color: #475569;
            font-size: 16px;
        }

        .intro {
            margin: 0 0 20px;
            color: #64748b;
        }

        .info-card {
            margin: 20px 0;
            padding: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #4f46e5;
            border-radius: 10px;
        }

        .info-title {
            margin: 0 0 14px;
            color: #0f172a;
            font-size: 18px;
            font-weight: 700;
            overflow-wrap: anywhere;
        }

        .info-row {
            margin-top: 12px;
        }

        .info-label {
            display: block;
            color: #64748b;
            font-size: 12px;
        }

        .info-value {
            color: #1e293b;
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .button-wrap {
            margin: 24px 0;
            text-align: center;
        }

        .button {
            display: inline-block;
            padding: 11px 22px;
            border-radius: 7px;
            background: #4f46e5;
            color: #fff !important;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
        }

        .note {
            margin: 20px 0 0;
            color: #64748b;
            font-size: 13px;
        }

        .footer {
            padding: 20px 24px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 12px;
            text-align: center;
        }

        .footer p {
            margin: 5px 0;
        }

        .footer a {
            color: #4f46e5;
            overflow-wrap: anywhere;
        }

        @media (max-width: 600px) {
            .email-wrapper {
                padding: 0;
            }

            .email-card {
                border: 0;
                border-radius: 0;
            }

            .header {
                padding: 22px 18px 18px;
            }

            .content {
                padding: 24px 20px;
            }

            .info-card {
                padding: 16px;
            }

            .footer {
                padding: 18px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-card">
            <header class="header">
                <img
                    class="logo"
                    src="https://proja.kemtcenter.org/storage/public/task_comments/images/proja-logo.png"
                    alt="ProJA"
                    width="140"
                >
                <h1 class="header-title">@yield('header_title')</h1>
            </header>
            <main class="content">
                @yield('content')
                @hasSection('action')
                    <div class="button-wrap">
                        @yield('action')
                    </div>
                @endif
                @yield('note')
            </main>
            <footer class="footer">
                @yield('footer_link')
                <p>© {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
            </footer>
        </div>
    </div>
</body>
</html>
