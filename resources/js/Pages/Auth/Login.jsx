import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { FaEnvelope, FaLock, FaSignInAlt, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import GlobalFooter from '@/Components/GlobalFooter';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const { props } = usePage();
    const errorMessage = props.message || '';
    const errorStatus = props.status || '';
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        try {
            const savedEmail = localStorage.getItem('proja_saved_email');
            const savedRemember = localStorage.getItem('proja_remember_login');
            if (savedEmail) {
                setData(prev => ({
                    ...prev,
                    email: savedEmail,
                    remember: savedRemember !== 'false',
                }));
            }
        } catch {
            // Ignore
        }
    }, []);

    useEffect(() => {
        // Effacer le message d'erreur après 10 secondes
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
            onSuccess: () => {
                try {
                    if (data.remember) {
                        localStorage.setItem('proja_saved_email', data.email);
                        localStorage.setItem('proja_remember_login', 'true');
                    } else {
                        localStorage.removeItem('proja_saved_email');
                        localStorage.removeItem('proja_remember_login');
                    }
                } catch {
                    // Ignore
                }
            },
            onFinish: () => reset('password'),
        });
    };

    return (
        <div
            className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 font-sans overflow-x-hidden"
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <Head title="Connexion" />

            {/* ═══════════════════ Décor d'arrière-plan (mobile) ═══════════════════ */}
            <div className="md:hidden pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden -z-0">
                <div className="absolute -top-24 -left-16 w-64 h-64 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -top-10 -right-10 w-56 h-56 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            <div className="flex-1 flex flex-col justify-center w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-10 relative z-10">

                {/* ═══════════════════ Carte mobile : logo + titre au-dessus, pas de split ═══════════════════ */}
                <div className="flex flex-col md:flex-row w-full bg-white dark:bg-gray-800 rounded-3xl md:rounded-2xl shadow-xl md:shadow-2xl overflow-hidden">

                    {/* Left Panel: Branding — desktop uniquement */}
                    <div className="hidden md:flex flex-col justify-center items-center w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white text-center">
                        <img
                            src="https://proja.kemtcenter.org/storage/public/task_comments/images/proja-logo.png"
                            alt="ProJA"
                            className="w-20 h-20 object-contain mb-4 drop-shadow-lg"
                        />
                        <h1 className="text-3xl font-bold mb-2">Bienvenue sur ProJA</h1>
                        <p className="text-blue-200 mb-8">Votre solution de gestion de projet moderne.</p>
                        <div className="mt-8">
                            <p className="text-blue-200">Pas compte ?</p>
                            <Link
                                href={route('register')}
                                className="mt-2 inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                S'inscrire
                            </Link>
                        </div>
                    </div>

                    {/* Right Panel: Form */}
                    <div className="w-full md:w-1/2 px-6 py-8 sm:p-10 flex flex-col justify-center">

                        {/* ── En-tête mobile : logo compact + titre ── */}
                        <div className="md:hidden flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-blue-600/20 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center mb-4 p-2.5">
                                <img
                                    src="https://proja.kemtcenter.org/storage/public/task_comments/images/proja-logo.png"
                                    alt="ProJA"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Votre solution de gestion de projet</p>
                        </div>

                        <div className="text-center mb-6 sm:mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-200 mb-1.5">
                                Connexion
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                                Heureux de vous revoir !
                            </p>
                        </div>

                        {/* Message de statut */}
                        {status && (
                            <div className="mb-5 sm:mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3 bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
                                <p className="text-sm font-medium leading-snug">{status}</p>
                            </div>
                        )}

                        {/* Message d'erreur 401 */}
                        {errorStatus === 401 && errorMessage && (
                            <div className="mb-5 sm:mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                                <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-red-500" />
                                <p className="text-sm font-medium leading-snug">{errorMessage}</p>
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4 sm:space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Adresse email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <FaEnvelope className="h-4.5 w-4.5 text-gray-400 flex-shrink-0" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="pl-11 w-full h-12 sm:h-11 rounded-xl text-base sm:text-sm"
                                        autoComplete="email"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1.5" />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <FaLock className="h-4.5 w-4.5 text-gray-400 flex-shrink-0" />
                                    </div>
                                    <TextInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        className="pl-11 pr-11 w-full h-12 sm:h-11 rounded-xl text-base sm:text-sm"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-90 transition-all"
                                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <FaEyeSlash className="h-4.5 w-4.5" /> : <FaEye className="h-4.5 w-4.5" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-1.5" />
                            </div>

                            <div className="flex items-center justify-between flex-wrap gap-y-2">
                                <div className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                        Se souvenir de moi
                                    </label>
                                </div>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group relative w-full flex items-center justify-center gap-2 h-12 sm:h-11 px-4 rounded-xl text-base sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-blue-600/25"
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
                            </div>
                        </form>

                        <div className="mt-6 text-center md:hidden">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Pas de compte ?{' '}
                                <Link href={route('register')} className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                                    S'inscrire
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mb-4 sm:mb-6 w-full text-center px-4">
                <GlobalFooter />
            </div>
        </div>
    );
}