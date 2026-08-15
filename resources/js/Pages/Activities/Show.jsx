import React from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import {
  FaHistory, FaUserCircle, FaRegListAlt, FaProjectDiagram, FaTasks,
  FaFileAlt, FaUser, FaCommentDots, FaArrowLeft, FaGlobe, FaClock,
  FaDesktop, FaCalendarAlt, FaChevronRight
} from 'react-icons/fa';

// ─── Config visuelle par type d'activité ──────────────────────────────────
const TYPE_STYLES = {
  create:  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500', label: 'Création' },
  update:  { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500', label: 'Modification' },
  delete:  { badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', dot: 'bg-red-500', label: 'Suppression' },
  comment: { badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800', dot: 'bg-orange-500', label: 'Commentaire' },
  status:  { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800', dot: 'bg-indigo-500', label: 'Statut' },
};
const DEFAULT_TYPE_STYLE = { badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-500', label: null };

const getTypeStyle = (type) => TYPE_STYLES[type] || DEFAULT_TYPE_STYLE;

const getSubjectIcon = (type) => {
  if (!type) return <FaRegListAlt className="w-4 h-4" />;
  if (type.includes('Project')) return <FaProjectDiagram className="w-4 h-4" />;
  if (type.includes('Task') && !type.includes('Comment')) return <FaTasks className="w-4 h-4" />;
  if (type.includes('File')) return <FaFileAlt className="w-4 h-4" />;
  if (type.includes('User')) return <FaUser className="w-4 h-4" />;
  if (type.includes('Comment')) return <FaCommentDots className="w-4 h-4" />;
  return <FaRegListAlt className="w-4 h-4" />;
};

// ─── Ligne clé/valeur réutilisable pour les détails ────────────────────────
const DetailRow = ({ label, value, mono = false }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex-shrink-0 pt-0.5">
      {label}
    </span>
    <span className={`text-sm text-gray-800 dark:text-gray-200 text-right ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
      {value ?? <span className="italic text-gray-400 font-normal">—</span>}
    </span>
  </div>
);

function renderSubjectDetails(subject, type) {
  if (!subject) return null;

  if (type === 'App\\Models\\File') {
    return (
      <div>
        <DetailRow label="Nom" value={subject.name} />
        <DetailRow label="Type" value={subject.type} mono />
        <DetailRow label="Taille" value={subject.size ? `${(subject.size / 1024).toFixed(1)} Ko` : null} />
        <DetailRow label="Projet" value={subject.project?.name || subject.project_id} />
        <DetailRow label="Tâche" value={subject.task?.title || subject.task_id} />
        <DetailRow label="Utilisateur" value={subject.user?.name || subject.user_id} />
        <DetailRow label="Statut" value={subject.status} />
        <DetailRow label="Créé le" value={subject.created_at ? new Date(subject.created_at).toLocaleString('fr-FR') : null} />
      </div>
    );
  }

  if (type === 'App\\Models\\Task') {
    return (
      <div>
        <DetailRow label="Titre" value={subject.title} />
        <DetailRow label="Projet" value={subject.project?.name || subject.project_id} />
        <DetailRow label="Assigné à" value={subject.assigned_user?.name || subject.assigned_to} />
        <DetailRow label="Statut" value={subject.status} />
        <DetailRow label="Priorité" value={subject.priority} />
        <DetailRow label="Créé le" value={subject.created_at ? new Date(subject.created_at).toLocaleString('fr-FR') : null} />
      </div>
    );
  }

  if (type === 'App\\Models\\Project') {
    return (
      <div>
        <DetailRow label="Nom" value={subject.name} />
        <DetailRow label="Description" value={subject.description} />
        <DetailRow label="Créé le" value={subject.created_at ? new Date(subject.created_at).toLocaleString('fr-FR') : null} />
      </div>
    );
  }

  if (type === 'App\\Models\\User') {
    return (
      <div>
        <DetailRow label="Nom" value={subject.name} />
        <DetailRow label="Email" value={subject.email} mono />
        <DetailRow label="Rôle" value={subject.roles ? subject.roles.map(r => r.name).join(', ') : null} />
      </div>
    );
  }

  if (type === 'App\\Models\\TaskComment') {
    return (
      <div>
        <DetailRow label="Contenu" value={subject.content || <span className="italic">Message vocal/photo</span>} />
        <DetailRow label="Tâche" value={subject.task?.title || subject.task_id} />
        <DetailRow label="Auteur" value={subject.user?.name || subject.user_id} />
        <DetailRow label="Réponse à" value={subject.parent_id ? `Commentaire #${subject.parent_id}` : 'Message principal'} />
        <DetailRow label="Créé le" value={subject.created_at ? new Date(subject.created_at).toLocaleString('fr-FR') : null} />
      </div>
    );
  }

  // Fallback générique
  return (
    <div>
      {Object.entries(subject)
        .filter(([k]) => !['id', 'user_id', 'project_id', 'task_id', 'kanban_id', 'subject_id'].includes(k))
        .map(([k, v]) => (
          <DetailRow
            key={k}
            label={k.replace(/_/g, ' ')}
            value={typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(v).toLocaleString('fr-FR') : String(v)}
          />
        ))}
    </div>
  );
}
function resolveSubjectUrl(subjectType, subjectId, subject) {
  if (!subjectType || !subjectId) return null;
  if (subjectType === 'App\\Models\\Project') return route('projects.show', subjectId);
  if (subjectType === 'App\\Models\\Task') return route('tasks.show', subjectId);
  if (subjectType === 'App\\Models\\File') return route('files.show', subjectId);
  if (subjectType === 'App\\Models\\TaskComment' && subject?.task_id) return route('tasks.show', subject.task_id);
  return null;
}

export default function Show({ activity, subject }) {
  const typeStyle = getTypeStyle(activity.type);
  const subjectName = activity.subject_type ? activity.subject_type.split('\\').pop() : null;

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ─── Fil d'ariane / retour ─── */}
        <Link
          href={route('activities.index')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-6 w-fit"
        >
          <FaArrowLeft className="w-3 h-3" /> Retour au journal d'activité
        </Link>

        {/* ─── Header avec dégradé ─── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl shadow-lg shadow-blue-500/10 p-6 sm:p-8 mb-8">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
              <FaHistory className="text-2xl text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Journal d'activité</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {activity.notification_message || activity.description || 'Détail de l\'activité'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 backdrop-blur-sm`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                  {typeStyle.label || activity.type_label || activity.type}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-blue-50 border border-white/10">
                  <FaCalendarAlt className="w-3 h-3" />
                  {new Date(activity.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Grille principale ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Colonne gauche : auteur + métadonnées techniques */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Carte auteur */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">
                Réalisé par
              </h2>
              <div className="flex items-center gap-4">
                {activity.user ? (
                  <img
                    src={activity.user.profile_photo_url ||
                      (activity.user.profile_photo_path
                        ? `/storage/${activity.user.profile_photo_path}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}&background=2563eb&color=fff`)}
                    alt={activity.user.name}
                    className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-blue-100 dark:border-blue-900"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <FaUserCircle className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {activity.user ? activity.user.name : <span className="italic text-gray-400 font-normal">Invité</span>}
                  </p>
                  {activity.user?.roles && activity.user.roles.length > 0 && (
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 capitalize">
                      {activity.user.roles[0].name}
                    </span>
                  )}
                </div>
              </div>

              {activity.description && (
                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{activity.description}</p>
                </div>
              )}
            </div>

            {/* Carte métadonnées techniques */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">
                Informations techniques
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <FaGlobe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase">Adresse IP</p>
                    <p className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">{activity.ip_address || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                    <FaDesktop className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase">Navigateur / Appareil</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words mt-0.5">
                      {activity.user_agent || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                    <FaClock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase">Horodatage complet</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {new Date(activity.created_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite : objet lié */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-full">

              {/* En-tête de carte avec icône dynamique */}
              <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeStyle.badge}`}>
                  {getSubjectIcon(activity.subject_type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Objet concerné</p>
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {subjectName || 'Aucun objet associé'}
                  </p>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6">
                {subject ? (
                  renderSubjectDetails(subject, activity.subject_type)
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                      <FaRegListAlt className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Aucun objet lié disponible pour cette activité
                    </p>
                  </div>
                )}
              </div>

              {/* Lien vers l'objet, si résolu */}
             {/* Lien vers l'objet, si résolu */}
{subject && activity.subject_type && activity.subject_id && (
  <div className="px-6 pb-6">
    <a
      href={resolveSubjectUrl(
        activity.subject_type,
        activity.subject_id,
        subject
      )}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
    >
      Ouvrir l'objet concerné{" "}
      <FaChevronRight className="w-3 h-3" />
    </a>
  </div>
)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />;