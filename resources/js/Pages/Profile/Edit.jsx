import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AdminLayout>
            <Head title="Mon profil" />
            <div className="w-full flex flex-col items-center min-h-screen bg-white dark:bg-gray-900 py-10 px-2">
                <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                    <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-800 rounded-lg p-8">
                        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 mb-8">Mon profil</h1>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-800 rounded-lg shadow p-8">
                        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">Sécurité</h2>
                        <UpdatePasswordForm />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-800 rounded-lg shadow p-8">
                        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">Supprimer mon compte</h2>
                        <DeleteUserForm />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
