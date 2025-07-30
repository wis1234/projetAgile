import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faSchool, 
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faGlobe,
  faUserTie,
  faInfoCircle,
  faSpinner,
  faEraser,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import School from '@/Models/School';

export default function CreateSchool({ auth }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    code: '',
    description: '',
    type: School.TYPE_PRIMARY,
    status: School.STATUS_ACTIVE,
    address: '',
    postal_code: '',
    city: '',
    state: '',
    country: 'Guinée',
    email: '',
    phone: '',
    website: '',
    principal_name: '',
    capacity: '',
  });

  const schoolTypes = Object.entries(School.getTypeOptions()).map(([value, label]) => ({
    value,
    label
  }));

  const statuses = Object.entries(School.getStatusOptions()).map(([value, label]) => ({
    value,
    label
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      post(route('schools.store'));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!data.name) newErrors.name = "Le nom de l'établissement est requis";
    if (!data.type) newErrors.type = "Le type d'établissement est requis";
    if (!data.status) newErrors.status = "Le statut est requis";
    if (!data.address) newErrors.address = "L'adresse est requise";
    if (!data.city) newErrors.city = "La ville est requise";
    if (!data.postal_code) newErrors.postal_code = "Le code postal est requis";
    if (!data.country) newErrors.country = "Le pays est requis";
    if (!data.email) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "L'email n'est pas valide";
    if (!data.phone) newErrors.phone = "Le numéro de téléphone est requis";
    
    if (data.website && !/^https?:\/\//.test(data.website)) {
      newErrors.website = "L'URL du site web doit commencer par http:// ou https://";
    }
    
    if (data.capacity && (isNaN(data.capacity) || data.capacity < 0 || data.capacity > 10000000)) {
      newErrors.capacity = "La capacité doit être un nombre entre 0 et 10,000,000";
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [formErrors, setFormErrors] = useState({});

  const resetForm = () => {
    reset();
    setFormErrors({});
  };

  // Rendu du message d'erreur
  const renderError = (field) => {
    const error = formErrors[field] || errors[field];
    return error ? (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
        <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
        {error}
      </p>
    ) : null;
  };

  // Vérifie si le formulaire a des modifications non sauvegardées
  const hasChanges = () => {
    return Object.keys(data).some(key => {
      // Vérifie si la valeur actuelle est différente de la valeur initiale
      return data[key] !== '' && data[key] !== null && data[key] !== undefined;
    });
  };

  const generateSchoolCode = () => {
    // Génère un code d'école aléatoire (ex: ECOLE12345)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const prefix = 'ECOLE';
    const code = `${prefix}${randomNum}`;
    setData('code', code);
  };

  return (
    <AdminLayout>
      <Head title="Ajouter un établissement" />
      
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <Link
                href={route('schools.index')}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4 md:mb-0"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour à la liste
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl mt-2">
                Ajouter un nouvel établissement
              </h1>
            </div>
          </div>

          {/* Formulaire */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                <FontAwesomeIcon icon={faSchool} className="mr-2 text-blue-500" />
                Informations de l'établissement
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Remplissez les informations requises pour créer un nouvel établissement scolaire.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-8">
                {/* Section Informations générales */}
                <div className="space-y-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-blue-500" />
                    Informations générales
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nom de l'établissement *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="name"
                          value={data.name}
                          onChange={(e) => setData('name', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                          required
                        />
                        {renderError('name')}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Code d'identification
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          id="code"
                          value={data.code}
                          onChange={(e) => setData('code', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-l-md"
                        />
                        <button
                          type="button"
                          onClick={generateSchoolCode}
                          className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-100 dark:hover:bg-gray-500"
                        >
                          Générer
                        </button>
                      </div>
                      {renderError('code')}
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type d'établissement *
                      </label>
                      <select
                        id="type"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        required
                      >
                        {schoolTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {renderError('type')}
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Statut *
                      </label>
                      <select
                        id="status"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        required
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {renderError('status')}
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          rows={3}
                          value={data.description}
                          onChange={(e) => setData('description', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                        />
                        {renderError('description')}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email *
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          id="email"
                          value={data.email}
                          onChange={(e) => setData('email', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                          required
                        />
                        {renderError('email')}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Téléphone *
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          id="phone"
                          value={data.phone}
                          onChange={(e) => setData('phone', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                          required
                        />
                        {renderError('phone')}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Capacité d'accueil
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="capacity"
                          min="0"
                          max="10000000"
                          value={data.capacity}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : '';
                            if (value === '' || (value >= 0 && value <= 10000000)) {
                              setData('capacity', value);
                            }
                          }}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                        />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Nombre maximum d'étudiants/élèves (max: 10,000,000)
                        </p>
                        {data.capacity > 10000000 && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            La capacité maximale autorisée est de 10,000,000
                          </p>
                        )}
                        {renderError('capacity')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Adresse */}
                <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-500" />
                    Adresse
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Adresse *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="address"
                          value={data.address}
                          onChange={(e) => setData('address', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                          required
                        />
                        {renderError('address')}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Code postal *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="postal_code"
                          value={data.postal_code}
                          onChange={(e) => setData('postal_code', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                          required
                        />
                        {renderError('postal_code')}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ville *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="city"
                          value={data.city}
                          onChange={(e) => setData('city', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                          required
                        />
                        {renderError('city')}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Région / Département
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="state"
                          value={data.state}
                          onChange={(e) => setData('state', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                        />
                        {renderError('state')}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Pays *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="country"
                          value={data.country}
                          onChange={(e) => setData('country', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                          required
                        />
                        {renderError('country')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton de soumission */}
                <div className="pt-8 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={!hasChanges() || processing}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faEraser} className="mr-2 h-4 w-4" />
                    Réinitialiser
                  </button>
                  <button
                    type="submit"
                    disabled={!hasChanges() || processing}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(!hasChanges() || processing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processing ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 h-4 w-4" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="mr-2 h-4 w-4" />
                        Créer l'établissement
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
