import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AdminLayout>
            <Head title="Mon profil" />
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AdminLayout>
    );
}
