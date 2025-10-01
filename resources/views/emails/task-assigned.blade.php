<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle Tâche Assignée - {{ config('app.name') }}</title>
    <style type="text/css">
        /* Reset et styles de base */
        body, html {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
        }
        
        /* Conteneur principal */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* En-tête */
        .header {
            text-align: center;
            padding: 30px 0;
        }
        
        .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 20px;
        }
        
        /* Carte de notification */
        .card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            margin-bottom: 30px;
        }
        
        .card-header {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .card-body {
            padding: 30px;
        }
        
        /* Badges */
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 8px;
            margin-bottom: 8px;
        }
        
        .badge-priority-high { background-color: #FEE2E2; color: #B91C1C; }
        .badge-priority-medium { background-color: #FEF3C7; color: #B45309; }
        .badge-priority-low { background-color: #D1FAE5; color: #047857; }
        
        .badge-status-todo { background-color: #E5E7EB; color: #4B5563; }
        .badge-status-in_progress { background-color: #DBEAFE; color: #1D4ED8; }
        .badge-status-done { background-color: #D1FAE5; color: #047857; }
        
        /* Détails de la tâche */
        .task-details {
            margin: 25px 0;
            border-top: 1px solid #E5E7EB;
            border-bottom: 1px solid #E5E7EB;
            padding: 20px 0;
        }
        
        .detail-row {
            display: flex;
            margin-bottom: 12px;
        }
        
        .detail-label {
            font-weight: 600;
            color: #6B7280;
            width: 120px;
            flex-shrink: 0;
        }
        
        .detail-value {
            flex-grow: 1;
        }
        
        /* Bouton d'action */
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        /* Pied de page */
        .footer {
            text-align: center;
            color: #9CA3AF;
            font-size: 14px;
            padding: 20px 0;
            border-top: 1px solid #E5E7EB;
            margin-top: 30px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .card-body {
                padding: 20px 15px;
            }
            
            .detail-row {
                flex-direction: column;
            }
            
            .detail-label {
                width: 100%;
                margin-bottom: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="{{ asset('logo-proja.png') }}" alt="{{ config('app.name') }}" class="logo">
        </div>
        
        <div class="card">
            <div class="card-header">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Nouvelle Tâche Assignée</h1>
            </div>
            
            <div class="card-body">
                <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 20px;">{{ $task->title }}</h2>
                
                <div style="margin-bottom: 20px;">
                    <span class="badge badge-priority-{{ strtolower($task->priority) }}">
                        {{ ucfirst($task->priority) }}
                    </span>
                    <span class="badge badge-status-{{ strtolower(str_replace(' ', '_', $task->status)) }}">
                        {{ ucfirst(str_replace('_', ' ', $task->status)) }}
                    </span>
                </div>
                
                <div class="task-details">
                    <div class="detail-row">
                        <div class="detail-label">Projet :</div>
                        <div class="detail-value">{{ $task->project->name ?? 'N/A' }}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Assigné à :</div>
                        <div class="detail-value">{{ $task->assignedUser ? $task->assignedUser->name : 'Non assigné' }}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Date d'échéance :</div>
                        <div class="detail-value">{{ $task->due_date ? \Carbon\Carbon::parse($task->due_date)->format('d/m/Y') : 'Non définie' }}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Priorité :</div>
                        <div class="detail-value">{{ ucfirst($task->priority) }}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Statut :</div>
                        <div class="detail-value">{{ ucfirst(str_replace('_', ' ', $task->status)) }}</div>
                    </div>
                    
            
                    
                    <div class="detail-row">
                        <div class="detail-label">Créée par :</div>
                        <div class="detail-value">
                            @php
                                $creator = \App\Models\User::find($task->created_by);
                            @endphp
                            {{ $creator ? $creator->name : 'Système' }}
                        </div>
                    </div>
                </div>
                
                <div style="margin: 25px 0;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #4B5563;">Description :</h3>
                    <div style="background-color: #F9FAFB; padding: 15px; border-radius: 6px; border-left: 3px solid #4F46E5;">
                        {!! nl2br(e($task->description ?? 'Aucune description fournie.')) !!}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <a href="{{ route('tasks.show', $task->id) }}" class="btn">Voir la tâche</a>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;">© {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
            <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
        </div>
    </div>
</body>
</html>
