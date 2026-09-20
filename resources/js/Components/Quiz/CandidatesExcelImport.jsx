import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
  FaFileExcel, FaCloudUploadAlt, FaTimes, FaCheck, FaCopy, FaDownload, FaSpinner,
  FaInfoCircle, FaExclamationTriangle, FaUserPlus,
} from 'react-icons/fa';

const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ACCEPT = '.xlsx,.xls,.csv,.txt';
const ALLOWED = ['xlsx', 'xls', 'csv', 'txt'];

const extOf = (name) => (name.split('.').pop() || '').toLowerCase();

const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
    : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

/** Message lisible pour une réponse d'erreur du serveur. */
function messageFrom(err) {
  const status = err.response?.status;
  const data = err.response?.data;
  if (data?.errors?.file?.[0]) return data.errors.file[0];
  if (status === 403) return 'Vous n\u2019avez pas le droit d\u2019ajouter des membres à ce quiz.';
  if (status === 413) return 'Le fichier est trop volumineux pour le serveur.';
  if (status === 419) return 'Votre session a expiré. Rechargez la page, puis réessayez.';
  if (status === 429) return 'Trop de tentatives. Patientez une minute, puis réessayez.';
  if (data?.message) return data.message;
  return 'L\u2019import a échoué. Vérifiez votre connexion, puis réessayez.';
}

function sourceNote(s) {
  const where = s.sheets > 1 ? `, feuille ${s.sheet}` : '';
  return s.detected_by === 'header'
    ? `Colonne « ${s.header} » détectée (colonne ${s.column}${where}).`
    : `Aucun en-tête « email » trouvé : la colonne ${s.column}${where} a été retenue parce qu\u2019elle contient des adresses e-mail.`;
}

function downloadTemplate() {
  const blob = new Blob(['\uFEFFemail\nprenom.nom@exemple.com\n'], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modele-candidats.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900/50',
  blue: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50',
  amber: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50',
  rose: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-900/50',
  gray: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600',
};

function Stat({ value, label, tone }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${TONES[tone]}`}>
      <span className="block text-xl font-extrabold leading-none">{value}</span>
      <span className="block text-xs font-semibold mt-1">{label}</span>
    </div>
  );
}

function CopyButton({ items }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.preventDefault(); // ne pas replier le <details>
    try {
      await navigator.clipboard.writeText(items.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : rien à faire */
    }
  };
  return (
    <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
      {copied ? <FaCheck /> : <FaCopy />} {copied ? 'Copié' : 'Copier la liste'}
    </button>
  );
}

function Fold({ title, hint, items, tone = 'gray', copyable = false }) {
  if (!items.length) return null;
  return (
    <details className={`rounded-xl border ${TONES[tone]} group`}>
      <summary className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer text-sm font-semibold select-none">
        <span>{title} ({items.length})</span>
        {copyable && <CopyButton items={items} />}
      </summary>
      <div className="px-3 pb-3 space-y-2">
        {hint && <p className="text-xs opacity-80">{hint}</p>}
        <ul className="max-h-40 overflow-y-auto text-xs font-mono space-y-0.5 break-all">
          {items.map((it, i) => (
            <li key={`${it}-${i}`}>{it}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function Report({ report }) {
  const { summary: s, source } = report;
  const added = s.added > 0;

  return (
    <div className="space-y-4">
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 ${added ? TONES.emerald : TONES.amber}`}
        role="status"
      >
        <span className="mt-0.5 text-lg">{added ? <FaCheck /> : <FaInfoCircle />}</span>
        <div>
          <p className="font-bold text-sm">
            {added
              ? `${plural(s.added, 'membre ajouté', 'membres ajoutés')} au quiz`
              : 'Aucun nouveau membre ajouté'}
          </p>
          <p className="text-xs mt-0.5 opacity-90">
            {plural(s.emails, 'adresse distincte lue', 'adresses distinctes lues')} dans le fichier. {sourceNote(source)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <Stat value={s.added} label="Ajoutés" tone="emerald" />
        <Stat value={s.already} label="Déjà membres" tone="blue" />
        <Stat value={s.not_found} label="Sans compte ProJA" tone={s.not_found ? 'amber' : 'gray'} />
        {s.unverified > 0 && <Stat value={s.unverified} label="Compte non vérifié" tone="amber" />}
        {s.managers > 0 && <Stat value={s.managers} label="Responsables (ignorés)" tone="gray" />}
        {s.invalid > 0 && <Stat value={s.invalid} label="Valeurs invalides" tone="rose" />}
        {s.duplicates > 0 && <Stat value={s.duplicates} label="Doublons ignorés" tone="gray" />}
      </div>

      {source.truncated && (
        <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
          <FaExclamationTriangle className="mt-0.5 shrink-0" /> Seules les 5 000 premières lignes ont été lues.
        </p>
      )}

      <div className="space-y-2">
        <Fold
          title="Ajoutés"
          tone="emerald"
          items={report.added.map((u) => `${u.name} — ${u.email}`)}
        />
        <Fold
          title="Sans compte ProJA"
          tone="amber"
          hint="Aucun utilisateur ne correspond à ces adresses. Invitez ces personnes à s’inscrire, puis relancez l’import."
          items={report.not_found}
          copyable
        />
        <Fold
          title="Comptes non vérifiés"
          tone="amber"
          hint="Ces personnes ont un compte mais n’ont pas encore confirmé leur adresse e-mail."
          items={report.unverified}
          copyable
        />
        <Fold
          title="Responsables du projet"
          tone="gray"
          hint="Les responsables ne passent pas les quiz du projet : ils ont été ignorés."
          items={report.managers}
        />
        <Fold
          title="Valeurs invalides"
          tone="rose"
          hint="Ces cellules de la colonne e-mail ne contiennent pas d’adresse valide."
          items={report.invalid}
        />
      </div>
    </div>
  );
}

