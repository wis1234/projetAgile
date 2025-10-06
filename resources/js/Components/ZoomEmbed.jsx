import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaExpand, FaCompress, FaVideo, FaPhone, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaShare } from 'react-icons/fa';

const ZoomEmbed = ({ joinUrl, onClose, meetingName, isHost = false }) => {
    const iframeRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeout = useRef(null);

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (iframeRef.current) {
                iframeRef.current.requestFullscreen().catch(err => {
                    console.error('Error entering fullscreen:', err);
                });
            }
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Toggle audio
    const toggleAudio = () => {
        setIsMuted(!isMuted);
        // Add audio control logic here
    };

    // Toggle video
    const toggleVideo = () => {
        setIsVideoOn(!isVideoOn);
        // Add video control logic here
    };

    // Handle controls visibility on mouse move
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        // Simulate loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        // Hide controls after 3 seconds of inactivity
        controlsTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            clearTimeout(timer);
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        };
    }, []);

    // Copy meeting link to clipboard
    const copyMeetingLink = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(joinUrl).then(() => {
            alert('Meeting link copied to clipboard');
        }).catch(err => {
            console.error('Error copying link:', err);
        });
    };

    // Handle iframe load
    const handleIframeLoad = () => {
        setIsLoading(false);
        // Auto-enter fullscreen for better experience
        if (!document.fullscreenElement && iframeRef.current) {
            iframeRef.current.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-gray-900 flex flex-col"
            onMouseMove={handleMouseMove}
        >
            {/* Meeting header */}
            <div 
                className={`bg-gray-800 text-white p-3 flex justify-between items-center transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <div className="flex items-center">
                    <FaVideo className="text-blue-400 mr-2" />
                    <h2 className="text-base font-medium truncate max-w-xs">
                        {meetingName || 'Meeting in progress'}
                    </h2>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={copyMeetingLink}
                        className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                        title="Copier le lien de la réunion"
                    >
                        <FaShare size={14} />
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                        title={isFullscreen ? 'Quitter le mode plein écran' : 'Plein écran'}
                    >
                        {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                        title="Quitter la réunion"
                    >
                        <FaPhone size={14} className="transform rotate-135" />
                    </button>
                </div>
            </div>

            {/* Conteneur de l'iframe */}
            <div className="relative w-full h-full bg-black">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-white text-lg">Chargement de la réunion Zoom...</p>
                        <p className="text-gray-400 mt-2 text-sm">Veuillez patienter, la réunion va bientôt démarrer</p>
                    </div>
                )}
                
                <iframe
                    ref={iframeRef}
                    src={joinUrl}
                    className="w-full h-full"
                    allow="microphone; camera; fullscreen; display-capture; autoplay"
                    allowFullScreen
                    onLoad={() => {
                        setIsLoading(false);
                        // Forcer le mode plein écran pour une meilleure expérience
                        if (!document.fullscreenElement) {
                            iframeRef.current.requestFullscreen().catch(err => {
                                console.error('Erreur lors du passage en plein écran:', err);
                            });
                        }
                    }}
                    title="Réunion Zoom"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                />
            </div>

            {/* Barre de contrôle en bas */}
            <div 
                className={`bg-gray-800 bg-opacity-90 p-3 flex justify-center items-center space-x-4 transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:bg-opacity-80 transition-colors`}
                    title={isMuted ? 'Activer le micro' : 'Désactiver le micro'}
                >
                    {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full ${!isVideoOn ? 'bg-red-500' : 'bg-gray-700'} text-white hover:bg-opacity-80 transition-colors`}
                    title={isVideoOn ? 'Désactiver la caméra' : 'Activer la caméra'}
                >
                    {isVideoOn ? <FaVideo size={18} /> : <FaVideoSlash size={18} />}
                </button>
                <button
                    onClick={toggleFullscreen}
                    className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                    title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
                >
                    {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
                </button>
                <button
                    onClick={onClose}
                    className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
                    title="Quitter la réunion"
                >
                    <FaPhone size={16} className="transform rotate-135 mr-2" />
                    <span>Quitter</span>
                </button>
            </div>

            {/* Instructions pour l'utilisateur */}
            {!isLoading && showControls && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-sm px-4 py-2 rounded-lg">
                    <p>Utilisez les boutons ci-dessous pour contrôler votre expérience de réunion</p>
                </div>
            )}
        </div>
    );
}

export default ZoomEmbed;
