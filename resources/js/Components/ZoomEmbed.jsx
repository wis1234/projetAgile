import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaExpand, FaCompress } from 'react-icons/fa';

export default function ZoomEmbed({ joinUrl, onClose, meetingName }) {
    const iframeRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Gérer le mode plein écran
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            iframeRef.current.requestFullscreen().catch(err => {
                console.error(`Erreur lors du passage en plein écran: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Écouter les changements de mode plein écran
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Nettoyer à la fermeture
    useEffect(() => {
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        };
    }, []);

    return (
        <div className={`fixed inset-0 z-50 bg-white ${isFullscreen ? '' : 'rounded-lg shadow-xl'}`}>
            {/* En-tête de la modale */}
            <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
                <h3 className="text-lg font-medium">
                    Réunion Zoom : {meetingName || 'Sans titre'}
                </h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-300 hover:text-white focus:outline-none"
                        title={isFullscreen ? 'Quitter le mode plein écran' : 'Plein écran'}
                    >
                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-300 hover:text-white focus:outline-none"
                        title="Fermer"
                    >
                        <FaTimes />
                    </button>
                </div>
            </div>

            {/* Conteneur de l'iframe */}
            <div className="relative w-full h-[calc(100%-56px)] bg-black">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-white">Chargement de la réunion Zoom...</p>
                        </div>
                    </div>
                )}
                
                <iframe
                    ref={iframeRef}
                    src={joinUrl}
                    className="w-full h-full"
                    allow="microphone; camera; fullscreen; display-capture"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                    title="Réunion Zoom"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>

            {/* Instructions pour l'utilisateur */}
            {!isLoading && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-sm px-4 py-2 rounded-lg">
                    <p>Utilisez le bouton de partage d'écran en bas de la fenêtre Zoom pour partager votre écran</p>
                </div>
            )}
        </div>
    );
}
