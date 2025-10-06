import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { FaVideo, FaSpinner, FaTimes, FaCheck, FaClock, FaUserClock, FaDoorOpen, FaExclamationTriangle, FaExpand, FaCompress } from 'react-icons/fa';
import { format, parseISO, isBefore, isAfter, addMinutes, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import Notification from './ui/Notification';
import ZoomEmbed from './ZoomEmbed';

export default function ZoomMeeting({ project }) {
    const { auth } = usePage().props;
    const [isLoading, setIsLoading] = useState(false);
    const [activeMeeting, setActiveMeeting] = useState(null);
    const [showStartMeetingModal, setShowStartMeetingModal] = useState(false);
    const [showZoomEmbed, setShowZoomEmbed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    
    // Ajouter une notification
    const addNotification = (message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        return id;
    };
    
    // Supprimer une notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };
    
    // Gestion des erreurs
    const handleError = (error, defaultMessage = 'Une erreur est survenue') => {
        console.error(error);
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           defaultMessage;
        
        // Ajouter des détails supplémentaires si disponibles
        let details = '';
        if (error?.response?.data?.errors) {
            details = Object.values(error.response.data.errors).flat().join(' ');
        }
        
        const fullMessage = details ? `${errorMessage} : ${details}` : errorMessage;
        addNotification(fullMessage, 'error');
        return fullMessage;
    };
    
    // Gestion des succès
    const handleSuccess = (message) => {
        addNotification(message, 'success');
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        topic: `Réunion pour le projet ${project.name}`,
        start_time: new Date().toISOString().slice(0, 16),
        duration: 60,
        agenda: 'Discussion sur l\'avancement du projet et les prochaines étapes.'
    });

    // Charger la réunion active
    const fetchActiveMeeting = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route('api.zoom.active', { project: project.id }), {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.meeting) {
                setActiveMeeting(result.meeting);
                // Vérifier si la réunion est terminée
                if (isMeetingEnded(result.meeting)) {
                    handleSuccess('La réunion est maintenant terminée.');
                    setActiveMeeting(null);
                }
            } else {
                setActiveMeeting(null);
            }
        } catch (err) {
            handleError(err, 'Impossible de charger les informations de la réunion.');
        } finally {
            setIsLoading(false);
        }
    };

    // Charger la réunion active au chargement du composant
    useEffect(() => {
        fetchActiveMeeting();
    }, [project.id]);

    // Vérifier périodiquement l'état de la réunion
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeMeeting) {
                fetchActiveMeeting();
            }
        }, 60000); // Vérifier toutes les minutes

        return () => clearInterval(interval);
    }, [activeMeeting]);

    // Vérifier si une réunion est terminée
    const isMeetingEnded = (meeting) => {
        if (!meeting) return true;
        const start = parseISO(meeting.start_time);
        const end = addMinutes(start, meeting.duration);
        return isPast(end);
    };

    // Valider les données du formulaire
    const validateForm = () => {
        if (!data.topic || data.topic.trim().length < 5) {
            handleError({}, 'Veuillez saisir un sujet de réunion valide (au moins 5 caractères)');
            return false;
        }
        
        const startTime = new Date(data.start_time);
        if (isPast(startTime)) {
            handleError({}, 'La date de début doit être dans le futur');
            return false;
        }
        
        if (data.duration < 1 || data.duration > 240) {
            handleError({}, 'La durée doit être comprise entre 1 et 240 minutes');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            const response = await fetch(route('api.zoom.store', { project: project.id }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...data,
                    topic: data.topic.trim()
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Une erreur est survenue lors de la création de la réunion.');
            }

            setActiveMeeting(result.meeting);
            setShowStartMeetingModal(false);
            handleSuccess('Réunion créée avec succès !');
            
            // Réinitialiser le formulaire
            setData({
                topic: `Réunion pour le projet ${project.name}`,
                start_time: new Date().toISOString().slice(0, 16),
                duration: 60,
                agenda: 'Discussion sur l\'avancement du projet et les prochaines étapes.'
            });
            
        } catch (err) {
            handleError(err, 'Impossible de créer la réunion');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndMeeting = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir terminer cette réunion ? Cette action est irréversible.')) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(route('api.zoom.end', { 
                project: project.id, 
                meeting: activeMeeting.id 
            }), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Une erreur est survenue lors de la fermeture de la réunion.');
            }

            setActiveMeeting(null);
            handleSuccess('La réunion a été terminée avec succès.');
            
        } catch (err) {
            handleError(err, 'Impossible de terminer la réunion');
        } finally {
            setIsLoading(false);
        }
    };

    const formatMeetingTime = (startTime, duration) => {
        const start = parseISO(startTime);
        const end = addMinutes(start, duration);
        
        return `${format(start, 'PPp', { locale: fr })} - ${format(end, 'p', { locale: fr })}`;
    };

    const isMeetingActive = (meeting) => {
        if (!meeting) return false;
        const start = parseISO(meeting.start_time);
        const end = addMinutes(start, meeting.duration);
        return isBefore(new Date(), end) && isAfter(new Date(), start);
    };

    const isMeetingUpcoming = (meeting) => {
        if (!meeting) return false;
        const start = parseISO(meeting.start_time);
        return isAfter(start, new Date());
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative">
            {/* Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        type={notification.type}
                        message={notification.message}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
            
            {/* En-tête */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                        <FaVideo className="text-blue-600 text-xl" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Réunion Zoom
                        </h3>
                        <p className="text-sm text-gray-500">
                            Gérez vos réunions en ligne pour le projet
                        </p>
                    </div>
                </div>
                
                {!activeMeeting && (
                    <button
                        onClick={() => setShowStartMeetingModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className="animate-spin mr-2" />
                                Chargement...
                            </>
                        ) : (
                            <>
                                <FaVideo className="mr-2" />
                                Démarrer une réunion
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Affichage des erreurs critiques */}
            {errors && Object.keys(errors).length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Des erreurs sont présentes dans le formulaire
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    {Object.entries(errors).map(([field, messages]) => (
                                        <li key={field}>
                                            {Array.isArray(messages) ? messages.join(' ') : messages}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-700">Chargement en cours...</p>
                    </div>
                </div>
            )}
            
            {activeMeeting ? (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium text-gray-900">{activeMeeting.topic}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    <FaClock className="inline mr-1" />
                                    {formatMeetingTime(activeMeeting.start_time, activeMeeting.duration)}
                                </p>
                                {activeMeeting.agenda && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        <strong>Ordre du jour :</strong> {activeMeeting.agenda}
                                    </p>
                                )}
                            </div>
                            <div className="flex-shrink-0">
                                {isMeetingActive(activeMeeting) ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <FaCheck className="mr-1" /> En cours
                                    </span>
                                ) : isMeetingUpcoming(activeMeeting) ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <FaClock className="mr-1" /> À venir
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <FaTimes className="mr-1" /> Terminé
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                            <div className="flex flex-col space-y-2 w-full">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowZoomEmbed(true)}
                                        className="flex items-center justify-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        <FaDoorOpen className="mr-2" />
                                        Rejoindre dans l&apos;application
                                    </button>
                                    
                                    <a
                                        href={activeMeeting.join_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        <FaExpand className="mr-2" />
                                        Ouvrir dans un nouvel onglet
                                    </a>
                                </div>

                                {isMeetingActive(activeMeeting) && (
                                    <button
                                        onClick={handleEndMeeting}
                                        disabled={isLoading}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <FaSpinner className="animate-spin mr-2" />
                                                Fermeture...
                                            </>
                                        ) : (
                                            <>
                                                <FaTimes className="mr-2" />
                                                Terminer la réunion
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 text-sm text-gray-500 w-full">
                                <p>ID de la réunion: {activeMeeting.meeting_id}</p>
                                <p>Mot de passe: {activeMeeting.password}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <FaVideo className="mx-auto h-12 w-12 text-gray-300" />
                    <h4 className="mt-2 text-sm font-medium text-gray-900">Aucune réunion en cours</h4>
                    <p className="mt-1 text-sm text-gray-500">
                        Créez une nouvelle réunion pour discuter en temps réel avec votre équipe.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => setShowStartMeetingModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <FaVideo className="mr-2" />
                            Planifier une réunion
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de création de réunion */}
            {showStartMeetingModal && (
                <div className="fixed inset-0 overflow-y-auto z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowStartMeetingModal(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                                    <FaVideo className="h-6 w-6 text-blue-600" aria-hidden="true" />
                                </div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Créer une nouvelle réunion Zoom
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Planifiez une nouvelle réunion pour discuter avec votre équipe.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                                        Sujet de la réunion
                                    </label>
                                    <input
                                        type="text"
                                        id="topic"
                                        value={data.topic}
                                        onChange={(e) => setData('topic', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                                            Date et heure
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="start_time"
                                            value={data.start_time}
                                            onChange={(e) => setData('start_time', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            required
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                                            Durée (minutes)
                                        </label>
                                        <select
                                            id="duration"
                                            value={data.duration}
                                            onChange={(e) => setData('duration', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="15">15 min</option>
                                            <option value="30">30 min</option>
                                            <option value="45">45 min</option>
                                            <option value="60">1 heure</option>
                                            <option value="90">1h30</option>
                                            <option value="120">2 heures</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="agenda" className="block text-sm font-medium text-gray-700">
                                        Ordre du jour (optionnel)
                                    </label>
                                    <textarea
                                        id="agenda"
                                        rows="3"
                                        value={data.agenda}
                                        onChange={(e) => setData('agenda', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <FaSpinner className="animate-spin mr-2" />
                                                Création...
                                            </>
                                        ) : 'Créer la réunion'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowStartMeetingModal(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Intégration de la réunion Zoom */}
            {showZoomEmbed && activeMeeting?.join_url && (
                <div className="fixed inset-0 z-50 bg-white">
                    <ZoomEmbed 
                        joinUrl={activeMeeting.join_url}
                        onClose={() => setShowZoomEmbed(false)}
                        meetingName={activeMeeting.topic}
                    />
                </div>
            )}
        </div>
    );
}