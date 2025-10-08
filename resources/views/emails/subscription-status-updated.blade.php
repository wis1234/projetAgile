<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Mise à jour de votre abonnement</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4f46e5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 30px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin: 10px 0;
        }
        .status-active {
            background-color: #d1fae5;
            color: #065f46;
        }
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .status-cancelled {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .status-expired {
            background-color: #e5e7eb;
            color: #4b5563;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
            color: white;
            text-decoration: none;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">{{ config('app.name') }}</div>
        <h1>Mise à jour de votre abonnement</h1>
    </div>
    
    <div class="content">
        <p>Bonjour {{ $subscription->user->name }},</p>
        
        <p>Nous vous informons que le statut de votre abonnement <strong>{{ $subscription->plan->name }}</strong> a été mis à jour.</p>
        
        <div>
            <p>Nouveau statut :</p>
            @if($subscription->status === 'active')
                <span class="status-badge status-active">Actif</span>
            @elseif($subscription->status === 'pending')
                <span class="status-badge status-pending">En attente</span>
            @elseif($subscription->status === 'cancelled')
                <span class="status-badge status-cancelled">Annulé</span>
            @elseif($subscription->status === 'expired')
                <span class="status-badge status-expired">Expiré</span>
            @endif
        </div>
        
        <p><strong>Détails de l'abonnement :</strong></p>
        <ul>
            <li>Plan: {{ $subscription->plan->name }}</li>
            <li>Prix: {{ number_format($subscription->plan->price, 0, ',', ' ') }} FCFA</li>
            <li>Période: {{ $subscription->plan->duration_in_months }} mois</li>
            <li>Date d'expiration: {{ $subscription->ends_at ? \Carbon\Carbon::parse($subscription->ends_at)->format('d/m/Y') : 'Non définie' }}</li>
        </ul>
        
        @if($subscription->status === 'active')
            <p>Votre abonnement est maintenant actif. Vous pouvez commencer à profiter de tous les avantages de votre forfait.</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="{{ route('dashboard') }}" class="button" style="color: #ffffff; text-decoration: none; padding: 10px 20px; background-color: #4f46e5; border-radius: 6px; display: inline-block;">Accéder à mon espace</a>
            </div>
        @elseif($subscription->status === 'cancelled')
            <p>Si vous souhaitez réactiver votre abonnement, n'hésitez pas à nous contacter.</p>
        @elseif($subscription->status === 'expired')
            <p>Votre abonnement a expiré. Pour continuer à profiter de nos services, veuillez renouveler votre abonnement.</p>
        @endif
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>
