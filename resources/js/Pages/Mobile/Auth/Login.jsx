// resources/js/Pages/Mobile/Login.jsx
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { FaEnvelope, FaLock, FaSignInAlt, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export default function MobileLogin({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const { props } = usePage();
    const errorMessage = props.message || '';
    const errorStatus = props.status || '';
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div
            className="min-h-[100dvh] flex flex-col bg-slate-950 dark:bg-black"
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <Head title="Connexion" />

            <div className="flex-1 flex flex-col justify-center px-5 py-8 relative z-10 max-w-md w-full mx-auto">

                {/* ─── En-tête : logo + titre, façon écran d'accueil natif ─── */}
                <div className="flex flex-col items-center text-center mb-8 text-white">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-blue-600/20 flex items-center justify-center mb-4 p-2.5">
                        <img
                            src="/logo-proja.png"
                            alt="ProJA"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-extrabold mb-1">Connexion</h1>
                    <p className="text-sm text-slate-400">Heureux de vous revoir !</p>
                </div>

                {/* ─── Messages de statut ─── */}
                {status && (
                    <div className="mb-4 flex items-start gap-2.5 rounded-2xl px-4 py-3 bg-green-50 border border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
                        <p className="text-sm font-medium leading-snug">{status}</p>
                    </div>
                )}

                {errorStatus === 401 && errorMessage && (
                    <div className="mb-4 flex items-start gap-2.5 rounded-2xl px-4 py-3 bg-red-50 border border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                        <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-red-500" />
                        <p className="text-sm font-medium leading-snug">{errorMessage}</p>
                    </div>
                )}

                {/* ─── Carte formulaire ─── */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                Adresse email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <FaEnvelope className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="pl-11 w-full h-12 rounded-xl text-base text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950"
                                    autoComplete="email"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1.5" />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <FaLock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </div>
                                <TextInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    className="pl-11 pr-11 w-full h-12 rounded-xl text-base text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 active:scale-90 transition-transform"
                                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1.5" />
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-y-2 pt-1">
                            <div className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <label htmlFor="remember" className="ml-2 text-xs text-slate-600 dark:text-slate-300">
                                    Se souvenir de moi
                                </label>
                            </div>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 h-13 rounded-2xl text-base font-bold text-white bg-blue-600 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-blue-600/25 mt-2"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <FaSignInAlt className="h-4.5 w-4.5" />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* ─── Lien inscription ─── */}
                <div className="mt-6 text-center">
                            <p className="text-sm text-slate-400">
                        Pas de compte ?{' '}
                        <Link href={route('register')} className="font-semibold text-blue-600 dark:text-blue-400">
                            S'inscrire
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}