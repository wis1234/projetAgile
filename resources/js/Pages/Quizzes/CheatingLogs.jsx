import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowLeft, FaExclamationTriangle, FaEyeSlash, FaCopy, FaMouse, FaUser, FaClock, FaCheckCircle, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';

function CheatingLogs({ project, quiz, attempts = [] }) {
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedAttemptId(expandedAttemptId === id ? null : id);
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'tab_switch':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-bold">
            <FaEyeSlash className="text-amber-600" /> Changement d'onglet
          </span>
        );
      case 'copy_paste_attempt':
      case 'copy_attempt':
      case 'cut_attempt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 rounded-lg text-xs font-bold">
            <FaCopy className="text-rose-600" /> Copie / Couper de texte
          </span>
        );
      case 'paste_attempt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 rounded-lg text-xs font-bold">
            <FaCopy className="text-purple-600" /> Collage de texte
          </span>
        );
      case 'right_click_attempt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-lg text-xs font-bold">
            <FaMouse className="text-blue-600" /> Clic droit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold">
            <FaExclamationTriangle className="text-gray-500" /> Incident
          </span>
        );
    }
  };

  const totalIncidents = attempts.reduce((acc, curr) => acc + (curr.cheating_count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation */}
        <Link
          href={route('projects.quizzes.show', [project.id, quiz.id])}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400"
        >
          <FaArrowLeft /> Retour au quiz
        </Link>

        {/* Header & Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center text-xl font-bold">
                <FaExclamationTriangle />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                  Rapports de Surveillance & Anti-Triche
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Quiz : <span className="font-semibold text-gray-800 dark:text-gray-200">{quiz.title}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-rose-700 dark:text-rose-300 block">Candidats suspectés</span>
                <span className="text-2xl font-black text-rose-900 dark:text-rose-100">{attempts.length}</span>
              </div>
              <FaUser className="text-3xl text-rose-400/50" />
            </div>

            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 block">Total des incidents enregistrés</span>
                <span className="text-2xl font-black text-amber-900 dark:text-amber-100">{totalIncidents}</span>
              </div>
              <FaExclamationTriangle className="text-3xl text-amber-400/50" />
            </div>
          </div>
        </div>

        {/* Attempts List */}
        {attempts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 shadow-sm">
            <FaCheckCircle className="text-4xl text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Aucun comportement suspect détecté</h3>
            <p className="text-sm text-gray-500 mt-1">Tous les candidats ont effectué ce quiz sans alerte anti-triche.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((att) => {
              const isExpanded = expandedAttemptId === att.id;
              return (
                <div
                  key={att.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm transition"
                >
                  <div
                    onClick={() => toggleExpand(att.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                  >
                    <div className="flex items-center gap-3">
                      {att.user_photo ? (
                        <img src={`/storage/${att.user_photo}`} alt={att.user_name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm">
                          {att.user_name?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{att.user_name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{att.user_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1 justify-end">
                          <FaClock className="text-gray-400" />
                          <span>Début : {new Date(att.started_at).toLocaleString('fr-FR')}</span>
                        </div>
                        <div>
                          Statut :{' '}
                          {att.status === 'completed' ? (
                            <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                              <FaCheckCircle /> Terminé
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                              <FaSpinner className="animate-spin" /> En cours
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-3 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-extrabold text-xs rounded-xl flex items-center gap-1">
                        <FaExclamationTriangle />
                        <span>{att.cheating_count} incident(s)</span>
                      </div>

                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Log Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-5 space-y-3">
                      <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Journal chronologique des incidents
                      </h5>
                      <div className="space-y-2">
                        {Array.isArray(att.cheating_logs) && att.cheating_logs.map((log, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {getEventBadge(log.type)}
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {log.details || 'Activité suspecte enregistrée'}
                              </span>
                            </div>
                            <span className="text-gray-400 font-mono text-[11px]">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : 'Heure inconnue'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

CheatingLogs.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default CheatingLogs;
