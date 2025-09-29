import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faPlus } from '@fortawesome/free-solid-svg-icons';

export default function SubscriptionPlanForm({ plan = null }) {
    const { errors } = usePage().props;
    const { data, setData, post, put, processing } = useForm({
        name: plan?.name || '',
        description: plan?.description || '',
        price: plan?.price || '',
        duration_in_months: plan?.duration_in_months || 1,
        features: Array.isArray(plan?.features) ? [...plan.features] : [''],
        is_active: plan ? plan.is_active : true,
    });

    const handleSubmit = (e, createAnother = false) => {
        e.preventDefault();
        
        const formData = {
            ...data,
            features: data.features
                .map(feature => feature.trim())
                .filter(feature => feature !== '')
        };
        
        if (formData.features.length === 0) {
            formData.features = [''];
        }
        
        const onSuccess = () => {
            if (createAnother) {
                setData({
                    name: '',
                    description: '',
                    price: '',
                    duration_in_months: 1,
                    features: [''],
                    is_active: true,
                });
            }
        };

        if (plan) {
            put(route('admin.subscription-plans.update', plan.id), formData, {
                onSuccess: onSuccess,
                preserveScroll: true,
                onError: (errors) => {
                    console.error('Erreur lors de la mise à jour:', errors);
                }
            });
        } else {
            post(route('admin.subscription-plans.store'), formData, {
                onSuccess: onSuccess,
                onError: (errors) => {
                    console.error('Erreur lors de la création:', errors);
                }
            });
        }
    };

    const addFeature = () => {
        setData('features', [...data.features, '']);
    };

    const updateFeature = (index, value) => {
        const newFeatures = [...data.features];
        newFeatures[index] = value;
        setData('features', newFeatures);
    };

    const removeFeature = (index) => {
        if (data.features.length > 1) {
            const newFeatures = data.features.filter((_, i) => i !== index);
            setData('features', newFeatures);
        }
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-800">
                        {plan ? 'Modifier le plan' : 'Créer un nouveau plan'}
                    </h2>
                </div>
            }
        >
            <Head title={plan ? 'Modifier le plan' : 'Nouveau plan'} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form id="subscription-plan-form" onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
                                {/* Boutons d'action en haut du formulaire */}
                                <div className="flex justify-end space-x-3 pb-6 border-b border-gray-200">
                                    <Link
                                        href={route('admin.subscription-plans.index')}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                                        Retour
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={(e) => handleSubmit(e, false)}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        disabled={processing}
                                    >
                                        <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
                                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleSubmit(e, true)}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        disabled={processing}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                                        {processing ? 'Enregistrement...' : 'Enregistrer et créer un autre'}
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                        <div className="sm:col-span-4">
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                Nom du plan *
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    required
                                                />
                                            </div>
                                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                                Description
                                            </label>
                                            <div className="mt-1">
                                                <textarea
                                                    id="description"
                                                    rows={3}
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                                Prix (FCFA) *
                                            </label>
                                            <div className="relative mt-1 rounded-md shadow-sm">
                                                <input
                                                    type="number"
                                                    id="price"
                                                    min="0"
                                                    step="100"
                                                    value={data.price}
                                                    onChange={(e) => setData('price', parseFloat(e.target.value) || '')}
                                                    className="block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    required
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">FCFA</span>
                                                </div>
                                            </div>
                                            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label htmlFor="duration_in_months" className="block text-sm font-medium text-gray-700">
                                                Durée (mois) *
                                            </label>
                                            <div className="mt-1">
                                                <select
                                                    id="duration_in_months"
                                                    value={data.duration_in_months}
                                                    onChange={(e) => setData('duration_in_months', parseInt(e.target.value))}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    required
                                                >
                                                    <option value="1">1 mois</option>
                                                    <option value="3">3 mois</option>
                                                    <option value="6">6 mois</option>
                                                    <option value="12">12 mois</option>
                                                </select>
                                            </div>
                                            {errors.duration_in_months && <p className="mt-1 text-sm text-red-600">{errors.duration_in_months}</p>}
                                        </div>

                                        <div className="sm:col-span-2">
                                            <div className="flex items-center h-full">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="is_active"
                                                        name="is_active"
                                                        type="checkbox"
                                                        checked={data.is_active}
                                                        onChange={(e) => setData('is_active', e.target.checked)}
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor="is_active" className="font-medium text-gray-700">
                                                        Plan actif
                                                    </label>
                                                    <p className="text-gray-500">Rendre ce plan disponible pour les abonnements</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-6 mt-6">
                                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                                <div className="mb-4">
                                                    <h3 className="text-lg font-medium text-gray-900">Fonctionnalités</h3>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        Liste des fonctionnalités incluses dans ce plan. Les champs vides seront ignorés.
                                                    </p>
                                                </div>
                                                <div className="space-y-3">
                                                    {data.features.map((feature, index) => (
                                                        <div key={index} className="flex items-start space-x-2 group">
                                                            <div className="flex-1 relative">
                                                                <span className="absolute left-3 top-2.5 text-gray-400">
                                                                    {index + 1}.
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={feature}
                                                                    onChange={(e) => updateFeature(index, e.target.value)}
                                                                    className="block w-full pl-8 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                                    placeholder="Décrivez la fonctionnalité"
                                                                />
                                                            </div>
                                                            {data.features.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFeature(index)}
                                                                    className="inline-flex items-center p-2 text-red-500 hover:text-red-700 focus:outline-none"
                                                                    title="Supprimer cette fonctionnalité"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={addFeature}
                                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                                                            Ajouter une fonctionnalité
                                                        </button>
                                                    </div>
                                                </div>
                                                {errors.features && (
                                                    <p className="mt-2 text-sm text-red-600">
                                                        {errors.features}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6 mt-8 border-t border-gray-200">
                                        <Link
                                            href={route('admin.subscription-plans.index')}
                                            className="inline-flex items-center px-4 py-2 mr-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                                            Annuler
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={(e) => handleSubmit(e, false)}
                                            className="inline-flex items-center px-4 py-2 mr-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            disabled={processing}
                                        >
                                            <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
                                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleSubmit(e, true)}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            disabled={processing}
                                        >
                                            <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                                            {processing ? 'Enregistrement...' : 'Enregistrer et créer un autre'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}