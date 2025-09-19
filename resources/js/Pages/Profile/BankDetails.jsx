import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';

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
        put(route('profile.update-bank-details'));
    };

    return (
        <div>
            <Head title="Informations bancaires" />

            <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Informations bancaires
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Mettez à jour les informations de votre compte bancaire pour recevoir vos paiements.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="bank_name" value="Nom de la banque" />
                        <TextInput
                            id="bank_name"
                            className="mt-1 block w-full"
                            value={data.bank_name}
                            onChange={(e) => setData('bank_name', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.bank_name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="account_holder_name" value="Nom du titulaire du compte" />
                        <TextInput
                            id="account_holder_name"
                            className="mt-1 block w-full"
                            value={data.account_holder_name}
                            onChange={(e) => setData('account_holder_name', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.account_holder_name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="account_number" value="Numéro de compte" />
                        <TextInput
                            id="account_number"
                            className="mt-1 block w-full"
                            value={data.account_number}
                            onChange={(e) => setData('account_number', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.account_number} />
                    </div>

                    <div>
                        <InputLabel htmlFor="iban" value="IBAN" />
                        <TextInput
                            id="iban"
                            className="mt-1 block w-full font-mono"
                            value={data.iban}
                            onChange={(e) => setData('iban', e.target.value.toUpperCase())}
                            required
                        />
                        <InputError className="mt-2" message={errors.iban} />
                    </div>

                    <div>
                        <InputLabel htmlFor="swift_code" value="Code SWIFT/BIC" />
                        <TextInput
                            id="swift_code"
                            className="mt-1 block w-full font-mono"
                            value={data.swift_code}
                            onChange={(e) => setData('swift_code', e.target.value.toUpperCase())}
                            required
                        />
                        <InputError className="mt-2" message={errors.swift_code} />
                    </div>

                    <div className="flex items-center gap-4">
                        <PrimaryButton disabled={processing}>
                            Enregistrer
                        </PrimaryButton>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-400">Enregistré.</p>
                        </Transition>
                    </div>
                </form>
            </div>
        </div>
    );
}

BankDetails.layout = page => <AdminLayout children={page} />;
