import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    FaArrowLeft, 
    FaEdit, 
    FaTrash, 
    FaUserTie, 
    FaMapMarkerAlt, 
    FaMoneyBillWave, 
    FaGraduationCap, 
    FaBriefcase, 
    FaCalendarAlt, 
    FaFileAlt, 
    FaUserCheck, 
    FaEnvelope, 
    FaPhone,
    FaClock,
    FaUsers,
    FaTools
} from 'react-icons/fa';
import CountdownTimer from '@/Components/CountdownTimer';

export default function RecruitmentShow({ recruitment, canManage, canApply, auth }) {
    const formatDate = (dateString) => {
        const options = { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            locale: 'fr-FR'
        };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
        
        const statusLabels = {
            draft: 'Brouillon',
            published: 'Publiée',
            closed: 'Clôturée'
        };

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status]} shadow-sm`}>
                {statusLabels[status]}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-sm">
                <FaUserTie className="mr-1.5 h-4 w-4" />
                {type}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title={`Offre : ${recruitment.title}`} />
            
            <div className="py-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* En-tête avec boutons d'action */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                            <div className="flex items-center">
                                <Link 
                                    href={route('recruitment.index')}
                                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mr-4"
                                >
                                    <FaArrowLeft className="mr-2 h-4 w-4" />
                                    Retour aux offres
                                </Link>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    Détails de l'offre
                                </h1>
                            </div>
                            
                            {(canManage || auth.user?.is_admin) && (
                                <div className="mt-4 sm:mt-0 flex space-x-3">
                                    <Link
                                        href={route('recruitment.edit', recruitment.id)}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    >
                                        <FaEdit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                    <Link
                                        href={route('recruitment.applications.index', recruitment.id)}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    >
                                        <FaUserCheck className="mr-2 h-4 w-4" />
                                        Voir les candidatures
                                    </Link>
                                </div>
                            )}
                        </div>
                        
                        {/* Bannière d'information */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {recruitment.title}
                                            </h2>
                                            {getStatusBadge(recruitment.status)}
                                        </div>
                                        
                                        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <FaUserTie className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                {getTypeBadge(recruitment.type)}
                                            </div>
                                            
                                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                {recruitment.location || 'Non spécifié'}
                                            </div>
                                            
                                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <FaMoneyBillWave className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                {recruitment.salary_min || recruitment.salary_max 
                                                    ? `${recruitment.salary_min ? `${recruitment.salary_min} €` : ''}${recruitment.salary_min && recruitment.salary_max ? ' - ' : ''}${recruitment.salary_max ? `${recruitment.salary_max} €` : ''}`
                                                    : 'Non spécifié'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 md:mt-0">
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <FaCalendarAlt className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                            <span className="font-medium">Date limite :</span>
                                            <span className="ml-1">{formatDate(recruitment.deadline)}</span>
                                        </div>
                                        
                                        <div className="mt-2">
                                            <CountdownTimer 
                                                deadline={recruitment.deadline} 
                                                className="text-sm font-medium text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Description et Détails */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Colonne de gauche - Description et compétences */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description du poste */}
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                        <FaFileAlt className="mr-2 h-5 w-5 text-blue-500" />
                                        Description du poste
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300" 
                                         dangerouslySetInnerHTML={{ __html: recruitment.description || 'Aucune description fournie.' }} />
                                </div>
                            </div>

                            {/* Compétences requises */}
                            {recruitment.skills && recruitment.skills.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                            <FaTools className="mr-2 h-5 w-5 text-blue-500" />
                                            Compétences requises
                                        </h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {recruitment.skills.map((skill, index) => (
                                                <span 
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Colonne de droite - Informations complémentaires */}
                        <div className="space-y-6">
                            {/* Niveau d'expérience */}
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                        <FaBriefcase className="mr-2 h-5 w-5 text-blue-500" />
                                        Expérience requise
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {recruitment.experience_level || 'Non spécifié'}
                                    </p>
                                </div>
                            </div>

                            {/* Niveau d'études */}
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                        <FaGraduationCap className="mr-2 h-5 w-5 text-blue-500" />
                                        Niveau d'études
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {recruitment.education_level || 'Non spécifié'}
                                    </p>
                                </div>
                            </div>

                            {/* Champs personnalisés */}
                            {/* {recruitment.custom_fields && recruitment.custom_fields.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            Informations complémentaires
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {recruitment.custom_fields.map((field, index) => (
                                            <div key={index} className="p-4">
                                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {field.label}
                                                </h4>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {field.value || 'Non spécifié'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )} */}

                            {/* Bouton de candidature */}
                            {canApply && (
                                <div className="mt-6">
                                    <Link 
                                        href={route('recruitment.applications.create', recruitment.id)}
                                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    >
                                        <FaFileAlt className="mr-2 h-5 w-5" />
                                        Postuler maintenant
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
   );
}
