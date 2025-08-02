import { useState, useEffect } from 'react';
import { FaFolder, FaPlus, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

export default function DropboxFolderSelector({ onSelect, onCancel, currentPath = '' }) {
    const [folders, setFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Dropbox', path: '' }]);
    const [currentPathState, setCurrentPathState] = useState(currentPath);

    useEffect(() => {
        fetchFolders(currentPathState);
    }, [currentPathState]);

    const fetchFolders = async (path = '') => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/dropbox/folders', {
                params: { path }
            });
            
            if (response.data.success) {
                setFolders(response.data.folders);
                
                // Mettre à jour le fil d'Ariane
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
            setError(err.response?.data?.message || 'Impossible de charger les dossiers Dropbox');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        
        setIsCreating(true);
        try {
            const response = await axios.post('/api/dropbox/folders', {
                path: currentPathState,
                name: newFolderName
            });
            
            if (response.data.success) {
                setNewFolderName('');
                fetchFolders(currentPathState);
            } else {
                throw new Error(response.data.message || 'Erreur lors de la création du dossier');
            }
        } catch (err) {
            console.error('Error creating folder:', err);
            setError(err.response?.data?.message || 'Erreur lors de la création du dossier');
        } finally {
            setIsCreating(false);
        }
    };

    const navigateToFolder = (path) => {
        setCurrentPathState(path);
    };

    const navigateUp = () => {
        if (breadcrumbs.length > 1) {
            const parentPath = breadcrumbs[breadcrumbs.length - 2].path;
            setCurrentPathState(parentPath);
        }
    };

    const handleFolderSelect = (folder) => {
        // Si c'est le dossier racine, on utilise un chemin vide
        const path = folder.path_display === '/' ? '' : folder.path_display;
        setCurrentPathState(path);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Sélectionner un dossier
            </h3>
            
            {/* Fil d'Ariane */}
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

            {/* Bouton retour */}
            {breadcrumbs.length > 1 && (
                <button
                    onClick={navigateUp}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-3"
                >
                    <FaArrowLeft className="mr-1" /> Retour au dossier parent
                </button>
            )}

            {/* Création de dossier */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                    placeholder="Nouveau dossier"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
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

            {/* Liste des dossiers */}
            <div className="border rounded-md divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                    </div>
                ) : error ? (
                    <div className="p-4 text-red-500 text-center">{error}</div>
                ) : folders.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">Aucun dossier trouvé</div>
                ) : (
                    folders.map((folder) => (
                        <button
                            key={folder.path_lower}
                            onClick={() => handleFolderSelect(folder)}
                            className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <FaFolder className="text-blue-500" />
                            <span className="truncate">{folder.name}</span>
                        </button>
                    ))
                )}
            </div>

            {/* Boutons d'action */}
            <div className="mt-4 flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                    Annuler
                </button>
                <button
                    onClick={() => onSelect(currentPathState || '/')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Sélectionner ce dossier
                </button>
            </div>
        </div>
    );
}
