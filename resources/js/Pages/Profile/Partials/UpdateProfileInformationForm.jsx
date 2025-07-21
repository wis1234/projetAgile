import { useRef, useState } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;
    const [preview, setPreview] = useState(user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`);
    const fileInput = useRef();
    const [globalSuccess, setGlobalSuccess] = useState('');
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
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
        patch(route('profile.update'), {
            forceFormData: true,
            onSuccess: (page) => {
                if (page.props?.success) setGlobalSuccess(page.props.success);
                if (page.props?.user) window.location.reload();
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
        <section className={`w-full max-w-2xl mx-auto flex flex-col items-center ${className}`}>
            {globalSuccess && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-green-100 text-green-800 font-semibold text-center w-full">
                    {globalSuccess}
                </div>
            )}
            <div className="flex flex-col items-center mb-8 w-full">
                <div className="relative group mb-4">
                    <img
                        src={preview}
                        alt="avatar"
                        className="w-32 h-32 rounded-full border-4 border-blue-400 object-cover cursor-pointer hover:opacity-80 transition"
                        onClick={() => fileInput.current.click()}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInput}
                        onChange={handlePhotoChange}
                    />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none">
                        Changer la photo
                    </div>
                </div>
                {data.profile_photo && (
                    <span className="text-xs text-gray-500">{data.profile_photo.name}</span>
                )}
                <InputError className="mt-2" message={errors.profile_photo} />
            </div>
            <form onSubmit={submit} className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="md:col-span-2">
                    <InputLabel htmlFor="bio" value="Bio" />
                    <textarea
                        id="bio"
                        className="mt-1 block w-full rounded border-gray-300 dark:bg-gray-800 dark:text-white min-h-[80px]"
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        rows={3}
                    />
                    <InputError className="mt-2" message={errors.bio} />
                </div>
                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="md:col-span-2">
                        <p className="mt-2 text-sm text-gray-800">
                            Votre adresse email n'est pas vérifiée.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                <div className="md:col-span-2 flex flex-col items-center mt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full max-w-xs rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-3 shadow-sm transition disabled:opacity-50"
                    >
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600 mt-2">Enregistré.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
