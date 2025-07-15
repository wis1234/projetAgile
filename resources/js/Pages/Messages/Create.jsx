import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';

export default function Create({ projects, users }) {
    const { errors, flash } = usePage().props;
    const [values, setValues] = useState({
        content: '',
        project_id: projects[0]?.id || '',
        user_id: users[0]?.id || '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = e => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = e => {
        e.preventDefault();
        setSubmitting(true);
        Inertia.post(route('messages.store'), values, {
            onSuccess: () => {
                setSubmitting(false);
                setTimeout(() => Inertia.visit('/messages'), 1200);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div className="max-w-xl w-full mx-auto">
                <h1 className="text-2xl font-bold mb-4">Ajouter un message</h1>
                {flash.success && <div className="alert alert-success mb-4">{flash.success}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-semibold">Contenu</label>
                        <textarea
                            name="content"
                            value={values.content}
                            onChange={handleChange}
                            className="textarea textarea-bordered w-full"
                            rows={4}
                        />
                        {errors.content && <div className="text-error text-sm">{errors.content}</div>}
                    </div>
                    <div>
                        <label className="block font-semibold">Projet</label>
                        <select
                            name="project_id"
                            value={values.project_id}
                            onChange={handleChange}
                            className="select select-bordered w-full"
                        >
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                        {errors.project_id && <div className="text-error text-sm">{errors.project_id}</div>}
                    </div>
                    <div>
                        <label className="block font-semibold">Utilisateur</label>
                        <select
                            name="user_id"
                            value={values.user_id}
                            onChange={handleChange}
                            className="select select-bordered w-full"
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        {errors.user_id && <div className="text-error text-sm">{errors.user_id}</div>}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <Link href="/messages" className="btn btn-secondary">Retour à la liste</Link>
                    </div>
                </form>
            </div>
        </div>
    );
} 