import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
  FaFileAlt, 
  FaUpload, 
  FaPlus, 
  FaSave, 
  FaBold, 
  FaItalic, 
  FaListUl, 
  FaListOl, 
  FaLink, 
  FaImage,
  FaCode,
  FaQuoteLeft,
  FaTable,
  FaUndo,
  FaRedo,
  FaTimes
} from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function Create({ projects, users, tasks = [], kanbans = [] }) {
  const { errors = {}, flash = {}, auth } = usePage().props;
  const urlParams = new URLSearchParams(window.location.search);
  const urlTaskId = urlParams.get('task_id');
  const urlProjectId = urlParams.get('project_id');
  
  // État des onglets
  const [activeTab, setActiveTab] = useState('import');
  
  // États du formulaire
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState(urlProjectId || projects[0]?.id || '');
  const [taskId, setTaskId] = useState(urlTaskId || '');
  const [kanbanId, setKanbanId] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);
  
  // Références
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  // Configuration de l'éditeur
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'code-block'
  ];

  useEffect(() => {
    if (urlProjectId) setProjectId(urlProjectId);
    if (urlTaskId) setTaskId(urlTaskId);
  }, [urlProjectId, urlTaskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('project_id', projectId);
    
    if (activeTab === 'import') {
      if (!file) {
        setNotification('Veuillez sélectionner un fichier');
        setNotificationType('error');
        setLoading(false);
        return;
      }
      formData.append('file', file);
    } else {
      // Création d'un fichier texte à partir du contenu de l'éditeur
      const blob = new Blob([content], { type: 'text/plain' });
      const filename = name.endsWith('.txt') ? name : `${name}.txt`;
      formData.append('file', blob, filename);
    }
    
    if (taskId) formData.append('task_id', taskId);
    if (kanbanId) formData.append('kanban_id', kanbanId);
    if (description) formData.append('description', description);
    
    try {
      const response = await fetch('/files', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNotification('Fichier créé avec succès');
        setNotificationType('success');
        setName('');
        setFile(null);
        setContent('');
        setDescription('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        setTimeout(() => router.visit('/files'), 1200);
      } else {
        setNotification(data.message || 'Erreur lors de la création du fichier');
        setNotificationType('error');
      }
    } catch (error) {
      setNotification('Une erreur est survenue lors de la communication avec le serveur');
      setNotificationType('error');
    }
    
    setLoading(false);
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Mettre à jour le nom du fichier si le champ est vide
      if (!name) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setName(fileName);
      }
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      if (!name) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setName(fileName);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-8">
            <Link 
              href="/files" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-800 transition"
              title="Retour aux fichiers"
            >
              <FaFileAlt className="text-xl" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'import' ? 'Importer un fichier' : 'Créer un nouveau fichier'}
            </h1>
          </div>

          {/* Notification */}
          {notification && (
            <div 
              className={`mb-6 p-4 rounded-lg font-medium ${
                notificationType === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
              }`}
            >
              {notification}
            </div>
          )}

          {/* Onglets */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FaUpload className="h-4 w-4" />
                Importer un fichier
              </div>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FaPlus className="h-4 w-4" />
                Créer un fichier
              </div>
            </button>
            </nav>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du fichier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Nom du fichier"
                  required
                />
                {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              {activeTab === 'import' ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fichier à importer <span className="text-red-500">*</span>
                  </label>
                  <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-1 text-center">
                      <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none">
                          <span>Téléverser un fichier</span>
                          <input 
                            ref={fileInputRef}
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">ou glisser-déposer</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file ? file.name : 'Aucun fichier sélectionné'}
                      </p>
                    </div>
                  </div>
                  {errors.file && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.file}</p>}
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contenu du fichier
                  </label>
                  <div className="mt-1 rounded-md shadow-sm">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={modules}
                      formats={formats}
                      className="h-64 bg-white dark:bg-gray-700 rounded-b-md"
                      placeholder="Saisissez le contenu de votre fichier..."
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Projet associé <span className="text-red-500">*</span>
                </label>
                <select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                  disabled={!!urlProjectId}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.project_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.project_id}</p>
                )}
              </div>

              <div>
                <label htmlFor="task" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tâche liée
                </label>
                <select
                  id="task"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner une tâche (optionnel)</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title || `Tâche #${task.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="kanban" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tableau Kanban (optionnel)
                </label>
                <select
                  id="kanban"
                  value={kanbanId}
                  onChange={(e) => setKanbanId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner un tableau (optionnel)</option>
                  {kanbans.map((kanban) => (
                    <option key={kanban.id} value={kanban.id}>
                      {kanban.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ajoutez une description pour ce fichier..."
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2 h-5 w-5" />
                      {activeTab === 'import' ? 'Importer le fichier' : 'Créer le fichier'}
                    </>
                  )}
                </button>
                <Link
                  href="/files"
                  className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaTimes className="mr-2 h-5 w-5" />
                  Annuler
                </Link>
              </div>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}


const CreateWithLayout = (props) => <Create {...props} />;
CreateWithLayout.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default CreateWithLayout;