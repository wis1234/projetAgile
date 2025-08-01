import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';

export default function SaveToDropboxButton({ fileId, className = '' }) {
    const [isSaving, setIsSaving] = useState(false);

    const saveToDropbox = async () => {
        if (!confirm('Voulez-vous vraiment sauvegarder ce fichier sur Dropbox ?')) {
            return;
        }

        setIsSaving(true);
        
        try {
            const response = await fetch(`/files/${fileId}/save-to-dropbox`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            const data = await response.json();
            
            if (data.success) {
                toast.success(data.message, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
            } else {
                throw new Error(data.message || 'Une erreur est survenue');
            }
        } catch (error) {
            toast.error(error.message || 'Erreur lors de la sauvegarde sur Dropbox', {
                position: "top-right",
                autoClose: 7000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
            console.error('Erreur:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <button
            onClick={saveToDropbox}
            disabled={isSaving}
            className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
        >
            {isSaving ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sauvegarde en cours...
                </>
            ) : (
                <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Sauvegarder sur Dropbox
                </>
            )}
        </button>
    );
}
