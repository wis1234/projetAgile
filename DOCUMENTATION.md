# Proja - Documentation officielle

## 1. Présentation

Proja est une application de gestion de projet agile développée avec Laravel 12, Inertia.js et React. Elle propose un environnement complet pour la collaboration d'équipe, la gestion de projets et de tâches, le suivi des sprints, les réunions Zoom/LiveKit, les notifications en temps réel et la gestion d'abonnements.

## 2. Architecture générale

- Backend : Laravel 12
- Frontend : Inertia.js + React + Tailwind CSS
- Base de données : Eloquent ORM
- Authentification : Laravel Breeze / Laravel Sanctum
- Notifications : e-mail, base de données, Web Push, événements Broadcast
- Paiement : FedaPay
- Réunions : Zoom + LiveKit
- Stockage : Dropbox, fichiers locaux

## 3. Principales fonctionnalités

- Gestion des projets et des équipes
- Gestion des tâches, priorités, échéances et commentaires
- Tableaux Kanban
- Sprints avec verrouillage automatique et alertes
- Réunions Zoom programmées et notifications de démarrage
- Appels audio/vidéo LiveKit avec tokens dynamiques et gestion de participants
- Notes, fichiers et versions de fichiers
- Notifications push et service worker
- Module de recrutement et candidatures
- Gestion d'abonnements, plans et paiements par FedaPay
- Permissions et rôles via Spatie Permission
- Suivi d'activités via Spatie Activitylog

## 4. Technologies et packages clés

- `laravel/framework` ^12.0
- `inertiajs/inertia-laravel` ^2.0
- `@inertiajs/react`, `react`, `react-dom`
- `tailwindcss`, `@tailwindcss/forms`, `@tailwindcss/typography`
- `spatie/laravel-permission`
- `spatie/laravel-activitylog`
- `laravel/sanctum`
- `laravel/ui`
- `barryvdh/laravel-dompdf`
- `maatwebsite/excel`
- `spatie/flysystem-dropbox`
- `fedapay/fedapay-php`
- `@zoom/meetingsdk`, `@zoom/videosdk`
- `livekit-client`, `Agence104/LiveKit`
- `minishlink/web-push`
- `react-beautiful-dnd`, `@dnd-kit` pour le drag & drop
- `@tiptap/react` pour l'édition de contenu riche

## 5. Structure du projet

### Dossiers principaux

- `app/` : logique applicative Laravel
  - `Http/Controllers/` : contrôleurs métier
  - `Models/` : modèles Eloquent
  - `Services/` : classes métiers réutilisables (`ZoomService`, `WebPushService`)
  - `Console/Commands/` : commandes planifiées
  - `Notifications/` : notifications applicatives
  - `Policies/` : règles d'autorisation
- `config/` : configuration des services et packages
- `resources/js/` : frontend React
- `resources/views/` : template principale Inertia Blade
- `routes/` : routes web et API
- `public/` : fichiers statiques, manifestes, service worker

## 6. Configuration requise

- PHP 8.2+
- Composer
- Node.js + npm
- Base de données MySQL, MariaDB ou SQLite
- Serveur web compatible Laravel

## 7. Variables d'environnement

### Variables `APP`

- `APP_NAME`
- `APP_ENV`
- `APP_KEY`
- `APP_URL`
- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`

### Authentification & mail

- `MAIL_MAILER`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_ENCRYPTION`
- `MAIL_FROM_ADDRESS`
- `MAIL_FROM_NAME`

### reCAPTCHA

- `RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`
- `NOCAPTCHA_SECRET`
- `NOCAPTCHA_SITEKEY`

### FedaPay

- `FEDAPAY_LIVE_PUBLIC_KEY`
- `FEDAPAY_LIVE_SECRET_KEY`
- `FEDAPAY_WEBHOOK_SECRET`
- `MIX_FEDAPAY_ENV` (`sandbox` ou `live`)

### Zoom

- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_ACCOUNT_ID`
- `ZOOM_DEFAULT_USER_EMAIL`

### LiveKit

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_URL`

### Web Push

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

### Dropbox

