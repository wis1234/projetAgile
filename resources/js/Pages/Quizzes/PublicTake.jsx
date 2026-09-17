import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import QuizTimer from '@/Components/Quiz/QuizTimer';
import QuizQuestionDisplay from '@/Components/Quiz/QuizQuestionDisplay';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaExclamationTriangle, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';

export default function PublicTake({ quiz, questions = [], attempt }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(attempt.answers || {});
  const [cheatingLogs, setCheatingLogs] = useState(attempt.cheating_logs || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const answersRef = useRef(attempt.answers || {});
  const cheatingLogsRef = useRef(attempt.cheating_logs || []);

  const addCheatingIncident = (type, details) => {
    const newIncident = {
      type,
      details,
      timestamp: new Date().toISOString(),
    };
    const updated = [...cheatingLogsRef.current, newIncident];
    setCheatingLogs(updated);
    cheatingLogsRef.current = updated;
    saveProgress(answersRef.current, updated);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false);
        addCheatingIncident('tab_switch', "L'utilisateur a quitté l'onglet du test.");
      } else {
        setIsTabActive(true);
      }
    };

    const handleWindowBlur = () => {
      addCheatingIncident('tab_switch', "Fenêtre inactive ou changement d'application.");
    };

    const handleCopyCut = (e) => {
      e.preventDefault();
      addCheatingIncident('copy_paste_attempt', "Tentative de copie ou de découpage du texte détectée.");
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addCheatingIncident('right_click_attempt', "Clic droit désactivé durant l'évaluation.");
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const saveProgress = async (newAnswers, logs = cheatingLogsRef.current) => {
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      await fetch(route('quizzes.public.save-progress', [quiz.public_token, attempt.id]), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          answers: newAnswers,
          cheating_logs: logs,
        }),
      });
    } catch (e) {
      console.error('Erreur sauvegarde progressive:', e);
    }
  };

  const handleAnswerChange = (val) => {
    if (isSubmitting) return;
    const currentQ = questions[currentIndex];
    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    saveProgress(newAnswers);
  };

  const handleConfirmSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    router.post(route('quizzes.public.submit', [quiz.public_token, attempt.id]), {
      answers: answersRef.current,
      cheating_logs: cheatingLogsRef.current,
    });
  };

  const handleTimeExpired = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    router.post(route('quizzes.public.submit', [quiz.public_token, attempt.id]), {
      answers: answersRef.current,
      cheating_logs: cheatingLogsRef.current,
    });
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <p className="text-gray-500">Aucune question dans cette évaluation.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 px-4 select-none">
      {/* Top Red Suspicious Activity Banner */}
      {cheatingLogs.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md max-w-3xl mx-auto mb-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-xl shrink-0" />
            <span>
              ALERTE SURVEILLANCE : {cheatingLogs.length} activité(s) suspecte(s) détectée(s) (changement d'onglet, copier/coller). Vos actions sont enregistrées.
            </span>
          </div>
        </div>
      )}

      {/* Warning overlay on tab switch */}
      {!isTabActive && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center text-white p-6 text-center">
          <div className="max-w-md space-y-4">
            <FaEyeSlash className="text-6xl text-red-500 mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold">Attention : Changement d'onglet décelé !</h2>
            <p className="text-sm text-gray-300">
              Veuillez rester sur cette page jusqu'à la fin de votre test. Cette action a été consignée dans le rapport de surveillance.
            </p>
            <button
              onClick={() => setIsTabActive(true)}
              className="px-6 py-2.5 bg-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg"
            >
              Continuer le Quiz
            </button>
          </div>
        </div>
      )}

      {/* Submission Modal Popup */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl mx-auto">
              <FaCheckCircle />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Soumettre l'évaluation ?</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                Vous avez répondu aux questions. Êtes-vous sûr de vouloir finaliser et transmettre vos réponses ?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-sm transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md"
              >
                {isSubmitting ? 'Envoi...' : 'Oui, Soumettre'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Sticky Header Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm sticky top-4 z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white line-clamp-1">{quiz.title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Candidat : <span className="font-semibold text-gray-700 dark:text-gray-300">{attempt.guest_name}</span> | Question {currentIndex + 1} / {questions.length}
            </p>
          </div>

          <QuizTimer
            startedAt={attempt.started_at}
            durationMinutes={quiz.duration_minutes}
            onExpire={handleTimeExpired}
          />
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full text-xs font-bold uppercase tracking-wider">
              {currentQ.question_type === 'written' ? 'Question Écrite' : 'QCM'}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <FaShieldAlt className="text-emerald-500" /> Mode Sécurisé
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed select-none">
            {currentQ.question_text}
          </h2>

          <QuizQuestionDisplay
            question={currentQ}
            answer={answers[currentQ.id]}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              disabled={currentIndex === 0 || isSubmitting}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl text-sm transition disabled:opacity-30"
            >
              <FaArrowLeft /> Précédent
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
              >
                <FaCheckCircle /> Terminer et Soumettre
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
              >
                Suivant <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
