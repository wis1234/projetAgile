import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/Layouts/AdminLayout';
import BankDetailsForm from './Partials/BankDetailsForm';

// Page conservée pour les anciens liens ; le formulaire est aussi intégré à « Mon profil » (onglet Banque).
export default function BankDetails({ bankDetails }) {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-900 sm:px-6 sm:py-8">
            <Head title="Informations bancaires" />
            <div className="mx-auto max-w-3xl">
                <Link href={route('profile.edit')} className="mb-5 inline-flex items-center gap-2 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300">
                    <ArrowLeftIcon className="h-4 w-4" /> Retour au profil
                </Link>
                <BankDetailsForm bankDetails={bankDetails} />
            </div>
        </div>
    );
}

BankDetails.layout = page => <AdminLayout children={page} />;
