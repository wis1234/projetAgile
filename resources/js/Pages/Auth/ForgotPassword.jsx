import { Head, useForm, Link } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { FaArrowLeft, FaEnvelope, FaPaperPlane } from 'react-icons/fa';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 font-sans p-4 sm:p-6">
            <Head title="Mot de passe oublié" />
            
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* En-tête avec bouton retour */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                    <div className="flex items-center">
                        <Link 
                            href={route('login')} 
                            className="p-2 rounded-full hover:bg-blue-700 transition-colors duration-200"
                            title="Retour à la page de connexion"
                        >
                            <FaArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-xl font-bold ml-4">Réinitialisation du mot de passe</h2>
                    </div>
                </div>
                
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
                                <FaPaperPlane className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Mot de passe oublié ?</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded-r">
                            <p className="font-medium">{status}</p>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Adresse email
                            </label>
                            <div className="relative">
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
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70"
                            >
                                <FaPaperPlane className="h-4 w-4" />
                                <span>{processing ? 'Envoi en cours...' : 'Envoyer le lien'}</span>
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Vous vous souvenez de votre mot de passe ?{' '}
                            <Link 
                                href={route('login')} 
                                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
