import React, { useState, useMemo, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import AdminLayout from '@/Layouts/AdminLayout';
import Notification from '@/Components/Notification'; // Importation du composant Notification

const STATUS_COLUMNS = [
  { id: 'todo', title: 'À faire' },
  { id: 'in_progress', title: 'En cours' },
  { id: 'done', title: 'Terminé' },
];

function Kanban({ tasks: initialTasks }) {
  const { props } = usePage();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (props.success) {
      setNotification({ type: 'success', message: props.success });
    }
    if (props.error) {
      setNotification({ type: 'error', message: props.error });
    }
  }, [props.success, props.error]);

  const columns = useMemo(() => STATUS_COLUMNS, []);
  const tasksByStatus = useMemo(() => {
    const groupedTasks = {};
    columns.forEach(col => (groupedTasks[col.id] = []));
    tasks.forEach(task => {
      if (groupedTasks[task.status]) {
        groupedTasks[task.status].push(task);
      }
    });
    return groupedTasks;
  }, [tasks, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 3px
      },
    })
  );

  function onDragStart(event) {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  }

  function onDragEnd(event) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    if (!isActiveATask) return;

    const activeTask = tasks.find(t => t.id === activeId);
    const overTask = tasks.find(t => t.id === overId);

    let newStatus = activeTask.status;
    let newPosition = activeTask.position;

    if (over.data.current?.type === 'Column') {
      newStatus = overId;
      const tasksInNewColumn = tasksByStatus[newStatus];
      newPosition = tasksInNewColumn.length;
    } else {
      newStatus = overTask.status;
      newPosition = overTask.position;
    }

    const newTasks = tasks.map(t => {
      if (t.id === activeId) {
        return { ...t, status: newStatus, position: newPosition };
      }
      return t;
    });

    setTasks(newTasks);

    router.put(
      route('kanban.updateOrder'),
      {
        tasks: newTasks.map(({ id, status, position }) => ({ id, status, position }))
      },
      {
        preserveState: true,
        onError: () => {
          setTasks(initialTasks);
          setNotification({ type: 'error', message: "Erreur lors de la mise à jour de l'ordre des tâches." });
        },
      }
    );
  }

  return (
    <AdminLayout>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="p-6 bg-white">
        <h1 className="text-2xl font-bold mb-4">Kanban</h1>
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto">
            <SortableContext items={columns.map(c => c.id)}>
              {columns.map(col => (
                <Column
                  key={col.id}
                  column={col}
                  tasks={tasksByStatus[col.id] || []}
                />
              ))}
            </SortableContext>
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </div>
    </AdminLayout>
  );
}

export default Kanban;