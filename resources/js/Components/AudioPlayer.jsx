import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaExclamationCircle } from 'react-icons/fa';

/**
 * Résout l'URL publique absolue ou relative du fichier audio
 */
export const resolveAudioUrl = (path) => {
  if (!path) return '';
  if (
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const clean = path.replace(/^\/+/, '');
  if (clean.startsWith('storage/public/')) {
    return `/${clean}`;
  }
  if (clean.startsWith('storage/')) {
    return `/${clean.replace(/^storage\//, 'storage/public/')}`;
  }
  return `/storage/public/${clean}`;
};

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function AudioPlayer({ src, isMe = false, className = '' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const resolvedSrc = resolveAudioUrl(src);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setHasError(false);

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);

    // Précharge les métadonnées
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [resolvedSrc]);

  const togglePlay = useCallback(async (e) => {
    e?.stopPropagation?.();
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        // Débloquer le contexte audio si nécessaire sur iOS / Android
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            await ctx.resume().catch(() => {});
          }
          ctx.close().catch(() => {});
        }

        // Arrêter tout autre lecteur audio en cours sur la page
        document.querySelectorAll('audio').forEach((el) => {
          if (el !== audio && !el.paused) {
            el.pause();
          }
        });

        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('[AudioPlayer] Lecture bloquée ou erreur:', err);
        setIsPlaying(false);
      }
    }
  }, [isPlaying, hasError]);

  const handleSeek = (e) => {
    e?.stopPropagation?.();
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const nextTime = Number(e.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleSpeed = (e) => {
    e?.stopPropagation?.();
    const audio = audioRef.current;
    if (!audio) return;
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!src) return null;

  return (
    <div
      className={`flex items-center gap-2.5 py-1 px-1 min-w-[210px] max-w-[270px] select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={resolvedSrc} preload="metadata" playsInline />

      {/* Bouton Play/Pause */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={hasError}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 shadow-sm ${
          isMe
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700'
        } ${hasError ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
      >
        {isLoading && !hasError ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : hasError ? (
          <FaExclamationCircle className="w-4 h-4 text-red-400" />
        ) : isPlaying ? (
          <FaPause className="w-3.5 h-3.5" />
        ) : (
          <FaPlay className="w-3.5 h-3.5 translate-x-0.5" />
        )}
      </button>

      {/* Timeline et curseur */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="relative flex items-center h-4 w-full group">
          {/* Barre de fond */}
          <div
            className={`absolute left-0 right-0 h-1.5 rounded-full overflow-hidden ${
              isMe ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {/* Barre de progression remplie */}
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                isMe ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Input range invisible par-dessus pour le contrôle tactile et souris */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={hasError || duration === 0}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
        </div>

        {/* Temps et sélecteur de vitesse */}
        <div className="flex items-center justify-between mt-0.5">
          <span
            className={`text-[10px] font-medium font-mono ${
              isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '0:00'}
          </span>

          <button
            type="button"
            onClick={toggleSpeed}
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition ${
              isMe
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
            }`}
            title="Vitesse de lecture"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
