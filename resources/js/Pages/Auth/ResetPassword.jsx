import { Head, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans p-4">
            <Head title="Réinitialiser le mot de passe" />
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-10 flex flex-col items-center">
                <ApplicationLogo className="text-5xl mb-4" />
                <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2 text-center">Réinitialiser le mot de passe</h2>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                    Choisissez un nouveau mot de passe pour votre compte ProjA.
                </p>
                <form onSubmit={submit} className="w-full space-y-4 mt-2">
                    <input type="hidden" name="token" value={data.token} />
                    <div className="relative">
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="username"
                            placeholder="Adresse email"
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div className="relative">
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="new-password"
                            placeholder="Nouveau mot de passe"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>
                    <div className="relative">
                        <TextInput
                            type="password"
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="new-password"
                            placeholder="Confirmer le mot de passe"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-blue-700 text-white text-base font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105 disabled:opacity-50"
                    >
                        Réinitialiser le mot de passe
                    </button>
                </form>
            </div>
        </div>
    );
}
