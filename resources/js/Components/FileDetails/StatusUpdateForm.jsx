import React, { useState } from 'react';
import { router } from '@inertiajs/react';

const StatusUpdateForm = ({ file, statuses, canUpdateStatus }) => {
  const [status, setStatus] = useState(file.status);
  const [rejectionReason, setRejectionReason] = useState(file.rejection_reason || '');
  const [loading, setLoading] = useState(false);

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    if (e.target.value !== 'rejected') setRejectionReason('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canUpdateStatus) return;
    
    setLoading(true);
    router.put(route('files.update', file.id), {
      status,
      rejection_reason: status === 'rejected' ? rejectionReason : null,
    }, {
      onFinish: () => setLoading(false)
    });
  };

  if (!canUpdateStatus) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Mettre à jour le statut</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                id="status"
                value={status}
                onChange={handleStatusChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                disabled={loading}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === 'validated' ? 'Validé' : s === 'rejected' ? 'Rejeté' : 'En attente'}
                  </option>
                ))}
              </select>
            </div>

            {status === 'rejected' && (
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raison du rejet
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Pourquoi ce fichier est-il rejeté ?"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Mettre à jour'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateForm;
