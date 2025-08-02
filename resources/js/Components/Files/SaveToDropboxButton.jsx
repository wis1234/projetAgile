import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { FaSpinner, FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

export default function SaveToDropboxButton({ fileId, className = '' }) {
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleSaveToDropbox = async () => {
        setShowConfirmModal(false);
        setIsSaving(true);
        
        try {
            const response = await fetch(`/files/${fileId}/save-to-dropbox`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest'
                }
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

    return (
        <>
            <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className} ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
                {isSaving ? (
                    <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Enregistrement...
                    </>
                ) : (
                    <>
                        <FaCloudUploadAlt className="-ml-1 mr-2 h-4 w-4" />
                        Sauvegarder sur Dropbox
                    </>
                )}
            </button>

            {/* Modal de confirmation */}
            {showConfirmModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                            &#8203;
                        </span>

                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <FaCloudUploadAlt className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Sauvegarder sur Dropbox
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Êtes-vous sûr de vouloir sauvegarder ce fichier sur Dropbox ?
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleSaveToDropbox}
                                    disabled={isSaving}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    {isSaving ? (
                                        <>
                                            <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                            Enregistrement...
                                        </>
                                    ) : 'Confirmer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={isSaving}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
