import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faSchool, 
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faUserTie,
  faInfoCircle,
  faSpinner,
  faEraser,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import School from '@/Models/School';

export default function EditSchool({ auth, school }) {
  const { flash } = usePage().props;
  const [showSuccess, setShowSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Utilisation des constantes du modèle School pour les valeurs par défaut
  const { data, setData, put, processing, errors, reset } = useForm({
    name: school.name || '',
    code: school.code || '',
    description: school.description || '',
    type: school.type || School.TYPE_PRIMARY,
    status: school.status || School.STATUS_ACTIVE,
    address: school.address || '',
    city: school.city || '',
    state: school.state || '',
    country: school.country || 'Guinée',
    postal_code: school.postal_code || '',
    phone: school.phone || '',
    email: school.email || '',
    website: school.website || '',
    principal_name: school.principal_name || '',
    capacity: school.capacity || '',
  });

  // Utilisation des options du modèle School
  const schoolTypes = Object.entries(School.getTypeOptions()).map(([value, label]) => ({
    value,
    label
  }));

  const statuses = Object.entries(School.getStatusOptions()).map(([value, label]) => ({
    value,
    label
  }));

  // Afficher le message de succès
  useEffect(() => {
    if (flash && flash.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  // Valider le formulaire avant soumission
  const validateForm = () => {
    const newErrors = {};
    
    if (!data.name.trim()) newErrors.name = "Le nom de l'établissement est requis";
    if (!data.email) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "L'email n'est pas valide";
    
    if (!data.phone) newErrors.phone = "Le numéro de téléphone est requis";
    else if (!/^[0-9+\s-]{10,20}$/.test(data.phone)) newErrors.phone = "Le numéro de téléphone n'est pas valide";
    
    if (!data.address) newErrors.address = "L'adresse est requise";
    if (!data.postal_code) newErrors.postal_code = "Le code postal est requis";
    else if (!/^[0-9]{5}$/.test(data.postal_code)) newErrors.postal_code = "Le code postal doit contenir 5 chiffres";
    
    if (!data.city) newErrors.city = "La ville est requise";
    
    if (data.website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/.test(data.website)) {
      newErrors.website = "L'URL du site web n'est pas valide";
    }
    
    if (data.capacity > 10000000) newErrors.capacity = "La capacité maximale autorisée est de 10,000,000";
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      put(route('schools.update', school.id), { preserveScroll: true });
    }
  };

  const resetForm = () => {
    reset({
      name: school.name,
      code: school.code,
      description: school.description,
      type: school.type,
      status: school.status,
      address: school.address,
      city: school.city,
      state: school.state,
      country: school.country,
      postal_code: school.postal_code,
      phone: school.phone,
      email: school.email,
      website: school.website,
      principal_name: school.principal_name,
      capacity: school.capacity,
    });
    setFormErrors({});
  };

  // Rendu du message d'erreur
  const renderError = (field) => {
    const error = formErrors[field] || errors[field];
    return error ? (
      <p className="mt-1 text-sm text-red-600 flex items-center">
        <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
        {error}
      </p>
    ) : null;
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Vérifier les modifications
  const hasChanges = () => {
    return (
      data.name !== school.name ||
      data.description !== school.description ||
      data.type !== school.type ||
      data.status !== school.status ||
      data.address !== school.address ||
      data.city !== school.city ||
      data.state !== school.state ||
      data.country !== school.country ||
      data.postal_code !== school.postal_code ||
      data.phone !== school.phone ||
      data.email !== school.email ||
      data.website !== school.website ||
      data.principal_name !== school.principal_name ||
      data.capacity !== school.capacity
    );
  };

  return (
    <AdminLayout>
      <Head title={`Modifier ${school.name}`} />
      
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Message de succès */}
          {showSuccess && (
            <div className="mb-6 rounded-md bg-green-50 dark:bg-green-900/30 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {flash.success}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* En-tête avec navigation */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <Link
                href={route('schools.show', school.id)}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4 md:mb-0"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour aux détails
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl mt-2">
                Modifier l'établissement
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Dernière mise à jour le {formatDate(school.updated_at)} par {school.updated_by?.name || 'Utilisateur inconnu'}
              </p>
            </div>
          </div>

          {/* Formulaire principal */}
          <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 dark:divide-gray-700">
            {/* Section Informations générales */}
            <div className="pt-6">
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
                      Code
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="code"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                      />
                      {renderError('code')}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type d'établissement *
                    </label>
                    <div className="mt-1">
                      <select
                        id="type"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
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
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Statut *
                    </label>
                    <div className="mt-1">
                      <select
                        id="status"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
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
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                      />
                      {renderError('description')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Adresse */}
            <div className="pt-8">
              <div className="space-y-6">
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
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pays *
                    </label>
                    <div className="mt-1">
                      <select
                        id="country"
                        value={data.country}
                        onChange={(e) => setData('country', e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                        required
                      >
                        <option value="Guinée">Guinée</option>
                        <option value="France">France</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Canada">Canada</option>
                        <option value="Autre">Autre</option>
                      </select>
                      {renderError('country')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Contact */}
            <div className="pt-8">
              <div className="space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-blue-500" />
                  Contact
                </h4>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
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

                  <div className="sm:col-span-3">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Site web
                    </label>
                    <div className="mt-1">
                      <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
                          https://
                        </span>
                        <input
                          type="text"
                          id="website"
                          value={data.website ? data.website.replace(/^https?:\/\//, '') : ''}
                          onChange={(e) => setData('website', e.target.value ? `https://${e.target.value}` : '')}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="www.example.com"
                        />
                      </div>
                      {renderError('website')}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="principal_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom du directeur/recteur
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="principal_name"
                        value={data.principal_name}
                        onChange={(e) => setData('principal_name', e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                      />
                      {renderError('principal_name')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Capacité */}
            <div className="pt-8">
              <div className="space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  <FontAwesomeIcon icon={faSchool} className="mr-2 text-blue-500" />
                  Capacité
                </h4>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
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
            </div>

            {/* Boutons d'action */}
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
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