- `DROPBOX_CLIENT_ID`
- `DROPBOX_CLIENT_SECRET`
- `DROPBOX_REFRESH_TOKEN`
- `DROPBOX_ACCESS_TOKEN`
- `DROPBOX_APP_KEY`
- `DROPBOX_APP_SECRET`
- `DROPBOX_AUTHORIZATION_TOKEN`

### Vite

- `VITE_RECAPTCHA_SITE_KEY`
- `VITE_DROPBOX_APP_KEY`
- `VITE_DROPBOX_APP_SECRET`
- `VITE_DROPBOX_ACCESS_TOKEN`
- `VITE_DROPBOX_REFRESH_TOKEN`

## 8. Installation et exécution

### Commandes de base

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --graceful
npm run dev
php artisan serve
```

### Build front-end

```bash
npm run build
```

### Queue et tâches planifiées

- `php artisan queue:work --stop-when-empty` ou `php artisan schedule:work`
- `php artisan schedule:run` en cron toutes les minutes

## 9. Modules et flux métier

### 9.1 Authentification

- Le projet utilise les routes d'authentification Laravel standard et la vérification d'e-mail.
- La gestion des rôles s'appuie sur `Spatie\HasRoles`.
- Les permissions spécifiques sont définies dans `app/Providers/AuthServiceProvider.php` et les politiques associées aux modèles.

### 9.2 Projets

- `app/Models/Project.php`
- `app/Http/Controllers/ProjectController.php`
- Routes principales : `GET /projects`, `POST /projects`, `GET /projects/{project}`, `DELETE /projects/{project}/destroy-with-consent`
- Gestion des statuts de projet : `nouveau`, `demarrage`, `en_cours`, `avance`, `termine`, `suspendu`.
- Les projets sont liés aux utilisateurs via la table pivot `project_user` avec les champs `role` et `is_muted`.
- Suppression en cascade des sprints, tâches, fichiers, messages et logs associés.

### 9.3 Tâches

- `app/Models/Task.php`
- `app/Http/Controllers/TaskController.php`
- Les tâches ont des statuts, priorités, échéances, paiement, affectations et commentaires.
- Une tâche peut appartenir à un projet et à un sprint.
- Les commentaires de tâche sont supprimés en cascade.
- Les rapports de progression utilisateur sont calculés côté backend.

### 9.4 Sprints

- `app/Models/Sprint.php` (non détaillé ici, mais présent dans la structure)
- `app/Http/Controllers/SprintController.php`
- Sprints utilisés pour organiser les tâches et détecter les sprints terminés avec tâches inachevées.

### 9.5 Fichiers et stockage

- Intégration Dropbox via `app/Providers/DropboxServiceProvider.php`.
- Le service provider désactive la vérification SSL en environnement non-production.
- Le projet gère les versions de fichiers et les accès via des modèles `File`, `FileVersion`, `FileAccess`.

### 9.6 Recrutement

- `app/Models/Recruitment.php`
- `app/Http/Controllers/RecruitmentController.php`
- `app/Http/Controllers/RecruitmentApplicationController.php`
- `app/Console/Commands/CloseExpiredRecruitments.php`
- Le module couvre les offres d'emploi, les candidatures, l'export Excel et la clôture automatique des offres expirées.
- Les offres peuvent être en `draft`, `published` ou `closed`.

### 9.7 Abonnements et paiements

- `app/Models/Subscription.php`
- `app/Models/SubscriptionPlan.php`
- `app/Http/Controllers/SubscriptionController.php`
- Paiements gérés via FedaPay.
- Les plans actifs sont listés et le tunnel de paiement se fait sur `resources/js/Pages/Subscriptions/Checkout.jsx`.
- Le contrôleur crée une transaction puis un abonnement `pending` et redirige vers le callback de succès.

### 9.8 Notifications et Web Push

- `app/Services/WebPushService.php`
- `app/Http/Controllers/PushSubscriptionController.php`
- `resources/js/Components/PushNotificationManager.jsx`
- Les notifications Web Push sont stockées dans `push_subscriptions`.
- `resources/views/app.blade.php` expose la clé VAPID via le meta tag `vapid-public-key`.
- `PushNotificationManager` enregistre le service worker `/sw.js` et gère l'abonnement du navigateur.

### 9.9 Zoom

- `app/Services/ZoomService.php`
- `app/Http/Controllers/ZoomMeetingController.php`
- Routes API : `GET /projects/{project}/zoom/active`, `GET /projects/{project}/zoom/recent`, `POST /projects/{project}/zoom/meetings`, `GET /projects/{project}/zoom/meetings/{meeting}`, `PUT /projects/{project}/zoom/meetings/{meeting}/end`
- Utilisation de OAuth Account Credentials pour récupérer le token Zoom.
- Création de réunions, récupération de réunion, et notifications de réunion programmées.

### 9.10 LiveKit

- `app/Http/Controllers/LiveKitController.php`
- Routes LiveKit :
  - `POST /tasks/{task}/livekit-token`
  - `POST /projects/{project}/livekit-token`
  - `POST /projects/{project}/livekit-call/notify`
  - `POST /projects/{project}/livekit-call/end`
  - `POST /projects/{project}/livekit-call/answered`
  - `GET /projects/{project}/livekit-call/status`
  - `POST /projects/{project}/livekit-call/join-or-start`
  - `POST /projects/{project}/livekit-call/mute-participant`
- Génération de tokens JWT LiveKit avec `VideoGrant` et salles `task-{id}` / `project-{id}`.
- Gestion des notifications d'appel via événements broadcast `LiveKitCallStarted`, `LiveKitCallEnded`, `LiveKitCallAnswered`.
- L'hôte peut couper le microphone d'un participant avec `muteParticipant`.

## 10. Routes principales

### Web

- `GET /` : page d’accueil
- `GET /dashboard` : tableau de bord
- `GET /projects` : liste des projets
- `GET /tasks` : liste des tâches
- `GET /recruitment` : offres de recrutement
- `GET /subscriptions` : page d'abonnement
- `GET /push/test` : test de notification push

### API

- `GET /api/user` : utilisateur connecté (Sanctum)
- `GET /api/check-auth` : vérification de session
- `GET /api/users/search` : recherche utilisateur
- `POST /api/users/search-by-email` : recherche utilisateur par email

## 11. Sécurité et validation

- reCAPTCHA v3 est utilisé via `config/recaptcha.php` et `resources/views/app.blade.php`.
- `app/Rules/RecaptchaRule.php` valide le token côté backend.
- Validation des formulaires dans les contrôleurs.
- Politique d'autorisation avec `app/Providers/AuthServiceProvider.php` et les classes `Policy`.
- Les routes sensibles sont protégées par `auth` et `verified`.

## 12. Tâches planifiées et files d'attente

Le scheduler Laravel (`app/Console/Kernel.php`) exécute :

- `queue:work --stop-when-empty` toutes les minutes
- `recruitments:close-expired` toutes les 5 minutes
- `meetings:send-reminders` toutes les minutes
- `zoom:send-start-notifications` toutes les minutes
- `tasks:send-deadline-reminders` toutes les 5 minutes

Ces commandes gèrent l'automatisation des fermetures d'offres, les rappels de réunions et les alertes d'échéance.

## 13. Front-end et expérience utilisateur

### Architecture front-end

- Point d'entrée : `resources/js/app.jsx`.
  - Initialise Inertia.js, React et `createRoot`.
  - Fourni le contexte de traduction (`react-i18next`) et le `TutorialProvider`.
  - Charge des gestionnaires globaux pour les erreurs CSRF/401/419 et le rafraîchissement après un onglet inactif.
- `resources/js/bootstrap.js` contient la configuration initiale de l’application JavaScript, y compris Axios, Echo et les scripts partagés.
- `resources/views/app.blade.php` est le layout Blade principal.
  - Définit les meta tags CSRF et VAPID.
  - Charge le script FedaPay selon l’environnement (`sandbox` ou `live`).
  - Initialise le script reCAPTCHA et les callbacks globaux.

### Comportement utilisateur

- La navigation est assurée via Inertia avec des transitions rapides sans rechargement complet.
- Les erreurs de session expirée sont gérées globalement, redirigeant vers `/login` si nécessaire.
- Le système détecte les onglets inactifs et recharge la page après 30 minutes d’inactivité pour éviter les sessions périmées.
- Le thème sombre est géré côté client dans `AdminLayout.jsx` et se synchronise avec la préférence système.

### Notifications et temps réel

- `resources/js/Components/PushNotificationManager.jsx` :
  - Enregistre le service worker `public/sw.js`.
  - Demande la permission de notification au navigateur.
  - Crée et sauvegarde l’abonnement push côté backend via `/push/subscribe`.
- `resources/js/Components/LiveKitCallModal.jsx` : gestion complète d’appel LiveKit.
  - Connexion à la room LiveKit.
  - Micro et caméra.
  - Partage d’écran.
  - Réactions, mains levées, affichage des participants.
- `resources/js/Components/ZoomMeeting.jsx` et `ZoomEmbed.jsx` affichent les réunions Zoom et permettent l’intégration dans la page projet.
- `resources/js/Layouts/AdminLayout.jsx` écoute les événements Echo pour afficher les notifications temps réel, les inviters LiveKit et les activités.

## 14. Pages front-end principales

### Pages publiques et pages d’authentification

- `resources/js/Pages/Welcome.jsx`
- `resources/js/Pages/About.jsx`
- `resources/js/Pages/Contact.jsx`
- `resources/js/Pages/PrivacyPolicy.jsx`
- `resources/js/Pages/TermsOfService.jsx`
- `resources/js/Pages/Auth/Login.jsx`
- `resources/js/Pages/Auth/Register.jsx`
- `resources/js/Pages/Auth/ForgotPassword.jsx`
- `resources/js/Pages/Auth/ResetPassword.jsx`
- `resources/js/Pages/Auth/VerifyEmail.jsx`
- `resources/js/Pages/Auth/ConfirmPassword.jsx`

### Tableau de bord et activités

- `resources/js/Pages/Dashboard.jsx`
- `resources/js/Pages/Activities/Index.jsx`
- `resources/js/Pages/Activities/Show.jsx`
- `resources/js/Pages/AuditLogs/Index.jsx`
- `resources/js/Pages/AuditLogs/Show.jsx`
- `resources/js/Pages/AuditLogs/Create.jsx`
- `resources/js/Pages/AuditLogs/Edit.jsx`

### Projets et équipe

- `resources/js/Pages/Projects/Index.jsx`
- `resources/js/Pages/Projects/Show.jsx`
- `resources/js/Pages/Projects/Create.jsx`
- `resources/js/Pages/Projects/Edit.jsx`
- `resources/js/Pages/ProjectUsers/Index.jsx`
- `resources/js/Pages/ProjectUsers/Show.jsx`
- `resources/js/Pages/ProjectUsers/Create.jsx`
- `resources/js/Pages/ProjectUsers/Edit.jsx`

### Tâches et Kanban

- `resources/js/Pages/Tasks/Index.jsx`
- `resources/js/Pages/Tasks/Create.jsx`
- `resources/js/Pages/Tasks/Edit.jsx`
- `resources/js/Pages/Tasks/Show.jsx`
- `resources/js/Pages/Tasks/Kanban.jsx`
- `resources/js/Pages/Kanban/Index.jsx`
- `resources/js/Pages/Kanban/Column.jsx`
- `resources/js/Pages/Kanban/TaskCard.jsx`

### Fichiers et contenu

- `resources/js/Pages/Files/Index.jsx`
- `resources/js/Pages/Files/Show.jsx`
- `resources/js/Pages/Files/Create.jsx`
- `resources/js/Pages/Files/Edit.jsx`
- `resources/js/Pages/Files/EditContent.jsx`

### Recrutement

- `resources/js/Pages/Recruitment/Index.jsx`
- `resources/js/Pages/Recruitment/Create.jsx`
- `resources/js/Pages/Recruitment/Edit.jsx`
- `resources/js/Pages/Recruitment/Show.jsx`
- `resources/js/Pages/Recruitment/Applications/Index.jsx`
- `resources/js/Pages/Recruitment/Applications/Create.jsx`
- `resources/js/Pages/Recruitment/Applications/Show.jsx`

### Abonnements

- `resources/js/Pages/Subscriptions/Index.jsx`
- `resources/js/Pages/Subscriptions/Checkout.jsx`
- `resources/js/Pages/Subscriptions/Success.jsx`
- `resources/js/Pages/Subscriptions/Manage.jsx`
- `resources/js/Pages/Admin/SubscriptionPlans/Index.jsx`
- `resources/js/Pages/Admin/SubscriptionPlans/Create.jsx`
- `resources/js/Pages/Admin/SubscriptionPlans/Edit.jsx`
- `resources/js/Pages/Admin/SubscriptionPlans/Form.jsx`
- `resources/js/Pages/Admin/SubscriptionPlans/Subscribers.jsx`

### Profil et paramètres

- `resources/js/Pages/Profile/Edit.jsx`
- `resources/js/Pages/Profile/BankDetails.jsx`
- `resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx`
- `resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx`
- `resources/js/Pages/Profile/Partials/NotificationPreferencesForm.jsx`
- `resources/js/Pages/Profile/Partials/DeleteUserForm.jsx`
- `resources/js/Pages/Settings/Billing.jsx`
- `resources/js/Pages/Settings/Subscription.jsx`

### Remunerations

- `resources/js/Pages/Remunerations/Index.jsx`
- `resources/js/Pages/Remunerations/Show.jsx`
- `resources/js/Pages/Remunerations/Dashboard.jsx`

### Écoles

- `resources/js/Pages/Schools/Index.jsx`
- `resources/js/Pages/Schools/Show.jsx`
- `resources/js/Pages/Schools/Create.jsx`
- `resources/js/Pages/Schools/Edit.jsx`

### Messagerie

- `resources/js/Pages/Messages/Index.jsx`
- `resources/js/Pages/Messages/Create.jsx`
- `resources/js/Pages/Messages/Edit.jsx`
- `resources/js/Pages/Messages/Show.jsx`

## 15. Composants React clés

- `resources/js/Layouts/AdminLayout.jsx` et `resources/js/Layouts/AuthenticatedLayout.jsx` : navigation, menu, notifications, LiveKit global.
- `resources/js/Components/LiveKitCallModal.jsx` : interface d’appel audio/vidéo.
- `resources/js/Components/PushNotificationManager.jsx` : abonnements Web Push et permission notification.
- `resources/js/Components/ReCaptcha.jsx` : intégration reCAPTCHA v3 côté client.
- `resources/js/Components/ZoomEmbed.jsx` : affichage des réunions Zoom intégrées.
- `resources/js/Components/Notification.jsx` : affichage des messages flash.
- `resources/js/Components/Modal.jsx` : modales réutilisables.
- `resources/js/Components/TaskModal.jsx` : création/édition rapide de tâche.
- `resources/js/Components/Dropdown.jsx`, `InputLabel.jsx`, `TextInput.jsx`, `Textarea.jsx`, `PrimaryButton.jsx`, `SecondaryButton.jsx` : UI primitives.
- `resources/js/Components/RoleManagement.jsx` : gestion des rôles et permissions dans l’interface.
- `resources/js/Components/Tutorial.jsx` et `TutorialSettings.jsx` : assistant d’onboarding.
- `resources/js/Components/CountdownTimer.jsx` : minuteur pour les échéances et offres.

## 16. Fichiers importants

- `routes/web.php`
- `routes/api.php`
- `config/services.php`
- `config/webpush.php`
- `config/recaptcha.php`
- `config/dropbox.php`
- `vite.config.js`
- `resources/views/app.blade.php`
- `public/sw.js`
- `resources/js/app.jsx`
- `resources/js/bootstrap.js`
- `resources/js/lib/axios.js`
- `resources/js/lib/echo.js`
- `resources/js/lib/globalErrorHandler.js`
- `app/Models/Project.php`
- `app/Models/Task.php`
- `app/Models/User.php`
- `app/Models/Subscription.php`
- `app/Models/SubscriptionPlan.php`
- `app/Models/Recruitment.php`
- `app/Http/Controllers/LiveKitController.php`
- `app/Http/Controllers/ZoomMeetingController.php`
- `app/Http/Controllers/SubscriptionController.php`
- `app/Http/Controllers/PushSubscriptionController.php`
- `app/Http/Controllers/ProjectController.php`
- `app/Http/Controllers/TaskController.php`
- `app/Http/Controllers/RecruitmentController.php`
- `app/Http/Controllers/RecruitmentApplicationController.php`
- `app/Http/Controllers/PushSubscriptionController.php`
- `app/Services/ZoomService.php`
- `app/Services/WebPushService.php`
- `app/Providers/DropboxServiceProvider.php`
- `app/Rules/RecaptchaRule.php`
- `app/Console/Kernel.php`
- `app/Console/Commands/CloseExpiredRecruitments.php`
- `app/Console/Commands/SendMeetingReminders.php`
- `app/Console/Commands/SendTaskDeadlineReminders.php`

## 17. Déploiement et bonnes pratiques

- Assurer la génération d'une clé d'application : `php artisan key:generate`.
- Exécuter les migrations sur l'environnement cible : `php artisan migrate --force`.
- Gérer les variables d'environnement sensibles via un stockage sécurisé.
- Utiliser HTTPS pour toutes les intégrations externes (Zoom, LiveKit, FedaPay, Dropbox).
- Générer et stocker les clés VAPID avant de mettre en production : `php artisan webpush:vapid`.
- Activer et surveiller les logs : `storage/logs/laravel.log` et les fichiers de scheduler.

## 18. Points de vigilance

- Le service Dropbox désactive la vérification SSL en dehors de la production, ce qui est acceptable en développement mais doit rester surveillé.
- Le script reCAPTCHA expose une clé de site dans `resources/views/app.blade.php`; la clé secrète doit toujours rester privée.
- Les commandes planifiées doivent être actives via cron ou `php artisan schedule:work` en production.
- Les routes de test push et debug doivent être sécurisées ou retirées en production.

## 19. Conclusion

Cette application est un système de collaboration agile complet avec un backend Laravel robuste et un frontend React moderne. Elle intègre plusieurs services externes pour la visioconférence, les paiements, le stockage, et les notifications temps réel, tout en offrant une plateforme de gestion de projet, de recrutement et d'abonnements.

- `routes/web.php`
- `routes/api.php`
- `config/services.php`
- `config/webpush.php`
- `config/recaptcha.php`
- `vite.config.js`
- `resources/views/app.blade.php`
- `public/sw.js`
- `app/Models/Project.php`
- `app/Models/Task.php`
- `app/Models/User.php`
- `app/Models/Subscription.php`
- `app/Models/SubscriptionPlan.php`
- `app/Models/Recruitment.php`
- `app/Http/Controllers/LiveKitController.php`
- `app/Http/Controllers/ZoomMeetingController.php`
- `app/Http/Controllers/SubscriptionController.php`
- `app/Http/Controllers/PushSubscriptionController.php`
- `app/Services/ZoomService.php`
- `app/Services/WebPushService.php`
- `app/Providers/DropboxServiceProvider.php`

## 15. Déploiement et bonnes pratiques

- Assurer la génération d'une clé d'application : `php artisan key:generate`.
- Exécuter les migrations sur l'environnement cible : `php artisan migrate --force`.
- Gérer les variables d'environnement sensibles via un stockage sécurisé.
- Utiliser HTTPS pour toutes les intégrations externes (Zoom, LiveKit, FedaPay, Dropbox).
- Générer et stocker les clés VAPID avant de mettre en production : `php artisan webpush:vapid`.
- Activer et surveiller les logs : `storage/logs/laravel.log` et les fichiers de scheduler.

## 16. Points de vigilance

- Le service Dropbox désactive la vérification SSL en dehors de la production, ce qui est acceptable en développement mais doit rester surveillé.
- Le script reCAPTCHA expose une clé de site dans `resources/views/app.blade.php`; la clé secrète doit toujours rester privée.
- Les commandes planifiées doivent être actives via cron ou `php artisan schedule:work` en production.
- Les routes de test push et debug doivent être sécurisées ou retirées en production.

## 17. Conclusion

Cette application est un système de collaboration agile complet avec un backend Laravel robuste et un frontend React moderne. Elle intègre plusieurs services externes pour la visioconférence, les paiements, le stockage, et les notifications temps réel, tout en offrant une plateforme de gestion de projet, de recrutement et d'abonnements.
