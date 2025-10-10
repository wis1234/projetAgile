<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau commentaire sur la tâche - {{ config('app.name') }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f5f7fa;
            padding: 0;
        }
        
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin: 20px auto;
        }
        
        .header {
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
            color: white;
            text-decoration: none;
            display: inline-block;
        }
        
        .content {
            padding: 30px;
            color: #4a5568;
        }
        
        h1 {
            color: #f8fafc;
            font-size: 24px;
            margin: 0;
            font-weight: 600;
        }
        
        h2 {
            color: #1a202c;
            font-size: 20px;
            margin: 0 0 20px 0;
            font-weight: 600;
        }
        
        .card {
            background-color: #f8fafc;
            border-left: 4px solid #4361ee;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .comment {
            background-color: #f0fdf4;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            border: 1px solid #d1fae5;
        }
        
        .comment-meta {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;
            color: #4b5563;
        }
        
        .comment-author {
            font-weight: 600;
            color: #047857;
            margin-right: 10px;
        }
        
        .comment-time {
            color: #6b7280;
            font-size: 13px;
        }
        
        .comment-content {
            color: #1f2937;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        
        .task-info {
            margin: 10px 0;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .task-info p {
            margin: 5px 0;
        }
        
        .task-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 10px !important;
        }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            text-align: center;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
            background-color: #f9fafb;
        }
        
        .footer a { 
            color: #4361ee;
            text-decoration: none;
        }
        
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 20px 0;
        }
        
        @media (max-width: 600px) {
            .content {
                padding: 20px 15px;
            }
            
            .header {
                padding: 20px 15px;
            }
            
            h1 {
                font-size: 20px;
            }
            
            .btn {
                width: 100%;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ProjA</div>
            <h1>{{ $comment->parent_id ? 'Réponse à un commentaire' : 'Nouveau commentaire sur une tâche' }}</h1>
        </div>
        
        <div class="content">
            @php
                // Traduction des statuts
                $statuses = [
                    'todo' => 'À faire',
                    'in_progress' => 'En cours',
                    'done' => 'Terminé',
                    'nouveau' => 'Nouveau',
                    'en_cours' => 'En cours',
                    'termine' => 'Terminé',
                    'en_attente' => 'En attente'
                ];
                
                // Traduction des priorités
                $priorities = [
                    'low' => 'Basse',
                    'medium' => 'Moyenne',
                    'high' => 'Haute',
                    'basse' => 'Basse',
                    'moyenne' => 'Moyenne',
                    'haute' => 'Haute'
                ];
                
                // Récupérer le prénom de l'utilisateur
                $prenom = explode(' ', $user->name)[0];
                
                // Formater le statut et la priorité
                $statut = $statuses[strtolower($task->status)] ?? ucfirst($task->status);
                $priorite = $priorities[strtolower($task->priority)] ?? ucfirst($task->priority);
            @endphp
            
            <p>Salut {{ $prenom }},</p>
            
            @if($comment->parent_id)
                <p>Une nouvelle réponse a été postée par <strong>{{ $comment->user->name }}</strong> dans la discussion concernant la tâche <strong>{{ $task->title }}</strong>.</p>
            @else
                <p>Un nouveau commentaire a été posté sur la tâche <strong>{{ $task->title }}</strong> par <strong>{{ $comment->user->name }}</strong>.</p>
            @endif
            
            <div class="card">
                <div class="task-info">
                    <p class="task-title">{{ $task->title }}</p>
                    <p><strong>Projet :</strong> {{ $task->project->name ?? 'Non spécifié' }}</p>
                    <p><strong>Statut :</strong> {{ $statut }}</p>
                    <p><strong>Priorité :</strong> {{ $priorite }}</p>
                    <p><strong>Date d'échéance :</strong> {{ $task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie' }}</p>
                </div>
                
                <div class="comment">
                    <div class="comment-meta">
                        <span class="comment-author">{{ $comment->user->name }}</span>
                        <span class="comment-time">{{ $comment->created_at->format('d/m/Y \à H:i') }}</span>
                    </div>
                    <div class="comment-content">
                        @if($comment->parent_id)
                            <div style="background-color: #f0f9ff; border-left: 3px solid #7dd3fc; padding: 8px 12px; margin-bottom: 12px; border-radius: 4px; font-style: italic;">
                                <div style="font-size: 0.9em; color: #0369a1; margin-bottom: 4px;">
                                    En réponse à {{ $comment->parent->user->name ?? 'un commentaire' }} :
                                </div>
                                <div style="color: #4b5563; font-size: 0.9em;">
                                    {{ Str::limit($comment->parent->content ?? '', 150, '...') }}
                                </div>
                            </div>
                        @endif
                        {!! nl2br(e($comment->content)) !!}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="{{ route('tasks.show', $task->id) }}" class="btn">Voir la tâche</a>
                </div>
            </div>
            <p>Vous recevez cette notification car vous êtes assigné(e) à cette tâche ou avez participé à la discussion.</p>
            
            <div class="divider"></div>
            
            <p style="font-size: 14px; color: #6b7280;">
                Si vous ne souhaitez plus recevoir ces notifications, vous pouvez les désactiver dans vos paramètres de compte.
            </p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
            <p>
                <a href="{{ config('app.url') }}/mentions-legales">Mentions légales</a> | 
                <a href="{{ config('app.url') }}/confidentialite">Confidentialité</a> | 
                <a href="{{ config('app.url') }}/contact">Contact</a>
            </p>
        </div>
    </div>
</body>
</html>
