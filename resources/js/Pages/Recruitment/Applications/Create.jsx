import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowLeft, FaUpload, FaFilePdf, FaFileWord, FaTimes } from 'react-icons/fa';
import { useRef, useState, useEffect } from 'react';

// Composant pour afficher les champs personnalisés en fonction de leur type
function CustomFieldInput({ field, value, onChange, error }) {
    const handleChange = (e) => {
        const newValue = field.field_type === 'checkbox' ? e.target.checked : e.target.value;
        onChange(field.id, newValue);
    };

    switch (field.field_type) {
        case 'textarea':
            return (
                <textarea
                    id={`field-${field.id}`}
                    value={value || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    rows={4}
                    required={field.is_required}
                />
            );
            
        case 'select':
        case 'radio':
            const options = field.options || [];
            if (field.field_type === 'select') {
                return (
                    <select
                        id={`field-${field.id}`}
                        value={value || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required={field.is_required}
                    >
                        <option value="">Sélectionnez une option</option>
                        {options.map((option, index) => (
                            <option key={index} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            } else {
                return (
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center">
                                <input
                                    id={`field-${field.id}-${index}`}
                                    name={`field-${field.id}`}
                                    type="radio"
                                    value={option}
                                    checked={value === option}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    required={field.is_required}
                                />
                                <label htmlFor={`field-${field.id}-${index}`} className="ml-2 block text-sm text-gray-700">
                                    {option}
                                </label>
                            </div>
                        ))}
                    </div>
                );
            }

        case 'checkbox':
            return (
                <div className="flex items-center">
                    <input
                        id={`field-${field.id}`}
                        type="checkbox"
                        checked={!!value}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        required={field.is_required}
                    />
                    <label htmlFor={`field-${field.id}`} className="ml-2 block text-sm text-gray-700">
                        {field.field_label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.help_text && (
                        <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
                    )}
                </div>
            );

        case 'date':
            return (
                <input
                    type="date"
                    id={`field-${field.id}`}
                    value={value || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required={field.is_required}
                />
            );

        default: // text, email, number, etc.
            return (
                <input
                    type={field.field_type || 'text'}
                    id={`field-${field.id}`}
                    value={value || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required={field.is_required}
                />
            );
    }
}

export default function ApplicationCreate({ recruitment, fieldTypes }) {
    const { auth } = usePage().props;
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');
    const [filePreview, setFilePreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Diviser le nom complet en prénom et nom
    const getUserNameParts = () => {
        if (!auth?.user?.name) return { firstName: '', lastName: '' };
        
        const nameParts = auth.user.name.trim().split(/\s+/);
        if (nameParts.length === 1) return { firstName: nameParts[0], lastName: '' };
        
        const lastName = nameParts.pop();
        const firstName = nameParts.join(' ');
        return { firstName, lastName };
    };

    const { firstName, lastName } = getUserNameParts();

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: firstName || '',
        last_name: lastName || '',
        email: auth?.user?.email || '',
        phone: auth?.user?.phone || '',
        cover_letter: '',
        resume: null,
        custom_fields: {}
    });

    // Mettre à jour les champs personnalisés
    const updateCustomField = (fieldId, value) => {
        setData('custom_fields', {
            ...data.custom_fields,
            [fieldId]: value
        });
    };

    // Gestion du glisser-déposer
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (file) => {
        if (!file) return;
        
        // Vérifier le type de fichier
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            alert('Veuillez sélectionner un fichier PDF ou Word valide.');
            return;
        }
        
        // Vérifier la taille du fichier (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Le fichier est trop volumineux. La taille maximale autorisée est de 5MB.');
            return;
        }
        
        setFileName(file.name);
        setData('resume', file);
        
        // Créer un aperçu si c'est une image (non utilisé pour les PDF/DOC)
        if (file.type.startsWith('image/')) {
            setFilePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Vérifier la longueur minimale de la lettre de motivation
        if (data.cover_letter.length < 200) {
            alert('Votre lettre de motivation doit contenir au moins 200 caractères.');
            return;
        }
        
        // Vérifier que le CV est présent
        if (!data.resume) {
            alert('Veuillez télécharger votre CV.');
            return;
        }
        
        // Créer un FormData pour gérer le fichier
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'custom_fields') {
                formData.append(key, JSON.stringify(data[key]));
            } else if (key === 'resume' && data[key] instanceof File) {
                formData.append(key, data[key]);
            } else if (data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        
        // Envoyer le formulaire
        post(route('recruitment.applications.store', recruitment.id), formData);
    };

    const removeFile = () => {
        setFileName('');
        setData('resume', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
    };

    // Nettoyer les URLs d'aperçu lors du démontage du composant
    useEffect(() => {
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    return (
        <AdminLayout>
            <Head title={`Postuler à l'offre : ${recruitment.title}`} />
            
            <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                        <div className="px-6 py-8 sm:p-10">
                            <div className="mb-8">
                                <Link 
                                    href={route('recruitment.show', recruitment.id)}
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
                                >
                                    <FaArrowLeft className="mr-2" /> Retour à l'offre
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Postuler à l'offre : {recruitment.title}
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Remplissez le formulaire ci-dessous pour postuler à cette offre d'emploi.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Section Informations personnelles */}
                                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-6 py-6 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-800">
                                            <span className="inline-block w-1 h-6 bg-blue-600 mr-3 align-middle"></span>
                                            Informations personnelles
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">Vos coordonnées pour que nous puissions vous contacter</p>
                                        
                                        <div className="mt-8 space-y-6">
                                            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                                                <div className="sm:col-span-3 space-y-1">
                                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                                                        Prénom <span className="text-red-500">*</span>
                                                    </label>
                                                    <div>
                                                        <input 
                                                            type="text" 
                                                            id="first_name" 
                                                            value={data.first_name} 
                                                            onChange={e => setData('first_name', e.target.value)}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                                            required
                                                        />
                                                    </div>
                                                    {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                                                </div>
                                                
                                                <div className="sm:col-span-3 space-y-1">
                                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                                                        Nom <span className="text-red-500">*</span>
                                                    </label>
                                                    <div>
                                                        <input 
                                                            type="text" 
                                                            id="last_name" 
                                                            value={data.last_name} 
                                                            onChange={e => setData('last_name', e.target.value)}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                                            required
                                                        />
                                                    </div>
                                                    {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                                                </div>
                                                
                                                <div className="sm:col-span-4 space-y-1">
                                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                        Email <span className="text-red-500">*</span>
                                                    </label>
                                                    <div>
                                                        <input 
                                                            type="email" 
                                                            id="email" 
                                                            value={data.email} 
                                                            onChange={e => setData('email', e.target.value)}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                                            required
                                                        />
                                                    </div>
                                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                                </div>
                                                
                                                <div className="sm:col-span-4 space-y-1">
                                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                                        Téléphone <span className="text-red-500">*</span>
                                                    </label>
                                                    <div>
                                                        <input 
                                                            type="tel" 
                                                            id="phone" 
                                                            value={data.phone} 
                                                            onChange={e => setData('phone', e.target.value)}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                                            required
                                                        />
                                                    </div>
                                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                                </div>
                                                
                                                <div className="sm:col-span-6 space-y-1">
                                                    <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700">
                                                        Lettre de motivation <span className="text-red-500">*</span>
                                                    </label>
                                                    <div>
                                                        <textarea
                                                            id="cover_letter"
                                                            value={data.cover_letter}
                                                            onChange={e => setData('cover_letter', e.target.value)}
                                                            rows={6}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border min-h-[150px]"
                                                            placeholder="Décrivez votre expérience et vos motivations pour ce poste..."
                                                            required
                                                        />
                                                        <p className="mt-1 text-xs text-gray-500">Minimum 200 caractères</p>
                                                    </div>
                                                    {errors.cover_letter && <p className="mt-1 text-sm text-red-600">{errors.cover_letter}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Section CV */}
                                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-6 py-6 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-800">
                                            <span className="inline-block w-1 h-6 bg-blue-600 mr-3 align-middle"></span>
                                            CV et documents
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Téléchargez votre CV (PDF ou Word, max 5MB).
                                        </p>
                                        
                                        <div className="mt-4">
                                            <div 
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                                className={`mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-dashed rounded-lg transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                            >
                                                {fileName ? (
                                                    <div className="text-center">
                                                        {filePreview ? (
                                                            <img src={filePreview} alt="Aperçu" className="mx-auto h-32 w-auto mb-4" />
                                                        ) : (
                                                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                                                {fileName.endsWith('.pdf') ? (
                                                                    <FaFilePdf className="h-8 w-8 text-red-500" />
                                                                ) : (
                                                                    <FaFileWord className="h-8 w-8 text-blue-500" />
                                                                )}
                                                            </div>
                                                        )}
                                                        <p className="text-sm text-gray-900">{fileName}</p>
                                                        <button
                                                            type="button"
                                                            onClick={removeFile}
                                                            className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            <FaTimes className="mr-1 h-3 w-3" /> Changer de fichier
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                                        <div className="flex items-center">
                                                            <label
                                                                htmlFor="resume"
                                                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-3 py-1.5 border border-gray-300 shadow-sm text-sm"
                                                            >
                                                                <span>Sélectionner un fichier</span>
                                                                <input
                                                                    id="resume"
                                                                    name="resume"
                                                                    type="file"
                                                                    ref={fileInputRef}
                                                                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                                                                    className="sr-only"
                                                                    accept=".pdf,.doc,.docx"
                                                                    required
                                                                />
                                                            </label>
                                                            <p className="pl-3">ou glisser-déposer ici</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">Formats acceptés : PDF, DOC, DOCX (max. 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {errors.resume && <p className="mt-2 text-sm text-red-600">{errors.resume}</p>}
                                    </div>
                                </div>
                                
                                {/* Champs personnalisés */}
                                {recruitment.custom_fields && recruitment.custom_fields.length > 0 && (
                                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                        <div className="px-6 py-6 border-b border-gray-200">
                                            <h2 className="text-xl font-semibold text-gray-800">
                                                <span className="inline-block w-1 h-6 bg-blue-600 mr-3 align-middle"></span>
                                                Informations complémentaires
                                            </h2>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Veuillez remplir les champs supplémentaires demandés par le recruteur.
                                            </p>
                                            
                                            <div className="mt-6 space-y-6">
                                                {recruitment.custom_fields.map((field) => (
                                                    <div key={field.id} className="">
                                                        {field.field_type !== 'checkbox' && (
                                                            <>
                                                                <label htmlFor={`field-${field.id}`} className="block text-sm font-medium text-gray-700">
                                                                    {field.field_label}
                                                                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                                                </label>
                                                                {field.help_text && (
                                                                    <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
                                                                )}
                                                            </>
                                                        )}
                                                        <div className={field.field_type === 'checkbox' ? '' : 'mt-1'}>
                                                            <CustomFieldInput
                                                                field={field}
                                                                value={data.custom_fields?.[field.id]}
                                                                onChange={updateCustomField}
                                                                error={errors[`custom_fields.${field.id}`]}
                                                            />
                                                        </div>
                                                        {errors[`custom_fields.${field.id}`] && (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {errors[`custom_fields.${field.id}`]}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="px-6 py-6 bg-gray-50 text-right border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <Link
                                            href={route('recruitment.show', recruitment.id)}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Annuler
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.resume}
                                            className={`inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white ${
                                                processing || !data.resume 
                                                    ? 'bg-blue-300 cursor-not-allowed' 
                                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[220px]`}
                                        >
                                            {processing ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Envoi en cours...
                                                </>
                                            ) : (
                                                'Soumettre ma candidature'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
