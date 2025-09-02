import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaSave, FaSpinner, FaArrowLeft, FaCode, FaUserEdit, FaFilter, FaTimes, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify } from 'react-icons/fa';
import { isPdfFile, formatFileSize } from '@/utils/fileUtils';
import MenuBar from '@/Components/Editor/MenuBar';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
// Import des extensions pour configuration personnalisée
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import TrackChanges from '@/Components/Editor/extensions/track-changes';

const EditContent = ({ file, lastModifiedBy, auth }) => {
    const { flash } = usePage().props;
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState('');
    const [lastSaved, setLastSaved] = useState(null);
    const [autoSaved, setAutoSaved] = useState(false);
    const [success, setSuccess] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        userId: '',
        date: ''
    });
    
    // Get all project members from the file data
    const projectMembers = useMemo(() => {
        if (!file?.project?.users) return [];
        return file.project.users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
        }));
    }, [file?.project?.users]);
    const [activeFilters, setActiveFilters] = useState(false);
    const isPdf = isPdfFile(file.type, file.name);

    const editor = useEditor({
        user: {
            id: auth.user.id,
            name: auth.user.name,
            email: auth.user.email,
            // Ajoutez d'autres propriétés nécessaires ici
        },
        extensions: [
            StarterKit.configure({
                textStyle: false,
                // Utilisation du codeBlock de base
                codeBlock: {
                    HTMLAttributes: {
                        class: 'code-block',
                    },
                },
                // On désactive les extensions qui seront configurées séparément
                underline: false,
                link: false
            }),
            TextStyle,
            FontFamily,
            FontSize.configure({
                types: ['textStyle'],
            }),
            Underline,  // Extension underline configurée séparément
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
                defaultAlignment: 'left',
            }),
            Link.configure({  // Extension link configurée séparément
                openOnClick: false,
                HTMLAttributes: {
                    class: 'editor-link',
                },
                validate: href => /^https?:\/\//.test(href),
                autolink: true,
                linkOnPaste: true,
            }),
            // S'assurer que Highlight est chargée avant TrackChanges
            Highlight.configure({
                multicolor: true,
                HTMLAttributes: {
                    class: 'highlight',
                },
            }),
            TrackChanges,
            Color,
            Image.configure({ inline: true, allowBase64: true }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            setIsDirty(true);
        },
    });

    // Effet pour détecter et styliser les liens et mentions d'auteur
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            // Détecter et styliser les liens
            const links = document.querySelectorAll('.ProseMirror a');
            links.forEach(link => {
                if (!link.classList.contains('styled-link')) {
                    link.classList.add('styled-link');
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            });

            // Détecter et styliser les mentions d'auteur
            const mentions = document.querySelectorAll('.ProseMirror p, .ProseMirror div');
            mentions.forEach(element => {
                const text = element.textContent || '';
                const mentionRegex = /@(\w+)/g;
                let match;
                
                while ((match = mentionRegex.exec(text)) !== null) {
                    const username = match[1];
                    const user = projectMembers.find(u => 
                        u.name.toLowerCase() === username.toLowerCase() || 
                        u.email.split('@')[0].toLowerCase() === username.toLowerCase()
                    );
                    
                    if (user) {
                        const mentionSpan = document.createElement('span');
                        mentionSpan.className = 'mention';
                        mentionSpan.textContent = `@${username}`;
                        mentionSpan.title = user.email;
                        mentionSpan.dataset.userId = user.id;
                        
                        // Remplacer le texte par le span stylisé
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = element.innerHTML;
                        tempDiv.innerHTML = tempDiv.innerHTML.replace(
                            new RegExp(`@${username}`, 'g'), 
                            mentionSpan.outerHTML
                        );
                        element.innerHTML = tempDiv.innerHTML;
                    }
                }
            });
        };

        // Ajouter un écouteur pour les mises à jour de l'éditeur
        editor.on('update', handleUpdate);
        
        // Exécuter une première fois au chargement
        handleUpdate();

        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor, projectMembers]);

    useEffect(() => {
        if (flash?.success) {
            setSuccess(flash.success);
            setTimeout(() => setSuccess(''), 3000);
        }
        if (flash?.error) {
            setError(flash.error);
            setTimeout(() => setError(''), 3000);
        }
    }, [flash]);

    useEffect(() => {
        const loadContent = async () => {
            if (isPdf || !editor) return;

            let initialContent = '<p></p>';
            if (file.content) {
                initialContent = file.content;
            } else {
                try {
                    const response = await fetch(`/storage/${file.file_path}`);
                    if (!response.ok) throw new Error('Failed to load file content');
                    const text = await response.text();
                    if (text.trim()) {
                        initialContent = text;
                    }
                } catch (err) {
                    setError(err.message);
                }
            }

            if (editor && !editor.isDestroyed) {
                editor.commands.setContent(initialContent, false);
            }
        };

        loadContent();
    }, [file, isPdf, editor]);

    const applyFilters = useCallback(() => {
        if (!editor) return;
        
        // Reset all highlights first
        editor.commands.unsetHighlight();
        
        // If no filters are active, just return
        if (!filters.userId && !filters.date) {
            return;
        }
        
        // Get all text nodes with highlight marks
        const { doc } = editor.state;
        const changes = [];
        let totalNodes = 0;
        let nodesWithMarks = 0;
        let nodesWithHighlights = 0;
        
        // First, collect all changes that match our filters
        doc.descendants((node, pos) => {
            totalNodes++;
            
            if (!node.isText) return;
            
            // Skip if no marks
            if (!node.marks || node.marks.length === 0) return;
            
            nodesWithMarks++;
            
            // Find all highlight marks on this node
            const highlightMarks = node.marks.filter(mark => mark.type && mark.type.name === 'highlight');
            
            if (highlightMarks.length === 0) return;
            
            nodesWithHighlights++;
            
            // Check each highlight mark against our filters
            const matchingMarks = highlightMarks.filter(mark => {
                const userId = mark.attrs && mark.attrs['data-user-id'];
                const timestamp = mark.attrs && mark.attrs['data-timestamp'];
                const changeDate = timestamp ? new Date(timestamp) : null;
                
                // Check if this change matches the filters
                let matches = true;
                
                // Filter by user if specified
                if (filters.userId && userId !== filters.userId) {
                    matches = false;
                }
                
                // Filter by date if specified
                if (matches && filters.date && changeDate) {
                    const filterDate = new Date(filters.date);
                    const startOfDay = new Date(filterDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    
                    const endOfDay = new Date(filterDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    if (changeDate < startOfDay || changeDate > endOfDay) {
                        matches = false;
                    }
                }
                
                return matches;
            });
            
            // If we have matching marks, add them to our changes
            if (matchingMarks.length > 0 && matchingMarks[0].attrs) {
                changes.push({
                    from: pos,
                    to: pos + node.nodeSize,
                    userId: matchingMarks[0].attrs['data-user-id'],
                    timestamp: matchingMarks[0].attrs['data-timestamp']
                });
            } else {
                // If no marks matched our filters, unhighlight this node
                editor.commands.unsetHighlight({ from: pos, to: pos + node.nodeSize });
            }
        });
        
        // Apply a special highlight to matching changes
        changes.forEach(change => {
            editor.commands.setHighlight({
                from: change.from,
                to: change.to,
                attributes: {
                    class: 'bg-yellow-200 border border-yellow-400',
                    'data-filtered': 'true',
                    'data-user-id': change.userId,
                    'data-timestamp': change.timestamp
                }
            });
        });
        
        // If we have active filters, show a notification
        if (changes.length > 0) {
            setSuccess(`Filtre appliqué : ${changes.length} modification(s) trouvée(s)`);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError('Aucune modification trouvée avec les critères sélectionnés');
            setTimeout(() => setError(''), 3000);
        }
        
    }, [editor, filters]);
    
    const clearFilters = useCallback(() => {
        if (!editor) return;
        
        // Reset all highlights to their original state
        const { doc } = editor.state;
        
        doc.descendants((node, pos) => {
            if (!node.marks || !node.marks.length) return;
            
            node.marks.forEach(mark => {
                if (mark.type.name === 'highlight' && mark.attrs['data-filtered']) {
                    // Remove the filtered highlight
                    editor.commands.unsetHighlight({ from: pos, to: pos + node.nodeSize });
                    
                    // Reapply the original highlight if it was a tracked change
                    const userId = mark.attrs['data-user-id'];
                    if (userId && editor.storage.trackChanges && editor.storage.trackChanges.users) {
                        const user = editor.storage.trackChanges.users.get(userId);
                        if (user) {
                            editor.commands.setHighlight({
                                from: pos,
                                to: pos + node.nodeSize,
                                attributes: {
                                    class: user.color,
                                    'data-user-id': userId,
                                    'data-timestamp': mark.attrs['data-timestamp']
                                }
                            });
                        }
                    }
                }
            });
        });
        
        // Reset filter state
        setFilters({
            userId: '',
            date: ''
        });
        setActiveFilters(false);
    }, [editor]);
    
    // Référence pour la fonction de sauvegarde
    const saveRef = useRef();
    
    // Définir handleSave avant tout effet qui l'utilise
    const handleSave = useCallback(() => {
        if (!editor || isSaving) return;

        const htmlContent = editor.getHTML();
        
        // Sauvegarder localement avant l'envoi au serveur
        if (file?.id) {
            const backup = {
                content: htmlContent,
                fileId: file.id,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem(`file_autosave_${file.id}`, JSON.stringify(backup));
            setLastSaved(new Date().toISOString());
        }
        
        // Envoyer la requête au serveur
        const options = {
            preserveScroll: true,
            onStart: () => setIsSaving(true),
            onSuccess: () => {
                setIsSaving(false);
                setIsDirty(false);
                setSuccess('Fichier enregistré avec succès!');
                
                // Supprimer la sauvegarde locale après un enregistrement réussi
                if (file?.id) {
                    localStorage.removeItem(`file_autosave_${file.id}`);
                }
            },
            onError: (errors) => {
                setIsSaving(false);
                setError('Erreur lors de l\'enregistrement du fichier');
                console.error('Erreur lors de la sauvegarde:', errors);
            }
        };
        
        return router.put(
            route('files.update-content', file.id),
            { content: htmlContent },
            options
        );
    }, [editor, isSaving, file?.id]);
    
    // Mise à jour de la référence quand handleSave change
    useEffect(() => {
        saveRef.current = handleSave;
    }, [handleSave]);
    
    // Gestion des raccourcis clavier
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+S ou Cmd+S pour sauvegarder
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (saveRef.current) {
                    saveRef.current();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Gestion de la sauvegarde avant fermeture
    useEffect(() => {
        if (!editor || !file?.id) return;

        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                const confirmationMessage = 'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter ?';
                
                // Sauvegarde immédiate dans le stockage local
                const htmlContent = editor.getHTML();
                localStorage.setItem(`file_autosave_${file.id}`, JSON.stringify({
                    content: htmlContent,
                    fileId: file.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                }));
                
                // Tenter une sauvegarde serveur en arrière-plan
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(route('files.update-content', file.id), 
                        new Blob([JSON.stringify({
                            content: htmlContent,
                            _method: 'PUT',
                            _token: document.querySelector('meta[name="csrf-token"]').content
                        })], { type: 'application/json' })
                    );
                }
                
                // Retourner le message de confirmation
                e.returnValue = confirmationMessage;
                return confirmationMessage;
            }
        };
        
        // Sauvegarde automatique périodique
        const autoSaveInterval = setInterval(() => {
            if (isDirty && editor) {
                const content = editor.getHTML();
                // Sauvegarde locale directe sans dépendre de saveToLocalStorage
                localStorage.setItem(`file_autosave_${file.id}`, JSON.stringify({
                    content,
                    fileId: file.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                }));
                
                // Mettre à jour l'état de dernière sauvegarde
                setLastSaved(new Date().toISOString());
                setAutoSaved(true);
                setTimeout(() => setAutoSaved(false), 5000);
                
                // Sauvegarder sur le serveur toutes les 5 minutes
                if (Date.now() - (lastSaved ? new Date(lastSaved).getTime() : 0) > 5 * 60 * 1000) {
                    if (saveRef.current) {
                        saveRef.current();
                    }
                }
            }
        }, 30000); // Vérification toutes les 30 secondes
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(autoSaveInterval);
        };
    }, [isDirty, editor, file.id, lastSaved]); // Retiré saveToLocalStorage des dépendances

    // Sauvegarde automatique dans le stockage local
    const saveToLocalStorage = useCallback((content) => {
        if (!file?.id) return;
        
        const backup = {
            content,
            fileId: file.id,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        try {
            localStorage.setItem(`file_autosave_${file.id}`, JSON.stringify(backup));
            setLastSaved(new Date().toISOString());
            setAutoSaved(true);
            
            // Masquer la notification après 5 secondes
            setTimeout(() => setAutoSaved(false), 5000);
        } catch (e) {
            console.error('Erreur lors de la sauvegarde locale:', e);
        }
    }, [file?.id]);
    
    // Vérifier s'il existe une sauvegarde locale au chargement
    useEffect(() => {
        if (!file?.id) return;
        
        const savedData = localStorage.getItem(`file_autosave_${file.id}`);
        if (savedData) {
            try {
                const { content, timestamp } = JSON.parse(savedData);
                if (confirm(`Une sauvegarde non enregistrée du ${new Date(timestamp).toLocaleString()} a été trouvée. Voulez-vous la charger ?`)) {
                    editor?.commands.setContent(content);
                    setIsDirty(true);
                }
                // Nettoyer la sauvegarde après l'avoir proposée
                localStorage.removeItem(`file_autosave_${file.id}`);
            } catch (e) {
                console.error('Erreur lors de la récupération de la sauvegarde:', e);
            }
        }
    }, [file?.id, editor]);

    // handleSave a été déplacé plus haut pour éviter les références circulaires

    const handleClose = () => {
        if (isDirty) {
            if (window.confirm('Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter?')) {
                window.history.back();
            }
        } else {
            window.history.back();
        }
    };

    if (isPdf) {
        return (
            <AdminLayout>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-semibold">La modification des fichiers PDF n'est pas prise en charge.</h2>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title={`Édition de ${file.name}`} />
            <div className="flex flex-col h-screen bg-white overflow-hidden">
                {/* Barre d'outils fixe en haut */}
                <div className="fixed top-0 left-64 right-0 z-50 bg-white shadow-md">
                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between border-b">
                        <div className="flex items-center space-x-2">
                            <div className="text-sm font-mono text-gray-500">
                                {file.name}
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving || !isDirty}
                                className={`px-3 py-1.5 rounded-md flex items-center space-x-1 text-sm font-medium ${isSaving || !isDirty ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                {isSaving ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-1" />
                                        <span>Enregistrement...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="mr-1" />
                                        <span>Enregistrer</span>
                                    </>
                                )}
                            </button>
                            
                            <button 
                                onClick={handleClose}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                            >
                                <FaTimes className="mr-1 inline" />
                                <span>Fermer</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Barre d'outils de formatage */}
                    <div className="bg-gray-50 border-b px-4 py-1 flex items-center justify-between">
                        <MenuBar editor={editor} />
                        
                        {editor && (
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                    className={`p-2 rounded-md ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                    title="Aligner à gauche"
                                >
                                    <FaAlignLeft />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                    className={`p-2 rounded-md ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                    title="Centrer"
                                >
                                    <FaAlignCenter />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                    className={`p-2 rounded-md ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                    title="Aligner à droite"
                                >
                                    <FaAlignRight />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                                    className={`p-2 rounded-md ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                    title="Justifier"
                                >
                                    <FaAlignJustify />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Contenu principal avec marge pour la barre d'outils fixe et le pied de page */}
                <div className="flex-1 overflow-y-auto pt-24 pb-20 px-8">
                    {success && <div className="p-3 mb-2 bg-green-100 text-green-700 rounded-t-md w-full">{success}</div>}
                    {error && <div className="p-3 mb-2 bg-red-100 text-red-700 rounded-t-md w-full">{error}</div>}
                    
                    <div className="prose max-w-none w-full bg-white">
                        <EditorContent editor={editor} className="min-h-[300px] pb-8" />
                    </div>
                </div>
                
                {/* Pied de page fixe */}
                <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-inner">
                    <div className="max-w-7xl mx-auto px-4 py-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center">
                                <FaUserEdit className="mr-2 text-gray-400" />
                                <span>Vous éditez en tant que <span className="font-medium">{auth.user.name}</span></span>
                            </div>
                            {lastModifiedBy && (
                                <div className="text-xs text-gray-500">
                                    Dernière modification par {lastModifiedBy.name} le {new Date(file.updated_at).toLocaleString('fr-FR', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default EditContent;