export default function CandidatesExcelImport({ project, quiz }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setError(null);
    setReport(null);
    setProgress(0);
    setDragging(false);
  };

  const close = useCallback(() => {
    if (uploading) return;
    setOpen(false);
    resetState();
    triggerRef.current?.focus();
  }, [uploading]);

  // Modale : défilement de la page bloqué, fermeture avec Échap, focus placé dans la boîte de dialogue.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const pick = (candidate) => {
    setReport(null);
    if (!candidate) return;
    if (!ALLOWED.includes(extOf(candidate.name))) {
      setFile(null);
      setError('Format non pris en charge. Utilisez un fichier .xlsx, .xls ou .csv.');
    } else if (candidate.size === 0) {
      setFile(null);
      setError('Ce fichier est vide.');
    } else if (candidate.size > MAX_BYTES) {
      setFile(null);
      setError(`Ce fichier est trop volumineux (${MAX_MB} Mo maximum).`);
    } else {
      setError(null);
      setFile(candidate);
    }
  };

  const submit = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    const body = new FormData();
    body.append('file', file);

    try {
      const { data } = await axios.post(
        route('projects.quizzes.candidates.import-excel', [project.id, quiz.id]),
        body,
        {
          headers: { Accept: 'application/json' },
          onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
        }
      );
      setReport(data);
      // Rafraîchit la liste des candidats de la page sans recharger le reste.
      router.reload({ only: ['candidates'], preserveScroll: true });
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!uploading) pick(e.dataTransfer.files?.[0]);
  };

  return (
    <>
      {/* Carte d'entrée, dans la page du quiz */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="w-11 h-11 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
          <FaFileExcel />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Importer une liste de candidats</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Déposez un fichier Excel ou CSV avec une colonne « email » : les comptes ProJA correspondants sont ajoutés au quiz.
          </p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
        >
          <FaUserPlus /> Importer un fichier
        </button>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/60" onClick={close} aria-hidden="true" />

            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="excel-import-title"
              tabIndex={-1}
              className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl outline-none"
            >
              <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h2 id="excel-import-title" className="text-base font-bold text-gray-900 dark:text-white">
                    Importer des candidats depuis un fichier
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{quiz.title}</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  disabled={uploading}
                  aria-label="Fermer"
                  className="p-2 -m-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {report ? (
                  <Report report={report} />
                ) : (
                  <>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      onClick={() => !uploading && inputRef.current?.click()}
                      className={`rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                        dragging
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                      }`}
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPT}
                        className="sr-only"
                        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
                      />
                      <FaCloudUploadAlt className="mx-auto text-3xl text-gray-400" />
                      {file ? (
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white break-all">
                          {file.name} <span className="font-normal text-gray-500">· {formatSize(file.size)}</span>
                        </p>
                      ) : (
                        <>
                          <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                            Glissez votre fichier ici ou <span className="text-emerald-600 dark:text-emerald-400 underline">parcourez</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">.xlsx, .xls ou .csv · {MAX_MB} Mo maximum</p>
                        </>
                      )}
                    </div>

                    {error && (
                      <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm p-3">
                        <FaExclamationTriangle className="mt-0.5 shrink-0" /> {error}
                      </p>
                    )}

                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        La colonne des adresses est repérée automatiquement, où qu’elle soit et quel que soit son libellé
                        (« email », « e-mail », « courriel »…).
                      </p>
                      <p>
                        Seuls les utilisateurs ayant déjà un compte ProJA vérifié sont ajoutés.{' '}
                        <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                          <FaDownload /> Télécharger un modèle
                        </button>
                      </p>
                    </div>

                    {uploading && (
                      <div aria-live="polite">
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                          {progress < 100 ? `Envoi du fichier… ${progress} %` : 'Analyse du fichier et ajout des candidats…'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
                {report ? (
                  <>
                    <button
                      type="button"
                      onClick={resetState}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    >
                      Importer un autre fichier
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Terminer
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={close}
                      disabled={uploading}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!file || uploading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
                      {uploading ? 'Import en cours…' : 'Importer et ajouter'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
