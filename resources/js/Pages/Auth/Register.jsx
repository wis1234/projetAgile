import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaBuilding, FaIdBadge, FaRegCommentDots, FaCamera } from 'react-icons/fa';

export default function Register() {
    const fileInput = useRef();
    const [preview, setPreview] = useState(null);
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

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            forceFormData: true,
            onFinish: () => reset('password', 'password_confirmation'),
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
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
            <Head title="Inscription" />
            {/* Motif décoratif en fond */}
            <div className="absolute inset-0 pointer-events-none select-none opacity-30 z-0" aria-hidden>
                <svg width="100%" height="100%" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="bg-grad" cx="50%" cy="50%" r="80%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#bg-grad)" />
                </svg>
            </div>
            <form
                onSubmit={submit}
                className="relative z-10 w-full max-w-2xl mx-auto bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl shadow-2xl p-12 space-y-10 animate-fade-in"
                style={{ boxShadow: '0 8px 40px 0 rgba(80, 80, 180, 0.18)' }}
            >
                <h1 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-purple-600 to-pink-400 mb-8 tracking-tight drop-shadow-lg">Créer un compte ProJA</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaUser className="text-blue-500 text-xl" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 text-gray-900"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder="Nom complet"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaEnvelope className="text-blue-500 text-xl" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 text-gray-900"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="Adresse email"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaLock className="text-blue-500 text-xl" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 text-gray-900"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            placeholder="Mot de passe"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaLock className="text-blue-500 text-xl" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 text-gray-900"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                            placeholder="Confirmer le mot de passe"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaPhone className="text-blue-500 text-xl" />
                        <TextInput
                            id="phone"
                            type="tel"
                            name="phone"
                            value={data.phone}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 text-gray-900"
                            autoComplete="tel"
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="Téléphone (optionnel)"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaIdBadge className="text-blue-500 text-xl" />
                        <TextInput
                            id="job_title"
                            type="text"
                            name="job_title"
                            value={data.job_title}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 text-gray-900"
                            autoComplete="organization-title"
                            onChange={(e) => setData('job_title', e.target.value)}
                            placeholder="Poste (optionnel)"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaBuilding className="text-blue-500 text-xl" />
                        <TextInput
                            id="company"
                            type="text"
                            name="company"
                            value={data.company}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 text-gray-900"
                            autoComplete="organization"
                            onChange={(e) => setData('company', e.target.value)}
                            placeholder="Entreprise (optionnel)"
                        />
                    </div>
                    <div className="md:col-span-2 flex items-start gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaRegCommentDots className="text-blue-500 text-xl mt-1" />
                        <textarea
                            id="bio"
                            name="bio"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 text-gray-900 resize-none min-h-[60px]"
                            value={data.bio}
                            onChange={(e) => setData('bio', e.target.value)}
                            rows={3}
                            placeholder="Quelques mots sur vous... (optionnel)"
                        />
                    </div>
                </div>
                {/* Photo de profil en bas */}
                <div className="flex flex-col items-center gap-4 mt-8">
                    <div className="relative group">
                        <img src={preview || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name || 'User') + '&background=0D8ABC&color=fff'} alt="avatar" className="w-28 h-28 rounded-full border-4 border-blue-400 shadow-lg object-cover transition-all duration-300 group-hover:scale-105 bg-white" />
                        <button
                            type="button"
                            className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg border-2 border-white transition-all"
                            onClick={() => fileInput.current.click()}
                            title="Choisir une photo"
                        >
                            <FaCamera size={18} />
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInput}
                            onChange={handlePhotoChange}
                        />
                    </div>
                    {data.profile_photo && (
                        <span className="ml-2 text-xs text-gray-700 bg-blue-100 px-2 py-1 rounded-full">{data.profile_photo.name}</span>
                    )}
                    <InputError className="mt-2" message={errors.profile_photo} />
                </div>
                <div className="flex justify-center mt-8">
                    <button
                        type="submit"
                        className="w-full md:w-auto px-16 py-4 text-2xl font-bold rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 text-white shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
                        disabled={processing}
                    >
                        S'inscrire
                    </button>
                </div>
                <div className="text-center mt-4">
                    <span className="text-base text-gray-700">Déjà inscrit ? </span>
                    <Link
                        href={route('login')}
                        className="rounded-md text-base text-blue-700 underline hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
                    >
                        Se connecter
                    </Link>
                </div>
            </form>
        </div>
    );
}
