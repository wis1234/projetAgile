<!DOCTYPE html>
<html>
<head>
    <title>{{ $subject ?? 'Mise à jour de votre candidature' }}</title>
    <style type="text/css">
        /* Styles de base */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
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
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 15px;
        }
        
        /* Carte de contenu */
        .card {
            background: #ffffff;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 30px;
            margin-bottom: 20px;
        }
        
        /* Statut */
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin: 15px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-pending { background-color: #F59E0B; color: white; }
        .status-reviewed { background-color: #3B82F6; color: white; }
        .status-interviewed { background-color: #8B5CF6; color: white; }
        .status-accepted { background-color: #10B981; color: white; }
        .status-rejected { background-color: #EF4444; color: white; }
        
        /* Bouton d'action */
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
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
            color: #6B7280;
            font-size: 14px;
            padding: 20px 0;
            border-top: 1px solid #E5E7EB;
            margin-top: 30px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                padding: 10px;
            }
            .card {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Mise à jour de votre candidature</h1>
            <p>Poste : {{ $application->recruitment->title }}</p>
        </div>
        
        <div class="card">
            <p>Bonjour <strong>{{ $application->first_name }} {{ $application->last_name }}</strong>,</p>
            
            <p>Nous vous informons que le statut de votre candidature pour le poste de <strong>{{ $application->recruitment->title }}</strong> a été mis à jour.</p>
            
            <div class="status-badge status-{{ $status }}">
                @php
                    $statusLabels = [
                        'pending' => 'En attente',
                        'reviewed' => 'En cours d\'examen',
                        'interviewed' => 'Entretien',
                        'accepted' => 'Acceptée',
                        'rejected' => 'Non retenue'
                    ];
                @endphp
                {{ $statusLabels[$status] ?? ucfirst($status) }}
            </div>
            
            @if($status === 'interviewed')
                <p><strong>Prochaine étape :</strong> Notre équipe vous contactera bientôt pour planifier un entretien.</p>
            @elseif($status === 'accepted')
                <p><strong>Félicitations !</strong> Nous sommes ravis de vous annoncer que votre profil a retenu toute notre attention.</p>
                <p>Notre équipe des ressources humaines prendra contact avec vous sous peu pour les démarches à suivre.</p>
            @elseif($status === 'rejected')
                <p>Nous tenons à vous remercier pour l'intérêt que vous avez porté à notre entreprise.</p>
                <p>Nous avons examiné attentivement votre candidature et malgré ses qualités, nous avons le regret de vous informer que votre profil ne correspond pas exactement à nos attentes pour ce poste.</p>
            @endif
            
            @if(!empty($notes))
                <div style="background-color: #F9FAFB; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="font-weight: 600; margin-top: 0; color: #4B5563;">Message complémentaire :</p>
                    <p style="margin-bottom: 0;">{{ $notes }}</p>
                </div>
            @endif
            
            <p>Pour toute question concernant votre candidature, n'hésitez pas à nous contacter en répondant à cet email.</p>
            
            <p>Nous vous remercions pour votre confiance et l'intérêt que vous portez à notre entreprise.</p>
            
            <p>Cordialement,<br>
            <strong>Le service des Ressources Humaines</strong><br>
            {{ config('app.name') }}</p>
        </div>
        
        <div class="footer">
            <p>Ceci est un message automatique, merci de ne pas y répondre directement.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
