import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { parseISO, isBefore, isAfter, addMinutes } from 'date-fns';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  FaProjectDiagram, FaUsers, FaTasks, FaEdit, FaEye, FaArrowLeft, FaCalendarAlt,
  FaUserFriends, FaClipboardList, FaRocket, FaUserPlus, FaFileExport,
  FaChevronDown, FaChevronUp, FaFileAlt, FaFilePdf, FaFileWord, FaTrash, FaChartLine, FaCommentDots,
  FaCheckCircle, FaClock, FaPlay, FaChartBar, FaCrown, FaUser, FaShieldAlt,
  FaPlus, FaGlobe, FaExternalLinkAlt, FaQuestionCircle, FaArrowUp, FaArrowDown,
  FaEquals, FaExclamationTriangle, FaSpinner, FaListUl, FaVideo, FaDoorOpen, FaTimes, FaLock
} from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import Modal from '../../Components/Modal';
import ZoomMeeting from '../../Components/ZoomMeeting';
import LiveKitCallModal from '@/Components/LiveKitCallModal';
import ScheduledCallsModal from '@/Components/ScheduledCallsModal';

const getFreshCsrfToken = async () => {
  try {
    const res = await fetch('/csrf-token', { credentials: 'include' });
    const data = await res.json();
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) metaTag.setAttribute('content', data.token);
    return data.token;
  } catch {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
const getStatusInfo = (status, t) => {
  const statusMap = {
    todo: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: <FaClock className="mr-1.5" />, text: t('status_todo') },
    in_progress: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', icon: <FaPlay className="mr-1.5" />, text: t('status_in_progress') },
    done: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: <FaCheckCircle className="mr-1.5" />, text: t('status_done') },
  };
  return statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: <FaQuestionCircle className="mr-1.5" />, text: status };
};

const getPriorityInfo = (priority, t) => {
  const priorityMap = {
    high: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', icon: <FaArrowUp className="mr-1.5" />, text: t('priority.high') },
    medium: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', icon: <FaEquals className="mr-1.5" />, text: t('priority.medium') },
    low: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: <FaArrowDown className="mr-1.5" />, text: t('priority.low') },
  };
  return priorityMap[priority?.toLowerCase()] || { color: 'bg-gray-100 text-gray-800', icon: <FaQuestionCircle className="mr-1.5" />, text: priority };
};

// ── Composants réutilisables ────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, onDetailClick }) => {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-4 border shadow-sm flex flex-col`}>
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{label}</div>
      {onDetailClick && (
        <button
          onClick={onDetailClick}
          className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline self-start"
        >
          Voir détail
        </button>
      )}
    </div>
  );
};

