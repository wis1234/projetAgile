import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

/**
 * Logique d'une session de correction (une copie) : notes + commentaires, brouillon local,
 * réservation de la copie (heartbeat / libération), enregistrement puis passage à la suivante.
 * Utilisé par la version mobile ; la version bureau contient la même logique dans Grading.jsx.
 */
export default function useGradingSession({ current, project, quiz, maxScore, exclude, readOnly, onLost }) {
  const storageKey = `proja:grading:${quiz.id}:${current.id}`;
  const handled = useRef(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [grades, setGrades] = useState(() => {
    const base = Object.fromEntries(current.responses.map((r) => [r.id, { score: r.score ?? null, comment: r.comment || '' }]));
    try {
      const draft = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (draft && !current.already_graded) Object.keys(base).forEach((id) => { if (draft[id]) base[id] = { ...base[id], ...draft[id] }; });
    } catch { /* brouillon illisible */ }
    return base;
  });

  useEffect(() => {
    if (readOnly) return;
    try { localStorage.setItem(storageKey, JSON.stringify(grades)); } catch { /* stockage indisponible */ }
  }, [grades, storageKey, readOnly]);

  useEffect(() => {
    if (readOnly) return undefined;
    const beat = setInterval(async () => {
      try { await axios.post(route('projects.quizzes.grading.heartbeat', [project.id, quiz.id, current.id])); }
      catch (e) { if (e.response?.status === 409) onLost?.(); }
    }, 60000);
    const release = () => {
      if (handled.current) return;
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const body = new FormData();
      if (token) body.append('_token', token);
      navigator.sendBeacon?.(route('projects.quizzes.grading.release', [project.id, quiz.id, current.id]), body);
    };
    window.addEventListener('pagehide', release);
    return () => {
      clearInterval(beat);
      window.removeEventListener('pagehide', release);
      if (!handled.current) axios.post(route('projects.quizzes.grading.release', [project.id, quiz.id, current.id])).catch(() => {});
    };
  }, [current.id, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const setGrade = (id, patch) => {
    setGrades((g) => ({ ...g, [id]: { ...g[id], ...patch } }));
    setErrors((e) => ({ ...e, [id]: undefined }));
  };

  const maxTotal = current.responses.length * maxScore;
  const total = current.responses.reduce((s, r) => s + (grades[r.id]?.score ?? 0), 0);
  const gradedCount = current.responses.filter((r) => grades[r.id]?.score != null).length;

  const save = useCallback(() => {
    if (readOnly || saving) return;
    const missing = current.responses.filter((r) => grades[r.id]?.score == null);
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((r) => [r.id, true])));
      document.getElementById(`resp-${missing[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    handled.current = true;
    router.post(
      route('projects.quizzes.grading.save', [project.id, quiz.id, current.id]),
      { grades: current.responses.map((r) => ({ response_id: r.id, score: grades[r.id].score, comment: grades[r.id].comment || null })), exclude },
      {
        onSuccess: () => { try { localStorage.removeItem(storageKey); } catch { /* noop */ } },
        onError: () => { handled.current = false; setSaving(false); },
        onFinish: () => setSaving(false),
      }
    );
  }, [grades, current, exclude, readOnly, saving]); // eslint-disable-line react-hooks/exhaustive-deps

  const skip = () => {
    handled.current = true;
    router.post(route('projects.quizzes.grading.release', [project.id, quiz.id, current.id]), { skip: true, exclude });
  };

  return { grades, setGrade, errors, saving, total, maxTotal, gradedCount, save, skip };
}
