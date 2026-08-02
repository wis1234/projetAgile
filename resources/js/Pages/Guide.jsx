import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  FaRocket, FaSignInAlt, FaTachometerAlt, FaProjectDiagram, FaTasks, FaColumns,
  FaCommentDots, FaFlagCheckered, FaVideo, FaVideoSlash, FaFileAlt, FaBell,
  FaBriefcase, FaCreditCard, FaMoneyBillWave, FaUserCircle, FaShieldAlt,
  FaEnvelope, FaLightbulb, FaQuestionCircle, FaChevronRight, FaBars, FaTimes,
  FaCrown, FaUser, FaCheckCircle, FaLock, FaDesktop, FaHandPaper, FaSmile,
  FaUsers, FaExpand,
} from 'react-icons/fa';

// ── Définition du sommaire (id, titre, icône) ────────────────────────────
const SECTIONS = [
  { id: 'decouvrir', title: 'Découvrir ProJA', icon: FaRocket },
  { id: 'connexion', title: 'Se connecter et créer son compte', icon: FaSignInAlt },
  { id: 'dashboard', title: 'Le tableau de bord', icon: FaTachometerAlt },
  { id: 'projets', title: 'Gérer un projet', icon: FaProjectDiagram },
  { id: 'taches', title: 'Gérer les tâches', icon: FaTasks },
  { id: 'kanban', title: 'Le tableau Kanban', icon: FaColumns },
  { id: 'discussions', title: 'Discuter et commenter', icon: FaCommentDots },
  { id: 'sprints', title: 'Les sprints', icon: FaFlagCheckered },
  { id: 'zoom', title: 'Réunions Zoom', icon: FaVideo },
  { id: 'projameet', title: 'ProJA Meet — appels audio/vidéo', icon: FaVideo },
  { id: 'fichiers', title: 'Fichiers et documents', icon: FaFileAlt },
  { id: 'notifications', title: 'Notifications', icon: FaBell },
  { id: 'recrutement', title: 'Recrutement', icon: FaBriefcase },
  { id: 'abonnements', title: 'Abonnements et paiements', icon: FaCreditCard },
  { id: 'remunerations', title: 'Rémunérations', icon: FaMoneyBillWave },
  { id: 'profil', title: 'Mon profil et paramètres', icon: FaUserCircle },
  { id: 'roles', title: 'Rôles et permissions', icon: FaShieldAlt },
  { id: 'messagerie', title: 'Messagerie', icon: FaEnvelope },
  { id: 'astuces', title: 'Astuces et bonnes pratiques', icon: FaLightbulb },
  { id: 'faq', title: 'Questions fréquentes', icon: FaQuestionCircle },
];

// ── Petits composants réutilisables ──────────────────────────────────────
const SectionHeader = ({ id, icon: Icon, title }) => (
  <div id={id} className="flex items-center gap-3 mb-4 scroll-mt-24">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
      <Icon className="text-white text-base" />
    </div>
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white m-0">{title}</h2>
  </div>
);

const Tip = ({ children }) => (
  <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 my-4">
    <FaLightbulb className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
    <p className="text-sm text-blue-900 dark:text-blue-200 m-0">{children}</p>
  </div>
);

const Steps = ({ items }) => (
  <ol className="space-y-2.5 my-4">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center mt-0.5">
          {i + 1}
        </span>
        <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{item}</span>
      </li>
    ))}
  </ol>
);

