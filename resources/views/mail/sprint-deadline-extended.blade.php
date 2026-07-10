<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prolongation du délai du sprint</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            background: #f7f7f7;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: #fff;
            padding: 20px 30px;
        }
        h2 {
            margin-bottom: 10px;
            color: #222;
        }
        .section {
            margin-top: 20px;
        }
        ul {
            margin-top: 10px;
            padding-left: 20px;
        }
        .footer {
            margin-top: 30px;
            font-size: 13px;
            color: #777;
            text-align: center;
        }
    </style>
</head>

<body>

<div class="container">

    <h2>Prolongation du délai d'atteinte d'objectif</h2>

    <p>Bonjour à toute l’équipe,</p>

    <p>
        Le délai prévu pour le sprint/objectif <strong>{{ $sprint->name }}</strong> a été prolongé afin de permettre la finalisation des tâches restantes.
    </p>

    <div class="section">
        <p><strong>Ancienne date de fin :</strong> {{ \Carbon\Carbon::parse($oldEndDate)->translatedFormat('d F Y à H:i') }}</p>
        <p><strong>Nouvelle date de fin :</strong> {{ \Carbon\Carbon::parse($sprint->end_date)->translatedFormat('d F Y à H:i') }}</p>
    </div>

    <div class="section">
        <strong>Tâches achevées :</strong>
        @if($completedTasks->isNotEmpty())
            <ul>
                @foreach($completedTasks as $task)
                    <li>{{ $task->title }}</li>
                @endforeach
            </ul>
        @else
            <p>Aucune tâche achevée pour le moment.</p>
        @endif
    </div>

    <div class="section">
        <strong>Tâches restantes :</strong>
        @if($unfinishedTasks->isNotEmpty())
            <ul>
                @foreach($unfinishedTasks as $task)
                    <li>{{ $task->title }} ({{ $task->status === 'in_progress' ? 'En cours' : 'À faire' }})</li>
                @endforeach
            </ul>
        @else
            <p>Toutes les tâches sont terminées.</p>
        @endif
    </div>

    <div class="section">
        <p>
            Merci de veiller à l’avancement des activités afin d’éviter un nouveau report, qui pourrait impacter le calendrier global du projet.
        </p>
    </div>

    <div class="footer">
        <p>© {{ date('Y') }} {{ config('app.name') }} — Message automatique, merci de ne pas répondre.</p>
    </div>

</div>

</body>
</html>
