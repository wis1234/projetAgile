import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeftIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/Layouts/AdminLayout';
import { SectionCard, Field, SaveBar, inputCls } from '@/Components/Profile/ui';

export default function BankDetails({ bankDetails }) {
    const { data, setData, put, errors, processing, recentlySuccessful } = useForm({
        bank_name: bankDetails.bank_name || '',
        account_holder_name: bankDetails.account_holder_name || '',
        account_number: bankDetails.account_number || '',
        iban: bankDetails.iban || '',
        swift_code: bankDetails.swift_code || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('profile.update-bank-details'), { preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900 sm:px-6">
            <Head title="Informations bancaires" />
            <div className="mx-auto max-w-3xl">
                <Link href={route('profile.edit')} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300">
                    <ArrowLeftIcon className="h-4 w-4" /> Retour au profil
                </Link>
                <form onSubmit={submit}>
                    <SectionCard
                        icon={BanknotesIcon}
                        title="Informations bancaires"
                        description="Coordonnées utilisées pour recevoir vos paiements."
                        footer={<SaveBar processing={processing} saved={recentlySuccessful} note="Tous les champs sont obligatoires." />}
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Nom de la banque" htmlFor="bank_name" error={errors.bank_name}>
                                <input id="bank_name" className={inputCls} value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} required />
                            </Field>
                            <Field label="Titulaire du compte" htmlFor="account_holder_name" error={errors.account_holder_name}>
                                <input id="account_holder_name" className={inputCls} value={data.account_holder_name} onChange={(e) => setData('account_holder_name', e.target.value)} required />
                            </Field>
                            <Field label="Numéro de compte" htmlFor="account_number" error={errors.account_number} className="sm:col-span-2">
                                <input id="account_number" className={`${inputCls} font-mono`} value={data.account_number} onChange={(e) => setData('account_number', e.target.value)} required />
                            </Field>
                            <Field label="IBAN" htmlFor="iban" error={errors.iban}>
                                <input id="iban" className={`${inputCls} font-mono uppercase`} value={data.iban} onChange={(e) => setData('iban', e.target.value.toUpperCase())} required />
                            </Field>
                            <Field label="Code SWIFT / BIC" htmlFor="swift_code" error={errors.swift_code}>
                                <input id="swift_code" className={`${inputCls} font-mono uppercase`} value={data.swift_code} onChange={(e) => setData('swift_code', e.target.value.toUpperCase())} required />
                            </Field>
                        </div>
                    </SectionCard>
                </form>
            </div>
        </div>
    );
}

BankDetails.layout = page => <AdminLayout children={page} />;
