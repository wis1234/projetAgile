import { Head, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans p-4">
            <Head title="Mot de passe oublié" />
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-10 flex flex-col items-center">
                <ApplicationLogo className="text-5xl mb-4" />
                <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2 text-center">Mot de passe oublié ?</h2>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                    Entrez votre adresse email et ProjA vous enverra un lien pour réinitialiser votre mot de passe.
                </p>
                {status && (
                    <div className="mb-4 text-sm font-medium text-green-600 text-center">
                        {status}
                    </div>
                )}
                <form onSubmit={submit} className="w-full space-y-4">
                    <div className="relative">
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Adresse email"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-blue-700 text-white text-base font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105 disabled:opacity-50"
                    >
                        Envoyer le lien de réinitialisation
                    </button>
                </form>
            </div>
        </div>
    );
}
