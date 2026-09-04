// resources/js/Pages/Mobile/Register.jsx
import { Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
    FaEye, FaEyeSlash, FaCheckCircle, FaShieldAlt, FaChevronLeft, FaArrowRight,
} from 'react-icons/fa';
import { InputError, PrimaryButton, TextInput } from '@/Components';

function passwordStrength(password) {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
        { label: 'Faible', color: 'bg-red-500' },
        { label: 'Moyen', color: 'bg-amber-500' },
        { label: 'Bon', color: 'bg-blue-500' },
        { label: 'Excellent', color: 'bg-emerald-500' },
    ];
    return { score, ...levels[Math.max(score - 1, 0)] };
}

const fieldClasses =
    'w-full h-14 rounded-2xl text-[15px] text-slate-900 bg-slate-50 border border-slate-200 ' +
    'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors placeholder:text-slate-400 px-4';

const fieldLabelClasses =
    'block text-[13px] font-semibold text-slate-700 mb-2';

export default function MobileRegister() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        recaptcha_token: '',
    });

    const recaptchaRef = useRef(null);
    const [recaptchaError, setRecaptchaError] = useState('');
    const [formError, setFormError] = useState('');
    const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const strength = useMemo(() => passwordStrength(data.password), [data.password]);
    const emailLooksValid = useMemo(
        () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        [data.email]
    );
    const passwordsMatch =
        data.password_confirmation.length > 0 && data.password === data.password_confirmation;

    const initializeRecaptcha = () => {
        if (!window.grecaptcha) return;

        const container = document.getElementById('recaptcha-element');
        if (container && container.hasChildNodes()) {
            setIsRecaptchaLoaded(true);
            return;
        }

        window.grecaptcha.ready(() => {
            try {
                const widgetId = window.grecaptcha.render('recaptcha-element', {
                    sitekey: window.recaptchaSiteKey || '6Lcvg8krAAAAAEoghMGKFg4jZwQkh-vYfzzYMFcN',
                    callback: onRecaptchaSuccess,
                    'expired-callback': onRecaptchaExpired,
                    'error-callback': onRecaptchaError,
                    theme: 'light',
                    size: 'normal',
                });
                recaptchaRef.current = widgetId;
                setIsRecaptchaLoaded(true);
                setRecaptchaError('');
            } catch (error) {
                console.error('Erreur lors du rendu de reCAPTCHA:', error);
                setRecaptchaError("La vérification de sécurité n'a pas pu se charger. Rechargez la page ou réessayez.");
                setIsRecaptchaLoaded(false);
            }
        });
    };

    const onRecaptchaSuccess = (token) => {
        setData('recaptcha_token', token);
        setRecaptchaError('');
        setIsRecaptchaLoaded(true);
    };
    const onRecaptchaExpired = () => {
        setData('recaptcha_token', '');
        setRecaptchaError('La vérification a expiré. Veuillez réessayer.');
        setIsRecaptchaLoaded(false);
    };
    const onRecaptchaError = () => {
        setData('recaptcha_token', '');
        setRecaptchaError('Une erreur est survenue. Veuillez réessayer.');
        setIsRecaptchaLoaded(false);
    };

    useEffect(() => {
        const handleRecaptchaLoaded = () => initializeRecaptcha();
        if (window.grecaptcha) handleRecaptchaLoaded();
        document.addEventListener('recaptcha-loaded', handleRecaptchaLoaded);
        return () => document.removeEventListener('recaptcha-loaded', handleRecaptchaLoaded);
    }, []);

    const submit = (e) => {
        e.preventDefault();

        if (!data.recaptcha_token) {
            if (!isRecaptchaLoaded) {
                setRecaptchaError("La vérification de sécurité n'a pas pu se charger. Nouvelle tentative en cours…");
                initializeRecaptcha();
            } else {
                setRecaptchaError("Veuillez cocher la case « Je ne suis pas un robot » avant de continuer.");
            }
            return;
        }

        setFormError('');

        post(route('register'), {
            onSuccess: () => {
                if (window.grecaptcha) window.grecaptcha.reset(recaptchaRef.current ?? undefined);
            },
            onError: (errs) => {
                if (errs.recaptcha_token) {
                    setRecaptchaError(errs.recaptcha_token);
                } else if (Object.keys(errs).length === 0) {
                    setFormError("Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
                }
                if (window.grecaptcha) window.grecaptcha.reset(recaptchaRef.current ?? undefined);
                setData('recaptcha_token', '');
            },
            preserveScroll: true,
            onFinish: () => setData('recaptcha_token', ''),
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
            {/* ─── Barre de navigation native : retour vers le login ─── */}
            <div className="flex items-center gap-1 px-3 py-3 sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-slate-100">
                <Link
                    href={route('login')}
                    className="w-10 h-10 flex items-center justify-center rounded-full active:bg-slate-100 transition-colors"
                    aria-label="Retour à la connexion"
                >
                    <FaChevronLeft className="h-4 w-4 text-slate-700" />
                </Link>
                <span className="text-sm font-semibold text-slate-800">Connexion</span>
            </div>

            <div className="flex-1 px-6 pt-8 pb-10 max-w-md w-full mx-auto">

                <div className="text-center mb-8">
                    <h1 className="text-[26px] leading-tight font-extrabold text-slate-900 mb-1.5">
                        Créer un compte
                    </h1>
                    <p className="text-sm text-slate-500">
                        Moins de 2 minutes, sans carte bancaire.
                    </p>
                </div>

                {formError && (
                    <div className="mb-5 rounded-2xl px-4 py-3 bg-red-50 border border-red-100" role="alert">
                        <p className="text-sm font-medium leading-snug text-red-700">{formError}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5" noValidate>

                    {/* Compartiment Nom */}
                    <div>
                        <label htmlFor="name" className={fieldLabelClasses}>Nom complet</label>
                        <TextInput
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            className={fieldClasses}
                            placeholder="Ronaldo Agbohou"
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            isFocused
                        />
                        <InputError message={errors.name} className="mt-1.5" />
                    </div>

                    {/* Compartiment Email */}
                    <div>
                        <label htmlFor="email" className={fieldLabelClasses}>Adresse email</label>
                        <div className="relative">
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className={`${fieldClasses} pr-11`}
                                placeholder="vous@entreprise.com"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                            />
                            {emailLooksValid && (
                                <FaCheckCircle className="absolute inset-y-0 right-4 my-auto h-4 w-4 text-emerald-500" />
                            )}
                        </div>
                        <InputError message={errors.email} className="mt-1.5" />
                    </div>

                    {/* Compartiment Mot de passe */}
                    <div>
                        <label htmlFor="password" className={fieldLabelClasses}>Mot de passe</label>
                        <div className="relative">
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className={`${fieldClasses} pr-11`}
                                placeholder="8 caractères minimum"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-4 flex items-center text-slate-400 active:scale-90 transition-transform"
                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                tabIndex={-1}
                            >
                                {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                            </button>
                        </div>
                        {data.password.length > 0 && (
                            <div className="mt-2.5">
                                <div className="flex gap-1">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : 'bg-slate-200'}`}
                                        />
                                    ))}
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Robustesse : <span className="font-semibold">{strength.label}</span>
                                </p>
                            </div>
                        )}
                        <InputError message={errors.password} className="mt-1.5" />
                    </div>

                    {/* Compartiment Confirmation mot de passe */}
                    <div>
                        <label htmlFor="password_confirmation" className={fieldLabelClasses}>Confirmer le mot de passe</label>
                        <div className="relative">
                            <TextInput
                                id="password_confirmation"
                                type={showPasswordConfirm ? 'text' : 'password'}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className={`${fieldClasses} pr-11`}
                                placeholder="Ressaisissez le mot de passe"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswordConfirm((v) => !v)}
                                className="absolute inset-y-0 right-4 flex items-center text-slate-400 active:scale-90 transition-transform"
                                aria-label={showPasswordConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                tabIndex={-1}
                            >
                                {showPasswordConfirm ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordsMatch && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <FaCheckCircle className="h-3 w-3" /> Les mots de passe correspondent
                            </p>
                        )}
                        <InputError message={errors.password_confirmation} className="mt-1.5" />
                    </div>

                    {/* Compartiment reCAPTCHA */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <FaShieldAlt className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-600">
                                Vérification de sécurité
                            </span>
                        </div>
                        <div
                            id="recaptcha-element"
                            className={errors.recaptcha_token || recaptchaError ? 'rounded-xl border border-red-400 p-2 bg-white' : ''}
                        />
                        {!isRecaptchaLoaded && !recaptchaError && (
                            <p className="mt-2.5 text-xs text-amber-600">
                                Chargement de la vérification…
                            </p>
                        )}
                        {recaptchaError && (
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <p className="text-xs text-red-600" role="alert">{recaptchaError}</p>
                                {!isRecaptchaLoaded && (
                                    <button
                                        type="button"
                                        onClick={initializeRecaptcha}
                                        className="text-xs font-semibold text-blue-600 underline"
                                    >
                                        Réessayer
                                    </button>
                                )}
                            </div>
                        )}
                        {errors.recaptcha_token && (
                            <p className="mt-2.5 text-xs text-red-600" role="alert">{errors.recaptcha_token}</p>
                        )}
                    </div>

                    {/* Compartiment Bouton */}
                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                        className="relative w-full h-14 rounded-2xl text-[15px] font-bold text-white bg-gradient-to-b from-blue-500 to-blue-600 active:scale-[0.98] active:from-blue-600 active:to-blue-700 transition-transform disabled:active:scale-100 shadow-lg shadow-blue-600/25 mt-2 overflow-hidden"
                    >
                        {/* État normal */}
                        <span
                            className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${
                                processing ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
                            }`}
                        >
                            Créer mon compte
                            <FaArrowRight className="h-3.5 w-3.5" />
                        </span>

                        {/* État chargement (preloader) */}
                        <span
                            className={`absolute inset-0 flex items-center justify-center gap-2.5 transition-all duration-300 ${
                                processing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
                            }`}
                        >
                            <span className="relative h-5 w-5 flex-shrink-0">
                                <span className="absolute inset-0 rounded-full border-2 border-white/25" />
                                <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
                            </span>
                            <span className="tracking-wide">Inscription...</span>
                        </span>
                    </PrimaryButton>

                    <p className="text-center text-xs text-slate-500 leading-relaxed">
                        En créant un compte, vous acceptez nos{' '}
                        <a href="/conditions" className="underline text-slate-700 font-medium">conditions d'utilisation</a> et notre{' '}
                        <a href="/confidentialite" className="underline text-slate-700 font-medium">politique de confidentialité</a>.
                    </p>
                </form>

                {/* ─── Séparateur ─── */}
                <div className="flex items-center gap-3 my-8">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-xs text-slate-400 font-medium">ou</span>
                    <div className="h-px flex-1 bg-slate-100" />
                </div>

                {/* ─── Lien connexion ─── */}
                <div className="text-center">
                    <p className="text-sm text-slate-500">
                        Vous avez déjà un compte ?{' '}
                        <Link href={route('login')} className="font-semibold text-slate-900">
                            Connectez-vous
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}