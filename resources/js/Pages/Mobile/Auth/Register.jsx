// resources/js/Pages/Mobile/Register.jsx
import { Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
    FaEye, FaEyeSlash, FaCheckCircle, FaShieldAlt, FaChevronLeft,
} from 'react-icons/fa';
import { InputError, PrimaryButton, TextInput } from '@/Components';

function passwordStrength(password) {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200 dark:bg-gray-700' };
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
    'w-full h-12 rounded-2xl text-base bg-gray-50 dark:bg-gray-900/40 border-transparent ' +
    'focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 px-4';

const fieldLabelClasses =
    'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide';

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
            className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900"
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {/* ─── Barre de navigation native : retour vers le login ─── */}
            <div className="flex items-center gap-1 px-2 py-3 sticky top-0 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur z-10">
                <Link
                    href={route('login')}
                    className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-200 dark:active:bg-gray-800 transition-colors"
                    aria-label="Retour à la connexion"
                >
                    <FaChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                </Link>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Connexion</span>
            </div>

            <div className="flex-1 px-4 pb-8 relative z-0">

                <div className="text-center mb-6 mt-2">
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Créer un compte</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Moins de 2 minutes, sans carte bancaire.</p>
                </div>

                {formError && (
                    <div className="mb-4 rounded-2xl px-4 py-3 bg-red-50 border border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200" role="alert">
                        <p className="text-sm font-medium leading-snug">{formError}</p>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                    <form onSubmit={submit} className="space-y-4" noValidate>
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

                        <div>
                            <label htmlFor="email" className={fieldLabelClasses}>Adresse email</label>
                            <div className="relative">
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className={`${fieldClasses} pr-10`}
                                    placeholder="vous@entreprise.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                                {emailLooksValid && (
                                    <FaCheckCircle className="absolute inset-y-0 right-3.5 my-auto h-4 w-4 text-emerald-500" />
                                )}
                            </div>
                            <InputError message={errors.email} className="mt-1.5" />
                        </div>

                        <div>
                            <label htmlFor="password" className={fieldLabelClasses}>Mot de passe</label>
                            <div className="relative">
                                <TextInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    className={`${fieldClasses} pr-10`}
                                    placeholder="8 caractères minimum"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 active:scale-90 transition-transform"
                                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                                </button>
                            </div>
                            {data.password.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Robustesse : {strength.label}
                                    </p>
                                </div>
                            )}
                            <InputError message={errors.password} className="mt-1.5" />
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className={fieldLabelClasses}>Confirmer le mot de passe</label>
                            <div className="relative">
                                <TextInput
                                    id="password_confirmation"
                                    type={showPasswordConfirm ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className={`${fieldClasses} pr-10`}
                                    placeholder="Ressaisissez le mot de passe"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm((v) => !v)}
                                    className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 active:scale-90 transition-transform"
                                    aria-label={showPasswordConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    tabIndex={-1}
                                >
                                    {showPasswordConfirm ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                                </button>
                            </div>
                            {passwordsMatch && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    <FaCheckCircle className="h-3 w-3" /> Les mots de passe correspondent
                                </p>
                            )}
                            <InputError message={errors.password_confirmation} className="mt-1.5" />
                        </div>

                        {/* ─── reCAPTCHA ─── */}
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <FaShieldAlt className="h-4 w-4 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    Vérification de sécurité
                                </span>
                            </div>
                            <div
                                id="recaptcha-element"
                                className={errors.recaptcha_token || recaptchaError ? 'rounded border border-red-500 p-2' : ''}
                            />
                            {!isRecaptchaLoaded && !recaptchaError && (
                                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                    Chargement de la vérification…
                                </p>
                            )}
                            {recaptchaError && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <p className="text-xs text-red-600" role="alert">{recaptchaError}</p>
                                    {!isRecaptchaLoaded && (
                                        <button
                                            type="button"
                                            onClick={initializeRecaptcha}
                                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 underline"
                                        >
                                            Réessayer
                                        </button>
                                    )}
                                </div>
                            )}
                            {errors.recaptcha_token && (
                                <p className="mt-2 text-xs text-red-600" role="alert">{errors.recaptcha_token}</p>
                            )}
                        </div>

                        <PrimaryButton
                            type="submit"
                            className="w-full flex items-center justify-center h-13 rounded-2xl text-base font-bold text-white bg-blue-600 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-blue-600/25"
                            disabled={processing}
                        >
                            {processing ? 'Inscription en cours…' : 'Créer mon compte'}
                        </PrimaryButton>

                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            En créant un compte, vous acceptez nos{' '}
                            <a href="/conditions" className="underline">conditions d'utilisation</a> et notre{' '}
                            <a href="/confidentialite" className="underline">politique de confidentialité</a>.
                        </p>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vous avez déjà un compte ?{' '}
                        <Link href={route('login')} className="font-semibold text-blue-600 dark:text-blue-400">
                            Connectez-vous
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}