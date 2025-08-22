import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaSave, FaSpinner, FaArrowLeft, FaCode, FaUserEdit, FaFilter, FaTimes, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify } from 'react-icons/fa';
import { isPdfFile, formatFileSize } from '@/utils/fileUtils';
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
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import TrackChanges from '@/Components/Editor/extensions/track-changes';

const EditContent = ({ file, lastModifiedBy, auth }) => {
    const { flash } = usePage().props;
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState('');
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
            }),
            TextStyle,
            FontFamily,
            FontSize.configure({
                types: ['textStyle'],
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
                defaultAlignment: 'left',
            }),
            Link.configure({ openOnClick: false }),
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
    
    const handleSave = useCallback(() => {
        if (!editor || isSaving) return;

        const htmlContent = editor.getHTML();
        router.put(route('files.update-content', file.id), {
            content: htmlContent,
        }, {
            preserveScroll: true,
            onStart: () => setIsSaving(true),
            onSuccess: () => {
                setIsDirty(false);
            },
            onFinish: () => setIsSaving(false),
        });
    }, [editor, isSaving, file.id]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleSave, applyFilters, clearFilters]);

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
                <div className="sticky top-0 z-10 bg-white shadow-md">
                    <div className="flex items-center justify-between p-2 border-b">
                        <div className="flex items-center space-x-2">
                            <div className="text-sm font-mono text-gray-500 border-r border-gray-200 pr-3 mr-2">
                                {file.name}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving || !isDirty}
                                    className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 ${isSaving || !isDirty ? 'bg-blue-300 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    {isSaving ? <FaSpinner className="animate-spin mr-1" /> : <FaSave className="mr-1" />}
                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                                <button 
                                    onClick={handleClose}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300"
                                >
                                    Fermer
                                </button>
                            </div>
                            {editor && (
                                <>
                                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                                    <MenuBar editor={editor} />
                                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {success && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-md">{success}</div>}
                    {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
                    <div className="prose max-w-none min-h-[400px] p-4 border rounded-lg">
                        <EditorContent editor={editor} className="min-h-[300px]" />
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center text-sm text-gray-600">
                            <FaUserEdit className="mr-2 text-gray-400" />
                            <span>Vous éditez en tant que <span className="font-medium">{auth.user.name}</span></span>
                        </div>
                        {lastModifiedBy && (
                            <div className="mt-2 text-xs text-gray-500">
                                Dernière modification par {lastModifiedBy.name} le {new Date(file.updated_at).toLocaleString('fr-FR', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Pied de page avec informations de dernière modification */}
                <footer className="border-t border-gray-200 bg-white py-2 px-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                            <FaUserEdit className="mr-2 text-gray-400" />
                            <span>
                                Dernière modification par <span className="font-medium">{lastModifiedBy?.name || 'Système'}</span> le {new Date(file.updated_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400">
                            Version: {new Date(file.updated_at).getTime()}
                        </div>
                    </div>
                </footer>
            </div>
        </AdminLayout>
    );
};

export default EditContent;
