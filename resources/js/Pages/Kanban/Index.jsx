import React, { useState, useMemo, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminLayout from '@/Layouts/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const STATUS_COLUMNS = [
  { 
    id: 'todo', 
    title: 'À faire', 
    color: 'bg-blue-50', 
    borderColor: 'border-blue-200', 
    headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    textColor: 'text-blue-600',
    hoverColor: 'hover:bg-blue-100'
  },
  { 
    id: 'in_progress', 
    title: 'En cours', 
    color: 'bg-amber-50', 
    borderColor: 'border-amber-200', 
    headerBg: 'bg-gradient-to-r from-amber-500 to-amber-600',
    textColor: 'text-amber-600',
    hoverColor: 'hover:bg-amber-100'
  },
  { 
    id: 'done', 
    title: 'Terminé', 
    color: 'bg-green-50', 
    borderColor: 'border-green-200', 
    headerBg: 'bg-gradient-to-r from-green-500 to-green-600',
    textColor: 'text-green-600',
    hoverColor: 'hover:bg-green-100'
  },
];

function Kanban({ tasks: initialTasks, auth }) {
  const { props } = usePage();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [activeTask, setActiveTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Vérifier si l'utilisateur peut modifier les tâches (admin ou manager)
  const canModifyTasks = auth?.user?.is_admin || auth?.user?.is_manager;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  // Chargement initial des tâches
  useEffect(() => {
    fetchTasks();
  }, []);

  // Gestion des messages flash
  useEffect(() => {
    if (props.flash?.success) {
      toast.success(props.flash.success);
    }
    if (props.flash?.error) {
      toast.error(props.flash.error);
    }
  }, [props.flash]);

  // Fonction pour charger les tâches depuis l'API
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(route('kanban.api.tasks'));
      // Mettre à jour avec les données de la clé 'data' de la réponse
      setTasks(response.data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err);
      setError('Impossible de charger les tâches. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setIsLoading(false);
    }
  };

  const tasksByStatus = useMemo(() => {
    const grouped = {};
    STATUS_COLUMNS.forEach(column => {
      grouped[column.id] = tasks
        .filter(task => task.status === column.id)
        .sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (event) => {
    // Vérifier les autorisations avant de permettre le glisser-déposer
    if (!canModifyTasks) {
      toast.error("Seuls les administrateurs et les managers peuvent déplacer les tâches");
      event.preventDefault();
      return;
    }
    
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;
    if (isLoading) return;
    
    // Vérifier les autorisations avant de traiter le glisser-déposer
    if (!canModifyTasks) {
      toast.error("Seuls les administrateurs et les managers peuvent modifier les tâches");
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    // Sauvegarder l'état actuel pour rollback en cas d'erreur
    const originalTasks = [...tasks];
    
    try {
      setIsLoading(true);
      
      // Mise à jour locale optimiste
      let newTasks = [...tasks];
      const activeIndex = newTasks.findIndex(t => t.id === activeId);
      const activeTask = newTasks[activeIndex];
      
      if (isOverATask) {
        const overIndex = newTasks.findIndex(t => t.id === overId);
        const overTask = newTasks[overIndex];
        
        // Mettre à jour le statut si nécessaire
        if (activeTask.status !== overTask.status) {
          activeTask.status = overTask.status;
        }
        
        // Déplacer la tâche dans le tableau
        newTasks = arrayMove(newTasks, activeIndex, overIndex);
      } else if (isOverAColumn) {
        // Mettre à jour le statut pour la colonne cible
        activeTask.status = overId;
        
        // Si la colonne est vide, placer la tâche en première position
        const columnTasks = newTasks.filter(t => t.status === overId && t.id !== activeId);
        const newPosition = columnTasks.length > 0 ? Math.min(...columnTasks.map(t => t.position)) - 1 : 0;
        activeTask.position = newPosition;
      }
      
      // Mettre à jour l'état local
      setTasks(newTasks);

      // Préparer les données pour le serveur avec les positions mises à jour
      const updatedTasks = newTasks.map((task, index) => ({
        id: parseInt(task.id), // S'assurer que c'est un entier
        status: task.status,
        position: task.position || 0, // Utiliser la position existante ou 0 par défaut
      }));

      // Journalisation pour le débogage
      console.log('Envoi des données au serveur:', { tasks: updatedTasks });

      try {
        // Envoyer les mises à jour au serveur
        const response = await axios.put(route('kanban.updateOrder'), {
          tasks: updatedTasks
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
          },
          validateStatus: status => status < 500 // Ne pas lancer d'exception pour les erreurs 4xx
        });
        
        if (response.status === 200) {
          toast.success(response.data?.message || 'Tableau mis à jour avec succès');
          // Recharger les tâches depuis le serveur pour s'assurer de la cohérence
          await fetchTasks();
        } else if (response.status === 422) {
          // Afficher les erreurs de validation
          const errorMessages = [];
          if (response.data.errors) {
            Object.values(response.data.errors).forEach(messages => {
              errorMessages.push(...messages);
            });
          }
          throw new Error(`Erreur de validation: ${errorMessages.join(', ') || 'Données invalides'}`);
        } else {
          throw new Error(response.data?.message || `Erreur serveur (${response.status})`);
        }
      } catch (error) {
        console.error('Erreur détaillée:', error);
        if (error.response) {
          // La requête a été faite et le serveur a répondu avec un code d'erreur
          console.error('Données de la réponse:', error.response.data);
          console.error('Statut de la réponse:', error.response.status);
          console.error('En-têtes de la réponse:', error.response.headers);
          
          if (error.response.status === 422 && error.response.data.errors) {
            // Afficher les erreurs de validation
            const errorMessages = [];
            Object.values(error.response.data.errors).forEach(messages => {
              errorMessages.push(...messages);
            });
            throw new Error(`Erreur de validation: ${errorMessages.join(', ')}`);
          }
          
          throw new Error(error.response.data?.message || `Erreur serveur (${error.response.status})`);
        } else if (error.request) {
          // La requête a été faite mais aucune réponse n'a été reçue
          console.error('Aucune réponse reçue:', error.request);
          throw new Error('Aucune réponse du serveur. Vérifiez votre connexion.');
        } else {
          // Une erreur s'est produite lors de la configuration de la requête
          console.error('Erreur de configuration de la requête:', error.message);
          throw new Error(`Erreur de configuration: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tableau:', error);
      // Restaurer l'état précédent en cas d'erreur
      setTasks(originalTasks);
      toast.error(error.message || 'Erreur lors de la mise à jour du tableau');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddTask = (status) => {
    router.visit(route('tasks.create', { status }));
  };

  // Afficher un indicateur de chargement
  if (isLoading && tasks.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  // Afficher un message d'erreur
  if (error && tasks.length === 0) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Erreur de chargement</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchTasks}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
              Réessayer
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau Kanban</h1>
            <p className="mt-1 text-sm text-gray-500">
              Glissez et déposez les tâches pour les organiser
            </p>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={fetchTasks}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => handleAddTask('todo')}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nouvelle tâche
            </button>
          </div>
        </div>

        {isLoading && tasks.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
            <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
            <span>Mise à jour en cours...</span>
          </div>
        )}

        <div className={`w-full mx-auto ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <DndContext 
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STATUS_COLUMNS.map((column) => {
                  const columnTasks = tasks.filter((task) => task.status === column.id);
                  return (
                    <Column
                      key={column.id}
                      id={column.id}
                      title={column.title}
                      tasks={columnTasks}
                      color={column.color}
                      borderColor={column.borderColor}
                      headerBg={column.headerBg}
                      onAddTask={canModifyTasks ? handleAddTask : null}
                      isLoading={isLoading}
                      textColor={column.textColor}
                      hoverColor={column.hoverColor}
                      canModify={canModifyTasks}
                    />
                  );
                })}
                </div>

                <DragOverlay>
                {activeTask ? (
                    <div className="w-64">
                    <TaskCard task={activeTask} isDragging={true} textColor={STATUS_COLUMNS.find(column => column.id === activeTask.status).textColor} hoverColor={STATUS_COLUMNS.find(column => column.id === activeTask.status).hoverColor} />
                    </div>
                ) : null}
                </DragOverlay>
            </DndContext>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AdminLayout>
  );
}

export default Kanban;

const Column = ({ id, title, tasks, color, borderColor, headerBg, onAddTask, isLoading, textColor, hoverColor, canModify = true }) => {
    const { setNodeRef } = useSortable({
        id: id,
        data: {
          type: 'Column',
          column: { id, title }
        }
    });

    return (
      <div ref={setNodeRef} className={`flex-shrink-0 rounded-xl shadow-lg overflow-hidden ${color} border ${borderColor}`}>
        <div className={`p-4 text-white font-semibold flex justify-between items-center ${headerBg}`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold">{title}</span>
            <span className="bg-white bg-opacity-20 px-2.5 py-0.5 rounded-full text-sm font-medium">
              {tasks.length}
            </span>
          </div>
          {onAddTask && (
            <button 
              onClick={() => onAddTask(id)}
              disabled={isLoading || !canModify}
              className="p-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50"
              aria-label={`Ajouter une tâche à ${title}`}
              title={!canModify ? "Action non autorisée" : "Ajouter une tâche"}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="p-3 space-y-3 overflow-y-auto h-[calc(100vh-250px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <SortableContext items={canModify ? tasks.map(t => t.id) : []}>
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                textColor={textColor}
                hoverColor={hoverColor}
                canModify={canModify}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className={`p-5 text-center text-sm ${textColor} border-2 border-dashed ${borderColor} rounded-lg bg-white bg-opacity-50`}>
              Aucune tâche ici.
            </div>
          )}
        </div>
      </div>
    );
};

const TaskCard = ({ task, isDragging, textColor, hoverColor, canModify = true }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging: dndIsDragging } = useSortable({
      id: task.id,
      data: {
        type: 'Task',
        task,
      },
      disabled: !canModify, // Désactive le glisser-déposer si l'utilisateur n'a pas les droits
    });
  
    const style = {
      transition,
      transform: CSS.Transform.toString(transform),
    };
  
    // Format date to be more readable
    const formattedDate = new Date(task.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  
    const priorityColors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
  
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`p-4 rounded-lg shadow-sm border border-gray-200 mb-3 transition-all duration-200 ${canModify ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-80'} ${hoverColor} ${dndIsDragging || isDragging ? 'opacity-50' : ''}`}
        title={!canModify ? "Seuls les administrateurs et les managers peuvent déplacer les tâches" : "Déplacer la tâche"}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-black text-base mb-1 w-full">
            {task.title || task.name || 'Sans titre'}
          </h3>
          {task.priority && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2 ${
              priorityColors[task.priority] || 'bg-gray-100 text-gray-800'
            }`}>
              {task.priority === 'high' ? 'Élevée' : 
               task.priority === 'medium' ? 'Moyenne' : 'Basse'}
            </span>
          )}
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-600 mt-1 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
          <span className="flex items-center">
            <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formattedDate}
          </span>
          
          {(task.assigned_user || task.user) ? (
            <div className="flex items-center">
              <span className="mr-2 text-gray-700 text-sm">
                {((task.assigned_user || task.user || {}).name || '').split(' ')[0]}
              </span>
              {((task.assigned_user || task.user || {}).photo_url || (task.assigned_user || task.user || {}).profile_photo_url) ? (
                <img 
                  src={(task.assigned_user || task.user).photo_url || (task.assigned_user || task.user).profile_photo_url} 
                  alt="User" 
                  className="w-6 h-6 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    // If image fails to load, show the initial instead
                    e.target.style.display = 'none';
                    const initialDiv = e.target.nextElementSibling;
                    if (initialDiv) initialDiv.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 border border-gray-200">
                  {((task.assigned_user || task.user || {}).name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
};
