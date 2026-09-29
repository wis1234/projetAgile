import React, { useEffect, useState } from 'react';
import { FaVideo, FaSpinner } from 'react-icons/fa';
import Modal from '@/Components/Modal';

const MemberAvatar = ({ user }) => (
  <img
    src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
    alt={user.name}
    className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
  />
);

// Sélection des membres à appeler : seuls les membres cochés verront leur téléphone sonner.
const CallMemberSelectModal = ({ show, onClose, members = [], currentUserId, onStart, loading }) => {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (show) setSelected([]);
  }, [show]);

  const callable = members.filter(u => u.id !== currentUserId);

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(prev => prev.length === callable.length ? [] : callable.map(u => u.id));
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="md">
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
          <FaVideo className="text-blue-500" /> Qui souhaitez-vous appeler ?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Seuls les membres sélectionnés verront leur téléphone sonner. Les autres ne seront pas dérangés.
        </p>

        {callable.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-6 text-center">Aucun autre membre sur ce projet.</p>
        ) : (
          <>
            <button onClick={toggleAll} className="text-xs font-semibold text-blue-600 hover:underline mb-3">
              {selected.length === callable.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {callable.map(user => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(user.id)}
                    onChange={() => toggle(user.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <MemberAvatar user={user} />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 truncate">{user.name}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => onStart(selected)}
            disabled={loading || selected.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaVideo />}
            {loading ? 'Démarrage…' : `Appeler (${selected.length})`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CallMemberSelectModal;
