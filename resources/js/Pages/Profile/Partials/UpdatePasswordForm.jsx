import { useForm } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { SectionCard, Field, SaveBar, inputCls } from '@/Components/Profile/ui';

function PasswordInput({ id, value, onChange, autoComplete, inputRef }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                id={id} ref={inputRef} type={show ? 'text' : 'password'} value={value}
                onChange={onChange} autoComplete={autoComplete} className={`${inputCls} pr-11`}
            />
            <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
                aria-label={show ? 'Masquer' : 'Afficher'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
        </div>
    );
}

function strength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
}
const levels = [
    { label: 'Trop faible', bar: 'bg-red-500', text: 'text-red-600' },
    { label: 'Faible', bar: 'bg-orange-500', text: 'text-orange-600' },
    { label: 'Moyen', bar: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Bon', bar: 'bg-lime-500', text: 'text-lime-600' },
    { label: 'Excellent', bar: 'bg-emerald-500', text: 'text-emerald-600' },
];

export default function UpdatePasswordForm() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '', password: '', password_confirmation: '',
    });

    const score = useMemo(() => strength(data.password), [data.password]);
    const lvl = levels[score];
    const mismatch = data.password_confirmation && data.password !== data.password_confirmation;

    const submit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) { reset('password', 'password_confirmation'); passwordInput.current?.focus(); }
                if (errs.current_password) { reset('current_password'); currentPasswordInput.current?.focus(); }
            },
        });
    };

    return (
        <form onSubmit={submit}>
            <SectionCard
                id="securite"
                icon={ShieldCheckIcon}
                title="Mot de passe et sécurité"
                description="Utilisez un mot de passe long et unique pour protéger votre compte."
                footer={<SaveBar processing={processing} saved={recentlySuccessful} label="Mettre à jour" note="Minimum 8 caractères, avec lettres et chiffres recommandés." />}
            >
                <div className="grid max-w-xl gap-5">
                    <Field label="Mot de passe actuel" htmlFor="current_password" error={errors.current_password}>
                        <PasswordInput id="current_password" inputRef={currentPasswordInput} value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)} autoComplete="current-password" />
                    </Field>
                    <Field label="Nouveau mot de passe" htmlFor="password" error={errors.password}>
                        <PasswordInput id="password" inputRef={passwordInput} value={data.password}
                            onChange={(e) => setData('password', e.target.value)} autoComplete="new-password" />
                        {data.password && (
                            <div className="mt-2.5">
                                <div className="flex gap-1.5">
                                    {[0, 1, 2, 3].map((i) => (
                                        <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? lvl.bar : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    ))}
                                </div>
                                <p className={`mt-1.5 text-xs font-medium ${lvl.text}`}>Robustesse : {lvl.label}</p>
                            </div>
                        )}
                    </Field>
                    <Field label="Confirmer le nouveau mot de passe" htmlFor="password_confirmation"
                        error={errors.password_confirmation || (mismatch ? 'Les mots de passe ne correspondent pas.' : '')}>
                        <PasswordInput id="password_confirmation" value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)} autoComplete="new-password" />
                    </Field>
                </div>
            </SectionCard>
        </form>
    );
}
