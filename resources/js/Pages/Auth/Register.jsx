import { Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
    FaEye, FaEyeSlash, FaCheckCircle, FaColumns, FaUsers, FaChartLine,
    FaChevronDown, FaLockOpen, FaShieldAlt, FaCloud, FaVideo,
} from 'react-icons/fa';
import { InputError, PrimaryButton, TextInput } from '@/Components';
import GlobalFooter from '@/Components/GlobalFooter';

/* ------------------------------------------------------------------ */
/*  Contenu statique de la page                                        */
/* ------------------------------------------------------------------ */

const FEATURES = [
    {
        icon: FaColumns,
        title: 'Tableaux visuels',
        text: "Organisez chaque projet en colonnes À faire, En cours et Terminé, glissez déposez les tâches en un geste.",
    },
    {
        icon: FaUsers,
        title: 'Collaboration en temps réel',
        text: "Commentaires, mentions et notifications instantanées : toute l'équipe voit la même version, au même moment.",
    },
    {
        icon: FaChartLine,
        title: 'Suivi & rapports',
        text: "Charges, échéances et avancement consolidés automatiquement, sans tableur à mettre à jour à la main.",
    },
    {
        icon: FaShieldAlt,
        title: 'Sécurité de niveau entreprise',
        text: "Chiffrement en transit et au repos, authentification renforcée, hébergement conforme RGPD.",
    },
    {
        icon: FaCloud,
        title: 'Stockage des livrables',
        text: "Centralisez vos fichiers de projet et synchronisez automatiquement vos dossiers Dropbox.",
    },
    {
        icon: FaVideo,
        title: 'Réunions intégrées',
        text: "Lancez un appel Zoom directement depuis une tâche ou un projet, sans changer d'outil.",
    },
];

const SECURITY_POINTS = [
    ['Chiffrement TLS', 'en transit sur toutes les connexions'],
    ['Chiffrement au repos', "sur l'ensemble des données stockées"],
    ['Hébergement UE', 'conforme RGPD'],
    ['Sauvegardes quotidiennes', 'avec restauration point-in-time'],
];

const FAQ = [
    {
        q: 'Mes données sont-elles en sécurité ?',
        a: "Oui. Toutes les données sont chiffrées en transit (TLS) et au repos. L'accès à votre compte est protégé par une vérification anti-robot et peut être renforcé par une double authentification depuis vos paramètres.",
    },
    {
        q: 'Y a-t-il un essai gratuit ?',
        a: "Chaque nouveau compte démarre avec 3 mois d'accès complet, sans carte bancaire requise. Vous pouvez inviter votre équipe dès l'inscription.",
    },
    {
        q: 'Comment contacter le support ?',
        a: "Une messagerie support est accessible depuis l'application, avec une réponse sous 24h ouvrées en moyenne.",
    },
];

/* ------------------------------------------------------------------ */
/*  Illustration signature : capture d'écran stylisée du tableau       */
/* ------------------------------------------------------------------ */

