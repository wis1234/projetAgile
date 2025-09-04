import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowLeft, FaEdit, FaTrash, FaUserTie, FaMapMarkerAlt, FaMoneyBillWave, FaGraduationCap, FaBriefcase, FaCalendarAlt, FaFileAlt, FaUserCheck, FaEnvelope, FaPhone } from 'react-icons/fa';
import CountdownTimer from '@/Components/CountdownTimer';

export default function RecruitmentShow({ recruitment, canManage, canApply, auth }) {
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            draft: 'bg-yellow-100 text-yellow-800',
            published: 'bg-green-100 text-green-800',
            closed: 'bg-red-100 text-red-800'
        };
        
        const statusLabels = {
            draft: 'Brouillon',
            published: 'Publiée',
            closed: 'Clôturée'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
                {statusLabels[status]}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {type}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title={`Offre : ${recruitment.title}`} />
            
            <div className="py-6 bg-white min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        {/* En-tête avec boutons d'action */}
                        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
                            <Link 
                                href={route('recruitment.index')}
                                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                            >
                                <FaArrowLeft className="mr-2" /> Retour à la liste
                            </Link>
                            <div className="space-x-2">
                                {/* Bouton de candidature */}
                                {canApply && (
                                    <Link 
                                        href={route('recruitment.applications.create', recruitment.id)}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <FaFileAlt className="mr-2" /> Postuler
                                    </Link>
                                )}
                                
                                {/* Boutons de gestion (seulement pour l'auteur ou l'admin) */}
                                {canManage && (
                                    <>
                                        <Link 
                                            href={route('recruitment.edit', recruitment.id)}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-900 focus:ring focus:ring-blue-200 disabled:opacity-25 transition"
                                        >
                                            <FaEdit className="mr-2" /> Modifier
                                        </Link>
                                        <button
                                            className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 active:bg-red-800 focus:outline-none focus:border-red-900 focus:ring focus:ring-red-200 disabled:opacity-25 transition"
                                            onClick={() => {
                                                if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
                                                    router.delete(route('recruitment.destroy', recruitment.id));
                                                }
                                            }}
                                        >
                                            <FaTrash className="mr-2" /> Supprimer
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {/* En-tête de l'offre */}
                            <div className="mb-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">{recruitment.title}</h1>
                                        <div className="mt-1 flex items-center text-sm text-gray-500">
                                            <FaUserTie className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            {recruitment.type}
                                            <span className="mx-2">•</span>
                                            <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            {recruitment.location}
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        {getStatusBadge(recruitment.status)}
                                    </div>
                                </div>

                                {/* Compte à rebours */}
                                {recruitment.status === 'published' && recruitment.deadline && (
                                    <div className="mt-4">
                                        <CountdownTimer 
                                            deadline={recruitment.deadline} 
                                            onExpire={() => {
                                                // Cette fonction sera appelée quand le compte à rebours atteindra zéro
                                                // La tâche planifiée gérera la fermeture automatique
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Métadonnées */}
                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                                <FaMoneyBillWave className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">Salaire</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {recruitment.salary_min && recruitment.salary_max 
                                                        ? `${recruitment.salary_min}€ - ${recruitment.salary_max}€`
                                                        : 'Non spécifié'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                                <FaGraduationCap className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">Niveau d'études</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {recruitment.education_level || 'Non spécifié'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                                <FaBriefcase className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">Expérience</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {recruitment.experience_level || 'Non spécifiée'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                                <FaCalendarAlt className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">Date de publication</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {formatDate(recruitment.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-8">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Description du poste</h2>
                                <div className="prose max-w-none">
                                    {recruitment.description.split('\n').map((paragraph, index) => (
                                        <p key={index} className="text-gray-600 mb-4">
                                            {paragraph || <br />}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Compétences requises */}
                            {recruitment.skills && recruitment.skills.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">Compétences requises</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {recruitment.skills.map((skill, index) => (
                                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Informations supplémentaires */}
                            <div className="mt-8 border-t border-gray-200 pt-8">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Informations supplémentaires</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Type de contrat</h3>
                                        <p className="mt-1 text-sm text-gray-900">{getTypeBadge(recruitment.type)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Localisation</h3>
                                        <p className="mt-1 text-sm text-gray-900">{recruitment.location}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                                        <p className="mt-1">{getStatusBadge(recruitment.status)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Publiée le</h3>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(recruitment.created_at)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Dernière mise à jour</h3>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(recruitment.updated_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Candidatures */}
                            <div className="mt-8 border-t border-gray-200 pt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-medium text-gray-900">
                                        {auth.user.roles.includes('admin') || auth.user.id === recruitment.created_by 
                                            ? `Candidatures (${recruitment.applications?.length || 0})` 
                                            : 'Ma candidature'}
                                    </h2>
                                    {(auth.user.roles.includes('admin') || auth.user.id === recruitment.created_by) && (
                                        <Link 
                                            href={route('recruitment.applications.index', recruitment.id)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Voir toutes les candidatures
                                        </Link>
                                    )}
                                </div>

                                {(() => {
                                    // Filtrer les candidatures selon les droits d'accès
                                    let filteredApplications = [];
                                    const isAdminOrCreator = auth.user.roles.includes('admin') || auth.user.id === recruitment.created_by;
                                    
                                    if (isAdminOrCreator) {
                                        // Afficher toutes les candidatures pour les admins et créateurs
                                        filteredApplications = recruitment.applications || [];
                                    } else {
                                        // Afficher uniquement la candidature de l'utilisateur connecté
                                        filteredApplications = (recruitment.applications || []).filter(
                                            app => app.user_id === auth.user.id
                                        );
                                    }

                                    return filteredApplications.length > 0 ? (
                                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                            <ul className="divide-y divide-gray-200">
                                                {filteredApplications.map((application) => (
                                                    <li key={application.id}>
                                                        <div className="px-4 py-4 sm:px-6">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-blue-600 truncate">
                                                                    {isAdminOrCreator ? (
                                                                        <Link 
                                                                            href={route('recruitment.applications.show', [recruitment.id, application.id])}
                                                                            className="hover:underline"
                                                                        >
                                                                            {application.first_name} {application.last_name}
                                                                        </Link>
                                                                    ) : (
                                                                        `${application.first_name} ${application.last_name}`
                                                                    )}
                                                                </p>
                                                                <div className="ml-2 flex-shrink-0 flex">
                                                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                        {application.status === 'pending' ? 'En attente' :
                                                                         application.status === 'reviewed' ? 'Examinée' :
                                                                         application.status === 'interviewed' ? 'En entretien' :
                                                                         application.status === 'accepted' ? 'Acceptée' : 'Rejetée'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 sm:flex sm:justify-between">
                                                                <div className="sm:flex">
                                                                    <p className="flex items-center text-sm text-gray-500">
                                                                        <FaEnvelope className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                        {application.email}
                                                                    </p>
                                                                    {application.phone && (
                                                                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                                            <FaPhone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                            {application.phone}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                                    <FaCalendarAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                    <p>
                                                                        Candidaté le{' '}
                                                                        <time dateTime={application.created_at}>
                                                                            {new Date(application.created_at).toLocaleDateString('fr-FR')}
                                                                        </time>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                                            <FaUserCheck className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune candidature</h3>
                                            <p className="mt-1 text-sm text-gray-500">Aucune candidature n'a été reçue pour cette offre pour le moment.</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
