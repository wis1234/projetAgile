<!DOCTYPE html>
<html>
<head>
    <title>{{ $subject ?? 'Notification' }}</title>
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
            padding: 20px 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
        }
        
        /* Carte de contenu */
        .card {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        
        /* Bouton d'action */
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4F46E5;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 15px 0;
        }
        
        /* Pied de page */
        .footer {
            text-align: center;
            padding: 20px 0;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
        }
        
        /* Styles personnalisés passés depuis la notification */
        {!! $styles ?? '' !!}
    </style>
</head>
<body>
    <div class="email-container">
        <!-- En-tête avec logo -->
        <div class="header">
            <!-- <img src="{{ asset('images/logo.png') }}" alt="Logo" class="logo"> -->

            <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Arrière-plan blanc -->
  <rect width="300" height="120" fill="white" rx="8"/>
  
  <!-- Forme géométrique moderne à gauche -->
  <g transform="translate(20, 20)">
    <!-- Hexagone stylisé -->
    <path d="M35 15 L55 25 L55 45 L35 55 L15 45 L15 25 Z" 
          fill="#1e3a8a" 
          opacity="0.1"/>
    
    <!-- Triangle central -->
    <path d="M35 25 L45 35 L35 45 L25 35 Z" 
          fill="#1e3a8a"/>
    
    <!-- Lignes de connexion -->
    <line x1="35" y1="15" x2="35" y2="25" 
          stroke="#1e3a8a" 
          stroke-width="2"/>
    <line x1="35" y1="45" x2="35" y2="55" 
          stroke="#1e3a8a" 
          stroke-width="2"/>
    <line x1="15" y1="35" x2="25" y2="35" 
          stroke="#1e3a8a" 
          stroke-width="2"/>
    <line x1="45" y1="35" x2="55" y2="35" 
          stroke="#1e3a8a" 
          stroke-width="2"/>
  </g>
  
  <!-- Texte ProJA -->
  <g transform="translate(100, 30)">
    <!-- "Pro" -->
    <text x="0" y="35" 
          font-family="'Segoe UI', Arial, sans-serif" 
          font-size="32" 
          font-weight="700" 
          fill="#1e3a8a">Pro</text>
    
    <!-- "JA" avec style différent -->
    <text x="65" y="35" 
          font-family="'Segoe UI', Arial, sans-serif" 
          font-size="32" 
          font-weight="300" 
          fill="#1e3a8a">JA</text>
    
    <!-- Ligne de soulignement -->
    <rect x="0" y="45" width="110" height="2" fill="#1e3a8a" opacity="0.3"/>
    
    <!-- Tagline -->
    <text x="0" y="65" 
          font-family="'Segoe UI', Arial, sans-serif" 
          font-size="10" 
          font-weight="400" 
          fill="#1e3a8a" 
          opacity="0.7"
          letter-spacing="1px">PROJET AGILE</text>
  </g>
  
  <!-- Élément décoratif -->
  <g transform="translate(230, 25)">
    <circle cx="15" cy="15" r="3" fill="#1e3a8a" opacity="0.6"/>
    <circle cx="30" cy="20" r="2" fill="#1e3a8a" opacity="0.4"/>
    <circle cx="20" cy="30" r="2" fill="#1e3a8a" opacity="0.4"/>
  </g>
</svg>
        </div>
        
        <!-- Carte de contenu -->
        <div class="card">
            <!-- Salutation -->
            @if(isset($greeting) && $greeting)
                <h1 style="margin-top: 0; color: #1f2937;">{{ $greeting }}</h1>
            @endif
            
            <!-- Contenu du message -->
            {!! $content ?? 'Aucun contenu à afficher.' !!}
            
            <!-- Bouton d'action -->
            @if(isset($actionUrl) && isset($actionText) && ($showActionButton ?? true))
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{{ $actionUrl }}" class="btn">
                        {{ $actionText }}
                    </a>
                </div>
            @endif
        </div>
        
        <!-- Pied de page -->
        <div class="footer">
            <p>{{ $footer ?? 'Ceci est une notification automatique, merci de ne pas y répondre.' }}</p>
            @if(isset($unsubscribeUrl))
                <p style="font-size: 11px; margin-top: 10px;">
                    <a href="{{ $unsubscribeUrl }}" style="color: red;">
                        Se désabonner des notifications
                    </a>
                </p>
            @endif
        </div>
    </div>
</body>
</html>