const FeatureGrid = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
    {items.map(({ icon: Icon, label }, i) => (
      <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3">
        <Icon className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      </div>
    ))}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 shadow-sm ${className}`}>
    {children}
  </div>
);

const FaqItem = ({ q, a }) => (
  <div className="border-b border-gray-100 dark:border-gray-700 last:border-0 py-4">
    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5 flex items-start gap-2">
      <FaQuestionCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
      {q}
    </p>
    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6 leading-relaxed">{a}</p>
  </div>
);

export default function Guide() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Met en évidence la section visible au scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Head>
        <title>Guide utilisateur ProJA — Comment utiliser ProJA au quotidien</title>
        <meta name="description" content="Guide pratique complet pour utiliser ProJA : gestion de projets, tâches, sprints, réunions Zoom et ProJA Meet, fichiers, notifications, recrutement, abonnements et rémunérations." />
      </Head>

      {/* ─── En-tête ─── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">ProJA</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(v => !v)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileNavOpen ? <FaTimes /> : <FaBars />}
            </button>
            <Link href="/" className="hidden sm:inline-flex text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Bandeau titre ─── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Guide utilisateur ProJA</h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl">
            Le guide pratique pour utiliser ProJA au quotidien, de A à Z.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex gap-8">

        {/* ─── Sommaire — sidebar sticky desktop ─── */}
        <nav className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 max-h-[calc(100vh-7rem)] overflow-y-auto shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2 mb-2">Sommaire</h3>
            <ul className="space-y-0.5">
              {SECTIONS.map(({ id, title, icon: Icon }) => (
                <li key={id}>
                  <button
                    onClick={() => scrollTo(id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* ─── Sommaire mobile (drawer) ─── */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Sommaire</h3>
                <button onClick={() => setMobileNavOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes />
                </button>
              </div>
              <ul className="space-y-0.5">
                {SECTIONS.map(({ id, title, icon: Icon }) => (
                  <li key={id}>
                    <button
                      onClick={() => scrollTo(id)}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ─── Contenu ─── */}
        <div className="flex-1 min-w-0 space-y-6">

          <Card>
            <SectionHeader id="decouvrir" icon={FaRocket} title="1. Découvrir ProJA" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              ProJA est une application qui permet à une équipe de travailler ensemble sur des projets : organiser des tâches,
              discuter, partager des fichiers, se réunir en visioconférence, et suivre l'avancement du travail en temps réel.
            </p>
            <FeatureGrid items={[
              { icon: FaProjectDiagram, label: 'Créer et suivre des projets avec votre équipe' },
              { icon: FaTasks, label: 'Organiser le travail en tâches avec échéances et priorités' },
              { icon: FaCommentDots, label: 'Discuter directement sur chaque tâche' },
              { icon: FaVideo, label: 'Appels vidéo ou réunions Zoom intégrés' },
              { icon: FaFileAlt, label: 'Partager des fichiers avec historique des versions' },
              { icon: FaBell, label: 'Notifications en temps réel' },
              { icon: FaBriefcase, label: 'Recrutement, abonnements et rémunérations' },
            ]} />
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">Tout se passe dans votre navigateur — aucune installation n'est nécessaire.</p>
          </Card>

          <Card>
            <SectionHeader id="connexion" icon={FaSignInAlt} title="2. Se connecter et créer son compte" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-2">Créer un compte</h3>
            <Steps items={[
              'Rendez-vous sur la page d\'accueil de ProJA.',
              'Cliquez sur « S\'inscrire ».',
              'Renseignez votre nom, votre adresse e-mail et un mot de passe.',
              'Validez le formulaire.',
              'Un e-mail de vérification vous est envoyé : ouvrez-le et cliquez sur le lien pour confirmer votre adresse.',
            ]} />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Se connecter</h3>
            <Steps items={[
              'Cliquez sur « Se connecter ».',
              'Entrez votre e-mail et votre mot de passe.',
              'Vous accédez directement à votre tableau de bord.',
            ]} />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Mot de passe oublié</h3>
            <Steps items={[
              'Sur la page de connexion, cliquez sur « Mot de passe oublié ? ».',
              'Indiquez votre e-mail.',
              'Vous recevrez un lien pour définir un nouveau mot de passe.',
            ]} />
            <Tip>
              Si vous restez inactif sur l'application pendant longtemps (environ 30 minutes), ProJA recharge automatiquement
              la page pour éviter les problèmes de session expirée. C'est normal, il suffit de vous reconnecter si demandé.
            </Tip>
          </Card>

          <Card>
            <SectionHeader id="dashboard" icon={FaTachometerAlt} title="3. Le tableau de bord" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              Le tableau de bord est la page d'accueil une fois connecté. Il vous donne une vue d'ensemble de :
            </p>
            <FeatureGrid items={[
              { icon: FaProjectDiagram, label: 'Vos projets en cours' },
              { icon: FaTasks, label: 'Vos tâches à faire, en cours et terminées' },
              { icon: FaBell, label: 'Les activités récentes de votre équipe' },
              { icon: FaEnvelope, label: 'Vos notifications' },
            ]} />
            <p className="text-sm text-gray-500 dark:text-gray-400">C'est le point de départ pour naviguer vers le reste de l'application, via le menu principal.</p>
          </Card>

          <Card>
            <SectionHeader id="projets" icon={FaProjectDiagram} title="4. Gérer un projet" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Un <strong>projet</strong> est le conteneur principal de votre travail d'équipe : il regroupe des tâches, des membres,
              des sprints, des fichiers et des réunions.
            </p>

            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Créer un projet</h3>
            <Steps items={[
              'Allez dans « Projets » depuis le menu.',
              'Cliquez sur « Nouveau projet ».',
              'Renseignez le nom, une description optionnelle, un lien de réunion externe optionnel, et le statut initial.',
              'Validez. Vous devenez automatiquement manager de ce projet.',
            ]} />

            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Les statuts d'un projet</h3>
            <div className="flex flex-wrap gap-2 my-3">
              {['Nouveau', 'Démarrage', 'En cours', 'Avancé', 'Terminé', 'Suspendu'].map(s => (
                <span key={s} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {s}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Seul un <strong>manager</strong> ou un <strong>administrateur</strong> peut changer le statut, et uniquement vers certains statuts autorisés.
            </p>

            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Ajouter des membres à un projet</h3>
            <Steps items={[
              'Ouvrez le projet concerné.',
              'Dans « Actions rapides », cliquez sur « Ajouter un membre ».',
              'Recherchez la personne par son nom ou son e-mail.',
              'Choisissez son rôle (membre, manager, observateur) et validez.',
            ]} />

            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Consulter un projet</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
              La page d'un projet vous montre les informations générales, un accès rapide aux appels (Zoom et ProJA Meet),
              des statistiques (tâches terminées, en cours, fichiers, commentaires), la liste des sprints et des tâches,
              les membres et leur rôle, la progression de chaque membre, et un graphique d'évolution des tâches sur 30 jours.
            </p>

            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Voir qui contribue le plus aux discussions</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
              Sur la page du projet, cliquez sur <strong>« Voir détail »</strong> sous le compteur de commentaires pour afficher
              le classement des membres les plus actifs (🥇🥈🥉) et un graphique comparatif.
            </p>

            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Modifier un projet</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
              Ouvrez le projet puis cliquez sur <strong>« Modifier le projet »</strong> (managers et administrateurs uniquement).
            </p>

            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Supprimer un projet</h3>
            <ul className="space-y-2 my-2">
              <li className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                <FaShieldAlt className="text-red-500 mt-0.5 flex-shrink-0" />
                <span><strong>Administrateur système</strong> : suppression directe après confirmation.</span>
              </li>
              <li className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                <FaCrown className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span><strong>Manager (non administrateur)</strong> : nécessite le consentement de <strong>tous les membres</strong>, chacun saisissant son propre mot de passe de compte.</span>
              </li>
            </ul>

            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Exporter les informations d'un projet</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
              Depuis les « Actions rapides », exportez un journal complet du projet (texte) ou un planning au format PDF.
            </p>
          </Card>

          <Card>
            <SectionHeader id="taches" icon={FaTasks} title="5. Gérer les tâches" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Créer une tâche</h3>
            <Steps items={[
              'Allez dans « Tâches » ou depuis un projet, cliquez sur « Nouvelle tâche ».',
              'Renseignez le titre, la description, le projet, la priorité (Faible, Moyenne, Haute), le statut, la personne assignée, la date d\'échéance et si la tâche est rémunérée.',
              'Validez.',
            ]} />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Vue Tableau et vue Cartes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Basculez entre une <strong>vue Tableau</strong> (idéale pour trier rapidement) et une <strong>vue Cartes</strong> (plus visuelle) via les boutons en haut de la liste.
            </p>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Filtrer et rechercher des tâches</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Cliquez sur <strong>« Filtres & Recherche »</strong> pour affiner par mot-clé, statut, priorité, projet, personne assignée ou plage de dates.
            </p>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Suivre la progression de l'équipe</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Cliquez sur <strong>« Voir les progrès »</strong> pour afficher le pourcentage de tâches complétées par membre, le détail par statut, et le taux de tâches rendues à temps.
            </p>
            <Tip>
              Une tâche appartenant à un sprint dont le délai est dépassé est automatiquement <strong>verrouillée</strong> (🔒) jusqu'à ce qu'un chef de projet prolonge le sprint.
            </Tip>
          </Card>

          <Card>
            <SectionHeader id="kanban" icon={FaColumns} title="6. Le tableau Kanban" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Le Kanban offre une vue en colonnes (À faire / En cours / Terminé) pour visualiser et déplacer les tâches par
              glisser-déposer. Faites glisser une tâche d'une colonne à une autre pour changer son statut instantanément,
              sans validation supplémentaire.
            </p>
          </Card>

          <Card>
            <SectionHeader id="discussions" icon={FaCommentDots} title="7. Discuter et commenter" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              Chaque tâche dispose de son propre espace de discussion, semblable à une messagerie instantanée.
            </p>
            <ul className="space-y-2">
              {[
                ['Écrire un commentaire', 'onglet « Discussions », tapez et appuyez sur Entrée.'],
                ['Répondre', 'survolez un message et cliquez sur l\'icône réponse 💬.'],
                ['Réagir', 'icône sourire 😊, une seule réaction active par message.'],
                ['Message vocal', 'icône micro 🎙️.'],
                ['Modifier / Supprimer', 'survolez votre propre message.'],
                ['Présence en ligne', 'avatars avec point vert, indicateur « en train d\'écrire... ».'],
                ['Accusés de lecture', 'double coche ✓✓, bleue une fois lue.'],
                ['Copie par e-mail', 'icône enveloppe ✉️ dans l\'en-tête de la discussion.'],
              ].map(([label, desc]) => (
                <li key={label} className="flex items-start gap-2 text-sm">
                  <FaCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300"><strong className="text-gray-800 dark:text-gray-100">{label}</strong> : {desc}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader id="sprints" icon={FaFlagCheckered} title="8. Les sprints" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Un <strong>sprint</strong> est une période de travail définie durant laquelle une équipe se concentre sur un ensemble précis de tâches.
            </p>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Créer un sprint</h3>
            <Steps items={[
              'Depuis un projet, « Actions rapides » puis « Ajouter un sprint ».',
              'Renseignez le nom, un objectif optionnel, les dates de début et de fin.',
              'Validez.',
            ]} />
            <Tip>
              Lorsqu'un sprint dépasse sa date de fin, toutes les tâches inachevées qui lui sont rattachées sont automatiquement
              verrouillées, jusqu'à ce qu'un chef de projet prolonge le sprint.
            </Tip>
          </Card>

          <Card>
            <SectionHeader id="zoom" icon={FaVideo} title="9. Réunions Zoom" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              ProJA permet de planifier et suivre des réunions Zoom directement depuis un projet.
            </p>
            <Steps items={[
              'Ouvrez un projet, cliquez sur le bandeau « Réunions Zoom ».',
              'Cliquez sur « Planifier / voir ».',
              'Renseignez le sujet, la date et la durée, puis validez.',
            ]} />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Si une réunion est active, un badge <strong>« En cours »</strong> apparaît avec un bouton <strong>« Rejoindre »</strong>.
            </p>
          </Card>

          <Card>
            <SectionHeader id="projameet" icon={FaVideo} title="10. ProJA Meet — appels audio et vidéo" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              ProJA Meet est le système d'appel vidéo natif de l'application, jusqu'à <strong>100 participants simultanés</strong>.
            </p>
            <Steps items={[
              'Ouvrez un projet, repérez la carte « Appels & réunions ».',
              'Cliquez sur « Démarrer / Rejoindre » : si un appel est déjà en cours, vous le rejoignez directement.',
            ]} />
            <FeatureGrid items={[
              { icon: FaDesktop, label: 'Partage d\'écran' },
              { icon: FaHandPaper, label: 'Lever la main' },
              { icon: FaSmile, label: 'Réactions en direct' },
              { icon: FaUsers, label: 'Liste des participants' },
              { icon: FaExpand, label: 'Mode plein écran' },
              { icon: FaCrown, label: 'Contrôles hôte (micro/caméra)' },
            ]} />
            <p className="text-sm text-gray-500 dark:text-gray-400">Si vous êtes l'hôte, vous pouvez couper le micro ou la caméra d'un participant.</p>
          </Card>

          <Card>
            <SectionHeader id="fichiers" icon={FaFileAlt} title="11. Fichiers et documents" />
            <ul className="space-y-2">
              {[
                ['Ajouter un fichier', 'onglet « Ressources » d\'une tâche, bouton « Ajouter un fichier ».'],
                ['Historique des versions', 'chaque fichier conserve ses versions précédentes, restaurables.'],
                ['Protection et accès', 'protection par mot de passe et gestion fine des accès par fichier.'],
              ].map(([label, desc]) => (
                <li key={label} className="flex items-start gap-2 text-sm">
                  <FaCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300"><strong className="text-gray-800 dark:text-gray-100">{label}</strong> : {desc}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader id="notifications" icon={FaBell} title="12. Notifications" />
            <FeatureGrid items={[
              { icon: FaBell, label: 'Dans l\'application : cloche dans le menu principal' },
              { icon: FaVideo, label: 'Push navigateur, activable depuis votre profil' },
              { icon: FaEnvelope, label: 'E-mail, selon vos préférences' },
            ]} />
          </Card>

          <Card>
            <SectionHeader id="recrutement" icon={FaBriefcase} title="13. Recrutement" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Publiez une offre (brouillon, publiée ou clôturée automatiquement à la date limite), gérez les candidatures
              reçues, changez leur statut, et exportez la liste au format Excel.
            </p>
          </Card>

          <Card>
            <SectionHeader id="abonnements" icon={FaCreditCard} title="14. Abonnements et paiements" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Consultez les plans disponibles, souscrivez via le tunnel de paiement sécurisé <strong>FedaPay</strong> (mobile money, carte...),
              et suivez l'état de votre abonnement depuis Paramètres &gt; Facturation.
            </p>
          </Card>

          <Card>
            <SectionHeader id="remunerations" icon={FaMoneyBillWave} title="15. Rémunérations" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Pour les tâches rémunérées : renseignez votre opérateur mobile money et numéro de téléphone dans l'onglet
              « Rémunération » de la tâche. Un manager valide ensuite le paiement, et un reçu PDF devient téléchargeable.
            </p>
          </Card>

          <Card>
            <SectionHeader id="profil" icon={FaUserCircle} title="16. Mon profil et mes paramètres" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Modifiez vos informations personnelles, votre mot de passe, vos coordonnées bancaires, ou supprimez votre compte
              depuis la page Profil. Le thème sombre/clair s'adapte automatiquement à votre système.
            </p>
          </Card>

          <Card>
            <SectionHeader id="roles" icon={FaShieldAlt} title="17. Rôles et permissions" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-200">Rôle</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-200">Peut faire</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [FaUser, 'text-blue-500', 'Membre', 'Consulter, gérer ses tâches, discuter, participer aux appels'],
                    [FaCrown, 'text-amber-500', 'Manager', '+ modifier le projet, gérer les membres, valider les paiements, changer le statut'],
                    [FaShieldAlt, 'text-red-500', 'Administrateur système', 'Accès complet, y compris suppression directe de projets'],
                  ].map(([Icon, color, role, desc]) => (
                    <tr key={role} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-2 font-medium text-gray-800 dark:text-gray-100">
                          <Icon className={`${color} flex-shrink-0`} /> {role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <SectionHeader id="messagerie" icon={FaEnvelope} title="18. Messagerie" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              En dehors des discussions liées aux tâches, ProJA propose un espace de messagerie générale accessible depuis
              le menu « Messages ».
            </p>
          </Card>

          <Card>
            <SectionHeader id="astuces" icon={FaLightbulb} title="19. Astuces et bonnes pratiques" />
            <ul className="space-y-2">
              {[
                'Utilisez les filtres pour ne pas être submergé par le volume de tâches.',
                'Activez les notifications push pour ne rien manquer.',
                'Consultez régulièrement la vue « Progrès » pour repérer les blocages.',
                'Réagissez avec des émojis plutôt qu\'un commentaire complet pour les simples accusés.',
                'Prolongez vos sprints à temps pour éviter le verrouillage automatique des tâches.',
                'Utilisez ProJA Meet pour les échanges rapides, réservez Zoom pour les réunions formelles.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <FaChevronRight className="text-blue-400 mt-1 flex-shrink-0 text-xs" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader id="faq" icon={FaQuestionCircle} title="20. Questions fréquentes et dépannage" />
            <div>
              <FaqItem q="Je ne reçois pas de notifications, que faire ?" a="Vérifiez les autorisations de votre navigateur et vos préférences de profil." />
              <FaqItem q="Ma session a expiré, pourquoi ?" a="Après une longue inactivité, ProJA vous déconnecte par sécurité. Reconnectez-vous simplement." />
              <FaqItem q="Je ne peux pas supprimer un projet seul en tant que manager, pourquoi ?" a="Seul un administrateur système peut le faire directement ; un manager doit obtenir le consentement de tous les membres." />
              <FaqItem q="Une tâche est verrouillée, que faire ?" a="Son sprint est arrivé à échéance. Un manager doit le prolonger." />
              <FaqItem q="Je reste bloqué sur « Connexion... » lors d'un appel ProJA Meet" a="Cela peut arriver sur des réseaux très restrictifs. Essayez un autre réseau ou contactez votre administrateur technique." />
              <FaqItem q="Comment voir qui a le plus contribué aux discussions d'un projet ?" a="Cliquez sur « Voir détail » sous la carte des commentaires, sur la page du projet." />
            </div>
          </Card>

          <p className="text-center text-sm text-gray-400 dark:text-gray-600 italic py-4">
            Ce guide couvre les fonctionnalités principales de ProJA. Pour toute question non couverte ici, contactez votre
            administrateur ou l'équipe support de votre organisation.
          </p>
        </div>
      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 text-center text-sm text-gray-400 dark:text-gray-600">
        © {new Date().getFullYear()} ProJA — <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Retour à l'accueil</Link>
      </footer>
    </div>
  );
}