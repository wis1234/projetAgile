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
  FaUserPlus
} from 'react-icons/fa';
import AdminLayout from '../../Layouts/AdminLayout';

function Create({ projects = [], sprints = [], users = [] }) {
  const { errors = {}, flash = {} } = usePage().props;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('12:00'); // Heure par défaut à midi
  const [priority, setPriority] = useState('medium');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [sprintId, setSprintId] = useState(sprints[0]?.id || '');
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
  
  // Formater la date et l'heure pour l'affichage
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

  // Mettre à jour la date complète quand la date ou l'heure change
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

  // Trouver les membres du projet sélectionné
  const selectedProject = projects.find(p => p.id == projectId);
  const projectUsers = selectedProject?.users || [];

  // Mettre à jour assignedTo quand le projet change
  const handleProjectChange = (e) => {
    setProjectId(e.target.value);
    const proj = projects.find(p => p.id == e.target.value);
    setAssignedTo(proj?.users[0]?.id || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Formater la date et l'heure au format attendu par le backend (Y-m-d H:i:s)
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
        setTitle(''); setDescription(''); setDueDate(''); setAssignedTo(''); setProjectId(projects[0]?.id || ''); setSprintId(sprints[0]?.id || ''); setStatus('todo'); setPriority('medium'); setIsPaid(false); setPaymentReason(''); setAmount('');
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

        {/* Modal d'aide */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Conseils pour créer une tâche efficace</h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
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
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          <FaUserCheck className="inline mr-2" />
                          Attribution claire
                        </h4>
                        <p>Assurez-vous d'attribuer la tâche à un membre de l'équipe et de sélectionner le bon projet et sprint.</p>
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          <FaCalendarAlt className="inline mr-2" />
                          Dates réalistes
                        </h4>
                        <p>Définissez une échéance réaliste en fonction de la complexité de la tâche.</p>
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          <FaClipboardList className="inline mr-2" />
                          Description détaillée
                        </h4>
                        <p>Décrivez clairement ce qui doit être fait, les étapes à suivre et le résultat attendu.</p>
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          <FaBell className="inline mr-2" />
                          Notifications
                        </h4>
                        <p>La personne assignée et les membres du projet seront automatiquement notifiés.</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500">
                      <p className="text-sm">
                        <strong>Astuce :</strong> Utilisez le formatage Markdown pour structurer votre description et ajouter des liens ou des listes.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                  >
                    Compris
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          {notification && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
          )}
          {!hasProjects && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-100 text-yellow-800 font-semibold text-center">
              Vous n'êtes manager d'aucun projet. Veuillez demander à un administrateur de vous rattacher à un projet pour pouvoir créer une tâche.
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Titre de la tâche</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Requis</span>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  id="title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" 
                  required 
                  disabled={!hasProjects} 
                />
                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                  <FaInfoCircle className="inline-block" title="Donnez un titre clair et concis qui décrit l'objectif principal de la tâche" />
                </div>
              </div>
              {errors.title && <div className="text-red-600 text-sm mt-2 font-medium">{errors.title}</div>}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="project" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Projet</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Requis</span>
              </div>
              <div className="relative">
                <select 
                  id="project" 
                  value={projectId} 
                  onChange={handleProjectChange} 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" 
                  required 
                  disabled={!hasProjects} 
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                  <FaInfoCircle className="inline-block" title="Sélectionnez le projet auquel appartient cette tâche" />
                </div>
              </div>
              {errors.project_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.project_id}</div>}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="sprint" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Sprint</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Requis</span>
              </div>
              <div className="relative">
                <select 
                  id="sprint" 
                  value={sprintId} 
                  onChange={e => setSprintId(e.target.value)} 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" 
                  required 
                  disabled={!hasProjects}
                >
                  {sprints.filter(s => s.project_id == projectId).map(sprint => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name} ({new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                  <FaInfoCircle className="inline-block" title="Sélectionnez le sprint auquel cette tâche est associée" />
                </div>
              </div>
              {errors.sprint_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.sprint_id}</div>}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="assigned_to" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Assigné à</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Requis</span>
              </div>
              <div className="relative">
                <select 
                  id="assigned_to" 
                  value={assignedTo} 
                  onChange={e => setAssignedTo(e.target.value)} 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" 
                  required 
                  disabled={projectUsers.length === 0 || !hasProjects}
                >
                  <option value="">Sélectionnez un membre</option>
                  {projectUsers.length === 0 && (
                    <option value="" disabled>Aucun membre disponible dans ce projet</option>
                  )}
                  {projectUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.roles?.[0]?.name || 'Membre'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                  <FaUserPlus className="inline-block" title="Sélectionnez la personne responsable de cette tâche" />
                </div>
              </div>
              {projectUsers.length === 0 && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  Aucun membre disponible dans ce projet. Veuillez d'abord ajouter des membres au projet.
                </p>
              )}
              {errors.assigned_to && <div className="text-red-600 text-sm mt-2 font-medium">{errors.assigned_to}</div>}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Statut</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Par défaut: À faire</span>
              </div>
              <div className="relative">
                <select 
                  id="status" 
                  value={status} 
                  onChange={e => setStatus(e.target.value)} 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 appearance-none" 
                  disabled={!hasProjects}
                >
                  <option value="todo" className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                    À faire
                  </option>
                  <option value="in_progress" className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                    En cours
                  </option>
                  <option value="done" className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                    Terminé
                  </option>
                </select>
                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {errors.status && <div className="text-red-600 text-sm mt-2 font-medium">{errors.status}</div>}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Priorité</label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Niveau d'importance</span>
                  <div className="flex space-x-1">
                    {['low', 'medium', 'high'].map((level) => (
                      <div 
                        key={level}
                        className={`w-3 h-3 rounded-full ${
                          level === 'low' ? 'bg-green-400' : 
                          level === 'medium' ? 'bg-yellow-400' : 'bg-red-500'
                        } ${priority === level ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-50'}`}
                        title={level === 'low' ? 'Faible' : level === 'medium' ? 'Moyenne' : 'Élevée'}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <select 
                  id="priority" 
                  value={priority} 
                  onChange={e => setPriority(e.target.value)} 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 appearance-none"
                  disabled={!hasProjects}
                >
                  <option value="low" className="flex items-center">
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                      Faible - Peut attendre
                    </span>
                  </option>
                  <option value="medium" className="flex items-center">
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                      Moyenne - À faire bientôt
                    </span>
                  </option>
                  <option value="high" className="flex items-center">
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                      Élevée - Urgente
                    </span>
                  </option>
                </select>
                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {errors.priority && <div className="text-red-600 text-sm mt-2 font-medium">{errors.priority}</div>}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="due_date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date d'échéance</label>
                <div className="flex items-center space-x-2">
                  {dueDate && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                      {new Date(dueDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input 
                      type="date" 
                      id="due_date" 
                      value={dueDate ? formatDateTime(dueDate).date : ''} 
                      min={formatDateTime(new Date().toISOString()).date}
                      onChange={e => setDueDate(e.target.value)} 
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" 
                      disabled={!hasProjects} 
                    />
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="time"
                      id="due_time"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                      disabled={!hasProjects}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 7, 14].map(days => {
                    const date = new Date();
                    date.setDate(date.getDate() + days);
                    const formattedDate = formatDateTime(date.toISOString());
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setDueDate(date.toISOString().split('T')[0]);
                          setDueTime('09:00'); // Heure par défaut pour les boutons rapides
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        {days === 1 ? 'Demain' : `+${days} jours`}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {errors.due_date && <div className="text-red-600 text-sm mt-2 font-medium">{errors.due_date}</div>}
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {description.length}/2000 caractères
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showPreview ? 'Éditer' : 'Aperçu'}
                  </button>
                </div>
              </div>
              
              {!showPreview ? (
                <>
                  <textarea 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value.slice(0, 2000))} 
                    rows="6" 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 resize-y font-mono text-sm" 
                    placeholder="Décrivez la tâche en détail (support Markdown)" 
                    disabled={!hasProjects} 
                  />
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        const textarea = document.getElementById('description');
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = description.substring(start, end);
                        const beforeText = description.substring(0, start);
                        const afterText = description.substring(end);
                        setDescription(`${beforeText}**${selectedText || 'texte en gras'}**${afterText}`);
                        setTimeout(() => textarea.setSelectionRange(start + 2, start + 6 + selectedText.length), 0);
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                      title="Gras"
                    >
                      <strong>B</strong>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('description');
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = description.substring(start, end);
                        const beforeText = description.substring(0, start);
                        const afterText = description.substring(end);
                        setDescription(`${beforeText}*${selectedText || 'texte en italique'}*${afterText}`);
                        setTimeout(() => textarea.setSelectionRange(start + 1, start + 1 + selectedText.length), 0);
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                      title="Italique"
                    >
                      <em>I</em>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('description');
                        const start = textarea.selectionStart;
                        const beforeText = description.substring(0, start);
                        const afterText = description.substring(start);
                        setDescription(`${beforeText}\n- Élément de liste\n- Autre élément${afterText}`);
                        setTimeout(() => textarea.setSelectionRange(start + 2, start + 17), 0);
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                      title="Liste à puces"
                    >
                      • Liste
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('description');
                        const start = textarea.selectionStart;
                        const selectedText = description.substring(start, textarea.selectionEnd);
                        const beforeText = description.substring(0, start);
                        const afterText = description.substring(textarea.selectionEnd);
                        setDescription(`${beforeText}\n\`\`\`\n${selectedText || '// Votre code ici'}\n\`\`\`\n${afterText}`);
                        setTimeout(() => textarea.setSelectionRange(start + 5, start + 5 + (selectedText.length || 17)), 0);
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                      title="Bloc de code"
                    >
                      {`</>`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="prose dark:prose-invert max-w-none p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 min-h-[150px]">
                  {description ? (
                    <ReactMarkdown>{description}</ReactMarkdown>
                  ) : (
                    <p className="text-gray-400 italic">Aperçu de la description</p>
                  )}
                </div>
              )}
              
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Utilisez la syntaxe <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Markdown</a> pour formater votre texte
              </p>
              
              {errors.description && <div className="text-red-600 text-sm mt-2 font-medium">{errors.description}</div>}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input
                  id="is_paid"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={isPaid}
                  onChange={(e) => {
                    setIsPaid(e.target.checked);
                    if (!e.target.checked) {
                      setAmount('');
                    } else {
                      setPaymentReason('');
                    }
                  }}
                />
                <label htmlFor="is_paid" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Cette tâche est rémunérée
                </label>
              </div>

              {isPaid ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Montant (FCFA)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">FCFA</span>
                      </div>
                      <input
                        type="number"
                        id="amount"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-16 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {errors.amount && <div className="text-red-600 text-sm mt-2 font-medium">{errors.amount}</div>}
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="payment_reason" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Raison de la non-rémunération</label>
                  <select
                    id="payment_reason"
                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={paymentReason}
                    onChange={(e) => setPaymentReason(e.target.value)}
                  >
                    <option value="">Sélectionner une raison</option>
                    <option value="volunteer">Bénévolat</option>
                    <option value="academic">Projet académique</option>
                    <option value="other">Autre raison</option>
                  </select>
                  {errors.payment_reason && <div className="text-red-600 text-sm mt-2 font-medium">{errors.payment_reason}</div>}
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-start">
                    <FaInfoCircle className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" />
                    Cette information nous aide à mieux comprendre la nature de la tâche.
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button type="submit" className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || !isFormValid || projectUsers.length === 0 || !hasProjects}>
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Création...</>) : (<><FaTasks /> Créer la tâche</>)}
              </button>
              <Link href="/tasks" className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 hover:shadow-sm">
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