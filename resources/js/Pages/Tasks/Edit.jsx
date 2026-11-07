import React, { useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaTasks, FaArrowLeft, FaUserCircle, FaDollarSign, FaInfoCircle, FaUsers, FaUser } from 'react-icons/fa';

function Edit({ task, projects = [], sprints = [], users = [] }) {
  const { errors = {}, flash = {} } = usePage().props;
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [taskType, setTaskType] = useState(task.type || 'individual');
  const initialGroupUserIds = task.assigned_users && task.assigned_users.length > 0
    ? task.assigned_users.map(u => u.id)
    : (task.assigned_to ? [task.assigned_to] : []);
  const [assignedUserIds, setAssignedUserIds] = useState(initialGroupUserIds);
  const [status, setStatus] = useState(task.status || 'todo');

  // Convertit la date reçue du serveur en date (YYYY-MM-DD) et heure (HH:mm) LOCALES
  // (new Date + getHours/getDate = heure locale du navigateur, jamais l'UTC)
  const formatDateTime = (dateString) => {
    if (!dateString) return { date: '', time: '12:00' };
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return { date: '', time: '12:00' };

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
      };
    } catch (e) {
      return { date: '', time: '12:00' };
    }
  };

  const initialDateTime = formatDateTime(task.due_date);
  const [dueDate, setDueDate] = useState(initialDateTime.date); // YYYY-MM-DD (heure locale)
  const [dueTime, setDueTime] = useState(initialDateTime.time); // HH:mm (heure locale)
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [projectId, setProjectId] = useState(task.project_id || projects[0]?.id || '');
  const [sprintId, setSprintId] = useState(task.sprint_id || sprints[0]?.id || '');
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || users[0]?.id || '');
  const [isPaid, setIsPaid] = useState(task.is_paid || false);
  const [amount, setAmount] = useState(task.amount || '');
  const [paymentStatus, setPaymentStatus] = useState(task.payment_status || 'unpaid');
  const [paymentReason, setPaymentReason] = useState(task.payment_reason || '');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  // Trouver les membres du projet sélectionné
  const selectedProject = projects.find(p => p.id == projectId);
  const projectUsers = selectedProject?.users || [];

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

  // Mettre à jour assignedTo quand le projet change
  const handleProjectChange = (e) => {
    setProjectId(e.target.value);
    const proj = projects.find(p => p.id == e.target.value);
    setAssignedTo(proj?.users[0]?.id || '');
    setAssignedUserIds([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Heure locale telle que saisie, sans aucune conversion de fuseau (format Y-m-d H:i:s)
    const formattedDueDate = dueDate ? `${dueDate} ${dueTime || '12:00'}:00` : null;

    router.put(`/tasks/${task.id}`, {
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
      amount,
      payment_status: paymentStatus,
      payment_reason: paymentReason,
    }, {
      onSuccess: () => {
        setNotification('Tâche mise à jour avec succès');
        setNotificationType('success');
        setLoading(false);
        setTimeout(() => router.visit('/tasks'), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la mise à jour');
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
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Éditer la tâche</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          {notification && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Titre <span className="text-red-500">*</span></label>
              <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" required />
              {errors.title && <div className="text-red-600 text-sm mt-2 font-medium">{errors.title}</div>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 resize-y" placeholder="Décrivez brièvement la tâche (optionnel)" />
              {errors.description && <div className="text-red-600 text-sm mt-2 font-medium">{errors.description}</div>}
            </div>

            <div>
              <label htmlFor="project" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Projet <span className="text-red-500">*</span></label>
              <select id="project" value={projectId} onChange={handleProjectChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" required>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              {errors.project_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.project_id}</div>}
            </div>

            <div>
              <label htmlFor="sprint" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sprint <span className="text-red-500">*</span></label>
              <select id="sprint" value={sprintId} onChange={e => setSprintId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" required>
                {sprints.map(sprint => (
                  <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                ))}
              </select>
              {errors.sprint_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.sprint_id}</div>}
            </div>

            {/* Type de tâche (Individuel ou Groupe) */}
            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
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
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigné à <span className="text-red-500">*</span></label>
                <select id="assigned_to" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" required disabled={projectUsers.length === 0}>
                  <option value="">Sélectionnez un membre</option>
                  {projectUsers.length === 0 && <option value="">Aucun membre disponible</option>}
                  {projectUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                {errors.assigned_to && <div className="text-red-600 text-sm mt-2 font-medium">{errors.assigned_to}</div>}
              </div>
            ) : (
              <div className="md:col-span-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
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
                  <p className="text-xs text-red-500">Aucun membre disponible dans ce projet.</p>
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
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate block">{u.email || 'Membre'}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5">
                  <FaInfoCircle className="text-blue-500 text-sm mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Règle de synchronisation :</strong> Cette tâche de groupe est commune à tous les membres cochés. Toute modification (changement de statut, etc.) faite par un membre s'applique immédiatement à tout le monde.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Statut</label>
              <select id="status" value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
              {errors.status && <div className="text-red-600 text-sm mt-2 font-medium">{errors.status}</div>}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priorité</label>
              <select id="priority" value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
              {errors.priority && <div className="text-red-600 text-sm mt-2 font-medium">{errors.priority}</div>}
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date d'échéance</label>
              <div className="flex space-x-2">
                <input 
                  type="date" 
                  id="due_date" 
                  value={dueDate || ''}
                  onChange={e => setDueDate(e.target.value)} 
                  className="w-1/2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" 
                />
                <input 
                  type="time" 
                  id="due_time" 
                  value={dueTime || '12:00'}
                  onChange={e => setDueTime(e.target.value)}
                  className="w-1/2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" 
                />
              </div>
              {errors.due_date && <div className="text-red-600 text-sm mt-2 font-medium">{errors.due_date}</div>}
            </div>

            <div>
              <label htmlFor="is_paid" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cette tâche est rémunérée</label>
              <input type="checkbox" id="is_paid" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
            </div>

            {isPaid && (
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Montant (FCFA)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">FCFA</span>
                  </div>
                  <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-16 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                </div>
                {errors.amount && <div className="text-red-600 text-sm mt-2 font-medium">{errors.amount}</div>}
              </div>
            )}

            {isPaid && (
              <div>
                <label htmlFor="payment_status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Statut du paiement</label>
                <select id="payment_status" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                  <option value="unpaid">Non payé</option>
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="failed">Échoué</option>
                </select>
                {errors.payment_status && <div className="text-red-600 text-sm mt-2 font-medium">{errors.payment_status}</div>}
              </div>
            )}

            {!isPaid && (
              <div>
                <label htmlFor="payment_reason" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Raison de la non-rémunération</label>
                <select id="payment_reason" value={paymentReason} onChange={e => setPaymentReason(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                  <option value="">Sélectionner une raison</option>
                  <option value="volunteer">Bénévolat</option>
                  <option value="academic">Projet académique</option>
                  <option value="other">Autre raison</option>
                </select>
                {errors.payment_reason && <div className="text-red-600 text-sm mt-2 font-medium">{errors.payment_reason}</div>}
                <p className="mt-2 text-sm text-gray-500 flex items-start">
                  <FaInfoCircle className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" />
                  Cette information nous aide à mieux comprendre la nature de la tâche.
                </p>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button type="submit" className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Mise à jour...</>) : (<><FaTasks /> Mettre à jour</>)}
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

Edit.layout = page => <AdminLayout children={page} />;
export default Edit;