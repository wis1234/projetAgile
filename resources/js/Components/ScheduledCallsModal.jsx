import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { FaCalendarAlt, FaTrash, FaSpinner, FaCheck } from 'react-icons/fa';

export default function ScheduledCallsModal({ show, onClose, projectId, csrfToken }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const fetchSchedules = () => {
    setLoading(true);
    fetch(`/projects/${projectId}/scheduled-calls`)
      .then(res => res.json())
      .then(data => {
        setSchedules(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (show) {
      fetchSchedules();
      
      // Set default time to now + 5 mins in local time for the input
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      // Format as YYYY-MM-DDThh:mm for datetime-local
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
      setScheduledAt(localISOTime);
    }
  }, [show, projectId]);

  const handleSchedule = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // The datetime-local is local. We send the ISO string which includes UTC offset automatically when parsed in JS
    const localDate = new Date(scheduledAt);
    const utcDateString = localDate.toISOString(); // sends as standard ISO UTC

    try {
      const res = await fetch(`/projects/${projectId}/scheduled-calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          title,
          scheduled_at: utcDateString,
        }),
      });
      if (res.ok) {
        setTitle('');
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`/projects/${projectId}/scheduled-calls/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
        },
      });
      if (res.ok) fetchSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="md">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <FaCalendarAlt className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold dark:text-white">Programmer un appel</h2>
        </div>

        <form onSubmit={handleSchedule} className="mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Point d'équipe, Démo..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date et heure (votre heure locale)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
            Programmer l'appel
          </button>
        </form>

        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Appels prévus
          </h3>
          {loading ? (
            <div className="flex justify-center p-4"><FaSpinner className="animate-spin text-gray-400" /></div>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucun appel programmé.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {schedules.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{s.title || 'Appel ProJA'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.scheduled_at).toLocaleString()} par {s.initiator?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancel(s.id)}
                    className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                    title="Annuler"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
