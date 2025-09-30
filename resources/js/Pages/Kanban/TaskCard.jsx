import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClockIcon, UserCircleIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/outline';

export function TaskCard({ task, isDragging: isDraggingProp }) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging: isSortableDragging 
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const isDragging = isSortableDragging || isDraggingProp;
  
  // Fonction pour obtenir la couleur en fonction de la priorité
  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    const priorityLower = priority.toLowerCase();
    if (['haute', 'high', 'élevée'].includes(priorityLower)) {
      return 'bg-red-100 text-red-800';
    } else if (['moyenne', 'medium'].includes(priorityLower)) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (['basse', 'low'].includes(priorityLower)) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const { t, i18n } = useTranslation();
  
  // Formater la date d'échéance
  const formatDueDate = (dateString) => {
    if (!dateString) return t('kanban.no_date');
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('kanban.no_date');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const taskDate = new Date(date);
      taskDate.setHours(0, 0, 0, 0);
      
      // Vérifier si la date est aujourd'hui ou demain
      if (taskDate.getTime() === today.getTime()) {
        return t('common.today');
      } else if (taskDate.getTime() === tomorrow.getTime()) {
        return t('common.tomorrow');
      }
      
      // Formater la date selon la locale
      return new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'short',
      }).format(date);
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return t('kanban.no_date');
    }
  };

  // Vérifier si la tâche est en retard
  const isOverdue = React.useMemo(() => {
    if (!task.due_date || task.status === 'done') return false;
    
    try {
      const dueDate = new Date(task.due_date);
      const now = new Date();
      return dueDate < now;
    } catch (error) {
      console.error('Erreur de vérification de la date d\'échéance:', error);
      return false;
    }
  }, [task.due_date, task.status]);

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  };

  // Fonction pour obtenir le nom d'utilisateur en fonction du format
  const getUserName = (user) => {
    if (!user) return t('common.unassigned');
    if (typeof user === 'string') return user;
    return user.name || user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || t('common.unknown_user');
  };

  // Fonction pour obtenir l'initiale du nom
  const getUserInitial = (user) => {
    if (!user) return '?';
    const name = getUserName(user);
    return name.charAt(0).toUpperCase();
  };

  // Fonction pour obtenir la couleur de l'avatar en fonction de l'utilisateur
  const getAvatarColor = (user) => {
    if (!user) return 'bg-gray-300';
    const name = getUserName(user);
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-teal-100 text-teal-800',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${
        isOverdue ? 'border-l-4 border-l-red-500' : ''
      }`}
      {...attributes}
    >
      <div 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-4"
      >
        {/* En-tête avec priorité et statut */}
        <div className="flex justify-between items-start mb-3">
          {task.priority && (
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
              title={t('priority.priority')}
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {t(`priority.${task.priority.toLowerCase()}`, { defaultValue: task.priority })}
            </span>
          )}
          
          <div className="flex items-center space-x-2">
            {isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                {t('kanban.overdue')}
              </span>
            )}
            
            {task.due_date && (
              <span 
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'
                }`}
                title={t('task.due_date')}
              >
                <ClockIcon className="h-3 w-3 mr-1" />
                {formatDueDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
        
        {/* Titre de la tâche */}
        <h3 className="text-base font-medium text-gray-900 mb-2 line-clamp-2">
          {task.title || t('task.untitled')}
        </h3>
        
        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 whitespace-pre-wrap">
            {task.description}
          </p>
        )}
        
        {/* Pied de carte avec utilisateur assigné et date d'échéance */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          {/* Utilisateur assigné */}
          <div className="flex items-center">
            {task.assigned_to || task.assigned_user || task.user ? (
              <div className="flex items-center">
                <div 
                  className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarColor(task.assigned_to || task.assigned_user || task.user)}`}
                  title={getUserName(task.assigned_to || task.assigned_user || task.user)}
                >
                  {getUserInitial(task.assigned_to || task.assigned_user || task.user)}
                </div>
                <span className="ml-2 text-xs text-gray-500 truncate">
                  {getUserName(task.assigned_to || task.assigned_user || task.user)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">{t('task.unassigned')}</span>
            )}
          </div>
          
          {/* Date d'échéance */}
          {task.due_date && (
            <div className="flex items-center text-xs text-gray-500">
              <CalendarIcon className={`h-3 w-3 mr-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {formatDueDate(task.due_date)}
              </span>
            </div>
          )}
        </div>
        
        {/* Status indicator bar */}
        {task.status && (
          <div className="h-1 w-full bg-gray-100">
            <div 
              className={`h-full ${
                task.status === 'done' || task.status === 'terminé' 
                  ? 'bg-green-500' 
                  : task.status === 'in_progress' || task.status === 'en_cours' 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              }`}
              style={{ 
                width: task.status === 'done' || task.status === 'terminé' 
                  ? '100%' 
                  : task.status === 'in_progress' || task.status === 'en_cours' 
                  ? '50%' 
                  : '10%' 
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}