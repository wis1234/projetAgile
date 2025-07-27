<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Reçu de Paiement - {{ config('app.name') }}</title>
    <style>
        @page { 
            margin: 15mm;
            size: A4;
        }
        body { 
            font-family: Arial, sans-serif;
            font-size: 11px; 
            line-height: 1.4;
            margin: 0;
            padding: 0 5mm;
            background-color: #ffffff;
            width: 100%;
            box-sizing: border-box;
        }
        .page-container {
            max-width: 180mm;
            margin: 0 auto;
            padding: 10px;
            box-sizing: border-box;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 3px 0;
            color: #2c5282;
        }
        .subtitle {
            font-size: 14px;
            color: #4a5568;
            margin: 0;
            text-transform: uppercase;
        }
        .receipt-info {
            text-align: right;
            margin-bottom: 10px;
            font-size: 10px;
            color: #718096;
        }
        .info-box {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px 12px;
            margin-bottom: 10px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .info-row {
            display: flex;
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 11px;
        }
        .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #4a5568;
            flex: 0 0 40%;
            text-align: left;
            padding-right: 10px;
            word-break: break-word;
        }
        .info-value {
            flex: 1;
            text-align: right;
            color: #2d3748;
            font-weight: 500;
            word-break: break-word;
            padding-left: 10px;
        }
        .amount {
            font-size: 14px;
            font-weight: bold;
            color: #2b6cb0;
        }
        .status {
            display: inline-block;
            padding: 1px 8px;
            background-color: #48bb78;
            color: white;
            border-radius: 10px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .signature {
            margin-top: 20px;
            text-align: right;
            padding: 15px 0;
        }
        .signature-line {
            width: 150px;
            height: 1px;
            background-color: #2d3748;
            margin: 0 0 3px auto;
        }
        .signature-name {
            font-weight: 600;
            margin-top: 3px;
            font-size: 11px;
        }
        .signature-title {
            font-size: 9px;
            color: #718096;
            margin-top: 1px;
        }
        .footer {
            text-align: center;
            padding: 8px 0;
            font-size: 9px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            margin-top: 20px;
        }
        .footer p {
            margin: 3px 0;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <div class="header">
            <div class="title">{{ config('app.name') }}</div>
            <div class="subtitle">REÇU DE PAIEMENT</div>
        </div>

        <div class="receipt-info">
            N° RC-{{ strtoupper(Str::random(6)) }}-{{ $payment->id ?? '' }}<br>
            {{ now()->format('d/m/Y à H:i') }}
        </div>

        <div class="info-box">
            <div class="info-row">
                <div class="info-label">Tâche</div>
                <div class="info-value">{{ $task->title }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Projet</div>
                <div class="info-value">{{ $task->project->name ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Bénéficiaire</div>
                <div class="info-value">{{ $user->name }}</div>
            </div>
        </div>

        <div class="info-box">
            <div class="info-row">
                <div class="info-label">Montant</div>
                <div class="info-value amount">{{ number_format($task->amount, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Moyen de paiement</div>
                <div class="info-value">{{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Téléphone</div>
                <div class="info-value">{{ $payment->phone_number }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Statut</div>
                <div class="info-value">
                    <span class="status">PAYÉ</span>
                </div>
            </div>
        </div>

        <div class="signature">
            <div>Signature</div>
            <div style="margin-top: 30px;">
                <div class="signature-line"></div>
                <div class="signature-name">{{ $projectManager->name ?? 'Le Responsable' }}</div>
                <div class="signature-title">
                    {{ $projectManager->roles->first()?->name ?? 'Gestionnaire du Projet' }}
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Ceci est un reçu électronique valide sans nécessité de signature.</p>
            <p>{{ config('app.name') }} &copy; {{ date('Y') }} - {{ config('app.url') }}</p>
        </div>
    </div>
</body>
</html>
