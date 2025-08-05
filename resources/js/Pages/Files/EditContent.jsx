import React, { useState, useEffect, useRef } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaSave, FaTimes, FaFileAlt } from 'react-icons/fa';
import { isFileEditable, isPdfFile } from '@/utils/fileUtils';

const EditContent = ({ file }) => {
  const { flash } = usePage().props;
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);
  const isPdf = isPdfFile(file.type, file.name);
  
  // Charger le contenu du fichier
  useEffect(() => {
    const loadFileContent = async () => {
      try {
        const response = await fetch(`/storage/${file.file_path}`);
        if (!response.ok) throw new Error('Impossible de charger le contenu du fichier');
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError('Erreur lors du chargement du fichier : ' + err.message);
        console.error('Erreur:', err);
      }
    };

    if (!isPdf) {
      loadFileContent();
    } else {
      setError('La modification des fichiers PDF n\'est pas prise en charge');
    }
  }, [file, isPdf]);

  // Ajuster automatiquement la hauteur du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        800 // Hauteur maximale de 800px
      )}px`;
    }
  }, [content]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isPdf) {
      setError('La modification des fichiers PDF n\'est pas prise en charge');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(route('files.update-content', file.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Inertia': 'true',
        },
        body: JSON.stringify({
          content: content,
          _method: 'PUT'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }

      // Afficher un message de succès
      window.flash = { message: 'Le contenu du fichier a été mis à jour avec succès.', type: 'success' };
      
      // Recharger la page pour afficher les modifications
      router.reload({ only: ['file'] });
    } catch (err) {
      setError('Erreur lors de la sauvegarde : ' + (err.message || 'Une erreur est survenue'));
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Si c'est un PDF, afficher un message d'erreur
  if (isPdf) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Modification non disponible
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                La modification des fichiers PDF n'est pas prise en charge.
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head title={`Modifier le contenu - ${file.name}`} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Modifier le contenu
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {file.name} • {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => router.visit(route('files.show', file.id))}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaTimes className="mr-2 h-4 w-4" />
              Annuler
            </button>
            <button
              type="submit"
              form="edit-content-form"
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                <>
                  <FaSave className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form id="edit-content-form" onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Contenu du fichier
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Modifiez le contenu du fichier ci-dessous.
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  rows={20}
                  style={{ minHeight: '300px', maxHeight: '70vh', resize: 'vertical' }}
                  spellCheck="false"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                  {content.length} caractères • {content.split('\n').length} lignes
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditContent;
