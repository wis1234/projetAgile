import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaSave, FaSpinner, FaArrowLeft, FaCode, FaUserEdit } from 'react-icons/fa';
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
    const isPdf = isPdfFile(file.type, file.name);

    const editor = useEditor({
        user: auth.user,
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
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
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
    }, [handleSave]);

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
                <header className="flex items-center justify-between p-3 border-b bg-gray-50 z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200">
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold">{file.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} disabled={isSaving || !isDirty} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
                            {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                        </button>
                        <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded-md font-semibold hover:bg-gray-300">
                            Fermer
                        </button>
                    </div>
                </header>

                <div className="sticky top-0 z-10 bg-white shadow-md shrink-0">
                    {editor && <MenuBar editor={editor} />}
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
                                Dernière modification par {lastModifiedBy.name} le {new Date(file.updated_at).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="p-3 border-t bg-gray-50 shrink-0">
                    {lastModifiedBy && (
                        <p className="text-sm text-gray-500 text-center">
                            Dernière modification par {lastModifiedBy.name} le {new Date(lastModifiedBy.timestamp).toLocaleString()}
                        </p>
                    )}
                </footer>
            </div>
        </AdminLayout>
    );
};

export default EditContent;
