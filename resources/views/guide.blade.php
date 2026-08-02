<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guide utilisateur ProJA — Comment utiliser ProJA au quotidien</title>
    <meta name="description" content="Guide pratique complet pour utiliser ProJA : gestion de projets, tâches, sprints, réunions Zoom et ProJA Meet, fichiers, notifications, recrutement, abonnements et rémunérations.">
    <link rel="canonical" href="{{ url('/guide') }}">

    {{-- Open Graph pour les partages sur réseaux sociaux --}}
    <meta property="og:title" content="Guide utilisateur ProJA">
    <meta property="og:description" content="Le guide pratique pour utiliser ProJA au quotidien, de A à Z.">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{{ url('/guide') }}">

    {{-- Données structurées pour les moteurs de recherche --}}
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": "Guide utilisateur ProJA",
        "description": "Guide pratique complet pour utiliser ProJA au quotidien.",
        "url": "{{ url('/guide') }}",
        "inLanguage": "fr"
    }
    </script>

    @vite(['resources/css/app.css'])
</head>
<body class="bg-gray-50 text-gray-800 antialiased">

    {{-- En-tête simple avec retour à l'accueil --}}
    <header class="bg-white border-b border-gray-100 py-4">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <a href="{{ url('/') }}" class="font-bold text-blue-600 text-lg">ProJA</a>
            <a href="{{ url('/') }}" class="text-sm text-gray-500 hover:text-blue-600">← Retour à l'accueil</a>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        <article class="prose prose-blue max-w-none prose-h2:mt-10 prose-h2:border-t prose-h2:pt-8 prose-table:text-sm">

            <h1>Guide utilisateur ProJA</h1>
            <p class="lead">Le guide pratique pour utiliser ProJA au quotidien, de A à Z.</p>

            <h2 id="sommaire">Sommaire</h2>
            <ol>
                <li><a href="#decouvrir">Découvrir ProJA</a></li>
                <li><a href="#connexion">Se connecter et créer son compte</a></li>
                <li><a href="#dashboard">Le tableau de bord</a></li>
                <li><a href="#projets">Gérer un projet</a></li>
                <li><a href="#taches">Gérer les tâches</a></li>
                <li><a href="#kanban">Le tableau Kanban</a></li>
                <li><a href="#discussions">Discuter et commenter</a></li>
                <li><a href="#sprints">Les sprints</a></li>
                <li><a href="#zoom">Réunions Zoom</a></li>
                <li><a href="#projameet">ProJA Meet — appels audio et vidéo</a></li>
                <li><a href="#fichiers">Fichiers et documents</a></li>
                <li><a href="#notifications">Notifications</a></li>
                <li><a href="#recrutement">Recrutement</a></li>
                <li><a href="#abonnements">Abonnements et paiements</a></li>
                <li><a href="#remunerations">Rémunérations</a></li>
                <li><a href="#profil">Mon profil et mes paramètres</a></li>
                <li><a href="#roles">Rôles et permissions</a></li>
                <li><a href="#messagerie">Messagerie</a></li>
                <li><a href="#astuces">Astuces et bonnes pratiques</a></li>
                <li><a href="#faq">Questions fréquentes et dépannage</a></li>
            </ol>

            <h2 id="decouvrir">1. Découvrir ProJA</h2>
            <p>ProJA est une application qui permet à une équipe de travailler ensemble sur des projets : organiser des tâches, discuter, partager des fichiers, se réunir en visioconférence, et suivre l'avancement du travail en temps réel.</p>
            <p>Concrètement, ProJA vous permet de :</p>
            <ul>
                <li>Créer et suivre des <strong>projets</strong> avec votre équipe</li>
                <li>Organiser le travail en <strong>tâches</strong> avec des échéances et des priorités</li>
                <li><strong>Discuter</strong> directement sur chaque tâche, comme dans une messagerie</li>
                <li>Faire des <strong>appels vidéo</strong> ou des <strong>réunions Zoom</strong> sans quitter l'application</li>
                <li>Partager des <strong>fichiers</strong> et en garder l'historique des versions</li>
                <li>Recevoir des <strong>notifications</strong> en temps réel sur ce qui se passe</li>
                <li>Gérer du <strong>recrutement</strong>, des <strong>abonnements</strong>, et des <strong>rémunérations</strong> si votre organisation l'utilise</li>
            </ul>
            <p>Tout se passe dans votre navigateur — aucune installation n'est nécessaire.</p>

            <h2 id="connexion">2. Se connecter et créer son compte</h2>
            <h3>Créer un compte</h3>
            <ol>
                <li>Rendez-vous sur la page d'accueil de ProJA.</li>
                <li>Cliquez sur <strong>« S'inscrire »</strong>.</li>
                <li>Renseignez votre nom, votre adresse e-mail et un mot de passe.</li>
                <li>Validez le formulaire.</li>
                <li>Un e-mail de vérification vous est envoyé : ouvrez-le et cliquez sur le lien pour confirmer votre adresse.</li>
            </ol>
            <h3>Se connecter</h3>
            <ol>
                <li>Cliquez sur <strong>« Se connecter »</strong>.</li>
                <li>Entrez votre e-mail et votre mot de passe.</li>
                <li>Vous accédez directement à votre tableau de bord.</li>
            </ol>
            <h3>Mot de passe oublié</h3>
            <ol>
                <li>Sur la page de connexion, cliquez sur <strong>« Mot de passe oublié ? »</strong>.</li>
                <li>Indiquez votre e-mail.</li>
                <li>Vous recevrez un lien pour définir un nouveau mot de passe.</li>
            </ol>
            <blockquote>💡 <strong>Astuce</strong> : si vous restez inactif sur l'application pendant longtemps (environ 30 minutes), ProJA recharge automatiquement la page pour éviter les problèmes de session expirée. C'est normal, il suffit de vous reconnecter si demandé.</blockquote>

            <h2 id="dashboard">3. Le tableau de bord</h2>
            <p>Le tableau de bord est la page d'accueil une fois connecté. Il vous donne une vue d'ensemble de :</p>
            <ul>
                <li>Vos projets en cours</li>
                <li>Vos tâches à faire, en cours et terminées</li>
                <li>Les activités récentes de votre équipe</li>
                <li>Vos notifications</li>
            </ul>
            <p>C'est le point de départ pour naviguer vers le reste de l'application, via le menu principal.</p>

            <h2 id="projets">4. Gérer un projet</h2>
            <p>Un <strong>projet</strong> est le conteneur principal de votre travail d'équipe : il regroupe des tâches, des membres, des sprints, des fichiers et des réunions.</p>

            <h3>Créer un projet</h3>
            <ol>
                <li>Allez dans <strong>« Projets »</strong> depuis le menu.</li>
                <li>Cliquez sur <strong>« Nouveau projet »</strong>.</li>
                <li>Renseignez le nom, une description optionnelle, un lien de réunion externe optionnel, et le statut initial.</li>
                <li>Validez. Vous devenez automatiquement <strong>manager</strong> de ce projet.</li>
            </ol>

            <h3>Les statuts d'un projet</h3>
            <ul>
                <li><strong>Nouveau</strong> : le projet vient d'être créé</li>
                <li><strong>Démarrage</strong> : le projet commence tout juste</li>
                <li><strong>En cours</strong> : le travail est actif</li>
                <li><strong>Avancé</strong> : le projet est bien avancé</li>
                <li><strong>Terminé</strong> : le projet est achevé</li>
                <li><strong>Suspendu</strong> : le projet est mis en pause temporairement</li>
            </ul>
            <p>Seul un <strong>manager</strong> ou un <strong>administrateur</strong> peut changer le statut, et uniquement vers certains statuts autorisés.</p>

            <h3>Ajouter des membres à un projet</h3>
            <ol>
                <li>Ouvrez le projet concerné.</li>
                <li>Dans « Actions rapides », cliquez sur <strong>« Ajouter un membre »</strong>.</li>
                <li>Recherchez la personne par son nom ou son e-mail.</li>
                <li>Choisissez son rôle (membre, manager, observateur) et validez.</li>
            </ol>

            <h3>Consulter un projet</h3>
            <p>La page d'un projet vous montre les informations générales, un accès rapide aux appels (Zoom et ProJA Meet), des statistiques (tâches terminées, en cours, fichiers, commentaires), la liste des sprints et des tâches, les membres et leur rôle, la progression de chaque membre, et un graphique d'évolution des tâches sur 30 jours.</p>

            <h3>Voir qui contribue le plus aux discussions</h3>
            <p>Sur la page du projet, cliquez sur <strong>« Voir détail »</strong> sous le compteur de commentaires pour afficher le classement des membres les plus actifs (🥇🥈🥉) et un graphique comparatif.</p>

            <h3>Modifier un projet</h3>
            <p>Ouvrez le projet puis cliquez sur <strong>« Modifier le projet »</strong> (managers et administrateurs uniquement).</p>

            <h3>Supprimer un projet</h3>
            <ul>
                <li><strong>Administrateur système</strong> : suppression directe après confirmation.</li>
                <li><strong>Manager (non administrateur)</strong> : nécessite le consentement de <strong>tous les membres</strong>, chacun saisissant son propre mot de passe de compte.</li>
            </ul>

            <h3>Exporter les informations d'un projet</h3>
            <p>Depuis les « Actions rapides », exportez un journal complet du projet (texte) ou un planning au format PDF.</p>

            <h2 id="taches">5. Gérer les tâches</h2>
            <h3>Créer une tâche</h3>
            <ol>
                <li>Allez dans <strong>« Tâches »</strong> ou depuis un projet, cliquez sur <strong>« Nouvelle tâche »</strong>.</li>
                <li>Renseignez le titre, la description, le projet, la priorité (Faible, Moyenne, Haute), le statut, la personne assignée, la date d'échéance et si la tâche est rémunérée.</li>
                <li>Validez.</li>
            </ol>

            <h3>Vue Tableau et vue Cartes</h3>
            <p>Basculez entre une <strong>vue Tableau</strong> (idéale pour trier rapidement) et une <strong>vue Cartes</strong> (plus visuelle) via les boutons en haut de la liste.</p>

            <h3>Filtrer et rechercher des tâches</h3>
            <p>Cliquez sur <strong>« Filtres & Recherche »</strong> pour affiner par mot-clé, statut, priorité, projet, personne assignée ou plage de dates.</p>

            <h3>Suivre la progression de l'équipe</h3>
            <p>Cliquez sur <strong>« Voir les progrès »</strong> pour afficher le pourcentage de tâches complétées par membre, le détail par statut, et le taux de tâches rendues à temps.</p>

            <h3>Tâches verrouillées</h3>
            <p>Une tâche appartenant à un sprint dont le délai est dépassé est automatiquement <strong>verrouillée</strong> (🔒) jusqu'à ce qu'un chef de projet prolonge le sprint.</p>

            <h2 id="kanban">6. Le tableau Kanban</h2>
            <p>Le Kanban offre une vue en colonnes (À faire / En cours / Terminé) pour visualiser et déplacer les tâches par glisser-déposer. Faites glisser une tâche d'une colonne à une autre pour changer son statut instantanément, sans validation supplémentaire.</p>

            <h2 id="discussions">7. Discuter et commenter</h2>
            <p>Chaque tâche dispose de son propre espace de discussion, semblable à une messagerie instantanée.</p>
            <ul>
                <li><strong>Écrire un commentaire</strong> : onglet « Discussions », tapez et appuyez sur Entrée.</li>
                <li><strong>Répondre</strong> : survolez un message et cliquez sur l'icône réponse 💬.</li>
                <li><strong>Réagir</strong> : icône sourire 😊, une seule réaction active par message (en choisir une nouvelle remplace la précédente).</li>
                <li><strong>Message vocal</strong> : icône micro 🎙️.</li>
                <li><strong>Modifier / Supprimer</strong> : survolez votre propre message.</li>
                <li><strong>Présence en ligne</strong> : avatars avec point vert, indicateur « en train d'écrire... ».</li>
                <li><strong>Accusés de lecture</strong> : double coche ✓✓, bleue une fois lue.</li>
                <li><strong>Copie par e-mail</strong> : icône enveloppe ✉️ dans l'en-tête de la discussion.</li>
            </ul>

            <h2 id="sprints">8. Les sprints</h2>
            <p>Un <strong>sprint</strong> est une période de travail définie durant laquelle une équipe se concentre sur un ensemble précis de tâches.</p>
            <h3>Créer un sprint</h3>
            <ol>
                <li>Depuis un projet, « Actions rapides » puis <strong>« Ajouter un sprint »</strong>.</li>
                <li>Renseignez le nom, un objectif optionnel, les dates de début et de fin.</li>
                <li>Validez.</li>
            </ol>
            <p>Lorsqu'un sprint dépasse sa date de fin, toutes les tâches inachevées qui lui sont rattachées sont automatiquement verrouillées, jusqu'à ce qu'un chef de projet prolonge le sprint.</p>

            <h2 id="zoom">9. Réunions Zoom</h2>
            <p>ProJA permet de planifier et suivre des réunions Zoom directement depuis un projet.</p>
            <ol>
                <li>Ouvrez un projet, cliquez sur le bandeau <strong>« Réunions Zoom »</strong>.</li>
                <li>Cliquez sur <strong>« Planifier / voir »</strong>.</li>
                <li>Renseignez le sujet, la date et la durée, puis validez.</li>
            </ol>
            <p>Si une réunion est active, un badge <strong>« En cours »</strong> apparaît avec un bouton <strong>« Rejoindre »</strong>.</p>

            <h2 id="projameet">10. ProJA Meet — appels audio et vidéo</h2>
            <p>ProJA Meet est le système d'appel vidéo natif de l'application, jusqu'à 100 participants simultanés.</p>
            <ol>
                <li>Ouvrez un projet, repérez la carte <strong>« Appels & réunions »</strong>.</li>
                <li>Cliquez sur <strong>« Démarrer / Rejoindre »</strong> : si un appel est déjà en cours, vous le rejoignez directement.</li>
            </ol>
            <p>Pendant l'appel : micro/caméra, partage d'écran 🖥️, lever la main ✋, réactions 😊, liste des participants 👥, plein écran. Si vous êtes l'hôte, vous pouvez couper le micro ou la caméra d'un participant.</p>

            <h2 id="fichiers">11. Fichiers et documents</h2>
            <ul>
                <li><strong>Ajouter un fichier</strong> : onglet « Ressources » d'une tâche, bouton « Ajouter un fichier ».</li>
                <li><strong>Historique des versions</strong> : chaque fichier conserve ses versions précédentes, restaurables.</li>
                <li><strong>Protection par mot de passe</strong> et <strong>gestion fine des accès</strong> par fichier.</li>
            </ul>

            <h2 id="notifications">12. Notifications</h2>
            <ul>
                <li><strong>Dans l'application</strong> : cloche 🔔 dans le menu principal.</li>
                <li><strong>Push navigateur</strong> : activable depuis Profil > Préférences de notification.</li>
                <li><strong>E-mail</strong> : selon vos préférences définies dans votre profil.</li>
            </ul>

            <h2 id="recrutement">13. Recrutement</h2>
            <p>Publiez une offre (brouillon, publiée ou clôturée automatiquement à la date limite), gérez les candidatures reçues, changez leur statut, et exportez la liste au format Excel.</p>

            <h2 id="abonnements">14. Abonnements et paiements</h2>
            <p>Consultez les plans disponibles, souscrivez via le tunnel de paiement sécurisé <strong>FedaPay</strong> (mobile money, carte...), et suivez l'état de votre abonnement depuis Paramètres > Facturation.</p>

            <h2 id="remunerations">15. Rémunérations</h2>
            <p>Pour les tâches rémunérées : renseignez votre opérateur mobile money et numéro de téléphone dans l'onglet « Rémunération » de la tâche. Un manager valide ensuite le paiement, et un reçu PDF devient téléchargeable.</p>

            <h2 id="profil">16. Mon profil et mes paramètres</h2>
            <p>Modifiez vos informations personnelles, votre mot de passe, vos coordonnées bancaires, ou supprimez votre compte depuis la page Profil. Le thème sombre/clair s'adapte automatiquement à votre système.</p>

            <h2 id="roles">17. Rôles et permissions</h2>
            <table>
                <thead>
                    <tr><th>Rôle</th><th>Peut faire</th></tr>
                </thead>
                <tbody>
                    <tr><td>👤 Membre</td><td>Consulter, gérer ses tâches, discuter, participer aux appels</td></tr>
                    <tr><td>👑 Manager</td><td>+ modifier le projet, gérer les membres, valider les paiements, changer le statut</td></tr>
                    <tr><td>🛡️ Administrateur système</td><td>Accès complet, y compris suppression directe de projets</td></tr>
                </tbody>
            </table>

            <h2 id="messagerie">18. Messagerie</h2>
            <p>En dehors des discussions liées aux tâches, ProJA propose un espace de messagerie générale accessible depuis le menu « Messages ».</p>

            <h2 id="astuces">19. Astuces et bonnes pratiques</h2>
            <ul>
                <li>Utilisez les filtres pour ne pas être submergé par le volume de tâches.</li>
                <li>Activez les notifications push pour ne rien manquer.</li>
                <li>Consultez régulièrement la vue « Progrès » pour repérer les blocages.</li>
                <li>Réagissez avec des émojis plutôt qu'un commentaire complet pour les simples accusés.</li>
                <li>Prolongez vos sprints à temps pour éviter le verrouillage automatique des tâches.</li>
                <li>Utilisez ProJA Meet pour les échanges rapides, réservez Zoom pour les réunions formelles.</li>
            </ul>

            <h2 id="faq">20. Questions fréquentes et dépannage</h2>
            <p><strong>Je ne reçois pas de notifications, que faire ?</strong><br>Vérifiez les autorisations de votre navigateur et vos préférences de profil.</p>
            <p><strong>Ma session a expiré, pourquoi ?</strong><br>Après une longue inactivité, ProJA vous déconnecte par sécurité. Reconnectez-vous simplement.</p>
            <p><strong>Je ne peux pas supprimer un projet seul en tant que manager, pourquoi ?</strong><br>Seul un administrateur système peut le faire directement ; un manager doit obtenir le consentement de tous les membres.</p>
            <p><strong>Une tâche est verrouillée, que faire ?</strong><br>Son sprint est arrivé à échéance. Un manager doit le prolonger.</p>
            <p><strong>Je reste bloqué sur « Connexion... » lors d'un appel ProJA Meet</strong><br>Cela peut arriver sur des réseaux très restrictifs. Essayez un autre réseau ou contactez votre administrateur technique.</p>
            <p><strong>Comment voir qui a le plus contribué aux discussions d'un projet ?</strong><br>Cliquez sur « Voir détail » sous la carte des commentaires, sur la page du projet.</p>

            <hr>
            <p class="text-sm text-gray-400"><em>Ce guide couvre les fonctionnalités principales de ProJA. Pour toute question non couverte ici, contactez votre administrateur ou l'équipe support de votre organisation.</em></p>
        </article>
    </main>

    <footer class="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        &copy; {{ date('Y') }} ProJA — <a href="{{ url('/') }}" class="hover:text-blue-600">Retour à l'accueil</a>
    </footer>
</body>
</html>