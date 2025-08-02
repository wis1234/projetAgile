import { useState, useEffect } from 'react';
import { FaFolder, FaPlus, FaSpinner, FaArrowLeft, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function DropboxFolderSelector({ onSelect, onCancel, currentPath = '' }) {
    const [folders, setFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Dropbox', path: '' }]);
    const [currentPathState, setCurrentPathState] = useState(currentPath);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [validationError, setValidationError] = useState('');

    const validateFolderName = (name) => {
        if (!name.trim()) {
            return 'Le nom du dossier est requis';
        }
        if (name.length > 255) {
            return 'Le nom ne peut pas dépasser 255 caractères';
        }
        if (!/^[a-zA-Z0-9 _-]+$/.test(name)) {
            return 'Seuls les lettres, chiffres, espaces, tirets (-) et tirets bas (_) sont autorisés';
        }
        return '';
    };

    useEffect(() => {
        fetchFolders(currentPathState);
    }, [currentPathState]);

    const fetchFolders = async (path = '') => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/dropbox/folders', {
                params: { path },
                timeout: 10000
            });
            
            if (response.data.success) {
                setFolders(response.data.folders);
                
                const parts = path ? path.split('/').filter(Boolean) : [];
                const newBreadcrumbs = [{ name: 'Dropbox', path: '' }];
                let currentPath = '';
                
                parts.forEach(part => {
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    newBreadcrumbs.push({
                        name: part,
                        path: currentPath
                    });
                });
                
                setBreadcrumbs(newBreadcrumbs);
            } else {
                throw new Error(response.data.message || 'Erreur lors du chargement des dossiers');
            }
        } catch (err) {
            console.error('Error fetching Dropbox folders:', err);
            
            let errorMessage = 'Impossible de charger les dossiers Dropbox';
            
            if (err.code === 'ECONNABORTED') {
                errorMessage = 'La requête a expiré. Vérifiez votre connexion Internet.';
            } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Could not resolve host')) {
                errorMessage = 'Impossible de se connecter à Dropbox. Vérifiez votre connexion Internet.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            setError({
                message: errorMessage,
                isNetworkError: ['ECONNABORTED', 'ERR_NETWORK'].includes(err.code) || 
                               err.message?.includes('Could not resolve host')
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        const folderName = newFolderName.trim();
        const validationMessage = validateFolderName(folderName);
        if (validationMessage) {
            setValidationError(validationMessage);
            return;
        }
        
        setIsCreating(true);
        setValidationError('');
        setError(null);
        
        const fullPath = currentPathState ? `${currentPathState}/${folderName}` : folderName;

        try {
            const response = await axios.post('/api/dropbox/folders', {
                path: fullPath
            });

            if (response.data.success) {
                toast.success(`Dossier "${folderName}" créé avec succès`);
                setNewFolderName('');
                await fetchFolders(currentPathState);
            } else {
                throw new Error(response.data.message || 'Erreur lors de la création du dossier');
            }
        } catch (err) {
            console.error('Error creating folder:', err);
            const errorMessage = err.response?.data?.message || 'Erreur lors de la création du dossier';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCreateFolder();
        }
    };

    const navigateToFolder = (path) => {
        setCurrentPathState(path);
        setSelectedFolder(null);
        setError(null);
    };

    const navigateUp = () => {
        if (breadcrumbs.length > 1) {
            const parentPath = breadcrumbs[breadcrumbs.length - 2].path;
            setCurrentPathState(parentPath);
            setSelectedFolder(null);
            setError(null);
        }
    };

    const handleFolderSelect = (folder) => {
        setSelectedFolder(folder);
        setError(null);
    };

    const confirmSelection = () => {
        if (selectedFolder) {
            onSelect(selectedFolder.path_display);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Sélectionner un dossier
            </h3>
            
            <div className="flex items-center gap-1 mb-4 text-sm overflow-x-auto py-1">
                {breadcrumbs.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => navigateToFolder(item.path)}
                        className={`flex items-center whitespace-nowrap ${
                            index === breadcrumbs.length - 1 
                                ? 'font-semibold text-blue-600 dark:text-blue-400' 
                                : 'text-blue-500 hover:underline dark:text-blue-300'
                        }`}
                    >
                        {item.name}
                        {index < breadcrumbs.length - 1 && (
                            <span className="mx-1 text-gray-400">/</span>
                        )}
                    </button>
                ))}
            </div>

            {breadcrumbs.length > 1 && (
                <button
                    onClick={navigateUp}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-3"
                >
                    <FaArrowLeft className="mr-1" /> Retour au dossier parent
                </button>
            )}

            <div className="mb-4">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => {
                                setNewFolderName(e.target.value);
                                if (validationError) {
                                    setValidationError(validateFolderName(e.target.value));
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Nouveau dossier"
                            className={`w-full px-3 py-2 border ${
                                validationError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationError && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                                <FaExclamationTriangle className="mr-1" /> {validationError}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleCreateFolder}
                        disabled={isCreating || !newFolderName.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                    >
                        {isCreating ? (
                            <>
                                <FaSpinner className="animate-spin" /> Création...
                            </>
                        ) : (
                            <>
                                <FaPlus /> Créer
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md flex items-start">
                    <FaExclamationTriangle className="mt-0.5 mr-2 flex-shrink-0" />
                    <span>{error.message}</span>
                </div>
            )}

            <div className="border rounded-md divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <FaSpinner className="animate-spin text-blue-500 text-2xl mb-2" />
                        <p className="text-gray-600 dark:text-gray-300">Chargement des dossiers...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 text-center">
                        <div className="text-red-500 mb-4">
                            <FaExclamationTriangle className="inline-block text-xl mb-2" />
                            <p>{error.message}</p>
                        </div>
                        <button
                            onClick={() => fetchFolders(currentPathState)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <FaSpinner className={`animate-spin mr-2 ${!isLoading ? 'hidden' : ''}`} />
                            Réessayer
                        </button>
                        {error.isNetworkError && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Vérifiez votre connexion Internet et réessayez.
                            </p>
                        )}
                    </div>
                ) : folders.length === 0 ? (
                    <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                        Aucun dossier trouvé dans ce répertoire.
                    </div>
                ) : (
                    folders.map((folder) => (
                        <div 
                            key={folder.path_lower} 
                            className={`flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                selectedFolder?.path_lower === folder.path_lower ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                            }`}
                        >
                            <button
                                onClick={() => handleFolderSelect(folder)}
                                className="flex-1 text-left flex items-center gap-2"
                            >
                                <FaFolder className="text-blue-500" />
                                <span className="truncate">{folder.name}</span>
                            </button>
                            <button
                                onClick={() => navigateToFolder(folder.path_display)}
                                className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="Ouvrir ce dossier"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div>
                    {selectedFolder && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Sélectionné : <span className="font-medium text-gray-800 dark:text-gray-200">{selectedFolder.name}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        onClick={confirmSelection}
                        disabled={!selectedFolder}
                        className={`px-4 py-2 rounded-md text-white font-medium ${
                            selectedFolder ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <FaCheck className="inline mr-1" /> Sélectionner
                    </button>
                </div>
            </div>
        </div>
    );
}
