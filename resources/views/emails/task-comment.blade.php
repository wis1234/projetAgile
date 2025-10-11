<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau commentaire sur la tâche - {{ config('app.name') }}</title>
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
        
        .comment-box {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            border-left: 4px solid #10b981;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
        }
        
        .comment-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .comment-author {
            font-weight: 700;
            color: #047857;
            font-size: 15px;
        }
        
        .comment-time {
            color: #059669;
            font-size: 13px;
            font-weight: 500;
        }
        
        .parent-comment {
            background: rgba(255, 255, 255, 0.8);
            border-left: 3px solid #06b6d4;
            padding: 12px 16px;
            margin-bottom: 16px;
            border-radius: 6px;
            font-style: italic;
        }
        
        .parent-label {
            font-size: 12px;
            color: #0891b2;
            font-weight: 600;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .parent-text {
            color: #475569;
            font-size: 13px;
            line-height: 1.6;
        }
        
        .comment-content {
            color: #1f2937;
            line-height: 1.8;
            font-size: 14px;
        }
        
        .comment-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
            overflow-x: auto;
            display: block;
        }
        
        .comment-content th {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            font-weight: 600;
            font-size: 13px;
        }
        
        .comment-content td {
            border: 1px solid #e5e7eb;
            padding: 10px;
            font-size: 13px;
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
            padding: 14px 32px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }
        
        .notification-info {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 14px 18px;
            border-radius: 8px;
            margin: 25px 0;
            font-size: 13px;
            color: #92400e;
            line-height: 1.6;
        }
        
        .settings-info {
            font-size: 13px;
            color: #64748b;
            text-align: center;
            padding: 18px;
            background: #f8fafc;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .footer {
            background: linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%);
            padding: 28px 30px;
            text-align: center;
            color: #94a3b8;
        }
        
        .footer-copyright {
            font-size: 13px;
            margin-bottom: 12px;
            font-weight: 500;
        }
        
        .footer-links {
            font-size: 12px;
        }
        
        .footer-links a {
            color: #cbd5e1;
            text-decoration: none;
            margin: 0 8px;
            transition: color 0.3s ease;
        }
        
        .footer-links a:hover {
            color: #f1f5f9;
        }
        
        .footer-links span {
            color: #475569;
            margin: 0 4px;
        }
        
        @media (max-width: 600px) {
            .header {
                padding: 30px 20px;
            }
            
            .logo {
                font-size: 28px;
            }
            
            .header-title {
                font-size: 17px;
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
            
            .comment-box {
                padding: 16px;
            }
            
            .btn {
                width: 100%;
                padding: 14px 20px;
            }
            
            .footer {
                padding: 24px 20px;
            }
            
            .footer-links a {
                display: block;
                margin: 8px 0;
            }
            
            .footer-links span {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <div class="logo">ProJA</div>
            <div class="header-title">{{ $comment->parent_id ? 'Réponse à un commentaire' : 'Nouveau commentaire sur une tâche' }}</div>
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
                
                $prenom = explode(' ', $user->name)[0];
                $statut = $statuses[strtolower($task->status)] ?? ucfirst($task->status);
                $priorite = $priorities[strtolower($task->priority)] ?? ucfirst($task->priority);
            @endphp
            
            <div class="greeting">
                Salut <strong>{{ $prenom }}</strong> 👋
            </div>
            
            <p class="intro-text">
                @if($comment->parent_id)
                    <strong>{{ $comment->user->name }}</strong> a répondu dans la discussion concernant la tâche <strong>{{ $task->title }}</strong>.
                @else
                    <strong>{{ $comment->user->name }}</strong> a commenté la tâche <strong>{{ $task->title }}</strong>.
                @endif
            </p>
            
            <div class="task-card">
                <div class="task-title">{{ $task->title }}</div>
                
                <div class="task-meta">
                    <div class="meta-item">
                        <span class="meta-label">Projet</span>
                        <span class="meta-value">{{ $task->project->name ?? 'Non spécifié' }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Statut</span>
                        <span class="meta-value">{{ $statut }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Priorité</span>
                        <span class="meta-value">{{ $priorite }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Échéance</span>
                        <span class="meta-value">{{ $task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie' }}</span>
                    </div>
                </div>
                
                <div class="comment-box">
                    <div class="comment-header">
                        <span class="comment-author">{{ $comment->user->name }}</span>
                        <span class="comment-time">{{ $comment->created_at->format('d/m/Y à H:i') }}</span>
                    </div>
                    
                    @if($comment->parent_id)
                        <div class="parent-comment">
                            <div class="parent-label">
                                En réponse à {{ $comment->parent->user->name ?? 'un commentaire' }}
                            </div>
                            <div class="parent-text">
                                {{ Str::limit($comment->parent->content ?? '', 150, '...') }}
                            </div>
                        </div>
                    @endif
                    
                    <div class="comment-content">
                        @php
                            $content = html_entity_decode($comment->content);
                            
                            $content = preg_replace_callback('/<table[^>]*>(.*?)<\/table>/is', function($matches) {
                                $table = $matches[0];
                                $table = str_replace('<table', '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;"', $table);
                                $table = str_replace('<th', '<th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); font-weight: 600; font-size: 13px;"', $table);
                                $table = str_replace('<td', '<td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 13px;"', $table);
                                return '<div style="overflow-x: auto;">' . $table . '</div>';
                            }, $content);
                            
                            $content = strip_tags($content, '<p><br><div><table><thead><tbody><tr><th><td><strong><em><u><s><a><ul><ol><li><h1><h2><h3><h4><h5><h6><blockquote><pre><code><img>');
                            $content = nl2br($content);
                        @endphp
                        {!! $content !!}
                    </div>
                </div>
                
                <div class="btn-container">
                    <a href="{{ route('tasks.show', $task->id) }}#comments" class="btn">Voir la discussion</a>
                </div>
            </div>
            
            <div class="notification-info">
                💡 Vous recevez cette notification car vous êtes assigné(e) à cette tâche ou avez participé à la discussion.
            </div>
            
            <div class="settings-info">
                Pour gérer vos préférences de notification, consultez vos paramètres de compte.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-copyright">
                © {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.
            </div>
            <div class="footer-links">
                <a href="{{ config('app.url') }}/mentions-legales">Mentions légales</a>
                <span>•</span>
                <a href="{{ config('app.url') }}/confidentialite">Confidentialité</a>
                <span>•</span>
                <a href="{{ config('app.url') }}/contact">Contact</a>
            </div>
        </div>
    </div>
</body>
</html>