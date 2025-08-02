import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaSpinner, FaCloudUploadAlt, FaTimes, FaFolder } from 'react-icons/fa';
import Modal from '@/Components/Modal';
import DropboxFolderSelector from './DropboxFolderSelector';

export default function SaveToDropboxButton({ fileId, fileName, className = '' }) {
    const [isSaving, setIsSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [customFileName, setCustomFileName] = useState(fileName || '');
    const [showFolderSelector, setShowFolderSelector] = useState(false);

    const handleSaveToDropbox = async () => {
        if (!selectedFolder) {
            toast.error('Veuillez sélectionner un dossier de destination');
            return;
        }

        if (!customFileName.trim()) {
            toast.error('Veuillez spécifier un nom de fichier');
            return;
        }

        setIsSaving(true);
        
        try {
            const response = await fetch(`/api/files/${fileId}/save-to-dropbox`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    folder_path: selectedFolder,
                    file_name: customFileName
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Une erreur est survenue lors de la sauvegarde');
            }

            toast.success('Fichier sauvegardé avec succès sur Dropbox', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });

            setShowModal(false);
            
            // Rafraîchir la page pour afficher le statut mis à jour
            if (data.file) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde sur Dropbox:', error);
            toast.error(error.message || 'Erreur lors de la sauvegarde sur Dropbox', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFolderSelect = (folderPath) => {
        setSelectedFolder(folderPath);
        setShowFolderSelector(false);
    };

    const resetForm = () => {
        setSelectedFolder('');
        setCustomFileName(fileName || '');
        setShowModal(false);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150 ${className} ${isSaving ? 'opacity-75' : ''}`}
            >
                {isSaving ? (
                    <>
                        <FaSpinner className="animate-spin mr-2" />
                        Envoi...
                    </>
                ) : (
                    <>
                        <FaCloudUploadAlt className="mr-2" />
                        Envoyer vers Dropbox
                    </>
                )}
            </button>

            <Modal show={showModal} onClose={resetForm} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Envoyer vers Dropbox
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom du fichier
                            </label>
                            <input
                                type="text"
                                value={customFileName}
                                onChange={(e) => setCustomFileName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Nom du fichier"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Dossier de destination
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <div className="relative flex items-stretch flex-grow focus-within:z-10">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaFolder className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedFolder || 'Aucun dossier sélectionné'}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Sélectionner un dossier"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFolderSelector(true)}
                                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:hover:bg-gray-500"
                                >
                                    <FaFolder className="h-5 w-5 text-gray-400" />
                                    <span>Parcourir</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:hover:bg-gray-500"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveToDropbox}
                            disabled={isSaving || !selectedFolder || !customFileName.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Envoi en cours...
                                </>
                            ) : (
                                'Enregistrer sur Dropbox'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de sélection de dossier */}
            <Modal 
                show={showFolderSelector} 
                onClose={() => setShowFolderSelector(false)}
                maxWidth="lg"
            >
                <div className="p-4">
                    <DropboxFolderSelector 
                        onSelect={handleFolderSelect}
                        onCancel={() => setShowFolderSelector(false)}
                        currentPath={selectedFolder}
                    />
                </div>
            </Modal>
        </>
    );
}