const MemberAvatar = ({ user, size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <img
      src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
      alt={user.name}
      className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`}
    />
  );
};

const RoleIcon = ({ role }) => {
  if (role === 'admin') return <FaShieldAlt className="text-red-500 text-sm" />;
  if (role === 'manager') return <FaCrown className="text-amber-500 text-sm" />;
  return <FaUser className="text-blue-500 text-sm" />;
};

const DescriptionWithToggle = ({ description, t }) => {
  const [expanded, setExpanded] = useState(false);
  if (!description) return <p className="text-gray-500 italic">{t('no_description')}</p>;

  const isLong = description.length > 200;
  const displayText = expanded || !isLong ? description : description.slice(0, 200) + '…';

  return (
    <div>
      <p className="whitespace-pre-wrap">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium mt-2 inline-flex items-center gap-1"
        >
          {expanded ? (
            <>
              <FaChevronUp className="text-xs" /> Voir moins
            </>
          ) : (
            <>
              <FaChevronDown className="text-xs" /> Voir plus
            </>
          )}
        </button>
      )}
    </div>
  );
};

// Bandeau compact de statut Zoom : remplace l'ancien composant pleine largeur.
// Affiche l'essentiel (réunion en cours ou non) et délègue le reste au modal.
const ZoomStatusBar = ({ project, onOpen }) => {
  const [liveMeeting, setLiveMeeting] = useState(null);
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${liveMeeting ? 'bg-emerald-600' : 'bg-blue-600'}`}>
          <FaVideo className="text-white text-sm" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Réunions Zoom</h3>
            {liveMeeting && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En cours
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {liveMeeting
              ? liveMeeting.topic
              : checked
              ? 'Aucune réunion en cours'
              : 'Vérification en cours…'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {liveMeeting && (
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
          >
            <FaDoorOpen className="text-xs" /> Rejoindre
          </button>
        )}
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition"
        >
          <FaVideo className="text-xs" /> {liveMeeting ? 'Détails' : 'Planifier / voir'}
        </button>
      </div>
    </div>
  );
};

// Modale de suppression avec consentement unanime des membres.
// Chaque membre saisit SON PROPRE mot de passe de compte (masqué) pour valider son accord.
// Le bouton de confirmation reste désactivé tant que tous les champs ne sont pas remplis ;
// la validation réelle (Hash::check) se fait côté serveur.
const ConsentDeleteModal = ({ show, onClose, project, onSubmit, loading, errors }) => {
  const [passwords, setPasswords] = useState({});

  const handleChange = (userId, value) => {
    setPasswords(prev => ({ ...prev, [userId]: value }));
  };

  const members = project.users || [];
  const allFilled = members.length > 0 && members.every(u => (passwords[u.id] || '').length > 0);

  const handleClose = () => {
    setPasswords({});
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose} maxWidth="lg">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FaExclamationTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Suppression du projet: consentement de tous les membres requis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vous ne pouvez pas supprimer ce projet seul. Chaque membre listé ci-dessous
              doit saisir son propre mot de passe pour donner son accord. Le projet ne sera supprimé que si
              <strong> tous</strong> les membres consentent.
            </p>
          </div>
        </div>

        {errors?.consent && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
            {errors.consent}
          </div>
        )}

        <div className="mt-5 space-y-3 max-h-80 overflow-y-auto pr-1">
          {members.map(user => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <MemberAvatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <div className="relative mt-1">
                  <FaLock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={passwords[user.id] || ''}
                    onChange={(e) => handleChange(user.id, e.target.value)}
                    placeholder="Mot de passe du compte"
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 ${
                      errors?.[user.id] ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors?.[user.id] && (
                  <p className="text-xs text-red-600 mt-1">{errors[user.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => onSubmit(passwords)}
            disabled={loading || !allFilled}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
            {loading ? 'Vérification…' : 'Confirmer la suppression'}
          </button>
        </div>
      </div>
    </Modal>
  );
};


// Modale : contribution aux discussions, classement par nombre de commentaires
const CommentStatsModal = ({ show, onClose, commentsByMember = [] }) => {
  const sorted = [...commentsByMember].sort((a, b) => b.count - a.count);
  const top3 = sorted.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  const chartData = {
    labels: sorted.map(m => (m.user?.name || 'Inconnu').split(' ')[0]),
    datasets: [
      {
        label: 'Commentaires',
        data: sorted.map(m => m.count),
        backgroundColor: sorted.map((_, i) =>
          i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#3b82f6'
        ),
        borderRadius: 8,
        maxBarThickness: 32,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaCommentDots className="text-amber-500" /> Contribution aux discussions
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg">
            <FaTimes />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Nombre de commentaires postés par membre sur les tâches de ce projet.
        </p>

        {sorted.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400 italic">
            Aucun commentaire n'a encore été posté sur ce projet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {top3.map((m, i) => (
                <div key={m.user?.id ?? i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                  <span className="text-2xl">{medals[i]}</span>
                  <MemberAvatar user={m.user || { name: 'Inconnu' }} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.user?.name || 'Inconnu'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.count} commentaire{m.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: Math.max(180, sorted.length * 40) }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// ── Composant principal ─────────────────────────────────────────────────────
function Show({ project, tasks = [], sprints = [], quizzes = [], auth: authProp, stats = {} }) {
  const { t, i18n } = useTranslation();
  const { flash = {}, auth: authFromPage } = usePage().props;
  const auth = authProp || authFromPage || {};
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentErrors, setConsentErrors] = useState({});
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showLiveKitCall, setShowLiveKitCall] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF for the modal early
  useEffect(() => {
    getFreshCsrfToken().then(t => setCsrfToken(t));
  }, []);
  const [callActive, setCallActive] = useState(false);
  const [showCommentStatsModal, setShowCommentStatsModal] = useState(false);

  // Auto-join quand redirigé depuis un lien d'invitation (?join-call=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('join-call') === '1' && !showLiveKitCall) {
      (async () => {
        setShowLiveKitCall(true);
        const csrfToken = await getFreshCsrfToken();
        fetch(`/projects/${project.id}/livekit-call/join-or-start`, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
          },
        })
          .then(res => res.json())
          .then(data => {
            setCallActive(true);
            if (data.inviteUrl) setInviteLink(data.inviteUrl);
          })
          .catch(err => console.error('Erreur appel:', err));
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
      })();
    }
  }, []);


  useEffect(() => {
    let cancelled = false;

    const fetchCallStatus = () => {
      fetch(`/projects/${project.id}/livekit-call/status`)
        .then(res => res.json())
        .then(data => { if (!cancelled) setCallActive(!!data.active); })
        .catch(() => {});
    };

    fetchCallStatus();
    const interval = setInterval(fetchCallStatus, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [project.id]);

  // ─── Temps réel : mise à jour instantanée du statut d'appel ProJA Meet ───
  useEffect(() => {
    const authUserId = auth?.user?.id;
    if (!window.Echo || !authUserId) return;

    const channel = window.Echo.private(`user.${authUserId}`);

    const handleStarted = (e) => {
      if (String(e.projectId) === String(project.id)) setCallActive(true);
    };
    const handleEnded = (e) => {
      if (String(e.projectId) === String(project.id)) setCallActive(false);
    };
    const handleAnswered = (e) => {
      if (String(e.projectId) === String(project.id)) setCallActive(true);
    };

    channel.listen('.livekit.call.started', handleStarted);
    channel.listen('.livekit.call.ended', handleEnded);
    channel.listen('.livekit.call.answered', handleAnswered);

    return () => {
      window.Echo.leave(`user.${authUserId}`);
    };
  }, [auth?.user?.id, project.id]);

  const userRoles = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
  const isAdmin = userRoles.includes('admin');
  const isManager = userRoles.includes('manager');

  const tasksData = tasks?.data || [];
  const sortedTasks = [...tasksData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const displayedTasks = showAllTasks ? sortedTasks : sortedTasks.slice(0, 5);
  const hasMoreTasks = sortedTasks.length > 5;

  const sprintsList = sprints?.data || [];

  // Clic sur "Supprimer le projet" : un admin système passe par la confirmation directe,
  // un manager (non admin) passe par la modale de consentement de tous les membres.
  const handleDeleteClick = () => {
    if (isAdmin) {
      setShowDeleteModal(true);
    } else {
      setConsentErrors({});
      setShowConsentModal(true);
    }
  };

  const handleDelete = () => {
    setDeleteLoading(true);
    router.delete(route('projects.destroy', project.id), {
      onSuccess: () => {
        setDeleteLoading(false);
        setShowDeleteModal(false);
      },
      onError: () => setDeleteLoading(false),
    });
  };

  const handleConsentSubmit = (passwords) => {
    setConsentLoading(true);
    setConsentErrors({});
    router.delete(route('projects.destroy.consent', project.id), {
      data: { passwords },
      preserveScroll: true,
      onSuccess: () => {
        setConsentLoading(false);
        setShowConsentModal(false);
      },
      onError: (errors) => {
        setConsentLoading(false);
        // Le contrôleur renvoie un message général ('consent') + une entrée par membre
        // en échec (clé = user id) dans le même sac d'erreurs Inertia.
        setConsentErrors(errors);
      },
    });
  };

  // Graphique
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });
  const taskCounts = last30Days.map(date => {
    const tasksForDate = tasksData.filter(task => new Date(task.created_at).toISOString().split('T')[0] === date);
    return { total: tasksForDate.length, done: tasksForDate.filter(t => t.status === 'done').length };
  });
  let cumTotal = 0, cumDone = 0;
  const chartData = taskCounts.map(day => {
    cumTotal += day.total;
    cumDone += day.done;
    return { cumTotal, cumDone };
  });
  const chartLabels = last30Days.map(date => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
  const trendChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('total_tasks'),
        data: chartData.map(d => d.cumTotal),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
      {
        label: t('completed_tasks'),
        data: chartData.map(d => d.cumDone),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Flash messages */}
        {flash.success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 px-5 py-3 rounded-2xl">
            {flash.success}
          </div>
        )}

{/* En-tête projet + Appels & réunions, côte à côte (empilés sur mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Carte gauche : identité du projet */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <FaProjectDiagram className="text-white text-xl" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white truncate">{project.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <FaCalendarAlt className="text-xs flex-shrink-0" />
                  {new Date(project.created_at).toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition"
              >
                <FaArrowLeft className="text-sm" /> {t('back_to_projects')}
              </Link>
            </div>
          </div>

          {/* Carte droite : Appels & réunions (Zoom + ProJA Meet) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Appels & réunions
            </h3>

            <ZoomStatusBar project={project} onOpen={() => setShowZoomModal(true)} />

            <div className="border-t border-gray-100 dark:border-gray-700" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${callActive ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                  <FaVideo className="text-white text-sm" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">ProJA Meet</h3>
                    {callActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En cours
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {callActive ? 'Un appel est en cours sur ce projet' : "Jusqu'à 100 participants simultanés"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowScheduledModal(true)}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition border border-gray-200 dark:border-gray-700"
                  title="Appels programmés"
                >
                  <FaCalendarAlt />
                </button>
                <button
                  onClick={async () => {
                    setShowLiveKitCall(true);
                    const token = csrfToken || await getFreshCsrfToken();
                    fetch(`/projects/${project.id}/livekit-call/join-or-start`, {
                      method: 'POST',
                      headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': token,
                      },
                    })
                      .then(res => res.json())
                      .then(data => {
                        setCallActive(true);
                        if (data.inviteUrl) setInviteLink(data.inviteUrl);
                      })
                      .catch(err => console.error('Erreur appel:', err));
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-white text-sm font-medium rounded-lg transition ${
                    callActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <FaVideo />
                  <span className="hidden sm:inline">
                    {callActive ? 'Rejoindre l\'appel' : 'Démarrer'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Grille 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <FaClipboardList className="text-blue-500" /> {t('project_description_label')}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <DescriptionWithToggle description={project.description} t={t} />
              </div>
              {project.meeting_link && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FaGlobe className="text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-blue-900 dark:text-blue-200">{t('meeting_link_title')}</span>
                  </div>
                  <a href={project.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all flex items-center gap-1">
                    <FaExternalLinkAlt className="text-xs" /> {project.meeting_link}
                  </a>
                </div>
              )}
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={<FaCheckCircle className="text-emerald-500 text-2xl" />} label={t('completed_tasks')} value={stats.doneTasksCount ?? 0} color="emerald" />
              <StatCard icon={<FaClock className="text-blue-500 text-2xl" />} label={t('tasks_in_progress')} value={stats.inProgressTasksCount ?? 0} color="blue" />
              <StatCard icon={<FaFileAlt className="text-purple-500 text-2xl" />} label={t('files')} value={stats.filesCount ?? 0} color="purple" />
              <StatCard
                icon={<FaCommentDots className="text-amber-500 text-2xl" />}
                label={t('comments')}
                value={stats.commentsCount ?? 0}
                color="amber"
                onDetailClick={() => setShowCommentStatsModal(true)}
              />
              <StatCard
                icon={<FaQuestionCircle className="text-indigo-500 text-2xl" />}
                label="Quiz"
                value={stats.quizzesCount ?? 0}
                color="blue"
                onDetailClick={() => router.visit(route('projects.quizzes.index', project.id))}
              />
            </div>

            {/* Section Quiz */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaQuestionCircle className="text-indigo-500" /> Quiz du projet ({stats.quizzesCount ?? quizzes.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Link
                    href={route('projects.quizzes.index', project.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-xl font-medium transition"
                  >
                    <FaEye className="text-xs" /> Voir tout
                  </Link>
                  {(isAdmin || isManager) && (
                    <Link
                      href={route('projects.quizzes.create', project.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition"
                    >
                      <FaPlus className="text-xs" /> Nouveau Quiz
                    </Link>
                  )}
                </div>
              </div>

              {quizzes.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                  Aucun quiz disponible pour ce projet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quizzes.slice(0, 4).map((quiz) => (
                    <div
                      key={quiz.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{quiz.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {quiz.duration_minutes} min | {quiz.questions_count ?? 0} questions
                        </p>
                      </div>
                      <Link
                        href={route('projects.quizzes.show', [project.id, quiz.id])}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex-shrink-0"
                      >
                        Accéder
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sprints */}
            {sprintsList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaListUl className="text-purple-500" /> {t('sprints')} ({sprintsList.length})
                  </h3>
                  <Link
                    href={route('sprints.index', { project_id: project.id })}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-xl font-medium transition"
                  >
                    <FaEye className="text-xs" /> Voir tout
                  </Link>
                </div>
                <div className="space-y-3">
                  {sprintsList.map(sprint => (
                    <div
                      key={sprint.id}
                      onClick={() => router.visit(route('sprints.show', sprint.id))}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{sprint.name}</h4>
                          {sprint.goal && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{sprint.goal}</p>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(sprint.start_date).toLocaleDateString()} → {new Date(sprint.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tâches */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaTasks className="text-blue-500" /> {t('tasks_section_title')} ({tasks.total || tasksData.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Link
                    href={route('tasks.index', { project_id: project.id })}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-xl font-medium transition"
                  >
                    <FaEye className="text-xs" /> Voir tout
                  </Link>
                  <Link
                    href={route('tasks.create', { project_id: project.id })}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-medium transition"
                  >
                    <FaPlus className="text-xs" /> {t('new_task')}
                  </Link>
                </div>
              </div>

              {tasksData.length === 0 ? (
                <div className="text-center py-12">
                  <FaTasks className="text-4xl mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{t('no_tasks_for_project')}</p>
                  <Link href={route('tasks.create', { project_id: project.id })} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
                    <FaPlus /> {t('create_task')}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {displayedTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => router.visit(route('tasks.show', task.id))}
                        className="group p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getPriorityInfo(task.priority, t).color}`}>
                                {getPriorityInfo(task.priority, t).icon} {getPriorityInfo(task.priority, t).text}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getStatusInfo(task.status, t).color}`}>
                                {getStatusInfo(task.status, t).icon} {getStatusInfo(task.status, t).text}
                              </span>
                            </div>
                          </div>
                          {task.assigned_user && <MemberAvatar user={task.assigned_user} size="md" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMoreTasks && !showAllTasks && (
                    <div className="text-center pt-3">
                      <button
                        onClick={() => setShowAllTasks(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {t('show_all_tasks')} ({sortedTasks.length}) <FaChevronDown className="text-xs" />
                      </button>
                    </div>
                  )}
                  {showAllTasks && (
                    <div className="text-center pt-3">
                      <button
                        onClick={() => setShowAllTasks(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {t('show_less')} <FaChevronUp className="text-xs" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Colonne droite - Sidebar */}
          <div className="space-y-6">
            {/* Actions rapides */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                {t('quick_actions')}
              </h3>
              <div className="space-y-2">
                <Link
                  href={route('projects.sprints.create', { project: project.id })}
                  className="flex items-center gap-3 w-full px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl transition"
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><FaRocket className="text-white text-sm" /></div>
                  <span className="font-medium text-sm">{t('add_sprint')}</span>
                </Link>

                <Link
                    href={route('project-users.create', { project_id: project.id })}
                    className="flex items-center gap-3 w-full px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl transition"
                >
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <FaUserPlus className="text-white text-sm" />
                    </div>
                    <span className="font-medium text-sm">{t('add_member')}</span>
                </Link>

                <Link
                  href={route('tasks.create', { project_id: project.id })}
                  className="flex items-center gap-3 w-full px-3 py-2.5 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl transition"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center"><FaTasks className="text-white text-sm" /></div>
                  <span className="font-medium text-sm">{t('add_task')}</span>
                </Link>

                {/* Export dropdown */}
                <div className="relative group/export">
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl transition text-left">
                    <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center"><FaFileExport className="text-white text-sm" /></div>
                    <span className="font-medium text-sm flex-1">{t('export')}</span>
                    <FaChevronDown className="text-xs" />
                  </button>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-50">
                    <a href={`/projects/${project.id}/suivi-global/txt`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <FaFileAlt className="text-blue-500" /> <span>Log Format TXT</span>
                    </a>
                     {/* Export hidden 
                    <a href={`/projects/${project.id}/suivi-global/pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <FaFilePdf className="text-red-500" /> <span>PDF</span>
                    </a>
                    <a href={`/projects/${project.id}/suivi-global/docx`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <FaFileWord className="text-blue-700" /> <span>Word</span>
                    </a>
                    */}
                    <a href={`/projects/${project.id}/planning/pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <FaProjectDiagram className="text-indigo-600" /> <span>Planning PDF</span>
                    </a>
                  </div>
                </div>

                {(isAdmin || isManager) && (
                  <>
                    <Link
                      href={route('projects.edit', project.id)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl transition"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><FaEdit className="text-white text-sm" /></div>
                      <span className="font-medium text-sm">{t('edit_project')}</span>
                    </Link>
                    <button
                      onClick={handleDeleteClick}
                      className="flex items-center gap-3 w-full px-3 py-2.5 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl transition"
                    >
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center"><FaTrash className="text-white text-sm" /></div>
                      <span className="font-medium text-sm">
                        {t('delete_project')}
                        {!isAdmin && <span className="block text-xs font-normal opacity-75">Nécessite le consentement de tous les membres</span>}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Membres */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  {t('project_members')} ({project.users?.length || 0})
                </h3>
                <Link href={route('project-users.show', project.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  {t('view_all')}
                </Link>
              </div>
              <div className="space-y-3">
                {project.users?.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <MemberAvatar user={user} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <RoleIcon role={user.pivot?.role || user.role} />
                  </div>
                ))}
              </div>
            </div>

            {/* Progression par membre */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
                {t('tasks_completed_by_member')}
              </h3>
              <div className="space-y-3">
                {project.users?.slice(0, 5).map(user => {
                  const userDoneTasks = stats.doneTasksByUser?.[user.id] ?? 0;
                  const percent = stats.totalTasks ? (userDoneTasks / stats.totalTasks) * 100 : 0;
                  return (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemberAvatar user={user} size="sm" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{userDoneTasks}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Graphique */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaChartLine className="text-blue-500" /> {t('tasks_evolution')}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span>{t('total_tasks')}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span>{t('completed_tasks')}</span></div>
            </div>
          </div>
          <div className="h-64">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Modal suppression directe (admin système uniquement) */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="md">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('delete_project_title')}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('delete_project_confirm', { name: project.name })}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Suppression directe en tant qu'administrateur système.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowDeleteModal(false)} disabled={deleteLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              {t('cancel')}
            </button>
            <button onClick={handleDelete} disabled={deleteLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 inline-flex items-center gap-2">
              {deleteLoading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              {deleteLoading ? t('deleting') : t('delete_project_permanently')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal suppression avec consentement des membres (managers non-admin) */}
      <ConsentDeleteModal
        show={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        project={project}
        onSubmit={handleConsentSubmit}
        loading={consentLoading}
        errors={consentErrors}
      />

      <CommentStatsModal
        show={showCommentStatsModal}
        onClose={() => setShowCommentStatsModal(false)}
        commentsByMember={stats.commentsByMember || []}
      />

      {/* Modal Zoom : héberge le composant complet, inchangé fonctionnellement */}
      <Modal show={showZoomModal} onClose={() => setShowZoomModal(false)} maxWidth="2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaVideo className="text-blue-500" /> Réunions Zoom
          </h3>
          <button
            onClick={() => setShowZoomModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
            aria-label="Fermer"
          >
            <FaTimes />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto">
          <ZoomMeeting project={project} />
        </div>
      </Modal>
      <ScheduledCallsModal
        show={showScheduledModal}
        onClose={() => setShowScheduledModal(false)}
        projectId={project.id}
        csrfToken={csrfToken}
      />
      {showLiveKitCall && (
<LiveKitCallModal
  tokenEndpoint={`/projects/${project.id}/livekit-token`}
  inviteLink={inviteLink}
  muteEndpoint={`/projects/${project.id}/livekit-call/mute-participant`}
  isHost={isAdmin || isManager}
  skipIncomingScreen={true}
  title={project.name}

    onAnswered={async () => {
      const csrfToken = await getFreshCsrfToken();
      fetch(`/projects/${project.id}/livekit-call/answered`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
        },
      }).catch(() => {});
    }}
onClose={async () => {
  setShowLiveKitCall(false);
  setInviteLink('');
  fetch(`/projects/${project.id}/livekit-call/status`)
    .then(res => res.json())
    .then(data => setCallActive(!!data.active))
    .catch(() => {});
  const csrfToken = await getFreshCsrfToken();
  fetch(`/projects/${project.id}/livekit-call/end`, {
    method: 'POST',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': csrfToken,
    },
  }).catch(() => {});
}}

        />
      )}
    </div>
  );
}

Show.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Show;