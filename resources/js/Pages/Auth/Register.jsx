import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    FaEye, FaEyeSlash, FaCheckCircle, FaColumns, FaUsers, FaChartLine,
    FaChevronDown, FaLockOpen, FaShieldAlt, FaCloud, FaVideo, FaExclamationCircle, FaSpinner,
} from 'react-icons/fa';
import { InputError, PrimaryButton, TextInput } from '@/Components';
import GlobalFooter from '@/Components/GlobalFooter';
import useToast from '@/hooks/useToast';

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

/* ------------------------------------------------------------------ */
/*  Validation côté navigateur (mêmes règles que le serveur)            */
/* ------------------------------------------------------------------ */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validators = {
    name: (v) => {
        const t = v.trim();
        if (!t) return 'Indiquez votre nom complet.';
        if (t.length < 2) return 'Votre nom doit contenir au moins 2 caractères.';
        return '';
    },
    email: (v) => {
        const t = v.trim();
        if (!t) return 'Indiquez votre adresse email.';
        if (!EMAIL_RX.test(t)) return "Cette adresse email n'est pas valide (exemple : nom@entreprise.com).";
        return '';
    },
    password: (v) => {
        if (!v) return 'Choisissez un mot de passe.';
        if (v.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
        return '';
    },
    password_confirmation: (v, all) => {
        if (!v) return 'Confirmez votre mot de passe.';
        if (v !== all.password) return 'Les deux mots de passe ne correspondent pas.';
        return '';
    },
};

const FIELD_ORDER = ['name', 'email', 'password', 'password_confirmation'];

// Fautes de frappe fréquentes dans le domaine de l'email (l'e-mail de vérification ne serait jamais reçu)
const DOMAIN_TYPOS = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com',
    'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com',
    'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com',
};

const suggestEmail = (email) => {
    const [local, domain] = email.trim().toLowerCase().split('@');
    return domain && DOMAIN_TYPOS[domain] ? `${local}@${DOMAIN_TYPOS[domain]}` : null;
};

const RECAPTCHA_LOAD_TIMEOUT = 12000;

