import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { SectionCard, inputCls, btnDanger, btnGhost } from '@/Components/Profile/ui';

export default function DeleteUserForm() {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef();
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });

    const closeModal = () => { setConfirming(false); clearErrors(); reset(); };
    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: closeModal,
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <SectionCard
            id="danger"
            tone="red"
            icon={ExclamationTriangleIcon}
            title="Supprimer mon compte"
            description="Action définitive : votre compte et ses données associées seront effacés."
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
                    Avant de continuer, téléchargez les informations que vous souhaitez conserver. Cette opération ne peut pas être annulée.
                </p>
                <button type="button" onClick={() => setConfirming(true)} className={btnDanger}>Supprimer mon compte</button>
            </div>

            <Modal show={confirming} onClose={closeModal} maxWidth="md">
                <form onSubmit={deleteUser} className="p-6">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Supprimer définitivement votre compte ?</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                Saisissez votre mot de passe pour confirmer. Cette action est irréversible.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5">
                        <label htmlFor="delete_password" className="sr-only">Mot de passe</label>
                        <input id="delete_password" type="password" ref={passwordInput} value={data.password}
                            onChange={(e) => setData('password', e.target.value)} className={inputCls} placeholder="Votre mot de passe" autoFocus />
                        <InputError message={errors.password} className="mt-2" />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className={btnGhost}>Annuler</button>
                        <button type="submit" disabled={processing} className={btnDanger}>
                            {processing ? 'Suppression…' : 'Supprimer définitivement'}
                        </button>
                    </div>
                </form>
            </Modal>
        </SectionCard>
    );
}
