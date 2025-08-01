import React from 'react';
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
    switch (priority?.toLowerCase()) {
      case 'haute':
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'moyenne':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'basse':
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Formater la date d'échéance
  const formatDueDate = (dateString) => {
    if (!dateString) return 'Pas de date';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Vérifier si la date est aujourd'hui ou demain
    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    }
    
    // Sinon, retourner la date formatée
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Vérifier si la tâche est en retard
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
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
        className="p-4 cursor-grab active:cursor-grabbing"
        {...listeners}
      >
        {/* En-tête avec priorité et statut */}
        <div className="flex justify-between items-start mb-2">
          {task.priority && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              <TagIcon className="h-3 w-3 mr-1" />
              {task.priority}
            </span>
          )}
          
          {isOverdue && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              En retard
            </span>
          )}
        </div>
        
        {/* Titre de la tâche */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {task.title}
        </h3>
        
        {/* Description de la tâche (optionnelle) */}
        {task.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        {/* Métadonnées de la tâche */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          {/* Date d'échéance */}
          <div className="flex items-center">
            <CalendarIcon className={`h-4 w-4 mr-1 ${isOverdue ? 'text-red-500' : ''}`} />
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatDueDate(task.due_date)}
            </span>
          </div>
          
          {/* Assigné à */}
          <div className="flex items-center">
            {task.assigned_user ? (
              <div className="flex items-center">
                <UserCircleIcon className="h-4 w-4 mr-1 text-gray-400" />
                <span className="truncate max-w-[100px]">
                  {task.assigned_user.name?.split(' ')[0] || 'Non assigné'}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-gray-400">
                <UserCircleIcon className="h-4 w-4 mr-1" />
                <span>Non assigné</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Barre de progression ou indicateur de statut */}
      {task.status && (
        <div className="h-1 w-full bg-gray-100">
          <div 
            className={`h-full ${
              task.status === 'done' 
                ? 'bg-green-500' 
                : task.status === 'in_progress' 
                ? 'bg-blue-500' 
                : 'bg-gray-300'
            }`}
            style={{ width: task.status === 'done' ? '100%' : task.status === 'in_progress' ? '50%' : '10%' }}
          />
        </div>
      )}
    </div>
  );
}