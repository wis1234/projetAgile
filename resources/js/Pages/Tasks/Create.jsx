import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaSave, 
  FaTimes, 
  FaQuestionCircle, 
  FaInfoCircle, 
  FaUserCheck, 
  FaCalendarAlt, 
  FaClipboardList, 
  FaBell,
  FaTasks,
  FaUserCircle,
  FaDollarSign,
  FaUserPlus,
  FaCheckCircle,
  FaUsers,
  FaUser
} from 'react-icons/fa';
import AdminLayout from '../../Layouts/AdminLayout';

// ─── Helpers de date : TOUT reste en heure locale, jamais de conversion UTC ───
// Date locale au format YYYY-MM-DD (sans passer par toISOString, qui est en UTC)
const toLocalDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Affiche une date YYYY-MM-DD en heure locale (le "T00:00:00" évite l'interprétation UTC)
const parseLocalDate = (dateString) => new Date(`${dateString}T00:00:00`);

function Create({ projects = [], sprints = [], users = [], selectedProjectId = null }) {
  const { errors = {}, flash = {} } = usePage().props;
  
  // Déterminer si un projet est pré‑sélectionné
  const isProjectPreSelected = selectedProjectId && projects.some(p => p.id == selectedProjectId);
  const defaultProjectId = isProjectPreSelected ? selectedProjectId : (projects[0]?.id || '');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('individual'); // 'individual' | 'group'
  const [assignedUserIds, setAssignedUserIds] = useState([]);
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');      // format YYYY-MM-DD (heure locale)
  const [dueTime, setDueTime] = useState('12:00'); // format HH:mm (heure locale)
  const [priority, setPriority] = useState('medium');
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [sprintId, setSprintId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentReason, setPaymentReason] = useState('');
  const [amount, setAmount] = useState('');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Route de retour contextuelle : si on arrive depuis la page d'un projet
  // (selectedProjectId présent et valide), on doit y retourner. Sinon, retour à la liste des tâches.
  const backRoute = isProjectPreSelected
    ? route('projects.show', selectedProjectId)
    : '/tasks';

  const handleToggleMember = (userId) => {
    setAssignedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllMembers = () => {
    if (assignedUserIds.length === projectUsers.length) {
      setAssignedUserIds([]);
    } else {
      setAssignedUserIds(projectUsers.map(u => u.id));
    }
  };

  const hasProjects = projects.length > 0;
  const isAssigneeValid = taskType === 'individual' ? !!assignedTo : assignedUserIds.length > 0;
  const isFormValid = title && projectId && sprintId && isAssigneeValid && status;

  const selectedProject = projects.find(p => p.id == projectId);
  const projectUsers = selectedProject?.users || [];
  const projectSprints = sprints.filter(s => s.project_id == projectId);

  // Met à jour le sprint par défaut quand le projet change
  const updateSprintAndAssignee = (projId) => {
    const projSprints = sprints.filter(s => s.project_id == projId);
    setSprintId(projSprints[0]?.id || '');
    const proj = projects.find(p => p.id == projId);
    setAssignedTo(proj?.users?.[0]?.id || '');
    setAssignedUserIds([]);
  };

  // Initialisation si projet pré‑sélectionné
  useEffect(() => {
    if (defaultProjectId) {
      updateSprintAndAssignee(defaultProjectId);
    }
  }, []); // ne dépend que du montage

  const handleProjectChange = (e) => {
    const newProjectId = e.target.value;
    setProjectId(newProjectId);
    updateSprintAndAssignee(newProjectId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Heure locale telle que saisie, sans aucune conversion de fuseau
    const formattedDueDate = dueDate ? `${dueDate} ${dueTime || '12:00'}:00` : null;
    
    router.post('/tasks', {
      title,
      description,
      type: taskType,
      status,
      due_date: formattedDueDate,
      priority,
      assigned_to: taskType === 'individual' ? assignedTo : (assignedUserIds[0] || null),
      assigned_user_ids: taskType === 'group' ? assignedUserIds : (assignedTo ? [assignedTo] : []),
      project_id: projectId,
      sprint_id: sprintId,
      is_paid: isPaid,
      payment_reason: paymentReason,
      amount: amount,
      // Indique au backend qu'on vient de la page d'un projet, pour que
      // la redirection serveur (fallback sans JS) reste cohérente avec le client
      from_project: isProjectPreSelected,
    }, {
      onSuccess: () => {
        setNotification('Tâche créée avec succès');
        setNotificationType('success');
        setTitle('');
        setDescription('');
        setTaskType('individual');
        setAssignedUserIds([]);
        setDueDate('');
        setDueTime('12:00');
        setAssignedTo('');
        setProjectId(projects[0]?.id || '');
        setSprintId(sprints[0]?.id || '');
        setStatus('todo');
        setPriority('medium');
        setIsPaid(false);
        setPaymentReason('');
        setAmount('');
        setLoading(false);
        setTimeout(() => router.visit(backRoute), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la création');
        setNotificationType('error');
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex flex-col w-full bg-white p-0 m-0 min-h-screen">
      <div className="flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        {/* En-tête avec boutons */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={backRoute} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-3 rounded-lg transition duration-200 hover:shadow-sm">
            <FaArrowLeft className="text-xl" />
          </Link>
          <FaTasks className="text-4xl text-blue-600 dark:text-blue-400" />
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Créer une tâche</h1>
          <button
            onClick={() => setShowHelpModal(true)}
            className="ml-auto flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-2 rounded-lg transition duration-200"
            title="Aide à la création de tâche"
          >
            <FaQuestionCircle className="text-2xl" />
          </button>
        </div>

        {/* Modal d'aide (inchangé) */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Conseils pour créer une tâche efficace</h2>
                <button onClick={() => setShowHelpModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                    <FaInfoCircle className="text-blue-600 dark:text-blue-400" />
                    Comment créer une tâche efficace ?
                  </h3>
                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p>Une tâche bien définie est essentielle pour la productivité de votre équipe. Voici quelques conseils :</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2"><FaUserCheck className="inline mr-2" />Attribution claire</h4>
                        <p>Assurez-vous d'attribuer la tâche à un membre de l'équipe et de sélectionner le bon projet et sprint.</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2"><FaCalendarAlt className="inline mr-2" />Dates réalistes</h4>
                        <p>Définissez une échéance réaliste en fonction de la complexité de la tâche.</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2"><FaClipboardList className="inline mr-2" />Description détaillée</h4>
                        <p>Décrivez clairement ce qui doit être fait, les étapes à suivre et le résultat attendu.</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2"><FaBell className="inline mr-2" />Notifications</h4>
                        <p>La personne assignée et les membres du projet seront automatiquement notifiés.</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500">
                      <p className="text-sm"><strong>Astuce :</strong> Utilisez le formatage Markdown pour structurer votre description et ajouter des liens ou des listes.</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setShowHelpModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">Compris</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Corps du formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          {notification && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
              {notification}
            </div>
          )}
          {!hasProjects && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-100 text-yellow-800 font-semibold text-center">
              Vous n'êtes manager d'aucun projet. Veuillez demander à un administrateur de vous rattacher à un projet pour pouvoir créer une tâche.
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Titre */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Titre de la tâche</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Requis</span>
              </div>
              <div className="relative">
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required disabled={!hasProjects} />
                <div className="absolute right-3 top-3 text-gray-400"><FaInfoCircle /></div>
              </div>
              {errors.title && <div className="text-red-600 text-sm mt-2">{errors.title}</div>}
            </div>

            {/* Projet */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="project" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Projet</label>
                <span className="text-xs text-gray-500">Requis</span>
              </div>
              <div className="relative">
                <select
                  id="project"
                  value={projectId}
                  onChange={handleProjectChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${isProjectPreSelected ? 'opacity-75 cursor-not-allowed bg-gray-100 dark:bg-gray-600' : ''}`}
                  required
                  disabled={!hasProjects || isProjectPreSelected}
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="absolute right-3 top-3 text-gray-400"><FaInfoCircle /></div>
              </div>
              {isProjectPreSelected && selectedProject && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                    <FaCheckCircle className="text-green-500" />
                    <span className="font-medium">Projet pré‑sélectionné :</span>
                    <span>{selectedProject.name}</span>
                  </div>
                </div>
              )}
              {errors.project_id && <div className="text-red-600 text-sm mt-2">{errors.project_id}</div>}
            </div>

            {/* Sprint */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="sprint" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Sprint</label>
                <span className="text-xs text-gray-500">Requis</span>
              </div>
              <div className="relative">
                <select id="sprint" value={sprintId} onChange={e => setSprintId(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700" required disabled={!hasProjects}>
                  {projectSprints.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({new Date(s.start_date).toLocaleDateString()} - {new Date(s.end_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 text-gray-400"><FaInfoCircle /></div>
              </div>
              {errors.sprint_id && <div className="text-red-600 text-sm mt-2">{errors.sprint_id}</div>}
            </div>

            {/* Type de tâche (Individuel ou Groupe) */}
            <div className="mb-6 md:col-span-2 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Type de tâche <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTaskType('individual')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    taskType === 'individual'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${taskType === 'individual' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    <FaUser className="text-sm" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Individuel</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Assignée à un seul membre responsable</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTaskType('group')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    taskType === 'group'
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 shadow-sm'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${taskType === 'group' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    <FaUsers className="text-sm" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Groupe</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Assignée à plusieurs membres (synchronisation d'état partagée)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Assignation : Individuel vs Groupe */}
            {taskType === 'individual' ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="assigned_to" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Assigné à</label>
                  <span className="text-xs text-gray-500">Requis</span>
                </div>
                <div className="relative">
                  <select
                    id="assigned_to"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                    required
                    disabled={projectUsers.length === 0 || !hasProjects}
                  >
                    <option value="">Sélectionnez un membre</option>
                    {projectUsers.length === 0 && <option disabled>Aucun membre disponible dans ce projet</option>}
                    {projectUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.roles?.[0]?.name || 'Membre'})</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 text-gray-400"><FaUserPlus /></div>
                </div>
                {projectUsers.length === 0 && <p className="mt-1 text-xs text-red-500">Aucun membre disponible. Ajoutez d'abord des membres au projet.</p>}
                {errors.assigned_to && <div className="text-red-600 text-sm mt-2">{errors.assigned_to}</div>}
              </div>
            ) : (
              <div className="mb-6 md:col-span-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white">
                      Membres concernés par la tâche de groupe <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Cochez les membres de l'équipe auxquels cette tâche doit être assignée ({assignedUserIds.length} sélectionné{assignedUserIds.length > 1 ? 's' : ''})
                    </p>
                  </div>
                  {projectUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllMembers}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors self-start"
                    >
                      {assignedUserIds.length === projectUsers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  )}
                </div>

                {projectUsers.length === 0 ? (
                  <p className="text-xs text-red-500">Aucun membre disponible dans ce projet. Ajoutez d'abord des membres au projet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {projectUsers.map(u => {
                      const isChecked = assignedUserIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-indigo-500 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-indigo-500'
                              : 'border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMember(u.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                          />
                          <img
                            src={u.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block truncate">{u.name}</span>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate block">{u.email || u.roles?.[0]?.name || 'Membre'}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5">
                  <FaInfoCircle className="text-blue-500 text-sm mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Règle de synchronisation :</strong> Cette tâche de groupe est commune à tous les membres cochés. Toute modification (changement de statut, validation, etc.) faite par un membre s'applique immédiatement à tout le monde.
                  </p>
                </div>
              </div>
            )}

            {/* Statut */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Statut</label>
                <span className="text-xs text-gray-500">Par défaut: À faire</span>
              </div>
              <div className="relative">
                <select id="status" value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 appearance-none" disabled={!hasProjects}>
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Terminé</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none"><svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>
              </div>
              {errors.status && <div className="text-red-600 text-sm mt-2">{errors.status}</div>}
            </div>

            {/* Priorité */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Priorité</label>
                <div className="flex space-x-1">
                  {['low', 'medium', 'high'].map(level => (
                    <div key={level} className={`w-3 h-3 rounded-full ${level === 'low' ? 'bg-green-400' : level === 'medium' ? 'bg-yellow-400' : 'bg-red-500'} ${priority === level ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-50'}`} />
                  ))}
                </div>
              </div>
              <div className="relative">
                <select id="priority" value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 appearance-none" disabled={!hasProjects}>
                  <option value="low">Faible – Peut attendre</option>
                  <option value="medium">Moyenne – À faire bientôt</option>
                  <option value="high">Élevée – Urgente</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none"><svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>
              </div>
              {errors.priority && <div className="text-red-600 text-sm mt-2">{errors.priority}</div>}
            </div>

            {/* Date d'échéance (heure locale) */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="due_date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date d'échéance</label>
                {dueDate && <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">{parseLocalDate(dueDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg></div>
                    <input type="date" value={dueDate} min={toLocalDateString(new Date())} onChange={e => setDueDate(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700" disabled={!hasProjects} />
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700" disabled={!hasProjects} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 7, 14].map(days => {
                    const date = new Date();
                    date.setDate(date.getDate() + days);
                    return (
                      <button key={days} type="button" onClick={() => { setDueDate(toLocalDateString(date)); setDueTime('09:00'); }} className="text-xs px-3 py-1.5 rounded-full border hover:bg-gray-50">
                        {days === 1 ? 'Demain' : `+${days} jours`}
                      </button>
                    );
                  })}
                </div>
              </div>
              {errors.due_date && <div className="text-red-600 text-sm mt-2">{errors.due_date}</div>}
            </div>

            {/* Description (Markdown) */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold">Description</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{description.length}/2000 caractères</span>
                  <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-xs text-blue-600 hover:underline">{showPreview ? 'Éditer' : 'Aperçu'}</button>
                </div>
              </div>
              {!showPreview ? (
                <>
                  <textarea id="description" value={description} onChange={e => setDescription(e.target.value.slice(0, 2000))} rows="6" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 font-mono text-sm" placeholder="Décrivez la tâche en détail (support Markdown)" disabled={!hasProjects} />
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button type="button" onClick={() => { const ta = document.getElementById('description'); const s = ta.selectionStart, e = ta.selectionEnd, t = description.substring(s, e); setDescription(description.substring(0,s) + `**${t||'texte en gras'}**` + description.substring(e)); setTimeout(()=>ta.setSelectionRange(s+2, s+6+(t.length)),0); }} className="text-xs px-2 py-1 bg-gray-100 rounded border hover:bg-gray-200" title="Gras"><strong>B</strong></button>
                    <button type="button" onClick={() => { const ta = document.getElementById('description'); const s = ta.selectionStart, e = ta.selectionEnd, t = description.substring(s, e); setDescription(description.substring(0,s) + `*${t||'texte en italique'}*` + description.substring(e)); setTimeout(()=>ta.setSelectionRange(s+1, s+1+t.length),0); }} className="text-xs px-2 py-1 bg-gray-100 rounded border hover:bg-gray-200" title="Italique"><em>I</em></button>
                    <button type="button" onClick={() => { const ta = document.getElementById('description'); const s = ta.selectionStart; setDescription(description.substring(0,s) + '\n- Élément de liste\n- Autre élément' + description.substring(s)); setTimeout(()=>ta.setSelectionRange(s+2, s+17),0); }} className="text-xs px-2 py-1 bg-gray-100 rounded border hover:bg-gray-200" title="Liste à puces">• Liste</button>
                    <button type="button" onClick={() => { const ta = document.getElementById('description'); const s = ta.selectionStart, e = ta.selectionEnd, t = description.substring(s, e); setDescription(description.substring(0,s) + `\n\`\`\`\n${t||'// Votre code ici'}\n\`\`\`\n` + description.substring(e)); setTimeout(()=>ta.setSelectionRange(s+5, s+5+(t.length||17)),0); }} className="text-xs px-2 py-1 bg-gray-100 rounded border hover:bg-gray-200" title="Bloc de code">{`</>`}</button>
                  </div>
                </>
              ) : (
                <div className="prose dark:prose-invert max-w-none p-4 border rounded-lg bg-white dark:bg-gray-800 min-h-[150px]">
                  {description ? <ReactMarkdown>{description}</ReactMarkdown> : <p className="text-gray-400 italic">Aperçu de la description</p>}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">Utilisez la syntaxe <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Markdown</a> pour formater votre texte</p>
              {errors.description && <div className="text-red-600 text-sm mt-2">{errors.description}</div>}
            </div>

            {/* Rémunération */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input id="is_paid" type="checkbox" className="h-4 w-4 text-indigo-600 rounded" checked={isPaid} onChange={(e) => { setIsPaid(e.target.checked); if (!e.target.checked) setAmount(''); else setPaymentReason(''); }} />
                <label htmlFor="is_paid" className="ml-2 text-sm">Cette tâche est rémunérée</label>
              </div>
              {isPaid ? (
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold mb-2">Montant (FCFA)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><span className="text-gray-500 sm:text-sm">FCFA</span></div>
                    <input type="number" id="amount" className="block w-full pl-16 pr-12 border-gray-300 rounded-md shadow-sm dark:bg-gray-700" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" />
                  </div>
                  {errors.amount && <div className="text-red-600 text-sm mt-2">{errors.amount}</div>}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold mb-2">Raison de la non‑rémunération</label>
                  <select className="block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700" value={paymentReason} onChange={e => setPaymentReason(e.target.value)}>
                    <option value="">Sélectionner une raison</option>
                    <option value="volunteer">Bénévolat</option>
                    <option value="academic">Projet académique</option>
                    <option value="other">Autre raison</option>
                  </select>
                  {errors.payment_reason && <div className="text-red-600 text-sm mt-2">{errors.payment_reason}</div>}
                  <p className="mt-2 text-sm text-gray-500 flex items-start gap-1"><FaInfoCircle className="h-4 w-4 mt-0.5" /> Cette information nous aide à mieux comprendre la nature de la tâche.</p>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button type="submit" className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || !isFormValid || projectUsers.length === 0 || !hasProjects}>
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Création...</>) : (<><FaTasks /> Créer la tâche</>)}
              </button>
              <Link href={backRoute} className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <FaArrowLeft /> Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

Create.layout = page => <AdminLayout children={page} />;
export default Create;