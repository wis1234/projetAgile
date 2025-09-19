import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { 
  FaArrowLeft, 
  FaMoneyBillWave, 
  FaHistory, 
  FaCalendarAlt, 
  FaUser, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEllipsisH, 
  FaFileAlt, 
  FaTasks, 
  FaGift 
} from 'react-icons/fa';

export default function RemunerationShow({ remuneration, auth }) {
  const isAdmin = auth.user.roles?.includes('admin');
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <FaCheckCircle className="mr-1.5 h-4 w-4" />
            Payé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <FaClock className="mr-1.5 h-4 w-4" />
            En attente
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <FaTimesCircle className="mr-1.5 h-4 w-4" />
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'task_completion':
        return 'Tâche terminée';
      case 'bonus':
        return 'Bonus';
      case 'refund':
        return 'Remboursement';
      default:
        return 'Autre';
    }
  };

  return (
    <>
      <Head title={`Rémunération #${remuneration.id}`} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link 
            href={route('remunerations.index')} 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'historique
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Détails de la rémunération
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  #{remuneration.id} • {getTypeLabel(remuneration.type)}
                </p>
              </div>
              <div className="mt-2 sm:mt-0">
                {getStatusBadge(remuneration.status)}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700">
            <dl>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                  <FaMoneyBillWave className="mr-2 h-4 w-4" />
                  Montant
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 font-semibold text-lg">
                  {formatCurrency(parseFloat(remuneration.amount))}
                </dd>
              </div>
              
              {remuneration.task && (
                <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                    <FaTasks className="mr-2 h-4 w-4" />
                    Tâche associée
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                    <Link 
                      href={route('tasks.show', remuneration.task.id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {remuneration.task.title}
                    </Link>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      #{remuneration.task.id} • {remuneration.task.status}
                    </p>
                  </dd>
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                  <FaUser className="mr-2 h-4 w-4" />
                  Bénéficiaire
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 mr-3">
                      <FaUser className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{remuneration.user?.name || 'Utilisateur inconnu'}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{remuneration.user?.email || ''}</p>
                    </div>
                  </div>
                </dd>
              </div>
              
              <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                  <FaCalendarAlt className="mr-2 h-4 w-4" />
                  Dates
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Créée le</p>
                      <p>{formatDate(remuneration.created_at)}</p>
                    </div>
                    {remuneration.payment_date && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Payée le</p>
                        <p>{formatDate(remuneration.payment_date)}</p>
                      </div>
                    )}
                    {remuneration.approved_at && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Approuvée le</p>
                        <p>{formatDate(remuneration.approved_at)}</p>
                        {remuneration.approver && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Par {remuneration.approver.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </dd>
              </div>
              
              {remuneration.payment_method && (
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                    Méthode de paiement
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                    {remuneration.payment_method}
                    {remuneration.transaction_reference && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Référence: {remuneration.transaction_reference}
                      </p>
                    )}
                  </dd>
                </div>
              )}
              
              {(remuneration.description || remuneration.notes) && (
                <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-start">
                    <FaFileAlt className="mr-2 h-4 w-4 mt-0.5" />
                    Détails
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 space-y-4">
                    {remuneration.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
                        <p className="whitespace-pre-line">{remuneration.description}</p>
                      </div>
                    )}
                    {remuneration.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                          <FaInfoCircle className="mr-1.5 h-4 w-4" />
                          Notes internes
                        </p>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-line">
                            {remuneration.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          
          {/* Actions */}
          {isAdmin && remuneration.status === 'pending' && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6 space-x-3">
              <button
                type="button"
                onClick={() => {
                  const paymentMethod = prompt('Méthode de paiement (ex: Virement, Chèque, etc.) :');
                  
                  if (paymentMethod) {
                    const transactionRef = prompt('Référence de transaction (optionnel) :');
                    const notes = prompt('Notes supplémentaires (optionnel) :');
                    
                    router.post(route('remunerations.mark-as-paid', remuneration.id), {
                      payment_method: paymentMethod,
                      transaction_reference: transactionRef || '',
                      notes: notes || ''
                    }, {
                      onSuccess: () => {
                        // Rafraîchir la page après la mise à jour
                        router.reload();
                      },
                      onError: (errors) => {
                        alert('Une erreur est survenue : ' + (errors.message || 'Veuillez réessayer.'));
                      }
                    });
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaCheckCircle className="mr-2 h-4 w-4" />
                Marquer comme payé
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const reason = prompt('Veuillez indiquer la raison de l\'annulation :');
                  
                  if (reason) {
                    router.post(route('remunerations.cancel', remuneration.id), {
                      reason: reason
                    }, {
                      onSuccess: () => {
                        // Rafraîchir la page après l'annulation
                        router.reload();
                      },
                      onError: (errors) => {
                        alert('Une erreur est survenue : ' + (errors.message || 'Veuillez réessayer.'));
                      }
                    });
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaTimesCircle className="mr-2 h-4 w-4" />
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

RemunerationShow.layout = page => <AdminLayout children={page} />;
