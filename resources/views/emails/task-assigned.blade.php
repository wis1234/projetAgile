<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle Tâche Assignée - {{ config('app.name') }}</title>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f5f7fa;
      margin: 0;
      padding: 0;
      color: #1e293b;
    }

    .email-wrapper {
      background: #fff;
      max-width: 600px;
      margin: auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    /* HEADER */
    .header {
      background: #ffffff;
      text-align: center;
      padding: 30px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #4361ee;
      margin-bottom: 8px;
    }
    .header-title {
      font-size: 20px;
      font-weight: 600;
      color: #0f172a;
    }

    /* CONTENT */
    .content {
      padding: 25px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 15px;
    }
    .intro-text {
      font-size: 14px;
      color: #475569;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    /* TASK CARD */
    .task-card {
      background: #f9fafb;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }
    .task-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .badges-container {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    .badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-priority-medium { background: #fef9c3; color: #92400e; }
    .badge-status { background: #e0f2fe; color: #1d4ed8; }

    /* META INFO */
    .task-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .meta-item {
      background: #fff;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .meta-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    /* DESCRIPTION */
    .description-section {
      background: #fff;
      border-left: 4px solid #4361ee;
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
    }
    .description-title {
      font-size: 13px;
      font-weight: 700;
      color: #4361ee;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .description-content {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
    }

    /* BUTTON */
    .btn-container {
      text-align: center;
      margin-top: 20px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #4361ee, #3a0ca3);
      color: #fff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(67,97,238,0.3);
    }

    /* FOOTER */
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }

    /* RESPONSIVE */
    @media (max-width: 600px) {
      .logo { font-size: 24px; }
      .header-title { font-size: 18px; }
      .content { padding: 20px 15px; }
      .task-card { padding: 15px; }
      .badges-container { flex-direction: column; align-items: flex-start; }
      .btn { width: 100%; padding: 14px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo">ProJA</div>
      <h1 class="header-title">Nouvelle Tâche Assignée</h1>
    </div>

    <div class="content">
      <div class="greeting">Salut <strong>Ronaldo</strong> 👋</div>
      <p class="intro-text">Une nouvelle tâche vous a été assignée par <strong>system Obs</strong>. Voici les détails :</p>

      <div class="task-card">
        <div class="task-title">Titre de la tâche</div>
        <div class="badges-container">
          <span class="badge badge-priority-medium">Priorité : Moyenne</span>
          <span class="badge badge-status">Statut : À faire</span>
        </div>

        <div class="task-meta">
          <div class="meta-item">
            <span class="meta-label">📁 Projet</span>
            <span class="meta-value">Nom du projet</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">👤 Assigné à</span>
            <span class="meta-value">Ronaldo AGBOHOU</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">📅 Échéance</span>
            <span class="meta-value">22/07/2026</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">✨ Créée par</span>
            <span class="meta-value">system Obs</span>
          </div>
        </div>

        <div class="description-section">
          <div class="description-title">Description</div>
          <div class="description-content">
            Détails de la tâche à réaliser...
          </div>
        </div>

        <div class="btn-container">
          <a href="#" class="btn">👁️ Voir la tâche</a>
        </div>
      </div>
    </div>

    <div class="footer">
      © 2026 ProJA. Tous droits réservés.<br>
      Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
    </div>
  </div>
</body>
</html>
