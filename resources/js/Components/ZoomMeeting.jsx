import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { FaVideo, FaSpinner, FaTimes, FaCheck, FaClock, FaUserClock, FaDoorOpen, FaExclamationTriangle, FaExpand, FaCompress, FaChevronDown } from 'react-icons/fa';
import { format, parseISO, isBefore, isAfter, addMinutes, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import Notification from './ui/Notification';
import ZoomEmbed from './ZoomEmbed';

export default function ZoomMeeting({ project }) {
    const { auth } = usePage().props;
    // États de chargement séparés pour un meilleur contrôle
    const [isInitialized, setIsInitialized] = useState(false);
    const [loadingStates, setLoadingStates] = useState({
        activeMeeting: false,
        recentMeetings: false,
        meetingActions: false
    });
    
    // États principaux
    const [activeMeeting, setActiveMeeting] = useState(null);
    const [recentMeetings, setRecentMeetings] = useState([]);
    const [showMeetingForm, setShowMeetingForm] = useState(false);
    const [showZoomEmbed, setShowZoomEmbed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [errors, setErrors] = useState({});
    const [showDropdown, setShowDropdown] = useState(false); // Nouvel état pour le dropdown
    
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
    
    // Gestion des erreurs améliorée avec retour du message
    const handleError = useCallback((error, defaultMessage = 'Une erreur est survenue') => {
        console.error('Erreur:', error);
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           defaultMessage;
        
        // Ajouter des détails supplémentaires si disponibles
        let details = '';
        if (error?.response?.data?.errors) {
            details = Object.values(error.response.data.errors).flat().join(' ');
        }
        
        const fullMessage = details ? `${errorMessage} : ${details}` : errorMessage;
        
        // Ajouter la notification
        addNotification(fullMessage, 'error');
        
        return fullMessage;
    }, [addNotification]);
    
    // Gestion des succès
    const handleSuccess = (message) => {
        addNotification(message, 'success');
    };

    // Utilisation de useForm avec renommage de la variable errors en formErrors
    const { data, setData, post, processing, reset, errors: formErrors } = useForm({
        topic: `Réunion pour le projet ${project.name}`,
        start_time: new Date().toISOString().slice(0, 16),
        duration: 60,
        agenda: 'Discussion sur l\'avancement du projet et les prochaines étapes.'
    });
    
    // S'assurer que l'agenda a toujours une valeur par défaut
    useEffect(() => {
        if (!data.agenda) {
            setData('agenda', 'Discussion sur l\'avancement du projet et les prochaines étapes.');
        }
    }, [data.agenda]);

    // Charger la réunion active de manière optimisée
    const fetchActiveMeeting = useCallback(async () => {
        setLoadingStates(prev => ({ ...prev, activeMeeting: true }));
        setErrors(prev => ({ ...prev, activeMeeting: null }));
        
        try {
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
                if (!isMeetingEnded(result.meeting)) {
                    setActiveMeeting(result.meeting);
                } else {
                    setActiveMeeting(null);
                }
            } else {
                setActiveMeeting(null);
            }
        } catch (err) {
            const errorMessage = handleError(err, 'Impossible de charger la réunion active');
            setErrors(prev => ({ ...prev, activeMeeting: errorMessage }));
        } finally {
            setLoadingStates(prev => ({ ...prev, activeMeeting: false }));
        }
    }, [project.id]);

    // Charger les réunions récentes de manière optimisée
    const fetchRecentMeetings = useCallback(async () => {
        setLoadingStates(prev => ({ ...prev, recentMeetings: true }));
        setErrors(prev => ({ ...prev, recentMeetings: null }));
        
        try {
            const response = await fetch(route('api.zoom.recent', { project: project.id }), {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Impossible de charger les réunions récentes');
            }

            const result = await response.json();
            if (result.success && Array.isArray(result.meetings)) {
                setRecentMeetings(result.meetings);
            }
        } catch (error) {
            const errorMessage = handleError(error, 'Erreur lors du chargement des réunions');
            setErrors(prev => ({ ...prev, recentMeetings: errorMessage }));
        } finally {
            setLoadingStates(prev => ({ ...prev, recentMeetings: false }));
        }
    }, [project.id]);

    // Chargement initial des données
    useEffect(() => {
        const initializeData = async () => {
            try {
                // Charger d'abord la réunion active
                await fetchActiveMeeting();
                
                // Puis charger les réunions récentes en arrière-plan
                fetchRecentMeetings().finally(() => {
                    setIsInitialized(true);
                });
            } catch (error) {
                handleError(error, 'Erreur lors du chargement initial');
                setIsInitialized(true); // On marque quand même comme initialisé pour afficher l'interface
            }
        };

        initializeData();
    }, [fetchActiveMeeting]);

    // Vérifier périodiquement l'état de la réunion
    useEffect(() => {
        if (!activeMeeting) return;
        
        const interval = setInterval(() => {
            fetchActiveMeeting();
        }, 60000); // Vérifier toutes les minutes

        return () => clearInterval(interval);
    }, [activeMeeting, fetchActiveMeeting]);

    // Vérifier si une réunion est terminée
    const isMeetingEnded = (meeting) => {
        if (!meeting) return true;
        const start = parseISO(meeting.start_time);
        const end = addMinutes(start, meeting.duration);
        return isPast(end);
    };

    // Valider les données du formulaire
    const validateForm = useCallback((field = null) => {
        const validationErrors = {};
        
        // Valider uniquement le champ spécifié ou tous les champs si null
        if (field === null || field === 'topic') {
            if (!data.topic || data.topic.trim().length < 5) {
                validationErrors.topic = 'Veuillez saisir un sujet de réunion valide (au moins 5 caractères)';
            }
        }
        
        if (field === null || field === 'start_time') {
            const startTime = new Date(data.start_time);
            if (isPast(startTime)) {
                validationErrors.start_time = 'La date de début doit être dans le futur';
            }
        }
        
        if (field === null || field === 'duration') {
            if (data.duration < 1 || data.duration > 240) {
                validationErrors.duration = 'La durée doit être comprise entre 1 et 240 minutes';
            }
        }
        
        // Mettre à jour les erreurs
        if (Object.keys(validationErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...validationErrors }));
            // Ne pas afficher les notifications pour la validation en temps réel (uniquement à la soumission)
            if (field === null) {
                Object.values(validationErrors).forEach(error => {
                    addNotification(error, 'error');
                });
            }
            return false;
        }
        
        // Si on valide un champ spécifique, supprimer son erreur
        if (field) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        
        return Object.keys(validationErrors).length === 0;
    }, [data.topic, data.start_time, data.duration, addNotification]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Vérifier si c'est un rappel (moins d'1h avant la réunion)
        const meetingTime = new Date(data.start_time);
        const now = new Date();
        const timeDiff = meetingTime - now;
        const isReminder = timeDiff > 0 && timeDiff <= 60 * 60 * 1000; // Moins d'1h
        
        // Préparer les données avec des valeurs par défaut
        const formData = {
            topic: data.topic.trim(),
            start_time: data.start_time,
            duration: parseInt(data.duration, 10),
            agenda: data.agenda || 'Réunion pour le projet ' + project.name,
            is_reminder: isReminder
        };
        
        // Valider tous les champs avant soumission
        const isValid = validateForm();
        if (!isValid) {
            // Faire défiler jusqu'à la première erreur
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                const element = document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus({ preventScroll: true });
                }
            }
            return;
        }
        
        setLoadingStates(prev => ({ ...prev, meetingActions: true }));
        
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
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Une erreur est survenue lors de la création de la réunion.');
            }

            setActiveMeeting(result.meeting);
            setShowMeetingForm(false);
            setShowDropdown(false); // Fermer le dropdown après création
            handleSuccess('Réunion créée avec succès !');
            
            // Recharger les réunions récentes
            await fetchRecentMeetings();
            
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
            setLoadingStates(prev => ({ ...prev, meetingActions: false }));
        }
    };

    const handleEndMeeting = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir terminer cette réunion ? Cette action est irréversible.')) {
            return;
        }

        setLoadingStates(prev => ({ ...prev, meetingActions: true }));

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
            setLoadingStates(prev => ({ ...prev, meetingActions: false }));
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

    // Fonction pour gérer l'ouverture du formulaire depuis le dropdown
    const handleCreateMeetingClick = () => {
        setShowMeetingForm(true);
        setShowDropdown(false); // Fermer le dropdown
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
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full mr-3 flex-shrink-0">
                        <FaVideo className="text-blue-600 text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Réunion Zoom
                        </h2>
                        <p className="text-sm text-gray-500">
                            Gérez vos réunions en ligne pour le projet
                        </p>
                    </div>
                </div>
                
                <div className="relative w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 bg-blue-600 border border-transparent rounded-md font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        id="meeting-options-menu"
                        aria-expanded={showDropdown}
                        aria-haspopup="true"
                    >
                        <FaVideo className="mr-2" />
                        Nouvelle réunion
                        <FaChevronDown className={`ml-2 h-3 w-3 transition-transform duration-200 ${showDropdown ? 'transform rotate-180' : ''}`} />
                    </button>

                        {/* Dropdown menu style AWS */}
                        {showDropdown && (
                            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                        onClick={handleCreateMeetingClick}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                        role="menuitem"
                                    >
                                        <FaVideo className="mr-3 h-4 w-4 text-gray-400" />
                                        Planifier une réunion
                                    </button>
                                    <a
                                        href="#recent-meetings"
                                        onClick={() => setShowDropdown(false)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                        role="menuitem"
                                    >
                                        <FaClock className="mr-3 h-4 w-4 text-gray-400" />
                                        Voir les réunions récentes
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                
            </div>

            {/* Affichage des erreurs critiques (supprimé pour éviter l'affichage par défaut) */}

            {loadingStates.meetingActions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-700">Chargement en cours...</p>
                    </div>
                </div>
            )}

            {/* Formulaire de création de réunion - AFFICHÉ EN BAS */}
            {showMeetingForm && (
                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg transition-all duration-300 ease-in-out border border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                                    <FaVideo className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="ml-3 text-lg leading-6 font-medium text-gray-900">
                                    Créer une réunion Zoom
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowMeetingForm(false);
                                    reset();
                                    setErrors({});
                                }}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="mt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                                            Sujet de la réunion <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="topic"
                                                id="topic"
                                                value={data.topic}
                                                onChange={(e) => {
                                                    setData('topic', e.target.value);
                                                    // Valider le champ en temps réel
                                                    if (e.target.value.trim().length > 0) {
                                                        validateForm('topic');
                                                    }
                                                }}
                                                onBlur={() => validateForm('topic')}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                placeholder="Ex: Réunion de suivi du projet"
                                            />
                                        </div>
                                        {errors.topic && <p className="mt-1 text-sm text-red-600">{errors.topic}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                                            Date et heure (UTC) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="datetime-local"
                                                name="start_time"
                                                id="start_time"
                                                value={data.start_time}
                                                min={new Date().toISOString().slice(0, 16)}
                                                onChange={(e) => {
                                                    setData('start_time', e.target.value);
                                                    // Valider le champ en temps réel
                                                    if (e.target.value) {
                                                        validateForm('start_time');
                                                    }
                                                }}
                                                onBlur={() => validateForm('start_time')}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                                            Durée (minutes) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="number"
                                                name="duration"
                                                id="duration"
                                                min="1"
                                                max="480"
                                                value={data.duration}
                                                onChange={(e) => {
                                                    setData('duration', e.target.value);
                                                    // Valider le champ en temps réel
                                                    if (e.target.value) {
                                                        validateForm('duration');
                                                    }
                                                }}
                                                onBlur={() => validateForm('duration')}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="agenda" className="block text-sm font-medium text-gray-700">
                                            Ordre du jour
                                        </label>
                                        <div className="mt-1">
                                            <textarea
                                                id="agenda"
                                                name="agenda"
                                                rows={3}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                placeholder="Décrivez l'ordre du jour de votre réunion..."
                                                value={data.agenda}
                                                onChange={(e) => setData('agenda', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMeetingForm(false);
                                            reset();
                                            setErrors({});
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                Création...
                                            </>
                                        ) : 'Créer la réunion'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Le reste du composant reste inchangé */}
            {activeMeeting ? (
                <div className="space-y-4">
                    {/* ... reste du code pour activeMeeting ... */}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <FaVideo className="mx-auto h-12 w-12 text-gray-300" />
                    <h4 className="mt-2 text-sm font-medium text-gray-900">Aucune réunion en cours</h4>
                    <p className="mt-1 text-sm text-gray-500">
                        Créez une nouvelle réunion pour discuter en temps réel avec votre équipe.
                    </p>
                </div>
            )}

            {/* Section des réunions récentes */}
            <div className="mt-8" id="recent-meetings">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Réunions récentes</h3>
                    <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                        {recentMeetings.length} {recentMeetings.length > 1 ? 'réunions' : 'réunion'}
                    </span>
                </div>
                
                {loadingStates.recentMeetings ? (
                    <div className="flex justify-center py-12">
                        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
                    </div>
                ) : recentMeetings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {recentMeetings.map((meeting) => {
                            const isUpcoming = isMeetingUpcoming(meeting);
                            const isActive = isMeetingActive(meeting);
                            const meetingDate = parseISO(meeting.start_time);
                            
                            return (
                                <div 
                                    key={meeting.id}
                                    className={`relative rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${
                                        isUpcoming 
                                            ? 'border-blue-200 bg-blue-50 hover:border-blue-300' 
                                            : isActive
                                            ? 'border-green-200 bg-green-50 hover:border-green-300'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    {/* En-tête avec statut */}
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            isUpcoming 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : isActive 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {isUpcoming ? 'À venir' : isActive ? 'En cours' : 'Terminé'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {format(meetingDate, 'dd MMM yyyy', { locale: fr })}
                                        </span>
                                    </div>
                                    
                                    {/* Corps de la carte */}
                                    <div className="space-y-1.5">
                                        <h4 className="font-medium text-gray-900 text-sm">
                                            {meeting.topic}
                                        </h4>
                                        
                                        <div className="space-y-1">
                                            <div className="flex items-center text-xs text-gray-600">
                                                <FaClock className="mr-2 text-gray-400 flex-shrink-0" />
                                                <span className="font-medium">Date: </span>
                                                <span className="ml-1">
                                                    {format(meetingDate, 'dd/MM/yyyy HH:mm', { timeZone: 'UTC' })} (UTC+1)
                                                    <br />
                                                    Durée: {meeting.duration} min
                                                </span>
                                            </div>
                                            
                                            {meeting.agenda && (
                                                <div className="flex text-xs text-gray-600">
                                                    <span className="font-medium mr-1">Motif:</span>
                                                    <p className="text-gray-600 line-clamp-2">
                                                        {meeting.agenda}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Pied de carte avec actions */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end space-x-2">
                                        {(isUpcoming || isActive) && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setActiveMeeting(meeting);
                                                            setShowZoomEmbed(true);
                                                        }}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <FaDoorOpen className="mr-1.5" /> Rejoindre
                                                    </button>
                                                    {/* <a
                                                        href={meeting.join_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <FaExpand className="mr-1.5" /> Nouvel onglet
                                                    </a> */}
                                                </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <FaVideo className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <h4 className="text-lg font-medium text-gray-900">Aucune réunion récente</h4>
                        <p className="mt-1 text-sm text-gray-500">Créez votre première réunion pour commencer</p>
                        <button
                            onClick={() => setShowMeetingForm(true)}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <FaVideo className="mr-2" /> Créer une réunion
                        </button>
                    </div>
                )}
            </div>

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