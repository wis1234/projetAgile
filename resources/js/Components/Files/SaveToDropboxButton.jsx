import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaSpinner, FaCloudUploadAlt, FaFolder, FaTimes } from 'react-icons/fa';
import Modal from '@/Components/Modal';
import DropboxFolderSelector from './DropboxFolderSelector';

export default function SaveToDropboxButton({ 
    file = null, 
    fileId = null, 
    fileName = '',
    className = '' 
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState('');
    
    // Utiliser file.id/file.name si disponible, sinon utiliser fileId/fileName
    const effectiveFileId = file?.id || fileId;
    const [customFileName, setCustomFileName] = useState(file?.name || fileName || '');

    // Mettre à jour le nom du fichier si la prop file change
    useEffect(() => {
        if (file?.name) {
            setCustomFileName(file.name);
        } else if (fileName) {
            setCustomFileName(fileName);
        }
    }, [file?.name, fileName]);

    const handleSaveToDropbox = async () => {
        if (!selectedFolder) {
            toast.error('Veuillez sélectionner un dossier');
            return;
        }

        if (!customFileName.trim()) {
            toast.error('Veuillez saisir un nom de fichier');
            return;
        }

        setIsSaving(true);
        toast.info('Envoi du fichier vers Dropbox...', { autoClose: false, toastId: 'saving-file' });

        try {
            // Nettoyer le chemin du dossier sélectionné (supprimer les / finaux)
            const cleanFolderPath = selectedFolder.replace(/\/+$/, '');
            
            const response = await fetch(`/api/files/${effectiveFileId}/save-to-dropbox`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    path: cleanFolderPath,
                    custom_filename: customFileName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Une erreur est survenue lors de la sauvegarde');
            }

            toast.dismiss('saving-file');
            toast.success('Fichier sauvegardé avec succès sur Dropbox');
            setShowModal(false);

            if (data.file) {
                window.location.reload();
            }
        } catch (error) {
            toast.dismiss('saving-file');
            console.error('Erreur lors de la sauvegarde sur Dropbox:', error);
            toast.error(error.message || 'Erreur lors de la sauvegarde sur Dropbox');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setSelectedFolder('');
        setCustomFileName(file?.name || fileName || '');
        setShowModal(false);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150 ${className}`}
                disabled={isSaving}
            >
                {isSaving ? (
                    <>
                        <FaSpinner className="animate-spin mr-2" />
                        Envoi en cours...
                    </>
                ) : (
                    <>
                        <FaCloudUploadAlt className="mr-2" />
                        Sauvegarder sur Dropbox
                    </>
                )}
            </button>

            <Modal show={showModal} onClose={resetForm} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Sauvegarder sur Dropbox
                        </h2>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <FaTimes className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="mb-4">
                            <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom du fichier
                            </label>
                            <input
                                type="text"
                                id="fileName"
                                value={customFileName}
                                onChange={(e) => setCustomFileName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                disabled={isSaving}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Dossier de destination
                            </label>
                            <DropboxFolderSelector
                                onSelect={setSelectedFolder}
                                currentPath=""
                            />
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={isSaving}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveToDropbox}
                                disabled={isSaving || !selectedFolder || !customFileName.trim()}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Enregistrement...
                                    </>
                                ) : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