function KanbanSignature() {
    const columns = [
        { label: 'À faire', dot: 'bg-slate-400', cards: 3 },
        { label: 'En cours', dot: 'bg-amber-400', cards: 2 },
        { label: 'Terminé', dot: 'bg-emerald-400', cards: 4 },
    ];

    return (
        <div className="relative select-none" aria-hidden="true">
            <style>{`
                @keyframes projaFlow {
                    0%   { left: 6%;  top: 46px; border-color: #94A3B8; opacity: 0; }
                    8%   { opacity: 1; }
                    28%  { left: 6%;  top: 46px; border-color: #94A3B8; }
                    45%  { left: 38%; top: 88px; border-color: #F59E0B; }
                    68%  { left: 38%; top: 88px; border-color: #F59E0B; }
                    85%  { left: 70%; top: 130px; border-color: #10B981; }
                    96%  { opacity: 1; }
                    100% { left: 70%; top: 130px; border-color: #10B981; opacity: 0; }
                }
                .proja-flow-card {
                    animation: projaFlow 7s ease-in-out infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .proja-flow-card { animation: none; left: 38%; top: 88px; border-color: #F59E0B; opacity: 1; }
                }
            `}</style>

            <div className="rounded-2xl border border-white/10 bg-gray-950 p-4 shadow-2xl shadow-black/50">
                {/* Barre de fenêtre, façon capture d'écran d'application */}
                <div className="mb-4 flex items-center gap-1.5 px-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                    <span className="ml-2 text-[11px] font-medium text-white/40">
                        Projet Refonte site web
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {columns.map((col) => (
                        <div key={col.label} className="space-y-2">
                            <div className="flex items-center gap-1.5 px-0.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                                <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">
                                    {col.label}
                                </span>
                            </div>
                            {Array.from({ length: col.cards }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-6 rounded-md bg-white/10"
                                    style={{ width: `${88 - i * 10}%` }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Carte flottante qui avance d'une colonne à l'autre */}
            <div
                className="proja-flow-card absolute h-6 w-16 rounded-md border-2 bg-gray-900 shadow-lg"
                style={{ left: '6%', top: '46px' }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Jauge de robustesse du mot de passe                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Champ de formulaire "plein", style moderne                         */
/* ------------------------------------------------------------------ */

const fieldClasses =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 shadow-sm ' +
    'transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none ' +
    'focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white ' +
    'dark:focus:bg-gray-800 dark:focus:ring-blue-500/20';

const fieldLabelClasses =
    'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400';

/* ------------------------------------------------------------------ */
/*  Page principale                                                     */
/* ------------------------------------------------------------------ */

export default function Register() {
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
    const [openFaq, setOpenFaq] = useState(0);

    const strength = useMemo(() => passwordStrength(data.password), [data.password]);
    const emailLooksValid = useMemo(
        () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        [data.email]
    );
    const passwordsMatch =
        data.password_confirmation.length > 0 && data.password === data.password_confirmation;

    // Initialise le widget reCAPTCHA
    // Important : grecaptcha.render() doit être appelé une fois l'API prête
    // (grecaptcha.ready), sinon "render is not a function" apparaît car le
    // script vient tout juste de se charger. Comme il s'agit d'un widget
    // visible (size: 'normal'), on ne doit PAS appeler grecaptcha.execute()
    // dessus : execute() n'existe que pour le reCAPTCHA invisible, l'utilisateur
    // doit cocher la case lui-même.
    const initializeRecaptcha = () => {
        if (!window.grecaptcha) {
            console.error('grecaptcha non disponible');
            return;
        }

        const container = document.getElementById('recaptcha-element');
        if (container && container.hasChildNodes()) {
            // Déjà rendu, rien à faire
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
                setRecaptchaError(
                    "La vérification de sécurité n'a pas pu se charger. Rechargez la page ou réessayez."
                );
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

        if (window.grecaptcha) {
            handleRecaptchaLoaded();
        }

        document.addEventListener('recaptcha-loaded', handleRecaptchaLoaded);
        return () => document.removeEventListener('recaptcha-loaded', handleRecaptchaLoaded);
    }, []);

    const submit = (e) => {
        e.preventDefault();

        if (!data.recaptcha_token) {
            if (!isRecaptchaLoaded) {
                // Le widget n'a jamais pu se charger : on retente plutôt que
                // d'appeler une API invalide sur un widget qui n'existe pas.
                setRecaptchaError(
                    "La vérification de sécurité n'a pas pu se charger. Nouvelle tentative en cours…"
                );
                initializeRecaptcha();
            } else {
                setRecaptchaError("Veuillez cocher la case « Je ne suis pas un robot » avant de continuer.");
            }
            return;
        }

        setFormError('');

        post(route('register'), {
            onSuccess: () => {
                if (window.grecaptcha) {
                    window.grecaptcha.reset(recaptchaRef.current ?? undefined);
                }
            },
            onError: (errs) => {
                if (errs.recaptcha_token) {
                    setRecaptchaError(errs.recaptcha_token);
                } else if (Object.keys(errs).length === 0) {
                    // Erreur serveur non associée à un champ précis (ex : session expirée)
                    setFormError(
                        "Une erreur est survenue lors de l'inscription. Veuillez réessayer."
                    );
                }
                if (window.grecaptcha) {
                    window.grecaptcha.reset(recaptchaRef.current ?? undefined);
                }
                setData('recaptcha_token', '');
            },
            preserveScroll: true,
            onFinish: () => setData('recaptcha_token', ''),
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased dark:bg-gray-950">
            {/* ---------------------------------------------------------- */}
            {/* En-tête produit                                             */}
            {/* ---------------------------------------------------------- */}
            <header className="sticky top-0 z-10 border-b border-gray-200/70 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                            P
                        </span>
                        <span className="text-lg font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                            PROJA
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">
                            Déjà membre ?
                        </span>
                        <Link
                            href={route('login')}
                            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
                        >
                            Se connecter
                        </Link>
                    </div>
                </div>
            </header>

            {/* ---------------------------------------------------------- */}
            {/* Bloc principal : illustration + formulaire                  */}
            {/* ---------------------------------------------------------- */}
            <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
                <div className="grid overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5 md:grid-cols-2">
                    {/* Panneau de marque, couleur d'origine conservée */}
                    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-white md:flex">
                        <div>
                            <h1 className="text-3xl font-bold leading-tight">
                                Bienvenue sur PROJA
                            </h1>
                            <p className="mt-3 text-sm leading-relaxed text-blue-100/90">
                                Centralisez la gestion de vos projets : tableaux de suivi,
                                échéances, discussions d'équipe et stockage des livrables réunis
                                au même endroit. Lancez vos réunions sur Zoom et sauvegardez vos
                                fichiers sur Dropbox sans jamais quitter PROJA.
                            </p>
                        </div>

                        <KanbanSignature />

                        <div className="flex items-center gap-6 pt-2 text-xs text-blue-100/80">
                            <div>
                                <div className="text-lg font-semibold text-white">20+</div>
                                équipes actives
                            </div>
                            <div className="h-8 w-px bg-white/20" />
                            <div>
                                <div className="text-lg font-semibold text-white">2 000+</div>
                                tâches suivies
                            </div>
                            <div className="h-8 w-px bg-white/20" />
                            <div>
                                <div className="text-lg font-semibold text-white">99,9 %</div>
                                de disponibilité
                            </div>
                        </div>
                    </div>

                    {/* Formulaire, design repensé */}
                    <div className="bg-white p-8 dark:bg-gray-900 sm:p-10">
                        <div className="mb-8 text-center md:hidden">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Rejoignez PROJA
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                Créez votre compte et commencez à gérer vos projets plus
                                efficacement.
                            </p>
                        </div>
                        <h2 className="mb-1 hidden text-2xl font-bold text-gray-900 dark:text-white md:block">
                            Créer votre compte
                        </h2>
                        <p className="mb-6 hidden text-sm text-gray-500 dark:text-gray-400 md:block">
                            Moins de 2 minutes pour démarrer, aucune carte bancaire requise.
                        </p>

                        {formError && (
                            <div
                                className="mb-5 max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400"
                                role="alert"
                            >
                                {formError}
                            </div>
                        )}

                        <form onSubmit={submit} className="max-w-md space-y-5" noValidate>
                            {/* Nom et email, côte à côte sur grand écran */}
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className={fieldLabelClasses}>
                                        Nom complet
                                    </label>
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
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="email" className={fieldLabelClasses}>
                                        Adresse email
                                    </label>
                                    <div className="relative">
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className={`${fieldClasses} pr-9`}
                                            placeholder="vous@entreprise.com"
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            autoComplete="username"
                                        />
                                        {emailLooksValid && (
                                            <FaCheckCircle className="absolute inset-y-0 right-3 my-auto h-4 w-4 text-emerald-500" />
                                        )}
                                    </div>
                                    <InputError message={errors.email} className="mt-1" />
                                </div>
                            </div>

                            {/* Mot de passe */}
                            <div>
                                <label htmlFor="password" className={fieldLabelClasses}>
                                    Mot de passe
                                </label>
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
                                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        aria-label={
                                            showPassword
                                                ? 'Masquer le mot de passe'
                                                : 'Afficher le mot de passe'
                                        }
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash className="h-4 w-4" />
                                        ) : (
                                            <FaEye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {data.password.length > 0 && (
                                    <div className="mt-2">
                                        <div className="flex gap-1">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full ${
                                                        i < strength.score
                                                            ? strength.color
                                                            : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Robustesse : {strength.label}. Utilisez au moins 8
                                            caractères, avec chiffres et symboles.
                                        </p>
                                    </div>
                                )}
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            {/* Confirmation mot de passe */}
                            <div>
                                <label htmlFor="password_confirmation" className={fieldLabelClasses}>
                                    Confirmer le mot de passe
                                </label>
                                <div className="relative">
                                    <TextInput
                                        id="password_confirmation"
                                        type={showPasswordConfirm ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className={`${fieldClasses} pr-10`}
                                        placeholder="Ressaisissez le mot de passe"
                                        onChange={(e) =>
                                            setData('password_confirmation', e.target.value)
                                        }
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        aria-label={
                                            showPasswordConfirm
                                                ? 'Masquer le mot de passe'
                                                : 'Afficher le mot de passe'
                                        }
                                    >
                                        {showPasswordConfirm ? (
                                            <FaEyeSlash className="h-4 w-4" />
                                        ) : (
                                            <FaEye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordsMatch && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                        <FaCheckCircle className="h-3 w-3" /> Les mots de passe
                                        correspondent
                                    </p>
                                )}
                                <InputError message={errors.password_confirmation} className="mt-1" />
                            </div>

                            {/* reCAPTCHA */}
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                                <div className="mb-2 flex items-center gap-2">
                                    <FaShieldAlt className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Vérification de sécurité
                                    </span>
                                </div>
                                <div
                                    id="recaptcha-element"
                                    className={
                                        errors.recaptcha_token || recaptchaError
                                            ? 'rounded border border-red-500 p-2'
                                            : ''
                                    }
                                />
                                {!isRecaptchaLoaded && !recaptchaError && (
                                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                                        Chargement de la vérification de sécurité…
                                    </p>
                                )}
                                {recaptchaError && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <p className="text-sm text-red-600" role="alert">
                                            {recaptchaError}
                                        </p>
                                        {!isRecaptchaLoaded && (
                                            <button
                                                type="button"
                                                onClick={initializeRecaptcha}
                                                className="text-sm font-medium text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                                            >
                                                Réessayer
                                            </button>
                                        )}
                                    </div>
                                )}
                                {errors.recaptcha_token && (
                                    <p className="mt-2 text-sm text-red-600" role="alert">
                                        {errors.recaptcha_token}
                                    </p>
                                )}
                            </div>

                            <PrimaryButton
                                type="submit"
                                className="w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                                disabled={processing}
                            >
                                {processing ? 'Inscription en cours…' : 'Créer mon compte'}
                            </PrimaryButton>

                            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                En créant un compte, vous acceptez nos{' '}
                                <a href="/conditions" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                                    conditions d'utilisation
                                </a>{' '}
                                et notre{' '}
                                <a href="/confidentialite" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                                    politique de confidentialité
                                </a>
                                .
                            </p>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 md:hidden">
                            Vous avez déjà un compte ?{' '}
                            <Link
                                href={route('login')}
                                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                Connectez-vous
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* ---------------------------------------------------------- */}
            {/* Bandeau de chiffres                                         */}
            {/* ---------------------------------------------------------- */}
            <section className="border-y border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto grid max-w-6xl grid-cols-3 gap-6 px-4 text-center sm:px-6">
                    {[
                        ['20+', 'équipes actives'],
                        ['2 000+', 'tâches suivies'],
                        ['99,9 %', 'disponibilité'],
                    ].map(([value, label]) => (
                        <div key={label}>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {value}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* Fonctionnalités                                             */}
            {/* ---------------------------------------------------------- */}
            <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tout ce qu'il faut pour piloter un projet, rien de plus
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Pensé pour que la première tâche créée soit utilisée le jour même par
                        toute l'équipe.
                    </p>
                </div>
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map(({ icon: Icon, title, text }) => (
                        <div
                            key={title}
                            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                {text}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* Sécurité / confiance, version claire                        */}
            {/* ---------------------------------------------------------- */}
            <section className="bg-blue-50/60 py-16 dark:bg-blue-500/5">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center">
                    <div>
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                            <FaLockOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Vos données, protégées par défaut
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            La vérification anti-robot ci-dessus n'est qu'une première couche.
                            Chaque compte est en plus protégé par un chiffrement de bout en bout
                            des données stockées, et par une infrastructure hébergée en Europe,
                            conforme au RGPD.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {SECURITY_POINTS.map(([title, text]) => (
                            <div
                                key={title}
                                className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900"
                            >
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {title}
                                </div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* FAQ                                                         */}
            {/* ---------------------------------------------------------- */}
            <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
                <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                    Questions fréquentes
                </h2>
                <div className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
                    {FAQ.map(({ q, a }, i) => {
                        const isOpen = openFaq === i;
                        return (
                            <div key={q}>
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(isOpen ? -1 : i)}
                                    className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white"
                                    aria-expanded={isOpen}
                                >
                                    {q}
                                    <FaChevronDown
                                        className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
                                            isOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                {isOpen && (
                                    <p className="px-6 pb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                        {a}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* Pied de page                                                */}
            {/* ---------------------------------------------------------- */}
            <div className="mt-4 mb-2 w-full text-center">
                <GlobalFooter />
            </div>
        </div>
    );
}