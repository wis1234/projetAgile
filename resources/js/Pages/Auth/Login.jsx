import { Head, Link, useForm } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function ProJALogo() {
    return (
        <span className="font-extrabold text-4xl text-blue-700 text-center block mb-6 select-none tracking-tight">
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
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Head title="Connexion" />

            <form
                onSubmit={submit}
                className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl space-y-8 animate-fade-in"
                style={{ boxShadow: '0 8px 40px rgba(80, 80, 180, 0.08)' }}
            >
                <ProJALogo />

                <h1 className="text-2xl font-bold text-center text-blue-700">
                    Connexion à ProJA
                </h1>

                {/* Email */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm">
                    <FaEnvelope className="text-blue-500 text-xl" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 placeholder-gray-400 text-gray-900 text-base"
                        placeholder="Adresse email"
                        autoComplete="username"
                        required
                        isFocused
                    />
                </div>
                <InputError message={errors.email} />

                {/* Password */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm">
                    <FaLock className="text-blue-500 text-xl" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 placeholder-gray-400 text-gray-900 text-base"
                        placeholder="Mot de passe"
                        autoComplete="current-password"
                        required
                    />
                </div>
                <InputError message={errors.password} />

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="text-gray-700">Se souvenir de moi</span>
                    </label>
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-blue-600 hover:underline"
                        >
                            Mot de passe oublié ?
                        </Link>
                    )}
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-blue-600 text-white text-lg font-semibold py-3 rounded-full shadow-md hover:bg-blue-700 transition"
                >
                    Se connecter
                </button>

                {/* Register link */}
                <div className="text-center text-sm mt-4">
                    <span className="text-gray-600">Pas encore de compte ? </span>
                    <Link
                        href={route('register')}
                        className="text-blue-600 hover:underline"
                    >
                        S'inscrire
                    </Link>
                </div>
            </form>
        </div>
    );
}
