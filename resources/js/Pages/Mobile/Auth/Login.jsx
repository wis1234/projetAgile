// resources/js/Pages/Mobile/Login.jsx
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { FaEnvelope, FaLock, FaExclamationTriangle, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';
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
            className="min-h-[100dvh] flex flex-col bg-white"
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <Head title="Connexion" />

            <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-md w-full mx-auto">

                {/* ─── Header : logo + titre ─── */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-20 h-20 rounded-[22px] bg-white shadow-md shadow-slate-200 ring-1 ring-slate-100 flex items-center justify-center mb-5 p-3">
                        <img
                            src="/logo-proja.png"
                            alt="ProJA"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-[26px] leading-tight font-extrabold text-slate-900 mb-1.5">
                        Content de vous revoir
                    </h1>
                    <p className="text-sm text-slate-500">
                        Connectez-vous pour continuer
                    </p>
                </div>

                {/* ─── Messages de statut ─── */}
                {status && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-2xl px-4 py-3 bg-emerald-50 border border-emerald-100">
                        <p className="text-sm font-medium leading-snug text-emerald-700">{status}</p>
                    </div>
                )}

                {errorStatus === 401 && errorMessage && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-2xl px-4 py-3 bg-red-50 border border-red-100">
                        <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-red-500 h-4 w-4" />
                        <p className="text-sm font-medium leading-snug text-red-700">{errorMessage}</p>
                    </div>
                )}

                {/* ─── Formulaire ─── */}
                <form onSubmit={submit} className="space-y-5">

                    {/* Compartiment Email */}
                    <div>
                        <label htmlFor="email" className="block text-[13px] font-semibold text-slate-700 mb-2">
                            Adresse email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaEnvelope className="h-4 w-4 text-slate-400" />
                            </div>
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                placeholder="vous@exemple.com"
                                className="pl-11 w-full h-14 rounded-2xl text-[15px] text-slate-900 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors placeholder:text-slate-400"
                                autoComplete="email"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                        </div>
                        <InputError message={errors.email} className="mt-1.5" />
                    </div>

                    {/* Compartiment Mot de passe */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="password" className="block text-[13px] font-semibold text-slate-700">
                                Mot de passe
                            </label>
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-[13px] text-blue-600 font-semibold"
                                >
                                    Oublié ?
                                </Link>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaLock className="h-4 w-4 text-slate-400" />
                            </div>
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                placeholder="••••••••"
                                className="pl-11 pr-12 w-full h-14 rounded-2xl text-[15px] text-slate-900 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors placeholder:text-slate-400"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 active:scale-90 transition-transform"
                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                tabIndex={-1}
                            >
                                {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-1.5" />
                    </div>

                    {/* Compartiment Se souvenir */}
                    <div className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <label htmlFor="remember" className="ml-2.5 text-[13px] text-slate-600">
                            Rester connecté
                        </label>
                    </div>

                    {/* Compartiment Bouton */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl text-[15px] font-bold text-white bg-slate-900 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:active:scale-100 shadow-lg shadow-slate-900/10 mt-2"
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
                                Se connecter
                                <FaArrowRight className="h-3.5 w-3.5" />
                            </>
                        )}
                    </button>
                </form>

                {/* ─── Séparateur ─── */}
                <div className="flex items-center gap-3 my-8">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-xs text-slate-400 font-medium">ou</span>
                    <div className="h-px flex-1 bg-slate-100" />
                </div>

                {/* ─── Lien inscription ─── */}
                <div className="text-center">
                    <p className="text-sm text-slate-500">
                        Pas encore de compte ?{' '}
                        <Link href={route('register')} className="font-semibold text-slate-900">
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}