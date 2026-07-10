<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prolongation du délai du sprint - {{ config('app.name') }}</title>

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
        }

        .email-wrapper {
            max-width: 100%;
            background: white;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #4361ee 10%, #6d28d9 100%);
            padding: 40px 30px;
            text-align: center;
        }

        .logo {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin-bottom: 12px;
        }

        .header-title {
            color: #f8fafc;
            font-size: 20px;
            font-weight: 500;
        }

        .content {
            padding: 35px 30px;
        }

        .greeting {
            font-size: 16px;
            color: #475569;
            margin-bottom: 20px;
        }

        .intro-text {
            font-size: 15px;
            color: #64748b;
            margin-bottom: 25px;
        }

        .task-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
        }

        .task-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 18px;
        }

        .task-meta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .meta-item {
            background: white;
            padding: 12px 14px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .meta-label {
            display: block;
            font-size: 13px;
            color: #64748b;
            margin-bottom: 4px;
        }

        .meta-value {
            font-weight: 600;
            color: #1e293b;
        }

        .success-box {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 18px;
            border-radius: 8px;
            margin-top: 20px;
        }

        .warning-box {
            background: #fff7ed;
            border-left: 4px solid #f97316;
            padding: 18px;
            border-radius: 8px;
            margin-top: 20px;
        }

        ul {
            padding-left: 20px;
            margin-top: 10px;
        }

        li {
            margin-bottom: 8px;
            color: #475569;
        }

        .footer {
            padding: 28px 30px;
            text-align: center;
            color: #94a3b8;
            background: white;
        }

        .footer-copyright {
            font-size: 13px;
            font-weight: 500;
        }

        .footer-note {
            font-size: 12px;
            margin-top: 10px;
            color: #64748b;
        }


        @media(max-width:600px){
            .task-meta{
                grid-template-columns:1fr;
            }
        }

    </style>
</head>


<body>

<div class="email-wrapper">

<div class="header" style="
    background: linear-gradient(135deg, #4361ee 10%, #6d28d9 100%);
    padding: 40px 30px;
    text-align: center;
">

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="text-align:center;">

                <div class="logo" style="
                    font-size:32px;
                    font-weight:700;
                    color:white;
                    margin:0 auto 12px auto;
                    text-align:center;
                    width:100%;
                    display:block;
                    line-height:1.2;
                ">
                    ProJA
                </div>


                <div class="header-title" style="
                    color:#f8fafc;
                    font-size:20px;
                    font-weight:500;
                    text-align:center;
                    width:100%;
                    display:block;
                    line-height:1.4;
                ">
                    Alerte : Prolongation du délai d'un sprint(objectif)
                </div>

            </td>
        </tr>
    </table>

</div>


    <div class="content">


        <div class="greeting">
            Bonjour à toute l'équipe,
        </div>


        <p class="intro-text">
            Le délai initialement prévu pour le sprint(objectif) 
            <strong>{{ $sprint->name }}</strong>
            a été prolongé afin de permettre la finalisation des tâches restantes.
        </p>



        <div class="task-card">

            <div class="task-title">
                Sprint : {{ $sprint->name }}
            </div>


            <div class="task-meta">

                <div class="meta-item">
                    <span class="meta-label">
                        Ancienne date de fin
                    </span>

                    <span class="meta-value">
                        {{ \Carbon\Carbon::parse($oldEndDate)->translatedFormat('d F Y à H:i') }}
                    </span>
                </div>


                <div class="meta-item">
                    <span class="meta-label">
                        Nouvelle date de fin
                    </span>

                    <span class="meta-value">
                        {{ \Carbon\Carbon::parse($sprint->end_date)->translatedFormat('d F Y à H:i') }}
                    </span>
                </div>

            </div>



            <div class="success-box">

                <strong>
                    ✅ Tâches achevées jusqu'à ce jour
                </strong>


                @if($completedTasks->isNotEmpty())

                    <ul>
                        @foreach($completedTasks as $task)

                            <li>
                                {{ $task->title }}
                            </li>

                        @endforeach
                    </ul>

                @else

                    <p>
                        Aucune tâche n'a été achevée pour l'instant.
                    </p>

                @endif

            </div>



            <div class="warning-box">

                <strong>
                     Tâches non achevées
                </strong>


                @if($unfinishedTasks->isNotEmpty())

                    <ul>

                        @foreach($unfinishedTasks as $task)

                            <li>
                                {{ $task->title }}

                                (
                                {{ $task->status === 'in_progress' 
                                    ? 'En cours' 
                                    : 'À faire'
                                }}
                                )

                            </li>

                        @endforeach

                    </ul>


                @else

                    <p>
                        Toutes les tâches sont terminées.
                    </p>

                @endif

            </div>



        </div>



        <p style="margin-top:24px;font-size:14px;color:#64748b">

            ⚠️ <strong>Rappel important :</strong>

            Nous vous invitons à mobiliser tous les moyens nécessaires
            pour finaliser les tâches restantes.
            Un nouveau report du sprint pourrait avoir un impact important
            sur le calendrier global du projet.

            La collaboration et l'engagement de chacun sont essentiels
            pour atteindre les objectifs fixés.

        </p>



    </div>



    <div class="footer">

        <p class="footer-copyright">
            © {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.
        </p>


        <p class="footer-note">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
        </p>

    </div>


</div>


</body>
</html>

