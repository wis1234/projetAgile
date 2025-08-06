import React, { useState, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaSave, FaTimes, FaFileAlt, FaExpand, FaCompress, FaSpinner } from 'react-icons/fa';
import { isFileEditable, isPdfFile, formatFileSize } from '@/utils/fileUtils';
import MenuBar from '@/Components/Editor/MenuBar';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';

const EditContent = ({ file }) => {
  const { flash } = usePage().props;
  const [content, setContent] = useState('<p></p>');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const isPdf = isPdfFile(file.type, file.name);
  
  // Liste des couleurs pour l'éditeur
  const colors = [
    { name: 'Noir', value: '#000000' },
    { name: 'Rouge', value: '#EF4444' },
    { name: 'Bleu', value: '#3B82F6' },
    { name: 'Vert', value: '#10B981' },
    { name: 'Jaune', value: '#F59E0B' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Rose', value: '#EC4899' },
    { name: 'Gris', value: '#6B7280' },
    { name: 'Bleu foncé', value: '#1E40AF' },
    { name: 'Vert foncé', value: '#047857' },
    { name: 'Rouge foncé', value: '#B91C1C' },
    { name: 'Orange', value: '#F97316' },
  ];

  // Charger le contenu du fichier
  useEffect(() => {
    const loadFileContent = async () => {
      try {
        // Vérifier si le fichier a déjà un contenu (peut-être déjà chargé côté serveur)
        if (file.content) {
          const isHTML = /<[a-z][\s\S]*>/i.test(file.content);
          setContent(isHTML ? file.content : `<p>${file.content}</p>`);
          return;
        }
        
        // Sinon, charger le contenu via une requête API
        const response = await fetch(`/storage/${file.file_path}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) throw new Error('Impossible de charger le contenu du fichier');
        const text = await response.text();
        
        // Si c'est du HTML valide, on l'utilise tel quel, sinon on l'encapsule dans un paragraphe
        const isHTML = /<[a-z][\s\S]*>/i.test(text);
        const formattedContent = text.trim() === '' ? '<p></p>' : (isHTML ? text : `<p>${text}</p>`);
        setContent(formattedContent);
      } catch (err) {
        setError('Erreur lors du chargement du fichier : ' + (err.message || 'Veuillez réessayer'));
        console.error('Erreur:', err);
      }
    };

    if (!isPdf) {
      loadFileContent();
    } else {
      setError('La modification des fichiers PDF n\'est pas prise en charge');
    }
  }, [file, isPdf]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    
    if (isPdf) {
      setError('La modification des fichiers PDF n\'est pas prise en charge');
      return;
    }

    // Vérifier si l'éditeur est prêt
    if (!editor) {
      setError('L\'éditeur n\'est pas encore prêt. Veuillez patienter...');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Récupérer le contenu directement depuis l'éditeur
      const htmlContent = editor.getHTML();
      
      // Créer un objet FormData pour l'envoi des données
      const formData = new FormData();
      formData.append('content', htmlContent);
      formData.append('_method', 'PUT');

      const response = await fetch(route('files.update-content', file.id), {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Inertia': 'true',
        },
        body: formData
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

  // Configuration de l'éditeur avec toutes les extensions nécessaires
  const editor = useEditor({
    extensions: [
      // Configuration personnalisée de StarterKit avec uniquement les extensions nécessaires
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // Désactiver les extensions qui seront ajoutées séparément
        textStyle: false, // Géré par l'extension TextStyle
        bold: { HTMLAttributes: { class: 'font-bold' } },
        italic: { HTMLAttributes: { class: 'italic' } },
        strike: { HTMLAttributes: { class: 'line-through' } },
        code: { HTMLAttributes: { class: 'bg-gray-100 p-1 rounded' } },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-5' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-5' } },
        blockquote: { HTMLAttributes: { class: 'border-l-4 border-gray-300 pl-4 py-1 my-2' } },
        codeBlock: { HTMLAttributes: { class: 'bg-gray-100 p-4 rounded font-mono' } },
        horizontalRule: { HTMLAttributes: { class: 'my-4 border-t border-gray-300' } },
        dropcursor: { color: '#3B82F6', width: 2 },
        gapcursor: false,
        hardBreak: false,
        history: true,
      }),
      // Ajouter les extensions avec leurs configurations personnalisées
      TextStyle.configure({
        HTMLAttributes: {
          class: 'font-sans',
        },
      }),
      Color,
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: href => /^https?:\/\//.test(href),
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded max-w-full h-auto my-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'px-1 rounded',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setContent(content);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none p-4 min-h-[300px]',
        spellcheck: 'true',
      },
      handleKeyDown: (view, event) => {
        // Raccourci Ctrl+S pour sauvegarder
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          handleSubmit();
          return true;
        }
        return false;
      },
    },
  });

  // Effet pour forcer la mise à jour du contenu de l'éditeur quand le contenu change
  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      // Ne mettre à jour que si le contenu est différent
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

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
      <Head title={`Éditer ${file.name}`} />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 bg-white border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    <FaFileAlt className="inline-block mr-2 text-blue-600" />
                    Éditer le contenu : <span className="text-blue-600">{file.name}</span>
                  </h2>
                  <div className="mt-1 text-sm text-gray-500">
                    {lastSaved && (
                      <span>Dernière sauvegarde : {lastSaved}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md">
                    <span>{wordCount} mots</span>
                    <span className="text-gray-300">•</span>
                    <span>{charCount} caractères</span>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none transition-colors"
                    title={isFullscreen ? 'Réduire' : 'Plein écran'}
                  >
                    {isFullscreen ? <FaCompress className="w-5 h-5" /> : <FaExpand className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <FaTimes className="mr-2" /> Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">
                          <FaSpinner className="w-4 h-4" />
                        </span>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Enregistrer
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
                <div 
                  className={`border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 m-0 bg-white flex flex-col' : 'flex flex-col'}`}
                  style={isFullscreen ? { borderRadius: 0 } : {}}
                >
                  <MenuBar editor={editor} colors={colors} />
                  <div className="border-t border-gray-200 flex-1 flex flex-col">
                    <EditorContent 
                      editor={editor} 
                      className="flex-1 overflow-y-auto p-4 focus:outline-none"
                      style={{ minHeight: isFullscreen ? 'calc(100vh - 60px)' : '500px' }}
                    />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500 flex flex-wrap items-center justify-between">
                  <div>
                    <p className="inline-flex items-center">
                      <span className="hidden sm:inline">Astuce :</span>
                      <kbd className="ml-1 px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">Ctrl</kbd>
                      <span className="mx-1">+</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">S</kbd>
                      <span className="ml-1">pour enregistrer</span>
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 sm:mt-0">
                    {file.mime_type} • {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditContent;
