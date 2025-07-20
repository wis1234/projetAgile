import React from 'react';
import { Link, router } from '@inertiajs/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminLayout from '@/Layouts/AdminLayout';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'À faire', color: 'bg-gray-100' },
  { key: 'in_progress', label: 'En cours', color: 'bg-blue-100' },
  { key: 'done', label: 'Terminé', color: 'bg-green-100' },
];

function Kanban({ tasks }) {
  // Convert tasks object to array for DnD
  const [columns, setColumns] = React.useState(() => {
    const cols = {};
    STATUS_COLUMNS.forEach(col => {
      cols[col.key] = tasks[col.key] ? [...tasks[col.key]] : [];
    });
    return cols;
  });

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const [moved] = sourceCol.splice(source.index, 1);
    moved.status = destination.droppableId;
    destCol.splice(destination.index, 0, moved);
    setColumns({ ...columns, [source.droppableId]: sourceCol, [destination.droppableId]: destCol });
    // Appel backend pour MAJ statut
    router.put(`/tasks/${draggableId}`, { status: destination.droppableId }, { preserveState: true });
  };

  return (
    <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
      <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-7 h-7 text-blue-600 dark:text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /></svg>
              </span>
              <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Kanban des tâches</h1>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/tasks/create" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold shadow whitespace-nowrap">
                <span className="text-xl">+</span> Nouvelle tâche
              </Link>
              <Link href="/tasks" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-blue-700 dark:text-blue-200 px-4 py-2 rounded font-semibold shadow whitespace-nowrap">
                Retour à la liste
              </Link>
            </div>
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {STATUS_COLUMNS.map(col => (
                <Droppable droppableId={col.key} key={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-lg p-4 shadow-sm ${col.color} min-h-[300px] transition-all ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <h2 className="text-xl font-semibold mb-4 text-center text-blue-700 dark:text-blue-200">{col.label}</h2>
                      <div className="space-y-3">
                        {columns[col.key].length === 0 && <div className="text-gray-400 text-center">Aucune tâche</div>}
                        {columns[col.key].map((task, idx) => (
                          <Draggable draggableId={String(task.id)} index={idx} key={task.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 border flex flex-col gap-1 transition-all ${snapshot.isDragging ? 'ring-2 ring-blue-400' : ''}`}
                              >
                                <div className="font-medium text-lg text-blue-700 dark:text-blue-200">{task.title}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-300">{task.description}</div>
                                <div className="flex justify-between text-xs mt-2">
                                  <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{task.priority || '—'}</span>
                                  <span className="text-gray-500 dark:text-gray-300">{task.due_date ? `Échéance : ${task.due_date}` : ''}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      </main>
    </div>
  );
}

Kanban.layout = page => <AdminLayout children={page} />;
export default Kanban; 