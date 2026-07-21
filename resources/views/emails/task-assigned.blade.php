<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle Tâche Assignée - {{ config('app.name') }}</title>
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
        
        .header {
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
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
            font-size: 22px;
            font-weight: 600;
            position: relative;
            z-index: 1;
            margin: 0;
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
            padding: 28px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        }
        
        .task-header {
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .task-title {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .badges-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
        }
        
        .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge-priority-high { background-color: #fee2e2; color: #b91c1c; }
        .badge-priority-medium { background-color: #fef3c7; color: #b45309; }
        .badge-priority-low { background-color: #d1fae5; color: #047857; }
        .badge-priority-urgent { background-color: #fce7f3; color: #be123c; }
        
        .badge-status { background-color: #dbeafe; color: #1d4ed8; }
        
        .task-meta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            margin: 24px 0;
        }
        
        .meta-item {
            background: white;
            padding: 14px 16px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        
        .meta-item:hover {
            border-color: #cbd5e1;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
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
        }
        
        .description-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #4361ee;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }
        
        .description-title {
            font-size: 14px;
            font-weight: 700;
            color: #4361ee;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        
        .description-content {
            color: #475569;
            font-size: 14px;
            line-height: 1.7;
        }
        
        .btn-container {
            text-align: center;
            margin: 28px 0 20px;
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
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(67, 97, 238, 0.5);
        }
        
        .notification-info {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 16px 20px;
            border-radius: 10px;
            margin: 25px 0;
            font-size: 13px;
            color: #92400e;
            line-height: 1.6;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.1);
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
            .header {
                padding: 30px 20px;
            }
            
            .logo {
                font-size: 28px;
            }
            
            .header-title {
                font-size: 18px;
            }
            
            .content {
                padding: 25px 20px;
            }
            
            .task-card {
                padding: 20px;
            }
            
            .task-meta {
                grid-template-columns: 1fr;
            }
            
            .badges-container {
                flex-direction: column;
            }
            
            .badge {
                text-align: center;
            }
            
            .btn {
                width: 100%;
                padding: 14px 20px;
            }
            
            .footer {
                padding: 24px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
            <h1 class="header-title">Nouvelle Tâche Assignée</h1>
        </div>
        
        <div class="content">
            @php
                $assignedUser = $task->assignedUser;
                $prenom = $assignedUser ? explode(' ', $assignedUser->name)[0] : 'Utilisateur';
                
                // Traduction des priorités
                $priorities = [
                    'low' => 'Basse',
                    'medium' => 'Moyenne',
                    'high' => 'Haute',
                    'urgent' => 'Urgente'
                ];
                
                // Traduction des statuts
                $statuses = [
                    'todo' => 'À faire',
                    'in_progress' => 'En cours',
                    'in_review' => 'En révision',
                    'done' => 'Terminé',
                    'cancelled' => 'Annulé',
                    'pending' => 'En attente',
                    'completed' => 'Terminé',
                    'closed' => 'Fermé'
                ];
                
                $priority = $priorities[strtolower($task->priority)] ?? ucfirst($task->priority);
                $status = $statuses[strtolower($task->status)] ?? ucfirst(str_replace('_', ' ', $task->status));
                $creator = \App\Models\User::find($task->created_by);
            @endphp
            
            <div class="greeting">
                Salut <strong>{{ $prenom }}</strong> 👋
            </div>
            
            <p class="intro-text">
                Une nouvelle tâche vous a été assignée par <strong>{{ $creator ? $creator->name : 'le système' }}</strong>. Voici les détails :
            </p>
            
            <div class="task-card">
                <div class="task-header">
                    <div class="task-title">{{ $task->title }}</div>
                    <div class="badges-container" style="display: flex; align-items: center; gap: 10px; font-style: italic; font-size: 0.9em; color: #666; margin: 5px 0;">
                        <div>
                            <span style="font-weight: 500;">Priorité :</span>
                            <span class="badge badge-priority-{{ strtolower($task->priority) }}" style="margin-left: 5px;">
                                {{ $priority }}
                            </span>
                        </div>
                        <div>
                            <span style="font-weight: 500;">Statut :</span>
                            <span class="badge badge-status" style="margin-left: 5px;">
                                {{ $status }}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="task-meta">
                    <div class="meta-item">
                        <span class="meta-label">📁 Projet</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">👤 Assigné à</span>
                        <span class="meta-value">{{ $assignedUser ? $assignedUser->name : 'Non assigné' }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">📅 Échéance</span>
                        <span class="meta-value">{{ $task->due_date ? \Carbon\Carbon::parse($task->due_date)->format('d/m/Y') : 'Non définie' }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">✨ Créée par</span>
                        <span class="meta-value">{{ $creator ? $creator->name : 'Système' }}</span>
                    </div>
                </div>
                
                @if($task->description)
                <div class="description-section">
                    <div class="description-title">Description</div>
                    <div class="description-content">
                        {!! nl2br(e($task->description)) !!}
                    </div>
                </div>
                @endif
                
                <div class="btn-container">
                    <a href="{{ route('tasks.show', $task->id) }}" class="btn">Voir la tâche</a>
                </div>
            </div>
            
            <div class="notification-info">
                💡 Vous recevez cet email car une nouvelle tâche vous a été assignée. Consultez les détails et commencez à travailler dessus dès que possible.
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