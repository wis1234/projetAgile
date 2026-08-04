import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import QuizTimer from '@/Components/Quiz/QuizTimer';
import QuizQuestionDisplay from '@/Components/Quiz/QuizQuestionDisplay';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaEyeSlash } from 'react-icons/fa';

export default function PublicTake({ quiz, questions = [], attempt }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(attempt.answers || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);

  const answersRef = useRef(attempt.answers || {});

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false);
      } else {
        setIsTabActive(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const saveProgress = async (newAnswers) => {
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      await fetch(route('quizzes.public.save-progress', [quiz.public_token, attempt.id]), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ answers: newAnswers }),
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

  const handleFinalSubmit = () => {
    if (isSubmitting) return;
    if (!confirm('Êtes-vous sûr de vouloir soumettre vos réponses ?')) return;

    setIsSubmitting(true);
    router.post(route('quizzes.public.submit', [quiz.public_token, attempt.id]), {
      answers: answersRef.current,
    });
  };

  const handleTimeExpired = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    alert('Temps écoulé ! Votre évaluation va être soumise.');
    router.post(route('quizzes.public.submit', [quiz.public_token, attempt.id]), {
      answers: answersRef.current,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 px-4">
      {!isTabActive && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center text-white p-6 text-center">
          <div className="max-w-md space-y-4">
            <FaEyeSlash className="text-6xl text-red-500 mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold">Attention : Changement d'onglet décelé !</h2>
            <p className="text-sm text-gray-300">
              Veuillez rester sur cette page jusqu'à la fin de votre test.
            </p>
            <button
              onClick={() => setIsTabActive(true)}
              className="px-6 py-2 bg-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              Continuer le Quiz
            </button>
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
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
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
                onClick={handleFinalSubmit}
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
