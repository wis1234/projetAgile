import React, { useState, useMemo, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminLayout from '@/Layouts/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusIcon } from '@heroicons/react/24/outline';

const STATUS_COLUMNS = [
  { id: 'todo', title: 'À faire', color: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'from-blue-500 to-blue-600' },
  { id: 'in_progress', title: 'En cours', color: 'bg-yellow-50', borderColor: 'border-yellow-200', headerBg: 'from-yellow-500 to-yellow-600' },
  { id: 'done', title: 'Terminé', color: 'bg-green-50', borderColor: 'border-green-200', headerBg: 'from-green-500 to-green-600' },
];

function Kanban({ tasks: initialTasks }) {
  const { props } = usePage();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  useEffect(() => {
    if (props.flash?.success) {
      toast.success(props.flash.success);
    }
    if (props.flash?.error) {
      toast.error(props.flash.error);
    }
  }, [props.flash]);

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
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    // Dropping a task over another task
    if (isActiveATask && isOverATask) {
      setTasks(currentTasks => {
        const activeIndex = currentTasks.findIndex(t => t.id === activeId);
        const overIndex = currentTasks.findIndex(t => t.id === overId);
        const activeTask = currentTasks[activeIndex];
        const overTask = currentTasks[overIndex];

        if (activeTask.status !== overTask.status) {
          currentTasks[activeIndex].status = overTask.status;
          currentTasks[activeIndex].position = overTask.position;
          return arrayMove(currentTasks, activeIndex, overIndex);
        }
        
        return arrayMove(currentTasks, activeIndex, overIndex);
      });
    }

    // Dropping a task over a column
    if (isActiveATask && isOverAColumn) {
        setTasks(currentTasks => {
            const activeIndex = currentTasks.findIndex(t => t.id === activeId);
            currentTasks[activeIndex].status = overId;
            return arrayMove(currentTasks, activeIndex, activeIndex);
        });
    }

    // After local state update, send to server
    const updatedTasks = tasks.map((task, index) => ({
        id: task.id,
        status: task.status,
        position: index,
    }));

    router.put(route('kanban.updateOrder'), { tasks: updatedTasks }, {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => toast.success('Tableau mis à jour!'),
        onError: () => toast.error('Erreur de mise à jour.'),
    });
  };
  
  const handleAddTask = (status) => {
    router.visit(route('tasks.create', { status }));
  };

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau Kanban</h1>
            <p className="mt-1 text-sm text-gray-500">
              Glissez et déposez les tâches pour les organiser
            </p>
          </div>
          <button
            onClick={() => handleAddTask('todo')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </button>
        </div>

        <div className="w-full mx-auto">
            <DndContext 
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STATUS_COLUMNS.map((column) => (
                    <Column
                        key={column.id}
                        id={column.id}
                        title={column.title}
                        tasks={tasksByStatus[column.id] || []}
                        color={column.color}
                        borderColor={column.borderColor}
                        headerBg={column.headerBg}
                        onAddTask={handleAddTask}
                    />
                ))}
                </div>

                <DragOverlay>
                {activeTask ? (
                    <div className="w-full">
                    <TaskCard task={activeTask} isDragging={true} />
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

const Column = ({ id, title, tasks, color, borderColor, headerBg, onAddTask }) => {
    const { setNodeRef } = useSortable({
        id: id,
        data: {
          type: 'Column',
          column: { id, title }
        }
    });

    return (
      <div ref={setNodeRef} className={`flex-shrink-0 rounded-lg shadow-md ${color}`}>
        <div className={`p-3 rounded-t-lg text-white font-semibold flex justify-between items-center ${headerBg}`}>
          <span>{title}</span>
          <button onClick={() => onAddTask(id)} className="text-white hover:text-gray-200">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3 space-y-3 overflow-y-auto h-[calc(100vh-250px)]">
          <SortableContext items={tasks.map(t => t.id)}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className={`p-4 text-center text-sm text-gray-500 border-2 border-dashed ${borderColor} rounded-lg`}>
              Aucune tâche ici.
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const TaskCard = ({ task, isDragging }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging: dndIsDragging } = useSortable({
      id: task.id,
      data: {
        type: 'Task',
        task,
      },
    });
  
    const style = {
      transition,
      transform: CSS.Transform.toString(transform),
    };
  
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${isDragging || dndIsDragging ? 'opacity-50' : ''}`}
      >
        <p className="font-semibold text-gray-800">{task.name}</p>
        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {new Date(task.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };
