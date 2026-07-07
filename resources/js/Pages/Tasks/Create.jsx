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
  FaCheckCircle
} from 'react-icons/fa';
import AdminLayout from '../../Layouts/AdminLayout';

function Create({ projects = [], sprints = [], users = [], selectedProjectId = null }) {
  const { errors = {}, flash = {} } = usePage().props;
  
  // Déterminer si un projet est pré‑sélectionné
  const isProjectPreSelected = selectedProjectId && projects.some(p => p.id == selectedProjectId);
  const defaultProjectId = isProjectPreSelected ? selectedProjectId : (projects[0]?.id || '');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
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
  
  // Formatage date/heure pour l'affichage
  const formatDateTime = (dateString) => {
    if (!dateString) return { date: '', time: '12:00' };
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  };

  // Met à jour la date complète quand la date ou l'heure change
  useEffect(() => {
    if (dueDate) {
      const [hours, minutes] = dueTime.split(':');
      const date = new Date(dueDate);
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      setDueDate(date.toISOString().slice(0, 16));
    }
  }, [dueTime]);

  const hasProjects = projects.length > 0;
  const isFormValid = title && projectId && sprintId && assignedTo && status;

  const selectedProject = projects.find(p => p.id == projectId);
  const projectUsers = selectedProject?.users || [];
  const projectSprints = sprints.filter(s => s.project_id == projectId);

  // Met à jour le sprint par défaut quand le projet change
  const updateSprintAndAssignee = (projId) => {
    const projSprints = sprints.filter(s => s.project_id == projId);
    setSprintId(projSprints[0]?.id || '');
    const proj = projects.find(p => p.id == projId);
    setAssignedTo(proj?.users?.[0]?.id || '');
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
    
    let formattedDueDate = null;
    if (dueDate) {
      const [year, month, day] = dueDate.split('T')[0].split('-');
      const [hours, minutes] = dueTime.split(':');
      formattedDueDate = `${year}-${month}-${day} ${hours}:${minutes}:00`;
    }
    
    router.post('/tasks', {
      title,
      description,
      status,
      due_date: formattedDueDate,
      priority,
      assigned_to: assignedTo,
      project_id: projectId,
      sprint_id: sprintId,
      is_paid: isPaid,
      payment_reason: paymentReason,
      amount: amount,
    }, {
      onSuccess: () => {
        setNotification('Tâche créée avec succès');
        setNotificationType('success');
        setTitle('');
        setDescription('');
        setDueDate('');
        setAssignedTo('');
        setProjectId(projects[0]?.id || '');
        setSprintId(sprints[0]?.id || '');
        setStatus('todo');
        setPriority('medium');
        setIsPaid(false);
        setPaymentReason('');
        setAmount('');
        setLoading(false);
        setTimeout(() => router.visit('/tasks'), 1200);
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
          <Link href="/tasks" className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-3 rounded-lg transition duration-200 hover:shadow-sm">
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

            {/* Assigné à */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="assigned_to" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Assigné à</label>
                <span className="text-xs text-gray-500">Requis</span>
              </div>
              <div className="relative">
                <select id="assigned_to" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700" required disabled={projectUsers.length === 0 || !hasProjects}>
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

            {/* Date d'échéance */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="due_date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date d'échéance</label>
                {dueDate && <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">{new Date(dueDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg></div>
                    <input type="date" value={dueDate ? formatDateTime(dueDate).date : ''} min={formatDateTime(new Date().toISOString()).date} onChange={e => setDueDate(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700" disabled={!hasProjects} />
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
                      <button key={days} type="button" onClick={() => { setDueDate(date.toISOString().split('T')[0]); setDueTime('09:00'); }} className="text-xs px-3 py-1.5 rounded-full border hover:bg-gray-50">
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
                  <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 2000))} rows="6" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 font-mono text-sm" placeholder="Décrivez la tâche en détail (support Markdown)" disabled={!hasProjects} />
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
              <Link href="/tasks" className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
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