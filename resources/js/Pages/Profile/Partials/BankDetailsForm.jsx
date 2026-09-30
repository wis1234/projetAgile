import { useForm } from '@inertiajs/react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { SectionCard, Field, SaveBar, inputCls } from '@/Components/Profile/ui';

export default function BankDetailsForm({ bankDetails = {} }) {
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
    const upper = (k) => (e) => setData(k, e.target.value.toUpperCase());

    return (
        <form onSubmit={submit}>
            <SectionCard
                icon={BanknotesIcon}
                title="Informations bancaires"
                description="Coordonnées utilisées pour recevoir vos paiements."
                footer={<SaveBar processing={processing} saved={recentlySuccessful} note="Tous les champs sont obligatoires." />}
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nom de la banque" htmlFor="bank_name" error={errors.bank_name}>
                        <input id="bank_name" className={inputCls} value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} required autoComplete="off" />
                    </Field>
                    <Field label="Titulaire du compte" htmlFor="account_holder_name" error={errors.account_holder_name}>
                        <input id="account_holder_name" className={inputCls} value={data.account_holder_name} onChange={(e) => setData('account_holder_name', e.target.value)} required autoComplete="off" />
                    </Field>
                    <Field label="Numéro de compte" htmlFor="account_number" error={errors.account_number} className="sm:col-span-2">
                        <input id="account_number" inputMode="numeric" className={`${inputCls} font-mono`} value={data.account_number} onChange={(e) => setData('account_number', e.target.value)} required autoComplete="off" />
                    </Field>
                    <Field label="IBAN" htmlFor="iban" error={errors.iban}>
                        <input id="iban" maxLength={34} className={`${inputCls} font-mono uppercase`} value={data.iban} onChange={upper('iban')} required autoComplete="off" />
                    </Field>
                    <Field label="Code SWIFT / BIC" htmlFor="swift_code" error={errors.swift_code}>
                        <input id="swift_code" maxLength={11} className={`${inputCls} font-mono uppercase`} value={data.swift_code} onChange={upper('swift_code')} required autoComplete="off" />
                    </Field>
                </div>
            </SectionCard>
        </form>
    );
}
