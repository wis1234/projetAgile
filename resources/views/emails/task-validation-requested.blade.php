<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de validation de tâche - {{ config('app.name') }}</title>
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
            color: #1e293b;
            background-color: #f5f7fa;
            padding: 0;
            margin: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .email-wrapper {
            max-width: 100%;
            margin: 0;
            background-color: #ffffff;
            overflow: hidden;
        }

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

        .task-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        }

        .task-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 18px;
            line-height: 1.4;
        }

        .validation-box {
            background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            border-left: 4px solid #4f46e5;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
        }

        .validation-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 8px;
        }

        .validation-requester {
            font-weight: 700;
            color: #4338ca;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .validation-details {
            background: white;
            border-radius: 8px;
            padding: 16px;
            margin-top: 12px;
            border: 1px solid #e0e7ff;
        }

        .detail-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }

        .detail-item:last-child {
            margin-bottom: 0;
        }

        .detail-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 2px;
        }

        .detail-value {
            font-weight: 500;
            color: #1e293b;
        }

        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            margin-top: 20px;
            border: none;
            cursor: pointer;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
            .header {
                padding: 24px 20px 18px 20px;
            }

            .header-title {
                font-size: 17px;
            }

            .content {
                padding: 25px 20px;
            }

            .btn {
                width: 100%;
            }
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
                            Demande de validation de tâche
                        </div>

                    </td>
                </tr>
            </table>
        </div>

        <div class="content">
            @php
                $prenom = $notifiable->name ? explode(' ', $notifiable->name)[0] : 'Utilisateur';
                $deliverableName = $task->deliverable ? $task->deliverable->name : 'Aucun fichier';
            @endphp

            <div class="greeting">
                Bonjour <strong>{{ $prenom }}</strong>,
            </div>

            <p class="intro-text">
                <strong>{{ $task->assignedUser->name }}</strong>
                 demande la validation de la tâche <strong>{{ $task->title }}</strong> du projet <strong>{{ $task->project->name ?? 'Sans projet' }}</strong>.
            </p>

            <div class="task-card">
                <div class="task-title">{{ $task->title }}</div>

                <div class="validation-box">
                    <div class="validation-header">
                        <div class="validation-requester">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {{ $task->assignedUser->name }} demande une validation
                        </div>
                    </div>

                    <div class="validation-details">
                        <div class="detail-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: #64748b; flex-shrink: 0;">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <div>
                                <div class="detail-label">Livrable</div>
                                <div class="detail-value">{{ $deliverableName }}</div>
                            </div>
                        </div>

                        <div class="detail-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: #64748b; flex-shrink: 0;">
                                <circle cx="12" cy="7" r="4"></circle>
                                <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
                            </svg>
                            <div>
                                <div class="detail-label">Assigné à</div>
                                <div class="detail-value">{{ $task->assignedUser->name ?? 'Non assigné' }}</div>
                            </div>
                        </div>

                        <div class="detail-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: #64748b; flex-shrink: 0;">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <div>
                                <div class="detail-label">Date d'échéance</div>
                                <div class="detail-value">{{ $task->due_date ? \Carbon\Carbon::parse($task->due_date)->format('d/m/Y') : 'Non définie' }}</div>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="{{ route('tasks.show', $task->id) }}" class="btn">
                            <span style="color: white;">Voir la tâche</span>
                        </a>
                    </div>
                </div>
            </div>

            <p style="margin-top: 24px; font-size: 14px; color: #64748b; line-height: 1.6;">
                Merci de procéder à la validation dès que possible. Vous recevez cette notification car vous êtes impliqué dans cette tâche.
            </p>

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