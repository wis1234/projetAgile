import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function ProJALogo() {
    return (
        <span className="font-extrabold text-3xl md:text-4xl tracking-tight text-blue-700 select-none font-sans mb-8 block text-center">
            Pro<span className="text-orange-500">J</span>A
        </span>
    );
}

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
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
            <Head title="Connexion" />
            <form
                onSubmit={submit}
                className="relative z-10 w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-12 space-y-10 animate-fade-in"
                style={{ boxShadow: '0 8px 40px 0 rgba(80, 80, 180, 0.08)' }}
            >
                <ProJALogo />
                <h1 className="text-3xl font-extrabold text-center text-blue-700 mb-8 tracking-tight">Connexion à ProJA</h1>
                <div className="grid grid-cols-1 gap-8">
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaEnvelope className="text-blue-500 text-xl" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-xl placeholder-gray-400 text-gray-900"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="Adresse email"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm border border-gray-200">
                        <FaLock className="text-blue-500 text-xl" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-xl placeholder-gray-400 text-gray-900"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            placeholder="Mot de passe"
                        />
                    </div>
                </div>
                <InputError message={errors.email} className="mt-2" />
                <InputError message={errors.password} className="mt-2" />
                <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-base text-gray-700">Se souvenir de moi</span>
                    </label>
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-base text-blue-700 underline hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Mot de passe oublié ?
                        </Link>
                    )}
                </div>
                <div className="flex justify-center mt-8">
                    <button
                        type="submit"
                        className="w-full md:w-auto px-16 py-4 text-2xl font-bold rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
                        disabled={processing}
                    >
                        Se connecter
                    </button>
                </div>
                <div className="text-center mt-4">
                    <span className="text-base text-gray-700">Pas encore de compte ? </span>
                    <Link
                        href={route('register')}
                        className="rounded-md text-base text-blue-700 underline hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
                    >
                        S'inscrire
                    </Link>
                </div>
            </form>
        </div>
    );
}
