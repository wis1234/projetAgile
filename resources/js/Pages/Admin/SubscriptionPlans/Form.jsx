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
        
        // Préparer les données à envoyer
        const formData = {
            ...data,
            // S'assurer que les fonctionnalités sont bien formatées
            features: data.features
                .map(feature => feature.trim())
                .filter(feature => feature !== '')
        };
        
        // Si toutes les fonctionnalités ont été supprimées, en ajouter une vide
        if (formData.features.length === 0) {
            formData.features = [''];
        }
        
        const onSuccess = () => {
            if (createAnother) {
                // Réinitialiser le formulaire pour une nouvelle entrée
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
                                <div className="space-y-8 divide-y divide-gray-200">
                                    <div>
                                        <div className="grid grid-cols-1 mt-6 gap-y-6 gap-x-4 sm:grid-cols-6">
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
                                                <div className="flex items-center">
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

                                            <div className="sm:col-span-6">
                                                <label className="block text-sm font-medium text-gray-700">Fonctionnalités *</label>
                                                <p className="mt-1 text-sm text-gray-500">Liste des fonctionnalités incluses dans ce plan</p>
                                                
                                                <div className="mt-4 space-y-2">
                                                    {data.features.map((feature, index) => (
                                                        <div key={index} className="flex space-x-2">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={feature}
                                                                    onChange={(e) => updateFeature(index, e.target.value)}
                                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                                    required
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFeature(index)}
                                                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                            >
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                    ))}
                                                    
                                                    <div className="pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={addFeature}
                                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                
                                                
                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={addFeature}
                                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        Ajouter une fonctionnalité
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {errors.features && <p className="mt-1 text-sm text-red-600">{errors.features}</p>}
                                        </div>
                                        
                                    </div>
                                </div>
                            </div>
                            
                            {/* Boutons d'action en bas du formulaire */}
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
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </AdminLayout>
);
}