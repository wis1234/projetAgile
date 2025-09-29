import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import CustomFieldsEditor from '@/Components/CustomFieldsEditor';
import { DragDropContext } from 'react-beautiful-dnd';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RecruitmentCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        type: '',
        location: '',
        salary_min: '',
        salary_max: '',
        experience_level: '',
        education_level: '',
        skills: [],
        custom_fields: [],
        status: 'draft',
        new_skill: '',
        deadline: format(addDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
        auto_close: true
    });

    const [showSkillInput, setShowSkillInput] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('recruitment.store'));
    };

    const addSkill = () => {
        if (data.new_skill.trim() && !data.skills.includes(data.new_skill.trim())) {
            setData('skills', [...data.skills, data.new_skill.trim()]);
            setData('new_skill', '');
        }
        setShowSkillInput(false);
    };

    const removeSkill = (skillToRemove) => {
        setData('skills', data.skills.filter(skill => skill !== skillToRemove));
    };

    return (
        <AdminLayout>
            <Head title="Créer une offre d'emploi" />

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une nouvelle offre d'emploi</h1>
                        <Link
                            href={route('recruitment.index')}
                            className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                        >
                        <FaArrowLeft className="mr-2" />
                        Retour à la liste
                        </Link>
                    </div>
                </div>

                <div className="px-6 pb-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Titre */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Titre de l'offre <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>}
                                </div>

                                {/* Type de contrat */}
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Type de contrat <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="type"
                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        required
                                    >
                                        <option value="">Sélectionnez un type de contrat</option>
                                        <option value="CDI">CDI</option>
                                        <option value="CDD">CDD</option>
                                        <option value="Stage">Stage</option>
                                        <option value="Alternance">Alternance</option>
                                        <option value="Freelance">Freelance</option>
                                        <option value="Interim">Intérim</option>
                                    </select>
                                    {errors.type && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.type}</p>}
                                </div>

                                    {/* Localisation */}
                                    <div>
                                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Localisation *
                                        </label>
                                        <input
                                            type="text"
                                            id="location"
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                            value={data.location}
                                            onChange={(e) => setData('location', e.target.value)}
                                            required
                                        />
                                        {errors.location && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location}</p>}
                                    </div>

                                    {/* Date limite de candidature */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Date limite de candidature
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="datetime-local"
                                                id="deadline"
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                                value={data.deadline}
                                                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                                                onChange={(e) => setData('deadline', e.target.value)}
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            La date limite pour postuler à cette offre. Laissez vide pour ne pas définir de date limite.
                                        </p>
                                        {errors.deadline && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deadline}</p>}
                                    </div>

                                    {/* Option de fermeture automatique */}
                                    <div className="md:col-span-2">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="auto_close"
                                                    name="auto_close"
                                                    type="checkbox"
                                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                    checked={data.auto_close}
                                                    onChange={(e) => setData('auto_close', e.target.checked)}
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="auto_close" className="font-medium text-gray-700 dark:text-gray-300">
                                                    Fermeture automatique
                                                </label>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    Si activé, l'offre sera automatiquement fermée après la date limite de candidature.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Salaire min */}
                                    <div>
                                        <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Salaire minimum (optionnel)
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">€</span>
                                            </div>
                                            <input
                                                type="number"
                                                id="salary_min"
                                                value={data.salary_min}
                                                onChange={e => setData('salary_min', e.target.value)}
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        {errors.salary_min && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.salary_min}</p>}
                                    </div>

                                    {/* Salaire max */}
                                    <div>
                                        <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Salaire maximum (optionnel)
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">€</span>
                                            </div>
                                            <input
                                                type="number"
                                                id="salary_max"
                                                value={data.salary_max}
                                                onChange={e => setData('salary_max', e.target.value)}
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                                placeholder="0.00"
                                                min={data.salary_min || 0}
                                                step="0.01"
                                            />
                                        </div>
                                        {errors.salary_max && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.salary_max}</p>}
                                    </div>

                                    {/* Niveau d'expérience */}
                                    <div>
                                        <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Niveau d'expérience (optionnel)
                                        </label>
                                        <input
                                            type="text"
                                            id="experience_level"
                                            value={data.experience_level}
                                            onChange={e => setData('experience_level', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                            placeholder="Ex: Débutant, 3-5 ans d'expérience, etc."
                                        />
                                        {errors.experience_level && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.experience_level}</p>}
                                    </div>

                                    {/* Niveau d'études */}
                                    <div>
                                        <label htmlFor="education_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Niveau d'études (optionnel)
                                        </label>
                                        <input
                                            type="text"
                                            id="education_level"
                                            value={data.education_level}
                                            onChange={e => setData('education_level', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                            placeholder="Ex: Bac+3, Master, etc."
                                        />
                                        {errors.education_level && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.education_level}</p>}
                                    </div>

                                    {/* Compétences */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Compétences requises (optionnel)
                                        </label>
                                        
                                        {/* Liste des compétences */}
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {data.skills.map((skill, index) => (
                                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSkill(skill)}
                                                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none focus:bg-blue-500 dark:focus:bg-blue-600 focus:text-white"
                                                    >
                                                        <span className="sr-only">Supprimer {skill}</span>
                                                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        
                                        {/* Ajout d'une compétence */}
                                        {showSkillInput ? (
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    value={data.new_skill}
                                                    onChange={e => setData('new_skill', e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                                    placeholder="Ajouter une compétence"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addSkill}
                                                    className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                                >
                                                    <FaPlus className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSkillInput(false)}
                                                    className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowSkillInput(true)}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                            >
                                                <FaPlus className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                                                Ajouter une compétence
                                            </button>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Description du poste *
                                        </label>
                                        <div className="mt-1">
                                            <textarea
                                                id="description"
                                                rows={8}
                                                value={data.description}
                                                onChange={e => setData('description', e.target.value)}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Décrivez en détail les missions, responsabilités et attentes du poste.
                                        </p>
                                        {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>}
                                    </div>

                                    {/* Champs personnalisés */}
                                    <div className="md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <CustomFieldsEditor 
                                            fields={data.custom_fields || []}
                                            onChange={(fields) => setData('custom_fields', fields)}
                                        />
                                        {errors['custom_fields'] && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors['custom_fields']}</p>
                                        )}
                                    </div>

                                    {/* Statut */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Statut
                                        </label>
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center">
                                                <input
                                                    id="status-draft"
                                                    name="status"
                                                    type="radio"
                                                    checked={data.status === 'draft'}
                                                    onChange={() => setData('status', 'draft')}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                                />
                                                <label htmlFor="status-draft" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                                                        Brouillon
                                                    </span>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal">L'offre sera enregistrée mais non publiée.</p>
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    id="status-published"
                                                    name="status"
                                                    type="radio"
                                                    checked={data.status === 'published'}
                                                    onChange={() => setData('status', 'published')}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                                />
                                                <label htmlFor="status-published" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                                        Publiée
                                                    </span>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal">L'offre sera visible par les candidats.</p>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Link
                                        href={route('recruitment.index')}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                    >
                                        Annuler
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                                    >
                                        <FaSave className="mr-2 h-4 w-4" />
                                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
