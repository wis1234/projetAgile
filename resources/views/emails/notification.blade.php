<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? config('app.name') }}</title>
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body, html {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f5f7fa;
        }

        .email-wrapper { max-width: 100%; background-color: #ffffff; }

        .header {
            background: linear-gradient(135deg, #4F46E5 0%, #3730a3 100%);
            padding: 36px 30px;
            text-align: center;
        }

        .logo { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .header-title { color: #e0e7ff; font-size: 18px; font-weight: 500; }

        .content { padding: 32px 30px; }

        .greeting { font-size: 16px; color: #475569; margin-bottom: 20px; }
        .greeting strong { color: #1e293b; }

        .card {
            background: #f8fafc;
            border-radius: 12px;
            border-left: 4px solid #4F46E5;
            padding: 24px;
            margin: 20px 0;
        }

        .heading { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .subheading { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 14px; }
        .intro { font-size: 14px; color: #475569; margin-bottom: 14px; }

        /* Badges en table pour un alignement fiable partout (y compris Outlook) */
        .badges-row { margin: 14px 0; }
        .badges-row td { padding: 0 8px 0 0; vertical-align: middle; }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            color: #ffffff;
        }
        .badge-neutral { background-color: #9CA3AF; }
        .badge-arrow { color: #6b7280; padding: 0 6px; font-size: 13px; }

        /* Grille meta en table (2 colonnes) — même technique que le mail de tâche */
        .meta-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 7px;
            margin: 16px -7px;
        }
        .meta-item {
            width: 50%;
            background: #ffffff;
            padding: 12px 14px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .meta-label {
            color: #64748b;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            display: block;
            margin-bottom: 4px;
        }
        .meta-value { color: #1e293b; font-weight: 600; font-size: 14px; display: block; }

        .description-section {
            background: #ffffff;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            border: 1px solid #e2e8f0;
            font-size: 14px;
            color: #475569;
        }

        .btn-container { text-align: center; margin: 22px 0 6px; }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #4F46E5 0%, #3730a3 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
        }

        .footer { padding: 24px 30px; text-align: center; color: #94a3b8; }
        .footer-note { font-size: 12px; color: #64748b; }
        .unsubscribe { margin-top: 10px; font-size: 11px; }
        .unsubscribe a { color: #6B7280; }

        @media (max-width: 600px) {
            .content { padding: 22px 20px; }
            .card { padding: 18px; }
            .meta-grid, .meta-grid tbody, .meta-grid tr, .meta-item {
                display: block; width: 100% !important;
            }
            .meta-grid { margin: 16px 0; border-spacing: 0; }
            .meta-item { margin-bottom: 8px; }
            .btn { width: 100%; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
            @if(!empty($headerTitle))
                <div class="header-title">{{ $headerTitle }}</div>
            @endif
        </div>

        <div class="content">
            @if(!empty($greeting))
                <div class="greeting">{{ $greeting }}</div>
            @endif

            <div class="card">
                @if(!empty($heading))
                    <div class="heading">{!! $heading !!}</div>
                @endif

                @if(!empty($subheading))
                    <div class="subheading">{{ $subheading }}</div>
                @endif

                @if(!empty($intro))
                    <p class="intro">{!! $intro !!}</p>
                @endif

                {{-- Transition de statut (ancien -> nouveau) --}}
                @if(!empty($statusTransition))
                    <table class="badges-row" role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td><span class="badge badge-neutral">{{ $statusTransition['from'] }}</span></td>
                            <td class="badge-arrow">→</td>
                            <td><span class="badge" style="background-color: {{ $statusTransition['color'] }};">{{ $statusTransition['to'] }}</span></td>
                        </tr>
                    </table>
                @endif

                {{-- Badges simples (statut / priorité côte à côte) --}}
                @if(!empty($badges))
                    <table class="badges-row" role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            @foreach($badges as $badge)
                                <td><span class="badge" style="background-color: {{ $badge['color'] }};">{{ $badge['label'] }}</span></td>
                            @endforeach
                        </tr>
                    </table>
                @endif

                @if(!empty($metaItems))
                    <table class="meta-grid" role="presentation" cellpadding="0" cellspacing="0" border="0">
                        @foreach(array_chunk($metaItems, 2) as $row)
                            <tr>
                                @foreach($row as $item)
                                    <td class="meta-item">
                                        <span class="meta-label">{{ $item['icon'] }} {{ $item['label'] }}</span>
                                        <span class="meta-value">{{ $item['value'] }}</span>
                                    </td>
                                @endforeach
                                @if(count($row) === 1)
                                    <td class="meta-item" style="border: none; background: transparent;"></td>
                                @endif
                            </tr>
                        @endforeach
                    </table>
                @endif

                @if(!empty($description))
                    <div class="description-section">{{ $description }}</div>
                @endif

                @if(!empty($showActionButton) && !empty($actionUrl))
                    <div class="btn-container">
                        <a href="{{ $actionUrl }}" class="btn">{{ $actionText ?? 'Voir' }}</a>
                    </div>
                @endif
            </div>
        </div>

        <div class="footer">
            <p class="footer-note">{{ $footer ?? 'Ceci est une notification automatique, merci de ne pas y répondre.' }}</p>
            @if(!empty($unsubscribeUrl))
                <p class="unsubscribe"><a href="{{ $unsubscribeUrl }}">Se désabonner de ce type de notification</a></p>
            @endif
        </div>
    </div>
</body>
</html>