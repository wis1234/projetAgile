<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau fichier sur la tâche - {{ config('app.name') }}</title>
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
            background: linear-gradient(135deg, #4361ee 10%, #6d28d9 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 15s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.6; }
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .header-title {
            color: #f8fafc;
            font-size: 20px;
            font-weight: 500;
            position: relative;
            z-index: 1;
            opacity: 0.95;
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
        
        .task-meta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .meta-item {
            background: white;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            border: 1px solid #e2e8f0;
        }
        
        .meta-label {
            color: #64748b;
            font-weight: 500;
            display: block;
            margin-bottom: 4px;
        }
        
        .meta-value {
            color: #1e293b;
            font-weight: 600;
        }
        
        .file-box {
            background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            border-left: 4px solid #4f46e5;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
        }
        
        .file-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .file-uploader {
            font-weight: 700;
            color: #4338ca;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .file-time {
            color: #4f46e5;
            font-size: 13px;
            font-weight: 500;
        }
        
        .file-details {
            background: white;
            border-radius: 8px;
            padding: 16px;
            margin-top: 12px;
            border: 1px solid #e0e7ff;
        }
        
        .file-name {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
            word-break: break-all;
        }
        
        .file-info {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #64748b;
            font-size: 13px;
        }
        
        .file-size {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .file-type {
            background: #eef2ff;
            color: #4f46e5;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
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
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
            text-align: center;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        
        .footer {
            background: linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%);
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
            .task-meta {
                grid-template-columns: 1fr;
            }
            
            .header {
                padding: 30px 20px;
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
            <div class="logo">ProJA</div>
            <div class="header-title">Nouveau fichier sur une tâche</div>
        </div>
        
        <div class="content">
            @php
                $statuses = [
                    'todo' => 'À faire',
                    'in_progress' => 'En cours',
                    'done' => 'Terminé',
                    'nouveau' => 'Nouveau',
                    'en_cours' => 'En cours',
                    'termine' => 'Terminé',
                    'en_attente' => 'En attente'
                ];
                
                $priorities = [
                    'low' => 'Basse',
                    'medium' => 'Moyenne',
                    'high' => 'Haute',
                    'basse' => 'Basse',
                    'moyenne' => 'Moyenne',
                    'haute' => 'Haute'
                ];
            @endphp
            
            <div class="greeting">
                Bonjour <strong>{{ $uploader->name }}</strong>,
            </div>
            
            <p class="intro-text">
                Un nouveau fichier a été téléversé sur la tâche <strong>{{ $task->title }}</strong> du projet <strong>{{ $task->project->name ?? 'Sans projet' }}</strong>.
            </p>
            
            <div class="task-card">
                <div class="task-title">{{ $task->title }}</div>
                
                <div class="task-meta">
                    <div class="meta-item">
                        <span class="meta-label">Statut</span>
                        <span class="meta-value">{{ $statuses[$task->status] ?? $task->status }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Priorité</span>
                        <span class="meta-value">{{ $priorities[$task->priority] ?? $task->priority }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Assigné à</span>
                        <span class="meta-value">{{ $task->assignedUser->name ?? 'Non assigné' }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Date d'échéance</span>
                        <span class="meta-value">{{ $task->due_date ? \Carbon\Carbon::parse($task->due_date)->format('d/m/Y') : 'Non définie' }}</span>
                    </div>
                </div>
                
                <div class="file-box">
                    <div class="file-header">
                        <div class="file-uploader">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            {{ $uploader->name }} a téléversé un fichier
                        </div>
                        <div class="file-time">
                            {{ \Carbon\Carbon::parse($file->created_at)->diffForHumans() }}
                        </div>
                    </div>
                    
                    <div class="file-details" style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 16px;">
                        <div class="file-detail-item" style="display: flex; align-items: center; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: #64748b;">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">Nom du fichier</div>
                                <div style="font-weight: 500;">{{ $file->name }}</div>
                            </div>
                        </div>

                        <div class="file-detail-item" style="display: flex; align-items: center; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: #64748b;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">Type</div>
                                <div style="font-weight: 500;">
                                    {{ $file->type ?? 'FICHIER' }}
                                </div>
                            </div>
                        </div>

                        <div class="file-detail-item" style="display: flex; align-items: center; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: #64748b;">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">Taille</div>
                                <div style="font-weight: 500;">{{ number_format($file->size / 1048576, 2) }} Mo</div>
                            </div>
                        </div>

                        <div class="file-detail-item" style="display: flex; align-items: center; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: #64748b;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 16v-4"></path>
                                <path d="M12 8h.01"></path>
                            </svg>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">Statut</div>
                                <div style="font-weight: 500; color: #10b981;">
                                    @if($file->status === 'pending')
                                        En attente
                                    @elseif($file->status === 'approved')
                                        Approuvé
                                    @elseif($file->status === 'rejected')
                                        Rejeté
                                    @else
                                        {{ $file->status }}
                                    @endif
                                </div>
                            </div>
                        </div>

                        <div class="file-detail-item" style="display: flex; align-items: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: #64748b;">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">Date de téléversement</div>
                                <div style="font-weight: 500;">{{ $file->created_at->format('d/m/Y à H:i') }}</div>
                            </div>
                        </div>
                    </div>

             <div style="text-align: center; margin-top: 20px;">
                <a href="{{ route('tasks.show', $task->id) }}" class="btn" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span style="color: white;">Voir la tâche complète</span>
                </a>
            </div>
                </div>
            </div>
            
            <p style="margin-top: 24px; font-size: 14px; color: #64748b; line-height: 1.6;">
                Vous recevez cette notification car vous êtes impliqué dans cette tâche. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un administrateur.
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
