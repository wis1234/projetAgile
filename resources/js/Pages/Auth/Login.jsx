import { Head, Link, useForm } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans">
            <Head title="Connexion" />

            <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">

                {/* Left Panel: Branding */}
                <div className="hidden md:flex flex-col justify-center items-center w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white text-center">
                    <ApplicationLogo className="text-6xl mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Bienvenue sur ProjA</h1>
                    <p className="text-blue-200">Votre solution de gestion de projet moderne.</p>
                </div>

                {/* Right Panel: Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12">
                    <div className="md:hidden text-center mb-8">
                        <ApplicationLogo className="text-5xl" />
                    </div>

                    <h2 className="text-3xl font-bold text-center text-blue-800 dark:text-blue-200 mb-2">
                        Connexion
                    </h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
                        Heureux de vous revoir !
                    </p>

                    {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

                    <form onSubmit={submit} className="space-y-6">
                        {/* Email */}
                        <div className="relative">
                            <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Adresse email"
                                autoComplete="username"
                                required
                                isFocused
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Mot de passe"
                                autoComplete="current-password"
                                required
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Remember me + Forgot password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:ring-blue-500"
                                />
                                Se souvenir de moi
                            </label>
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-3 bg-blue-700 text-white text-base font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                        >
                            <FaSignInAlt />
                            Se connecter
                        </button>

                        {/* Register link */}
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4">
                            Pas encore de compte ?{' '}
                            <Link
                                href={route('register')}
                                className="font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                            >
                                Créez-en un ici
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
