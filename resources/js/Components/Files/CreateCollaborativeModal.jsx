import React, { useState } from 'react';
import axios from 'axios';
import {
  FaTimes, FaFileWord, FaFileExcel, FaUpload, FaSpinner,
  FaCheckCircle, FaExclamationTriangle, FaArrowRight, FaPlus
} from 'react-icons/fa';

export default function CreateCollaborativeModal({
  isOpen,
  onClose,
  projectId,
  taskId = null,
  onFileCreated,
}) {
  if (!isOpen) return null;

  const [docType, setDocType] = useState('docx'); // 'docx' | 'excel' | 'upload'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (docType === 'upload') {
      if (!fileToUpload) {
        setError('Veuillez sélectionner un fichier à téléverser.');
        return;
      }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('name', name || fileToUpload.name.replace(/\.[^/.]+$/, ''));
        formData.append('file', fileToUpload);
        formData.append('project_id', projectId);
        if (taskId) formData.append('task_id', taskId);
        if (description) formData.append('description', description);

        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        const res = await axios.post('/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRF-TOKEN': csrf,
          },
        });

        if (onFileCreated) onFileCreated(res.data);
        onClose();
        window.location.reload();
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de l'envoi du fichier.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // DOCX ou EXCEL
    if (!name.trim()) {
      setError('Veuillez donner un titre à votre fichier.');
      return;
    }

    setLoading(true);
    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
      const res = await axios.post('/files/create-collaborative', {
        name: name.trim(),
        doc_type: docType,
        project_id: projectId,
        task_id: taskId,
        description: description.trim(),
      }, {
        headers: {
          'X-CSRF-TOKEN': csrf,
          'Accept': 'application/json',
        },
      });

      if (res.data.redirect) {
        window.location.href = res.data.redirect;
      } else if (res.data.data?.id) {
        window.location.href = `/files/${res.data.data.id}/edit-content`;
      } else {
        if (onFileCreated) onFileCreated(res.data);
        onClose();
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FaPlus className="text-blue-500 text-sm" />
              Ajouter ou créer un fichier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choisissez le format de fichier pour travailler en temps réel
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
            <FaExclamationTriangle className="shrink-0 text-sm" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Format Selection Cards */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Type de document *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Option DOCX */}
              <button
                type="button"
                onClick={() => setDocType('docx')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                  docType === 'docx'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg mb-2 shadow-sm">
                  <FaFileWord />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Document Word</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Type Google Docs</p>
                </div>
              </button>

              {/* Option EXCEL */}
              <button
                type="button"
                onClick={() => setDocType('excel')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                  docType === 'excel'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg mb-2 shadow-sm">
                  <FaFileExcel />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Tableur Excel</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Type Google Sheets</p>
                </div>
              </button>

              {/* Option UPLOAD */}
              <button
                type="button"
                onClick={() => setDocType('upload')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                  docType === 'upload'
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg mb-2 shadow-sm">
                  <FaUpload />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Importer</p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Fichier existant</p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional inputs */}
          {docType === 'upload' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Sélectionner le fichier *
              </label>
              <input
                type="file"
                required
                onChange={e => {
                  const f = e.target.files[0];
                  setFileToUpload(f);
                  if (f && !name) setName(f.name.replace(/\.[^/.]+$/, ''));
                }}
                className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-300 cursor-pointer"
              />
            </div>
          ) : null}

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Nom du fichier {docType !== 'upload' && '*'}
            </label>
            <input
              type="text"
              required={docType !== 'upload'}
              placeholder={
                docType === 'docx'
                  ? 'ex: Compte-rendu de réunion, Spécifications techniques…'
                  : docType === 'excel'
                  ? 'ex: Budget prévisionnel, Suivi des dépenses…'
                  : 'Optionnel : nom personnalisé'
              }
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Description input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Description ou notes (optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Précisez l'objectif ou le contenu de ce fichier…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md flex items-center gap-2 transition duration-200 disabled:opacity-50 ${
                docType === 'excel'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : docType === 'upload'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {loading && <FaSpinner className="animate-spin text-xs" />}
              <span>
                {docType === 'upload'
                  ? 'Téléverser le fichier'
                  : 'Créer et travailler en direct'}
              </span>
              {!loading && <FaArrowRight className="text-[10px]" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
