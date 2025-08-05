import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaSave, FaTimes, FaFileAlt } from 'react-icons/fa';
import { isFileEditable, isPdfFile } from '@/utils/fileUtils';
import Tiptap from '@/Components/Editor/Tiptap';

const EditContent = ({ file }) => {
  const { flash } = usePage().props;
  const [content, setContent] = useState('<p></p>');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isPdf = isPdfFile(file.type, file.name);
  
  // Charger le contenu du fichier
  useEffect(() => {
    const loadFileContent = async () => {
      try {
        const response = await fetch(`/storage/${file.file_path}`);
        if (!response.ok) throw new Error('Impossible de charger le contenu du fichier');
        const text = await response.text();
        
        // Si c'est du HTML valide, on l'utilise tel quel, sinon on l'encapsule dans un paragraphe
        const isHTML = /<[a-z][\s\S]*>/i.test(text);
        setContent(isHTML ? text : `<p>${text}</p>`);
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
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                <FaFileAlt className="inline-block mr-2" />
                Éditer le contenu : {file.name}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-transparent rounded-md font-semibold text-xs text-gray-700 dark:text-gray-200 uppercase tracking-widest hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                >
                  <FaTimes className="mr-2" /> Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 disabled:opacity-50"
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
                      <FaSave className="mr-2" /> Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                <p>{error}</p>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu du fichier
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <Tiptap 
                  content={content} 
                  onChange={setContent} 
                  editable={!isLoading} 
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Utilisez la barre d'outils pour formater votre texte. Les modifications seront enregistrées uniquement après avoir cliqué sur le bouton "Enregistrer".
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditContent;
