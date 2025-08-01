import { useRef, useState, useEffect } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Textarea from '@/Components/Textarea';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const { user } = usePage().props.auth;
    const [preview, setPreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInput = useRef();
    
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
        profile_photo: null,
        phone: user.phone || '',
        bio: user.bio || '',
        job_title: user.job_title || '',
        company: user.company || '',
    });

    // Mettre à jour la prévisualisation quand l'utilisateur change
    useEffect(() => {
        if (user.profile_photo_url) {
            setPreview(user.profile_photo_url);
        } else {
            // Générer un avatar par défaut si pas de photo de profil
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0D8ABC&color=fff`;
            setPreview(defaultAvatar);
        }
    }, [user]);

    const submit = (e) => {
        e.preventDefault();
        setIsUploading(true);
        
        router.post(route('profile.update'), 
            { ...data, _method: 'patch' },
            {
                forceFormData: true,
                onSuccess: (page) => {
                    // Recharger la page pour s'assurer que tout est à jour
                    if (page.props?.flash?.success) {
                        setPreview(page.props.auth.user.profile_photo_url || preview);
                    }
                },
                onFinish: () => {
                    setIsUploading(false);
                },
                preserveScroll: true,
            }
        );
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Vérifier la taille du fichier (max 1MB)
        if (file.size > 1024 * 1024) {
            alert('La photo ne doit pas dépasser 1 Mo');
            return;
        }

        // Vérifier le type de fichier
        if (!file.type.match('image.*')) {
            alert('Veuillez sélectionner une image valide');
            return;
        }

        // Mettre à jour la prévisualisation
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPreview(ev.target.result);
            setData('profile_photo', file);
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setData('profile_photo', null);
        setPreview(`https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=0D8ABC&color=fff`);
        
        // Envoyer une requête pour supprimer la photo
        router.delete(route('profile.photo'), {
            preserveScroll: true,
            onSuccess: () => {
                // Mettre à jour la prévisualisation après suppression
                setPreview(`https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=0D8ABC&color=fff`);
            },
        });
    };

    return (
        <section className={`w-full max-w-4xl mx-auto ${className}`}>
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Informations du profil
                </h2>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Photo de profil */}
                    <div className="w-full md:w-1/3 flex flex-col items-center">
                        <div className="relative group mb-4">
                            <img
                                src={preview}
                                alt="Photo de profil"
                                className="w-40 h-40 rounded-full border-4 border-blue-400 object-cover cursor-pointer hover:opacity-80 transition"
                                onClick={() => fileInput.current.click()}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInput}
                                onChange={handlePhotoChange}
                                disabled={isUploading}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-50 rounded-full">
                                <span className="text-white font-medium">Changer</span>
                            </div>
                        </div>
                        
                        {data.profile_photo && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span className="truncate max-w-xs">{data.profile_photo.name}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData('profile_photo', null);
                                        fileInput.current.value = '';
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                    disabled={isUploading}
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        
                        {user.profile_photo_path && (
                            <button
                                type="button"
                                onClick={removePhoto}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                disabled={isUploading}
                            >
                                Supprimer la photo
                            </button>
                        )}
                        
                        <InputError className="mt-2" message={errors.profile_photo} />
                    </div>

                    {/* Formulaire */}
                    <div className="w-full md:w-2/3">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Nom complet" />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        isFocused
                                        autoComplete="name"
                                        disabled={isUploading}
                                    />
                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="email"
                                        disabled={isUploading}
                                    />
                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone" value="Téléphone" />
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        autoComplete="tel"
                                        disabled={isUploading}
                                    />
                                    <InputError className="mt-2" message={errors.phone} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="job_title" value="Poste" />
                                    <TextInput
                                        id="job_title"
                                        className="mt-1 block w-full"
                                        value={data.job_title}
                                        onChange={(e) => setData('job_title', e.target.value)}
                                        autoComplete="organization-title"
                                        disabled={isUploading}
                                    />
                                    <InputError className="mt-2" message={errors.job_title} />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="company" value="Entreprise" />
                                    <TextInput
                                        id="company"
                                        className="mt-1 block w-full"
                                        value={data.company}
                                        onChange={(e) => setData('company', e.target.value)}
                                        autoComplete="organization"
                                        disabled={isUploading}
                                    />
                                    <InputError className="mt-2" message={errors.company} />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="bio" value="À propos de moi" />
                                    <Textarea
                                        id="bio"
                                        className="mt-1 block w-full"
                                        value={data.bio}
                                        onChange={(e) => setData('bio', e.target.value)}
                                        rows={4}
                                        disabled={isUploading}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Une brève description de vous-même pour que les autres utilisateurs puissent mieux vous connaître.
                                    </p>
                                    <InputError className="mt-2" message={errors.bio} />
                                </div>
                            </div>

                            <div className="flex items-center justify-end mt-8">
                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        Enregistré.
                                    </p>
                                </Transition>

                                <PrimaryButton 
                                    className="ml-4" 
                                    disabled={processing || isUploading}
                                >
                                    {processing || isUploading ? 'Enregistrement...' : 'Enregistrer'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