export default function Register() {
    const toast = useToast();
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        recaptcha_token: '',
    });

    const recaptchaRef = useRef(null);
    const captchaBoxRef = useRef(null);
    const submittingRef = useRef(false);
    const [recaptchaError, setRecaptchaError] = useState('');
    const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);
    const [captchaSlow, setCaptchaSlow] = useState(false);
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [openFaq, setOpenFaq] = useState(0);

    const strength = useMemo(() => passwordStrength(data.password), [data.password]);
    const emailLooksValid = useMemo(() => EMAIL_RX.test(data.email.trim()), [data.email]);
    const emailSuggestion = useMemo(() => suggestEmail(data.email), [data.email]);
    const passwordsMatch =
        data.password_confirmation.length > 0 && data.password === data.password_confirmation;

    // Erreurs de saisie calculées côté navigateur (affichées après passage sur le champ ou à l'envoi)
    const clientErrors = useMemo(
        () =>
            Object.fromEntries(
                FIELD_ORDER.map((f) => [f, validators[f](data[f], data)]).filter(([, msg]) => msg)
            ),
        [data]
    );

    // Erreur à afficher : celle du serveur en priorité, sinon celle du navigateur
    const errorFor = (field) =>
        errors[field] || ((touched[field] || submitted) ? clientErrors[field] : '') || '';

    const fieldClass = (field, extra = '') =>
        `${fieldClasses} ${extra} ${
            errorFor(field)
                ? '!border-red-400 !bg-red-50/60 focus:!border-red-500 focus:!ring-red-100 dark:!bg-red-900/10'
                : ''
        }`;

    const onFieldChange = (field) => (e) => {
        setData(field, e.target.value);
        if (errors[field]) clearErrors(field);
        if (errors.form) clearErrors('form');
    };

    const onFieldBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

    const focusField = (field) => {
        const el = document.getElementById(field);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => el.focus({ preventScroll: true }), 250);
        }
    };

    const scrollToCaptcha = () => {
        captchaBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    /* ---------------- reCAPTCHA ---------------- */

    const onRecaptchaSuccess = useCallback((token) => {
        setData('recaptcha_token', token);
        setRecaptchaError('');
        clearErrors('recaptcha_token');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onRecaptchaExpired = useCallback(() => {
        setData('recaptcha_token', '');
        setRecaptchaError('La vérification a expiré. Cochez à nouveau la case « Je ne suis pas un robot ».');
        toast.warning('La vérification anti-robot a expiré. Cochez à nouveau la case avant de valider.', {
            title: 'Vérification expirée',
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onRecaptchaError = useCallback(() => {
        setData('recaptcha_token', '');
        setRecaptchaError('La vérification de sécurité a rencontré une erreur. Réessayez.');
        toast.error('La vérification anti-robot a rencontré une erreur. Cliquez sur « Réessayer » ou rechargez la page.', {
            title: 'Vérification indisponible',
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const resetCaptcha = () => {
        try {
            if (window.grecaptcha && recaptchaRef.current !== null) {
                window.grecaptcha.reset(recaptchaRef.current);
            }
        } catch {
            /* widget indisponible : ignoré */
        }
        setData('recaptcha_token', '');
    };

    // grecaptcha.render() doit être appelé une fois l'API prête (grecaptcha.ready).
    // Widget visible (« case à cocher ») : l'utilisateur coche lui-même, on n'appelle jamais execute().
    const initializeRecaptcha = useCallback(() => {
        if (!window.grecaptcha) {
            setIsRecaptchaLoaded(false);
            return;
        }

        const container = document.getElementById('recaptcha-element');
        if (container && container.hasChildNodes()) {
            setIsRecaptchaLoaded(true);
            setCaptchaSlow(false);
            return;
        }

        window.grecaptcha.ready(() => {
            try {
                recaptchaRef.current = window.grecaptcha.render('recaptcha-element', {
                    sitekey: window.recaptchaSiteKey || '6Lcvg8krAAAAAEoghMGKFg4jZwQkh-vYfzzYMFcN',
                    callback: onRecaptchaSuccess,
                    'expired-callback': onRecaptchaExpired,
                    'error-callback': onRecaptchaError,
                    theme: 'light',
                    size: 'normal',
                });
                setIsRecaptchaLoaded(true);
                setCaptchaSlow(false);
                setRecaptchaError('');
            } catch (error) {
                console.error('Erreur lors du rendu de reCAPTCHA:', error);
                setRecaptchaError("La vérification de sécurité n'a pas pu se charger. Rechargez la page ou réessayez.");
                setIsRecaptchaLoaded(false);
            }
        });
    }, [onRecaptchaSuccess, onRecaptchaExpired, onRecaptchaError]);

    useEffect(() => {
        const onLoaded = () => initializeRecaptcha();
        // Le script de chargement (app.blade.php) signale un échec réseau via cet événement.
        const onScriptFailed = () => {
            setIsRecaptchaLoaded(false);
            setRecaptchaError("Impossible de charger la vérification de sécurité de Google. Vérifiez votre connexion internet.");
            toast.error(
                "La vérification anti-robot n'a pas pu se charger (connexion internet ou blocage par un bloqueur de publicités). Corrigez puis cliquez sur « Réessayer ».",
                { title: 'Vérification indisponible' }
            );
        };

        if (window.grecaptcha) onLoaded();
        document.addEventListener('recaptcha-loaded', onLoaded);
        document.addEventListener('recaptcha-error', onScriptFailed);

        // Chargement anormalement long : on prévient l'utilisateur au lieu de le laisser attendre en silence
        const slow = setTimeout(() => {
            if (!document.getElementById('recaptcha-element')?.hasChildNodes()) {
                setCaptchaSlow(true);
                toast.warning(
                    'La vérification anti-robot met du temps à se charger. Vérifiez votre connexion ou cliquez sur « Réessayer ».',
                    { title: 'Chargement lent' }
                );
            }
        }, RECAPTCHA_LOAD_TIMEOUT);

        return () => {
            clearTimeout(slow);
            document.removeEventListener('recaptcha-loaded', onLoaded);
            document.removeEventListener('recaptcha-error', onScriptFailed);
        };
    }, [initializeRecaptcha]); // eslint-disable-line react-hooks/exhaustive-deps

    // Coupure / retour de connexion : on prévient tout de suite
    useEffect(() => {
        const offline = () => toast.warning('Connexion internet perdue. Vous pourrez valider dès son retour.', { title: 'Hors ligne' });
        const online = () => toast.success('Connexion rétablie.', { title: 'De retour en ligne' });
        window.addEventListener('offline', offline);
        window.addEventListener('online', online);
        return () => {
            window.removeEventListener('offline', offline);
            window.removeEventListener('online', online);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const retryCaptcha = () => {
        setRecaptchaError('');
        setCaptchaSlow(false);
        if (window.grecaptcha) {
            initializeRecaptcha();
        } else {
            // Le script Google n'est jamais arrivé : on le recharge
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
            script.async = true;
            script.onerror = () => document.dispatchEvent(new Event('recaptcha-error'));
            document.head.appendChild(script);
        }
    };

    /* ---------------- Envoi ---------------- */

    const handleServerErrors = (errs) => {
        const keys = Object.keys(errs);

        if (errs.form) {
            toast.error(errs.form, { title: 'Inscription impossible' });
        }

        if (errs.recaptcha_token) {
            setRecaptchaError(errs.recaptcha_token);
            resetCaptcha();
            toast.warning(errs.recaptcha_token, { title: 'Vérification anti-robot' });
            scrollToCaptcha();
            return;
        }

        if (errs.email && /déjà/i.test(errs.email)) {
            toast.error(errs.email, {
                title: 'Adresse email déjà utilisée',
                action: { label: 'Se connecter', href: route('login') },
            });
            focusField('email');
            return;
        }

        const fieldKeys = keys.filter((k) => FIELD_ORDER.includes(k));
        if (fieldKeys.length > 0) {
            toast.error(
                fieldKeys.length === 1
                    ? errs[fieldKeys[0]]
                    : `Veuillez corriger ${fieldKeys.length} champs du formulaire avant de continuer.`,
                { title: 'Formulaire incomplet' }
            );
            focusField(FIELD_ORDER.find((f) => fieldKeys.includes(f)));
            return;
        }

        if (!errs.form) {
            toast.error("L'inscription n'a pas pu aboutir. Vérifiez vos informations puis réessayez.", {
                title: 'Inscription impossible',
            });
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (processing || submittingRef.current) return; // anti double-clic

        setSubmitted(true);
        clearErrors();

        // 1) Champs invalides : on l'annonce et on place le curseur sur le premier
        const firstInvalid = FIELD_ORDER.find((f) => clientErrors[f]);
        if (firstInvalid) {
            const count = Object.keys(clientErrors).length;
            toast.error(
                count === 1
                    ? clientErrors[firstInvalid]
                    : `Veuillez corriger ${count} champs du formulaire avant de continuer.`,
                { title: 'Formulaire incomplet' }
            );
            focusField(firstInvalid);
            return;
        }

        // 2) Hors ligne : inutile d'envoyer
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            toast.error('Vous semblez hors ligne. Vérifiez votre connexion internet puis réessayez.', {
                title: 'Connexion impossible',
            });
            return;
        }

        // 3) reCAPTCHA
        if (!data.recaptcha_token) {
            const message = !isRecaptchaLoaded
                ? "La vérification anti-robot n'est pas encore chargée. Patientez un instant ou cliquez sur « Réessayer »."
                : 'Cochez la case « Je ne suis pas un robot » avant de continuer.';
            setRecaptchaError(message);
            toast.warning(message, { title: 'Vérification anti-robot' });
            if (!isRecaptchaLoaded) initializeRecaptcha();
            scrollToCaptcha();
            return;
        }

        submittingRef.current = true;

        post(route('register'), {
            preserveScroll: true,
            // Garde le formulaire rempli si la page est rechargée en coulisses (ex. session renouvelée)
            preserveState: true,
            onError: handleServerErrors,
            onFinish: () => {
                submittingRef.current = false;
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased dark:bg-gray-950">
            <Head title="Créer un compte" />
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

                        {errors.form && (
                            <div
                                className="mb-5 flex max-w-md items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400"
                                role="alert"
                            >
                                <FaExclamationCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <span>{errors.form}</span>
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
                                        className={fieldClass('name')}
                                        placeholder="Ronaldo Agbohou"
                                        onChange={onFieldChange('name')}
                                        onBlur={onFieldBlur('name')}
                                        aria-invalid={!!errorFor('name')}
                                        required
                                        autoComplete="name"
                                        isFocused
                                    />
                                    <InputError message={errorFor('name')} className="mt-1" />
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
                                            className={fieldClass('email', 'pr-9')}
                                            placeholder="vous@entreprise.com"
                                            onChange={onFieldChange('email')}
                                            onBlur={onFieldBlur('email')}
                                            aria-invalid={!!errorFor('email')}
                                            required
                                            autoComplete="username"
                                            inputMode="email"
                                        />
                                        {emailLooksValid && !errorFor('email') && (
                                            <FaCheckCircle className="absolute inset-y-0 right-3 my-auto h-4 w-4 text-emerald-500" />
                                        )}
                                    </div>
                                    <InputError message={errorFor('email')} className="mt-1" />
                                    {emailSuggestion && !errorFor('email') && (
                                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                            Vouliez-vous dire{' '}
                                            <button
                                                type="button"
                                                onClick={() => setData('email', emailSuggestion)}
                                                className="font-semibold underline"
                                            >
                                                {emailSuggestion}
                                            </button>{' '}
                                            ? Le lien de vérification sera envoyé à cette adresse.
                                        </p>
                                    )}
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
                                        className={fieldClass('password', 'pr-10')}
                                        placeholder="8 caractères minimum"
                                        onChange={onFieldChange('password')}
                                        onBlur={onFieldBlur('password')}
                                        aria-invalid={!!errorFor('password')}
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
                                <InputError message={errorFor('password')} className="mt-1" />
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
                                        className={fieldClass('password_confirmation', 'pr-10')}
                                        placeholder="Ressaisissez le mot de passe"
                                        onChange={onFieldChange('password_confirmation')}
                                        onBlur={onFieldBlur('password_confirmation')}
                                        aria-invalid={!!errorFor('password_confirmation')}
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
                                <InputError message={errorFor('password_confirmation')} className="mt-1" />
                            </div>

                            {/* reCAPTCHA */}
                            <div
                                ref={captchaBoxRef}
                                className={`rounded-xl border p-4 dark:bg-gray-800/60 ${
                                    recaptchaError || errors.recaptcha_token
                                        ? 'border-red-300 bg-red-50/60 dark:border-red-800'
                                        : 'border-gray-200 bg-gray-50 dark:border-gray-700'
                                }`}
                            >
                                <div className="mb-2 flex items-center gap-2">
                                    <FaShieldAlt className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Vérification de sécurité
                                    </span>
                                    {data.recaptcha_token && (
                                        <span className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                            <FaCheckCircle className="h-3 w-3" /> Validée
                                        </span>
                                    )}
                                </div>
                                <div id="recaptcha-element" className="max-w-full overflow-x-auto" />
                                {!isRecaptchaLoaded && !recaptchaError && (
                                    <p className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                        <FaSpinner className="h-3 w-3 animate-spin" />
                                        {captchaSlow
                                            ? 'Le chargement est plus long que prévu…'
                                            : 'Chargement de la vérification de sécurité…'}
                                    </p>
                                )}
                                {(recaptchaError || errors.recaptcha_token) && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                                        {recaptchaError || errors.recaptcha_token}
                                    </p>
                                )}
                                {(!isRecaptchaLoaded || captchaSlow) && (
                                    <button
                                        type="button"
                                        onClick={retryCaptcha}
                                        className="mt-2 text-sm font-medium text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                                    >
                                        Réessayer
                                    </button>
                                )}
                            </div>

                            <PrimaryButton
                                type="submit"
                                className="w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                                disabled={processing}
                            >
                                {processing ? (
                                    <span className="inline-flex items-center gap-2">
                                        <FaSpinner className="h-4 w-4 animate-spin" /> Création de votre compte…
                                    </span>
                                ) : (
                                    'Créer mon compte'
                                )}
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