import React, { useState, useEffect, useRef } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { motion } from 'framer-motion';
import { 
  FaFileAlt, 
  FaUpload, 
  FaPlus, 
  FaSave, 
  FaTimes,
  FaInfoCircle,
  FaFileWord,
  FaFilePdf,
  FaFileExcel,
  FaFileImage,
  FaFileCode
} from 'react-icons/fa';

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
  const [selectedTask, setSelectedTask] = useState(null);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);
  
  // Références
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Gestion de la taille automatique du textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 800)}px`;
    }
  }, [content]);

  // Effet pour charger les détails de la tâche sélectionnée
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!taskId) {
        setSelectedTask(null);
        return;
      }
      
      try {
        const response = await fetch(`/api/tasks/${taskId}/details`);
        if (!response.ok) throw new Error('Impossible de charger les détails de la tâche');
        
        const data = await response.json();
        if (data.success && data.task) {
          setSelectedTask(data.task);
          // Mettre à jour le champ Kanban avec le sprint de la tâche si disponible
          if (data.task.sprint_id) {
            setKanbanId(data.task.sprint_id);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la tâche:', error);
        setNotification('Erreur lors du chargement des détails de la tâche', 'error');
      }
    };
    
    fetchTaskDetails();
  }, [taskId]);
  
  // Effet pour gérer les paramètres d'URL
  useEffect(() => {
    if (urlProjectId) setProjectId(urlProjectId);
    if (urlTaskId) setTaskId(urlTaskId);
  }, [urlProjectId, urlTaskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!projectId) {
      setNotification('Veuillez sélectionner un projet');
      setNotificationType('error');
      setLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('project_id', projectId);
      
      if (file) {
        // Si un fichier est téléchargé, l'envoyer directement
        formData.append('file', file);
      } else if (content) {
        // Pour le contenu texte, créer un Blob avec le contenu
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const filename = name.endsWith('.txt') ? name : `${name}.txt`;
        formData.append('file', blob, filename);
      } else {
        throw new Error('Aucun contenu fourni');
      }
      
      // Ajouter les champs optionnels
      if (taskId) formData.append('task_id', taskId);
      if (kanbanId) formData.append('kanban_id', kanbanId);
      if (description) formData.append('description', description);
      
      // Envoyer la requête avec gestion du timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Timeout après 60 secondes
      
      const response = await fetch('/files', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: formData,
      });
      
      clearTimeout(timeoutId);
      
      // Lire la réponse une seule fois
      const responseText = await response.text();
      
      // Essayer de parser la réponse en JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Si le parsing échoue, vérifier si c'est du HTML
        if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.includes('<html')) {
          throw new Error('Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez la console pour plus de détails.');
        }
        throw new Error('Réponse du serveur invalide');
      }
      
      // Vérifier si la requête a échoué
      if (!response.ok) {
        throw new Error(responseData.message || `Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Vérifier si la création a réussi
      if (!responseData.success) {
        throw new Error(responseData.message || 'Échec de la création du fichier');
      }
      
      const fileId = responseData.data?.id;
      
      // Réinitialiser le formulaire après un succès
      setNotification('Fichier créé avec succès. Redirection...', 'success');
      setNotificationType('success');
      setName('');
      setFile(null);
      setContent('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Afficher le loader de l'application
      const loader = document.createElement('div');
      loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      loader.innerHTML = `
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        <p class="mt-4 text-white">Redirection en cours...</p>
      `;
      document.body.appendChild(loader);
      
      try {
        // Déterminer la cible de redirection (par ordre de priorité)
        let redirectUrl = '/files'; // Par défaut, rediriger vers la liste des fichiers
        
        if (taskId) {
          // Si le fichier est lié à une tâche, rediriger vers la tâche
          redirectUrl = `/tasks/${taskId}`;
        } else if (fileId) {
          // Sinon, rediriger vers la page de détail du fichier
          redirectUrl = `/files/${fileId}`;
        }
        
        // Effectuer la redirection avec un délai pour permettre à l'utilisateur de voir le message de succès
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Utiliser window.location pour une redirection plus fiable
        window.location.href = redirectUrl;
        
      } catch (redirectError) {
        console.error('Erreur lors de la redirection:', redirectError);
        // En cas d'échec de redirection, recharger la page actuelle
        window.location.href = '/files';
      } finally {
        // Nettoyer le loader
        if (document.body.contains(loader)) {
          document.body.removeChild(loader);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la création du fichier:', error);
      let errorMessage = 'Une erreur est survenue lors de la communication avec le serveur';
      
      if (error.name === 'AbortError') {
        errorMessage = 'La requête a expiré. Veuillez réessayer avec un fichier plus petit ou vérifier votre connexion.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNotification(errorMessage);
      setNotificationType('error');
    } finally {
      setLoading(false);
    }
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
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
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
                    Créer un fichier texte
                  </div>
                </button>
              </nav>
            </div>
            
            {/* Note d'information */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <FaInfoCircle className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">À propos des fichiers éditables</h4>
                  <div className="mt-1 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• Les fichiers texte (.txt) peuvent être modifiés directement sur la plateforme</p>
                    <p>• Pour les autres formats (PDF, DOCX, XLSX, etc.), vous devrez :</p>
                    <div className="ml-4">
                      <p>1. Télécharger le fichier</p>
                      <p>2. Le modifier localement</p>
                      <p>3. Le réimporter</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center text-green-600 dark:text-green-400">
                        <FaFileCode className="mr-1" /> Formats éditables : .txt
                      </span>
                      <span className="flex items-center text-amber-600 dark:text-amber-400">
                        <FaFilePdf className="mr-1" /> Formats non-éditables : .pdf, .docx, .xlsx, etc.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du fichier <span className="text-red-500">*</span>
                  </label>
                  {activeTab === 'create' && (
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-2 py-1 rounded">
                      .txt sera ajouté automatiquement
                    </span>
                  )}
                </div>
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
                    <div className="space-y-3 text-center">
                      <div className="flex justify-center">
                        {file ? (
                          <div className="flex flex-col items-center">
                            {file.name.endsWith('.pdf') && <FaFilePdf className="h-12 w-12 text-red-500" />}
                            {['.doc', '.docx'].some(ext => file.name.endsWith(ext)) && <FaFileWord className="h-12 w-12 text-blue-600" />}
                            {['.xls', '.xlsx'].some(ext => file.name.endsWith(ext)) && <FaFileExcel className="h-12 w-12 text-green-600" />}
                            {['.jpg', '.jpeg', '.png', '.gif'].some(ext => file.name.endsWith(ext)) && <FaFileImage className="h-12 w-12 text-purple-500" />}
                            {!['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif'].some(ext => file.name.endsWith(ext)) && 
                              <FaFileAlt className="h-12 w-12 text-gray-400" />
                            }
                            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB • {file.type || 'Type inconnu'}
                            </p>
                          </div>
                        ) : (
                          <FaUpload className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                        <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none">
                          <span className="flex items-center">
                            <FaUpload className="mr-1 h-3 w-3" />
                            Sélectionner un fichier
                          </span>
                          <input 
                            ref={fileInputRef}
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="px-2 text-gray-400">ou</p>
                        <span className="text-gray-600 dark:text-gray-300">glisser-déposer</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Formats supportés : .txt, .pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png, .gif
                      </p>
                    </div>
                  </div>
                  {errors.file && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.file}</p>}
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label htmlFor="fileContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contenu du fichier
                  </label>
                  <div className="mt-1 relative">
                    <textarea
                      id="fileContent"
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Saisissez le contenu de votre fichier..."
                      rows={15}
                      style={{ minHeight: '300px', maxHeight: '70vh', resize: 'vertical' }}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                      {content.length} caractères
                    </div>
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
                  onChange={(e) => {
                    setTaskId(e.target.value);
                    // Réinitialiser le kanbanId lors du changement de tâche
                    if (!e.target.value) setKanbanId('');
                  }}
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
                  Tableau Kanban (optionnel){selectedTask?.sprint && ` (Sélectionné: ${selectedTask.sprint.name})`}
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