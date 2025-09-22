import { Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa';
import { InputError, PrimaryButton, TextInput } from '@/Components';

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
    const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);

    // Fonction pour initialiser reCAPTCHA
    const initializeRecaptcha = () => {
        if (!window.grecaptcha) {
            console.error('grecaptcha non disponible');
            return;
        }

        console.log('Initialisation de reCAPTCHA...');
        
        try {
            // Vérifier si le widget a déjà été rendu
            if (document.getElementById('recaptcha-element').hasChildNodes()) {
                console.log('reCAPTCHA déjà initialisé');
                return;
            }

            // Rendre le widget reCAPTCHA
            const widgetId = window.grecaptcha.render('recaptcha-element', {
                sitekey: window.recaptchaSiteKey || '6Lcvg8krAAAAAEoghMGKFg4jZwQkh-vYfzzYMFcN',
                callback: onRecaptchaSuccess,
                'expired-callback': onRecaptchaExpired,
                'error-callback': onRecaptchaError,
                theme: 'light',
                size: 'normal'
            });

            console.log('reCAPTCHA rendu avec succès, widget ID:', widgetId);
            setIsRecaptchaLoaded(true);
            setRecaptchaError('');
            
            // Forcer l'exécution de la vérification
            window.grecaptcha.ready(() => {
                try {
                    window.grecaptcha.execute(widgetId);
                } catch (e) {
                    console.error('Erreur lors de l\'exécution de reCAPTCHA:', e);
                }
            });
            
        } catch (error) {
            console.error('Erreur lors du rendu de reCAPTCHA:', error);
            setRecaptchaError('Erreur lors du chargement de la vérification de sécurité.');
            setIsRecaptchaLoaded(false);
        }
    };

    // Callback pour une vérification reCAPTCHA réussie
    const onRecaptchaSuccess = (token) => {
        console.log('Token reCAPTCHA reçu:', token);
        setData('recaptcha_token', token);
        setRecaptchaError('');
        setIsRecaptchaLoaded(true);
    };

    // Callback pour une vérification reCAPTCHA expirée
    const onRecaptchaExpired = () => {
        console.log('reCAPTCHA expiré');
        setData('recaptcha_token', '');
        setRecaptchaError('La vérification a expiré. Veuillez réessayer.');
        setIsRecaptchaLoaded(false);
    };

    // Callback pour une erreur reCAPTCHA
    const onRecaptchaError = () => {
        console.error('Erreur reCAPTCHA');
        setData('recaptcha_token', '');
        setRecaptchaError('Une erreur est survenue. Veuillez réessayer.');
        setIsRecaptchaLoaded(false);
    };

    // Gestion du chargement de reCAPTCHA
    useEffect(() => {
        const handleRecaptchaLoaded = () => {
            console.log('Événement reCAPTCHA chargé reçu');
            initializeRecaptcha();
        };

        // Vérifier si reCAPTCHA est déjà chargé
        if (window.grecaptcha) {
            handleRecaptchaLoaded();
        }

        // Écouter l'événement de chargement de reCAPTCHA
        document.addEventListener('recaptcha-loaded', handleRecaptchaLoaded);
        
        // Nettoyage
        return () => {
            document.removeEventListener('recaptcha-loaded', handleRecaptchaLoaded);
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        
        if (!data.recaptcha_token) {
            setRecaptchaError('Veuillez confirmer que vous n\'êtes pas un robot.');
            
            // Essayer d'exécuter reCAPTCHA si disponible
            if (window.grecaptcha) {
                try {
                    window.grecaptcha.ready(() => {
                        const widgetId = window.grecaptcha.render('recaptcha-element');
                        if (widgetId) {
                            window.grecaptcha.execute(widgetId);
                        }
                    });
                } catch (e) {
                    console.error('Erreur lors de l\'exécution de reCAPTCHA:', e);
                }
            }
            
            return;
        }
        
        console.log('Soumission du formulaire avec le token:', data.recaptcha_token);
        
        post(route('register'), {
            onSuccess: () => {
                console.log('Inscription réussie');
                // Réinitialiser reCAPTCHA après une soumission réussie
                if (window.grecaptcha) {
                    window.grecaptcha.reset();
                }
            },
            onError: (errors) => {
                console.error('Erreur lors de l\'inscription:', errors);
                if (errors.recaptcha_token) {
                    setRecaptchaError(errors.recaptcha_token);
                }
                // Réinitialiser reCAPTCHA en cas d'erreur
                if (window.grecaptcha) {
                    window.grecaptcha.reset();
                }
                setData('recaptcha_token', '');
            },
            preserveScroll: true,
            onFinish: () => {
                // S'assurer que le token est bien effacé après la soumission
                setData('recaptcha_token', '');
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans p-4 sm:p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Left Panel: Branding - Visible uniquement sur desktop */}
                <div className="hidden md:flex flex-col justify-center items-center w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white text-center">
                    <h1 className="text-4xl font-bold mb-4">Bienvenue sur ProjA</h1>
                    <p className="text-blue-100 text-lg">Intégrez notre communauté, optimisez la gestion de vos projets et saisissez des opportunités de collaboration.</p>
                    <div className="mt-8">
                        <p className="text-blue-200">Déjà membre ?</p>
                        <Link 
                            href={route('login')} 
                            className="mt-2 inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            Se connecter
                        </Link>
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="w-full md:w-1/2 p-8 sm:p-10">
                    <div className="md:hidden text-center mb-8">
                        <h4 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">Rejoignez ProjA</h4>
                        <p className="text-gray-600 dark:text-gray-300">Créez votre compte et commencez à gérer vos projets plus efficacement.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 max-w-md mx-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom complet
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaUser className="h-5 w-5 text-gray-400" />
                                </div>
                                <TextInput
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="pl-10 w-full"
                                    placeholder="Votre nom complet"
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    isFocused
                                />
                            </div>
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Adresse email
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                                </div>
                                <TextInput 
                                    id="email"
                                    type="email" 
                                    name="email" 
                                    value={data.email} 
                                    className="pl-10 w-full"
                                    placeholder="votre@email.com" 
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Mot de passe
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <TextInput 
                                    id="password"
                                    type="password" 
                                    name="password" 
                                    value={data.password} 
                                    className="pl-10 w-full"
                                    placeholder="••••••••" 
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <TextInput 
                                    id="password_confirmation"
                                    type="password" 
                                    name="password_confirmation" 
                                    value={data.password_confirmation} 
                                    className="pl-10 w-full"
                                    placeholder="••••••••" 
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-1" />
                        </div>

                        {/* reCAPTCHA */}
                        <div className="mt-6">
                            <div className="flex items-center mb-2">
                                <FaShieldAlt className="h-5 w-5 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Vérification de sécurité
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div 
                                    id="recaptcha-element"
                                    className={`${errors.recaptcha_token || recaptchaError ? 'border border-red-500 rounded p-2' : ''}`}
                                    data-sitekey="6Lcvg8krAAAAAEoghMGKFg4jZwQkh-vYfzzYMFcN"
                                ></div>
                                {!isRecaptchaLoaded && (
                                    <div className="mt-2 text-yellow-600 text-sm">
                                        Chargement de la vérification de sécurité...
                                    </div>
                                )}
                            </div>
                            {recaptchaError && (
                                <p className="mt-2 text-sm text-red-600">{recaptchaError}</p>
                            )}
                            {errors.recaptcha_token && (
                                <p className="mt-2 text-sm text-red-600">{errors.recaptcha_token}</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <div className="flex justify-center">
                                <PrimaryButton 
                                    type="submit" 
                                    className="w-auto justify-center py-2 px-8 text-base sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                    disabled={processing}
                                >
                                    {processing ? 'Inscription en cours...' : "S'inscrire"}
                                </PrimaryButton>
                            </div>
                            
                        </div>
                    </form>

                    <div className="mt-6 text-center md:hidden">
                        <p className="text-sm text-gray-600">
                            Vous avez déjà un compte ?{' '}
                            <Link href={route('login')} className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                Connectez-vous
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
