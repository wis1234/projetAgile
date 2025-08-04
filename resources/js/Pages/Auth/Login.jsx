import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { FaEnvelope, FaLock, FaSignInAlt, FaExclamationTriangle } from 'react-icons/fa';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { useEffect } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const { props } = usePage();
    const errorMessage = props.message || '';
    const errorStatus = props.status || '';

    useEffect(() => {
        // Effacer le message d'erreur après 10 secondes
        if (errorMessage) {
            const timer = setTimeout(() => {
                // Effacer le message
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans p-4 sm:p-6">
            <Head title="Connexion" />

            <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Left Panel: Branding */}
                <div className="hidden md:flex flex-col justify-center items-center w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white text-center">
                    <ApplicationLogo className="text-6xl mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Bienvenue sur ProjA</h1>
                    <p className="text-blue-200">Votre solution de gestion de projet moderne.</p>
                </div>

                {/* Right Panel: Form */}
                <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12">
                    <div className="md:hidden text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <ApplicationLogo className="h-16 w-auto text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Bienvenue sur ProjA</h1>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Votre solution de gestion de projet</p>
                    </div>

                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                            Connexion
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                            Heureux de vous revoir !
                        </p>
                    </div>

                    {/* Message de statut */}
                    {status && (
                        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-200">
                            <p className="font-medium">{status}</p>
                        </div>
                    )}

                    {/* Message d'erreur 401 */}
                    {errorStatus === 401 && errorMessage && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-200">
                            <div className="flex items-center">
                                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                                <p className="font-medium">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5 sm:space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Adresse email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="pl-10 w-full"
                                    autoComplete="email"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="pl-10 w-full"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <div className="flex items-center justify-between">
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
                                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <FaSignInAlt className="h-5 w-5 text-blue-300 group-hover:text-blue-200" />
                                </span>
                                {processing ? 'Connexion en cours...' : 'Se connecter'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Pas encore de compte ?{' '}
                            <Link href={route('register')} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                                Créer un compte
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
