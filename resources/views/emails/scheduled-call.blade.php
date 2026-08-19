<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $type === 'reminder' ? 'Rappel d\'appel' : 'Appel en cours' }} - {{ config('app.name') }}</title>
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body, html {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f5f7fa;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .email-wrapper {
            max-width: 100%;
            margin: 0;
            background-color: #ffffff;
            overflow: hidden;
        }

        /* ===== Header aligné sur le template "task assigned" ===== */
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
            padding: 35px 30px;
        }

        .greeting {
            font-size: 16px;
            color: #475569;
            margin-bottom: 20px;
        }

        .greeting strong {
            color: #1e293b;
        }

        .intro-text {
            font-size: 15px;
            color: #64748b;
            margin-bottom: 25px;
            line-height: 1.7;
        }

        .call-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            padding: 26px 28px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        }

        .call-title-row {
            margin-bottom: 18px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
        }

        .call-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 10px;
            line-height: 1.4;
        }

        .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }

        .badge-reminder { background-color: #fef3c7; color: #b45309; }
        .badge-live { background-color: #d1fae5; color: #047857; }

        .call-meta {
            width: 100%;
            border-collapse: separate;
            border-spacing: 7px;
            margin: 4px -7px 4px -7px;
        }

        .meta-item {
            width: 50%;
            background: #ffffff;
            padding: 14px 16px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }

        .meta-label {
            color: #64748b;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 6px;
        }

        .meta-value {
            color: #1e293b;
            font-weight: 600;
            font-size: 15px;
            display: block;
        }

        .btn-container {
            text-align: center;
            margin: 28px 0 8px;
        }

        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
            color: white !important;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 14px rgba(67, 97, 238, 0.4);
        }

        .footer {
            background: #ffffff;
            padding: 28px 30px;
            text-align: center;
            color: #94a3b8;
        }

        .footer-copyright {
            font-size: 13px;
            margin-bottom: 10px;
            font-weight: 500;
        }

        .footer-note {
            font-size: 12px;
            color: #64748b;
            margin: 0;
        }

        @media (max-width: 600px) {
            .header { padding: 24px 20px 18px 20px; }
            .header-title { font-size: 17px; }
            .content { padding: 25px 20px; }
            .call-card { padding: 20px; }

            .call-meta, .call-meta tbody, .call-meta tr, .meta-item {
                display: block;
                width: 100% !important;
            }
            .call-meta { margin: 16px 0; border-spacing: 0; }
            .meta-item { margin-bottom: 10px; }

            .btn { width: 100%; padding: 14px 20px; }
            .footer { padding: 24px 20px; }
        }
    </style>
</head>
<body>
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
                            {{ $type === 'reminder' ? 'Rappel d\'appel' : 'Appel en cours' }}
                        </div>

                    </td>
                </tr>
            </table>
        </div>

        <div class="content">
            @php
                $callTitle = $schedule->title ?: 'ProJA Meet';
                $projectName = $schedule->project->name ?? 'Sans projet';
                $scheduledAt = $schedule->scheduled_at ?? null;
            @endphp

            <div class="greeting">
                Bonjour,
            </div>

            <p class="intro-text">
                @if($type === 'reminder')
                    L'appel <strong>{{ $callTitle }}</strong> pour le projet <strong>{{ $projectName }}</strong> commencera dans environ <strong>1 heure</strong>.
                @else
                    L'appel <strong>{{ $callTitle }}</strong> pour le projet <strong>{{ $projectName }}</strong> vient de commencer.
                @endif
            </p>

            <div class="call-card">
                <div class="call-title-row">
                    <div class="call-title">{{ $callTitle }}</div>
                    <span class="badge {{ $type === 'reminder' ? 'badge-reminder' : 'badge-live' }}">
                        {{ $type === 'reminder' ? 'Bientôt' : 'En direct' }}
                    </span>
                </div>

                <table class="call-meta" role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="meta-item">
                            <span class="meta-label">📁 Projet</span>
                            <span class="meta-value">{{ $projectName }}</span>
                        </td>
                        <td class="meta-item">
                            <span class="meta-label">🕐 Heure (UTC)</span>
                            <span class="meta-value">{{ $scheduledAt ? \Carbon\Carbon::parse($scheduledAt)->format('d/m/Y H:i') : 'Maintenant' }}</span>
                        </td>
                    </tr>
                </table>

                <div class="btn-container">
                    <a href="{{ url('/projects/'.$schedule->project_id) }}" class="btn">Rejoindre l'appel</a>
                </div>
            </div>
        </div>

        <div class="footer">
            <p class="footer-copyright">
                © {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.
            </p>
            <p class="footer-note">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
            </p>
        </div>
    </div>
</body>
</html>