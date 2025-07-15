import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Notification from '@/Components/Notification';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [preview, setPreview] = useState(user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`);
    const fileInput = useRef();
    const [globalSuccess, setGlobalSuccess] = useState('');

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            profile_photo: null,
            phone: user.phone || '',
            bio: user.bio || '',
            job_title: user.job_title || '',
            company: user.company || '',
        });

    const submit = (e) => {
        e.preventDefault();
        console.log('Données envoyées:', data);
        patch(route('profile.update'), {
            forceFormData: true,
            onSuccess: (page) => {
                if (page.props?.success) {
                    setGlobalSuccess(page.props.success);
                }
                // Rafraîchir le user dans usePage().props.auth.user si possible
                if (page.props?.user) {
                    // Méthode simple : recharger la page pour tout synchroniser
                    window.location.reload();
                }
            },
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('profile_photo', file);
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <section className={className}>
            <Notification message={globalSuccess} type="success" />
            <header>
                <h2 className="text-lg font-medium text-gray-900">Mon profil</h2>
                <p className="mt-1 text-sm text-gray-600">Modifiez vos informations personnelles et votre photo de profil.</p>
            </header>
            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="flex items-center gap-6">
                    <img src={preview} alt="avatar" className="w-20 h-20 rounded-full border-2 border-blue-400 shadow" />
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInput}
                            onChange={handlePhotoChange}
                        />
                        <button type="button" className="btn btn-secondary" onClick={() => fileInput.current.click()}>
                            Changer la photo
                        </button>
                        {data.profile_photo && (
                            <span className="ml-2 text-xs text-gray-500">{data.profile_photo.name}</span>
                        )}
                        <InputError className="mt-2" message={errors.profile_photo} />
                    </div>
                </div>
                <div>
                    <InputLabel htmlFor="name" value="Nom" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
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
                        autoComplete="username"
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
                    />
                    <InputError className="mt-2" message={errors.phone} />
                </div>
                <div>
                    <InputLabel htmlFor="job_title" value="Poste" />
                    <TextInput
                        id="job_title"
                        type="text"
                        className="mt-1 block w-full"
                        value={data.job_title}
                        onChange={(e) => setData('job_title', e.target.value)}
                        autoComplete="organization-title"
                    />
                    <InputError className="mt-2" message={errors.job_title} />
                </div>
                <div>
                    <InputLabel htmlFor="company" value="Entreprise" />
                    <TextInput
                        id="company"
                        type="text"
                        className="mt-1 block w-full"
                        value={data.company}
                        onChange={(e) => setData('company', e.target.value)}
                        autoComplete="organization"
                    />
                    <InputError className="mt-2" message={errors.company} />
                </div>
                <div>
                    <InputLabel htmlFor="bio" value="Bio" />
                    <textarea
                        id="bio"
                        className="mt-1 block w-full rounded border-gray-300 dark:bg-gray-800 dark:text-white"
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        rows={3}
                    />
                    <InputError className="mt-2" message={errors.bio} />
                </div>
                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Votre adresse email n'est pas vérifiée.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Cliquez ici pour renvoyer l'email de vérification.
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Un nouveau lien de vérification a été envoyé à votre adresse email.
                            </div>
                        )}
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Enregistrer</PrimaryButton>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Enregistré.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
