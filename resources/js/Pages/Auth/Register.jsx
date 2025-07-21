import { Head, Link, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaBuilding, FaIdBadge, FaCamera } from 'react-icons/fa';
import ApplicationLogo from '@/Components/ApplicationLogo';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        profile_photo: null,
        phone: '',
        job_title: '',
        company: '',
        bio: '',
    });
    const photoInput = useRef();
    const [photoPreview, setPhotoPreview] = useState(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoPreview(URL.createObjectURL(file));
        setData('profile_photo', file);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            forceFormData: true,
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans p-4">
            <Head title="Inscription" />

            <div className="flex flex-col md:flex-row w-full max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">

                {/* Left Panel: Branding */}
                <div className="hidden md:flex flex-col justify-center items-center w-full md:w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white text-center">
                    <ApplicationLogo className="text-6xl mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Rejoignez ProjA</h1>
                    <p className="text-blue-200">Créez votre compte et commencez à gérer vos projets plus efficacement.</p>
                </div>

                {/* Right Panel: Form */}
                <div className="w-full md:w-3/5 p-8 md:p-12">
                    <div className="md:hidden text-center mb-8">
                        <ApplicationLogo className="text-5xl" />
                    </div>

                    <h2 className="text-3xl font-bold text-center text-blue-800 dark:text-blue-200 mb-2">
                        Créer un compte
                    </h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
                        C'est rapide et facile.
                    </p>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="relative">
                                <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                <TextInput id="name" name="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full pl-12" placeholder="Nom complet" autoComplete="name" required isFocused />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                <TextInput id="email" type="email" name="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full pl-12" placeholder="Adresse email" autoComplete="username" required />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                <TextInput id="password" type="password" name="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="w-full pl-12" placeholder="Mot de passe" autoComplete="new-password" required />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            {/* Confirm Password */}
                            <div className="relative">
                                <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className="w-full pl-12" placeholder="Confirmer le mot de passe" autoComplete="new-password" required />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>

                             {/* Phone */}
                             <div className="relative">
                                <FaPhone className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                <TextInput id="phone" type="tel" name="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="w-full pl-12" placeholder="Téléphone (optionnel)" autoComplete="tel" />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>

                            {/* Job Title */}
                            <div className="relative">
                                <FaIdBadge className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                <TextInput id="job_title" type="text" name="job_title" value={data.job_title} onChange={(e) => setData('job_title', e.target.value)} className="w-full pl-12" placeholder="Poste (optionnel)" autoComplete="organization-title" />
                                <InputError message={errors.job_title} className="mt-2" />
                            </div>
                        </div>

                        {/* Company */}
                        <div className="relative">
                            <FaBuilding className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                            <TextInput id="company" type="text" name="company" value={data.company} onChange={(e) => setData('company', e.target.value)} className="w-full pl-12" placeholder="Entreprise (optionnel)" autoComplete="organization" />
                            <InputError message={errors.company} className="mt-2" />
                        </div>

                        {/* Profile Photo & Bio */}
                        <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                <img src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'A')}&background=0D8ABC&color=fff&size=128`} alt="Aperçu" className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600" />
                                <button type="button" onClick={() => photoInput.current.click()} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                                    Photo de profil
                                </button>
                                <input type="file" ref={photoInput} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                                <InputError message={errors.profile_photo} className="mt-2" />
                            </div>
                            <div className="relative w-full">
                                <textarea id="bio" name="bio" value={data.bio} onChange={(e) => setData('bio', e.target.value)} className="w-full h-full min-h-[96px] p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Une courte biographie (optionnel)"></textarea>
                                <InputError message={errors.bio} className="mt-2" />
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-3 bg-blue-700 text-white text-base font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105 disabled:opacity-50"
                        >
                            Créer le compte
                        </button>

                        {/* Login link */}
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
                            Déjà un compte ?{' '}
                            <Link href={route('login')} className="font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition">
                                Se connecter
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
