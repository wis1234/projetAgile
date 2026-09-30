import { useRef, useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { CameraIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { SectionCard, Field, SaveBar, inputCls } from '@/Components/Profile/ui';

const fallbackAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=2563eb&color=fff&size=160`;

export default function UpdateProfileInformation({ profile: user, mustVerifyEmail, status }) {
    const [preview, setPreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const fileInput = useRef();

    const { data, setData, errors, processing, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
        profile_photo: null,
        phone: user.phone || '',
        bio: user.bio || '',
        job_title: user.job_title || '',
        company: user.company || '',
    });

    useEffect(() => {
        setPreview(user.profile_photo_url || fallbackAvatar(user.name));
    }, [user]);

    const [saved, setSaved] = useState(false);
    const submit = (e) => {
        e.preventDefault();
        setIsUploading(true);
        router.post(route('profile.update'), { ...data, _method: 'patch' }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); },
            onFinish: () => setIsUploading(false),
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoError('');
        if (file.size > 1024 * 1024) return setPhotoError('La photo ne doit pas dépasser 1 Mo.');
        if (!file.type.startsWith('image/')) return setPhotoError('Veuillez sélectionner une image valide.');
        const reader = new FileReader();
        reader.onload = (ev) => { setPreview(ev.target.result); setData('profile_photo', file); };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        if (!window.confirm('Supprimer votre photo de profil ?')) return;
        setData('profile_photo', null);
        setPreview(fallbackAvatar(data.name));
        router.delete(route('profile.photo.destroy'), { preserveScroll: true });
    };

    const busy = processing || isUploading;

    return (
        <form onSubmit={submit}>
            <SectionCard
                id="profil"
                icon={UserCircleIcon}
                title="Informations personnelles"
                description="Ces informations sont visibles par les membres de vos projets."
                footer={<SaveBar processing={busy} saved={saved || recentlySuccessful} note="Les champs marqués * sont obligatoires." />}
            >
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* Photo */}
                    <div className="flex shrink-0 flex-col items-center md:w-44">
                        <button
                            type="button"
                            onClick={() => fileInput.current.click()}
                            className="group relative h-32 w-32 overflow-hidden rounded-2xl ring-4 ring-blue-50 transition hover:ring-blue-100 dark:ring-slate-700"
                            aria-label="Changer la photo"
                        >
                            <img src={preview} alt="Photo de profil" className="h-full w-full object-cover" />
                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-900/55 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                                <CameraIcon className="h-6 w-6" /> Changer
                            </span>
                        </button>
                        <input type="file" accept="image/*" className="hidden" ref={fileInput} onChange={handlePhotoChange} disabled={busy} />
                        <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">JPG, PNG · 1 Mo maximum</p>
                        {data.profile_photo && (
                            <p className="mt-2 max-w-full truncate text-xs font-medium text-blue-600 dark:text-blue-300">{data.profile_photo.name}</p>
                        )}
                        {user.profile_photo_path && !data.profile_photo && (
                            <button type="button" onClick={removePhoto} disabled={busy}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400">
                                <TrashIcon className="h-4 w-4" /> Supprimer la photo
                            </button>
                        )}
                        {(photoError || errors.profile_photo) && (
                            <p className="mt-2 text-center text-xs font-medium text-red-600">{photoError || errors.profile_photo}</p>
                        )}
                    </div>

                    {/* Champs */}
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
                        <Field label="Nom complet *" htmlFor="name" error={errors.name}>
                            <input id="name" className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} required autoComplete="name" disabled={busy} />
                        </Field>
                        <Field label="Adresse e-mail *" htmlFor="email" error={errors.email}
                            hint={data.email !== user.email ? "Un nouvel e-mail devra être vérifié après l'enregistrement." : undefined}>
                            <input id="email" type="email" className={inputCls} value={data.email} onChange={(e) => setData('email', e.target.value)} required autoComplete="email" disabled={busy} />
                        </Field>
                        <Field label="Téléphone" htmlFor="phone" error={errors.phone}>
                            <input id="phone" type="tel" className={inputCls} value={data.phone} onChange={(e) => setData('phone', e.target.value)} autoComplete="tel" placeholder="+229 …" disabled={busy} />
                        </Field>
                        <Field label="Poste" htmlFor="job_title" error={errors.job_title}>
                            <input id="job_title" className={inputCls} value={data.job_title} onChange={(e) => setData('job_title', e.target.value)} autoComplete="organization-title" disabled={busy} />
                        </Field>
                        <Field label="Entreprise" htmlFor="company" error={errors.company} className="sm:col-span-2">
                            <input id="company" className={inputCls} value={data.company} onChange={(e) => setData('company', e.target.value)} autoComplete="organization" disabled={busy} />
                        </Field>
                        <Field label="À propos de moi" htmlFor="bio" error={errors.bio} className="sm:col-span-2"
                            hint={`${(data.bio || '').length} caractères · Une brève présentation pour les autres membres.`}>
                            <textarea id="bio" rows={4} className={`${inputCls} resize-y`} value={data.bio} onChange={(e) => setData('bio', e.target.value)} disabled={busy} />
                        </Field>
                        {status && <p className="sm:col-span-2 text-sm text-emerald-600">{status}</p>}
                    </div>
                </div>
            </SectionCard>
        </form>
    );
}
