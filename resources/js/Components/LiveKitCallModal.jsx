import React, { useEffect, useRef, useState } from 'react';
import {
  FaTimes, FaMicrophone, FaMicrophoneSlash, FaVideo as FaVideoIcon, FaVideoSlash,
  FaDesktop, FaSmile, FaUsers, FaExpand, FaCompress, FaCircle, FaHandPaper, FaCrown,
  FaPhone, FaPhoneSlash, FaLink, FaCopy, FaShareAlt, FaCheck,
} from 'react-icons/fa';

const getFreshCsrfToken = async () => {
  try {
    const res = await fetch('/csrf-token', { credentials: 'include' });
    const data = await res.json();
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) metaTag.setAttribute('content', data.token);
    return data.token;
  } catch {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }
};

const REACTIONS = ['👍', '❤️', '😂', '👏', '🎉', '😮', '🙌', '🔥'];

// ─── Sons d'appel réels ──────────────────────────────────────────────
// Place tes fichiers audio dans /public/sounds/ (ou adapte les chemins).
// Si le fichier est introuvable / bloqué, on retombe automatiquement
// sur une tonalité synthétisée (WebAudio) pour ne jamais casser le flux.
const OUTGOING_RINGTONE_SRC = '/sounds/outgoing-call.mp3'; // tonalité "ça sonne chez l'autre"
const INCOMING_RINGTONE_SRC = 'https://proja.kemtcenter.org/storage/public/files/incoming-call_old.mp3'; // vraie sonnerie d'appel entrant

export default function LiveKitCallModal({ tokenEndpoint, muteEndpoint, isHost, title, callerName, onClose, onAnswered, skipIncomingScreen = false, inviteLink = '' }) {
  const [room, setRoom] = useState(null);
  const [livekitLib, setLivekitLib] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connectionState, setConnectionState] = useState('connecting');
  const [callStarted, setCallStarted] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({}); // { identity: name }
  const [linkCopied, setLinkCopied] = useState(false);

  // ─── Décroché / pas décroché — état 100% LOCAL à cet utilisateur ───
  // C'est la clé du correctif : l'hôte (celui qui lance l'appel) est
  // "décroché" dès l'ouverture (il est l'appelant). Un invité, lui,
  // n'est PAS encore décroché tant qu'il n'a pas cliqué "Répondre" —
  // et donc continue de sonner de son côté, MÊME SI d'autres personnes
  // ont déjà rejoint l'appel entre-temps (ça ne dépend plus du nombre
  // de participants distants, mais uniquement de sa propre action).
  const [hasAnswered, setHasAnswered] = useState(!!isHost || !!skipIncomingScreen);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (isHost || skipIncomingScreen) {
      setHasAnswered(true);
    }
  }, [isHost, skipIncomingScreen]);

  // Compteur de tentatives de connexion (fix mobile : retry automatique si Capacitor suspend le WS)
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const containerRef = useRef(null);
  const ringbackRef = useRef(null);
  const ringtoneAudioRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const answeredNotifiedRef = useRef(false);

  // ─── Tonalité synthétisée (secours si le fichier audio est absent) ─
  const startSynthRingback = () => {
    if (ringbackRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    audioCtx.resume?.().catch(() => {});

    const playTone = () => {
      const now = audioCtx.currentTime;
      [440, 480].forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.12, now + 1.6);
        gain.gain.linearRampToValueAtTime(0, now + 1.8);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.8);
      });
    };

    playTone();
    const interval = setInterval(playTone, 3600);
    ringbackRef.current = { audioCtx, interval };
  };

  const stopSynthRingback = () => {
    if (!ringbackRef.current) return;
    clearInterval(ringbackRef.current.interval);
    ringbackRef.current.audioCtx.close().catch(() => {});
    ringbackRef.current = null;
  };

  // ─── Sonnerie "réelle" (fichier audio) avec repli sur la synthèse ──
  const startRingtone = (src) => {
    if (ringtoneAudioRef.current) return; // déjà en cours
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.85;
    ringtoneAudioRef.current = audio;

    audio.addEventListener('error', () => {
      // Fichier introuvable / non supporté → tonalité synthétisée de secours
      ringtoneAudioRef.current = null;
      startSynthRingback();
    });

    audio.play().catch(() => {
      // Lecture auto bloquée par le navigateur (pas de geste utilisateur) →
      // on retente via la synthèse WebAudio qui est plus tolérante,
      // et on retentera aussi la vraie sonnerie au prochain geste utilisateur.
      startSynthRingback();
    });
  };

  const stopRingtone = () => {
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current = null;
    }
    stopSynthRingback();
  };

  // Coupe toute sonnerie au démontage, par sécurité
  useEffect(() => () => stopRingtone(), []);

  // ─── Écran "appel entrant" pour un invité qui n'a pas encore décroché ─
  // Sonne en boucle indépendamment de l'état de la room (donc indépendamment
  // du nombre de personnes déjà connectées) jusqu'à ce que CET utilisateur
  // clique sur Répondre ou Refuser.
  useEffect(() => {
    if (isHost || hasAnswered || declined) {
      stopRingtone();
      return;
    }
    startRingtone(INCOMING_RINGTONE_SRC);
    return () => stopRingtone();
  }, [isHost, hasAnswered, declined]);

  const handleAnswer = async () => {
    stopRingtone();
    // ── Fix mobile : débloquer l'AudioContext avant de rejoindre ──────────
    // Sur iOS/Android l'AudioContext est suspendu jusqu'à un geste utilisateur.
    // Le clic "Répondre" EST le geste utilisateur : on en profite pour le reprendre.
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        await ctx.resume().catch(() => {});
        // On ferme immédiatement — on voulait juste débloquer le contexte audio du navigateur.
        ctx.close().catch(() => {});
      }
    } catch { /* Ignore, non bloquant */ }
    setRetryCount(0);
    setHasAnswered(true);
  };

  const handleDecline = () => {
    stopRingtone();
    setDeclined(true);
    onClose();
  };

  // ─── Copier / Partager le lien d'invitation ──────────────────────────
  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  const handleShareLink = async () => {
    if (!inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rejoindre l'appel ProJA Meet — ${title}`,
          text: `Rejoignez l'appel en cours sur « ${title} » via ProJA Meet`,
          url: inviteLink,
        });
      } catch { /* User cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  // ─── Connexion à la room — ne démarre qu'une fois l'appel décroché ──
  // Fix mobile : retry automatique (max 3 tentatives) + listener Capacitor App.resume
  // pour reconnecter si Android/iOS met l'app en arrière-plan pendant la connexion.
  const connectRetryRef = useRef(false);

  useEffect(() => {
    if (!hasAnswered) return;
    let activeRoom;
    let cancelled = false;

    const connectOnce = async (attempt = 1) => {
      if (cancelled) return;
      try {
        setIsRetrying(attempt > 1);
        setConnecting(true);
        setError('');

        let livekit = window.LivekitClient;
        if (!livekit) {
          try {
            livekit = await import('livekit-client');
          } catch (e) {
            console.warn('livekit-client non installe:', e);
          }
        }

        if (!livekit) {
          throw new Error("Le service d'appel (livekit-client) n'est pas installé sur le serveur. Veuillez exécuter 'npm install livekit-client'.");
        }

        const { Room, RoomEvent } = livekit;
        setLivekitLib(livekit);

        const csrfToken = await getFreshCsrfToken();
        const res = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
          },
        });
        if (!res.ok) throw new Error('Impossible de récupérer le token ProJA');
        const { token, url } = await res.json();

        activeRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          // Fix mobile : reconnexion automatique de LiveKit si le réseau coupe
          reconnectPolicy: { maxRetryDelay: 7000, minReconnectDelay: 2000, retries: 5 },
        });
        setRoom(activeRoom);

        activeRoom.on(RoomEvent.TrackSubscribed, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.ParticipantConnected, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.ParticipantDisconnected, (p) => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
          setRaisedHands(prev => {
            const copy = { ...prev };
            delete copy[p.identity];
            return copy;
          });
        });
        activeRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state);
        });
        activeRoom.on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const text = new TextDecoder().decode(payload);
            const data = JSON.parse(text);

            if (data.type === 'reaction') {
              const id = `${Date.now()}_${Math.random()}`;
              const leftPercent = 10 + Math.random() * 70;
              setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, left: leftPercent }]);
              setTimeout(() => {
                setFloatingReactions(prev => prev.filter(r => r.id !== id));
              }, 3000);
            }

            if (data.type === 'hand' && participant) {
              setRaisedHands(prev => {
                const copy = { ...prev };
                if (data.raised) copy[participant.identity] = data.name || participant.name || 'Participant';
                else delete copy[participant.identity];
                return copy;
              });
            }
          } catch (e) { /* ignore malformed payload */ }
        });

        await activeRoom.connect(url, token);
        await activeRoom.localParticipant.setMicrophoneEnabled(true);
        // Caméra désactivée par défaut

        const initialParticipants = [...activeRoom.remoteParticipants.values()];
        setParticipants(initialParticipants);
        setConnecting(false);
        setIsRetrying(false);
        setRetryCount(0);
        connectRetryRef.current = false;

        if (initialParticipants.length > 0 && !answeredNotifiedRef.current) {
          answeredNotifiedRef.current = true;
          onAnswered?.();
        }
      } catch (err) {
        if (cancelled) return;
        console.error(`Erreur connexion ProJA (tentative ${attempt}):`, err);

        const MAX_RETRIES = 3;
        if (attempt < MAX_RETRIES) {
          // Backoff exponentiel : 1.5s, 3s, 6s
          const delay = 1500 * Math.pow(2, attempt - 1);
          setRetryCount(attempt);
          console.info(`Reconnexion dans ${delay}ms…`);
          setTimeout(() => { if (!cancelled) connectOnce(attempt + 1); }, delay);
        } else {
          // Toutes les tentatives épuisées — afficher le bouton "Réessayer"
          setError(err.message || "Impossible de rejoindre l'appel. Vérifiez votre connexion.");
          setConnecting(false);
          setIsRetrying(false);
          connectRetryRef.current = false;
        }
      }
    };

    connectOnce(1);

    // ── Fix Capacitor : si l'app reprend après avoir été en arrière-plan ───
    // Sur Android, le WebSocket LiveKit peut être fermé silencieusement.
    // On tente une reconnexion douce dès que l'app repasse au premier plan.
    let appResumePlugin;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        appResumePlugin = await App.addListener('resume', () => {
          if (cancelled || connectRetryRef.current) return;
          if (activeRoom && activeRoom.state !== 'connected') {
            console.info('[Capacitor] App reprise — reconnexion LiveKit…');
            connectRetryRef.current = true;
            connectOnce(1);
          }
        });
      } catch {
        // @capacitor/app non disponible en web — pas grave
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(timerIntervalRef.current);
      stopRingtone();
      activeRoom?.disconnect();
      appResumePlugin?.remove?.().catch(() => {});
    };
  }, [tokenEndpoint, hasAnswered]);



  // ─── Passage "en attente" → "appel démarré" (côté appelant) ─────────
  // Ne concerne que l'appelant (hôte) : tant que personne n'a rejoint,
  // ça continue de sonner chez lui. Ça s'arrête dès qu'AU MOINS une
  // personne rejoint (ce comportement est correct pour l'appelant,
  // contrairement aux invités qui gèrent leur propre sonnerie plus haut).
  useEffect(() => {
    if (!hasAnswered || connecting) return;

    if (participants.length === 0) {
      if (!callStarted) startRingtone(OUTGOING_RINGTONE_SRC);
      return;
    }

    stopRingtone();
    if (!answeredNotifiedRef.current) {
      answeredNotifiedRef.current = true;
      onAnswered?.();
    }
    if (!callStarted) {
      setCallStarted(true);

      let startedAt = Date.now();
      if (room?.roomInfo?.creationTime) {
        startedAt = Number(room.roomInfo.creationTime) * 1000;
      }

      const updateElapsed = () => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      };
      updateElapsed();
      timerIntervalRef.current = setInterval(updateElapsed, 1000);
    }
  }, [participants.length, connecting, room, hasAnswered]);

  const TrackSourceScreenShare = livekitLib?.Track?.Source?.ScreenShare || 'screen_share';
  const TrackSourceCamera = livekitLib?.Track?.Source?.Camera || 'camera';

  // Détecte si quelqu'un (local ou distant) partage son écran
  const remoteScreenShare = participants
    .map(p => ({ p, pub: [...p.videoTrackPublications.values()].find(pub => (pub.source === TrackSourceScreenShare || pub.source === 'screen_share') && pub.track) }))
    .find(x => x.pub);
  const isScreenSharingAnyone = screenSharing || !!remoteScreenShare;

  // ─── Attacher la caméra LOCALE — se déclenche après chaque rendu concerné ───
  useEffect(() => {
    if (!room || !camEnabled) return;
    const camPub = [...room.localParticipant.videoTrackPublications.values()]
      .find(pub => pub.source === TrackSourceCamera || pub.source === 'camera');
    if (camPub?.track && localVideoRef.current) {
      camPub.track.attach(localVideoRef.current);
    }
  }, [camEnabled, room, isScreenSharingAnyone, callStarted]);

  // ─── Attacher le partage d'écran LOCAL — même principe ───
  useEffect(() => {
    if (!room || !screenSharing) return;
    const pub = [...room.localParticipant.videoTrackPublications.values()]
      .find(p => p.source === TrackSourceScreenShare || p.source === 'screen_share');
    if (pub?.track && screenVideoRef.current) {
      pub.track.attach(screenVideoRef.current);
    }
  }, [screenSharing, room]);

  // ─── Attacher les flux DISTANTS (caméra + audio) — relancé aussi au changement de mise en page ───
  useEffect(() => {
    participants.forEach(p => {
      const camPub = [...p.videoTrackPublications.values()].find(pub => (pub.source === TrackSourceCamera || pub.source === 'camera') && pub.track);
      const el = remoteVideoRefs.current[p.identity];
      if (camPub?.track && el) camPub.track.attach(el);

      const audioPub = [...p.audioTrackPublications.values()].find(pub => pub.track);
      if (audioPub?.track) audioPub.track.attach();
    });
  }, [participants, isScreenSharingAnyone, callStarted, connecting]);

  // ─── Attacher le partage d'écran DISTANT ───
  useEffect(() => {
    if (remoteScreenShare?.pub?.track && screenVideoRef.current) {
      remoteScreenShare.pub.track.attach(screenVideoRef.current);
    }
  }, [remoteScreenShare, screenSharing]);

  // ─── Contrôles locaux ────────────────────────────────────────────
  const toggleMic = async () => {
    if (!room) return;
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  };

  const toggleCam = async () => {
    if (!room) return;
    const next = !camEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setCamEnabled(next);
    // L'attachement visuel est désormais géré par l'effet ci-dessus,
    // pas ici — évite le bug qui obligeait à cliquer deux fois.
  };

  const toggleScreenShare = async () => {
    if (!room) return;
    try {
      const next = !screenSharing;
      await room.localParticipant.setScreenShareEnabled(next, { audio: true });
      setScreenSharing(next);
      // Idem : l'attachement est géré par l'effet dédié.
    } catch (err) {
      console.error('Erreur partage d’écran:', err);
      setError('Impossible de démarrer le partage d’écran.');
    }
  };

  const sendReaction = (emoji) => {
    if (!room) return;
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji }));
    room.localParticipant.publishData(payload, { reliable: true });

    const id = `${Date.now()}_local`;
    const leftPercent = 10 + Math.random() * 70;
    setFloatingReactions(prev => [...prev, { id, emoji, left: leftPercent }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
    setShowReactions(false);
  };

  const toggleRaiseHand = () => {
    if (!room) return;
    const next = !handRaised;
    setHandRaised(next);
    const payload = new TextEncoder().encode(JSON.stringify({
      type: 'hand', raised: next, name: room.localParticipant.name || 'Vous',
    }));
    room.localParticipant.publishData(payload, { reliable: true });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // ─── Contrôle de l'hôte sur un participant distant ──────────────────
  const muteRemote = async (participant, kind) => {
    if (!isHost || !muteEndpoint) return;
    const pub = kind === 'audio'
      ? [...participant.audioTrackPublications.values()][0]
      : [...participant.videoTrackPublications.values()].find(p => p.source === TrackSourceCamera || p.source === 'camera');
    if (!pub) return;

    try {
      const csrfToken = await getFreshCsrfToken();
      await fetch(muteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ identity: participant.identity, trackSid: pub.trackSid }),
      });
    } catch (err) {
      console.error('Erreur mute participant:', err);
    }
  };

  const handleLeave = () => {
    stopRingtone();
    clearInterval(timerIntervalRef.current);
    room?.disconnect();
    onClose();
  };

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const totalCount = 1 + participants.length;

  // Style commun pour l'effet miroir façon Zoom/Meet, appliqué à
  // TOUTES les vidéos caméra (locale + distantes) — jamais au partage d'écran.
  const mirrorStyle = { transform: 'scaleX(-1)' };

  // ─── Écran d'appel entrant (invité n'ayant pas encore décroché) ─────
  if (!isHost && !hasAnswered) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-between text-white overflow-hidden bg-slate-900">
        {/* Arrière-plan flouté avec l'avatar (ou dégradé sombre) */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="w-full h-full bg-gradient-to-b from-blue-900/40 to-slate-950 backdrop-blur-3xl" />
        </div>
        
        {/* Effet d'ondes autour de l'avatar */}
        <style>{`
          @keyframes callPulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255,255,255,0.2); }
            70% { transform: scale(1); box-shadow: 0 0 0 40px rgba(255,255,255,0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255,255,255,0); }
          }
          .incoming-avatar-pulse { animation: callPulse 2s infinite ease-in-out; }
          .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
          @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
        
        <div className="relative z-10 flex flex-col items-center pt-24 slide-up">
          <p className="text-sm font-medium tracking-widest uppercase text-white/70 mb-8">
            Appel ProJA Meet
          </p>
          
          <div className="relative">
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-5xl font-bold incoming-avatar-pulse shadow-2xl border-4 border-white/20">
              {(callerName || title || 'ProJA').slice(0, 2).toUpperCase()}
            </div>
          </div>
          
          <h2 className="text-3xl font-semibold mt-8 text-center text-white drop-shadow-md px-6">
            {callerName || title}
          </h2>
          <p className="text-lg text-white/80 mt-2">Appel entrant...</p>
        </div>

        <div className="relative z-10 flex justify-between items-center px-12 pb-20 slide-up w-full max-w-md mx-auto">
          {/* Bouton Refuser */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleDecline}
              title="Refuser"
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:bg-red-600"
            >
              <FaPhoneSlash className="w-7 h-7 text-white" />
            </button>
            <span className="text-sm font-medium text-white/80">Refuser</span>
          </div>

          {/* Bouton Répondre */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleAnswer}
              title="Répondre"
              className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:bg-emerald-600 animate-bounce"
            >
              <FaPhone className="w-7 h-7 text-white" />
            </button>
            <span className="text-sm font-medium text-white/80">Accepter</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <style>{`
        @keyframes floatUpMeet {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          15% { opacity: 1; transform: translateY(-10vh) scale(1.1); }
          85% { opacity: 1; }
          100% { transform: translateY(-70vh) scale(1); opacity: 0; }
        }
        .float-reaction { animation: floatUpMeet 3s ease-out forwards; }
      `}</style>

      {/* ─── HEADER — bleu ProJA ─── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold truncate">ProJA Meet — {title}</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-blue-100 bg-white/10 px-2 py-1 rounded-full">
            <FaCircle className={`w-1.5 h-1.5 ${connectionState === 'connected' && callStarted ? 'text-emerald-400' : 'text-amber-300 animate-pulse'}`} />
            {connecting
              ? 'Connexion…'
              : callStarted
              ? formatElapsed(elapsedSeconds)
              : 'En attente de participants…'}
          </span>
          {isHost && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-amber-400 text-amber-900 px-2 py-1 rounded-full">
              <FaCrown className="w-3 h-3" /> Hôte
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
          >
            <FaUsers className="w-3.5 h-3.5" /> {totalCount}
          </button>
          {inviteLink && (
            <>
              <button
                onClick={handleCopyLink}
                title={linkCopied ? 'Lien copié !' : 'Copier le lien d\'invitation'}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  linkCopied
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {linkCopied ? <FaCheck className="w-3 h-3" /> : <FaCopy className="w-3 h-3" />}
                <span className="hidden sm:inline">{linkCopied ? 'Copié !' : 'Copier le lien'}</span>
              </button>
              <button
                onClick={handleShareLink}
                title="Partager le lien d'invitation"
                className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
              >
                <FaShareAlt className="w-3 h-3" />
                <span className="hidden sm:inline">Partager</span>
              </button>
            </>
          )}
          <button onClick={toggleFullscreen} className="text-white/90 hover:text-white p-1.5">
            {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
          <button onClick={handleLeave} className="text-white/90 hover:text-white p-1.5">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-xl border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm flex-shrink-0">
          {error}
        </div>
      )}

      {/* ─── ZONE VIDÉO ─── */}
      <div className="flex-1 flex overflow-hidden">
        {showParticipants && (
          <div className="w-64 bg-slate-900 border-r border-slate-800 p-3 overflow-y-auto flex-shrink-0 hidden sm:block">
            {inviteLink && (
              <div className="mb-4 p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20">
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1.5">Lien d'invitation</p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 text-[11px] bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 truncate focus:outline-none"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center flex-shrink-0 transition"
                    title="Copier"
                  >
                    {linkCopied ? <FaCheck className="w-3 h-3 text-white" /> : <FaCopy className="w-3 h-3 text-white" />}
                  </button>
                </div>
              </div>
            )}
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Participants ({totalCount})</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">Moi</div>
                <span className="text-sm text-white truncate flex items-center gap-1">
                  Vous {isHost && <FaCrown className="w-3 h-3 text-amber-400" />}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  {handRaised && <FaHandPaper className="w-3 h-3 text-amber-400" />}
                  {!micEnabled && <FaMicrophoneSlash className="w-3 h-3 text-red-400" />}
                </div>
              </div>
              {participants.map(p => (
                <div key={p.identity} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 group">
                  <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(p.name || p.identity).slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-200 truncate flex-1">{p.name || p.identity}</span>
                  {raisedHands[p.identity] && <FaHandPaper className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                  {isHost && (
                    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => muteRemote(p, 'audio')}
                        title="Couper le micro"
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center"
                      >
                        <FaMicrophoneSlash className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => muteRemote(p, 'video')}
                        title="Couper la caméra"
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center"
                      >
                        <FaVideoSlash className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {connecting ? (
            <div className="h-full flex items-center justify-center text-white">Connexion en cours…</div>
          ) : !callStarted ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-white">
              <div className="w-40 h-40 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 relative flex items-center justify-center">
                {camEnabled ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle} />
                ) : (
                  <FaVideoSlash className="text-slate-500 text-3xl" />
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Appel en cours… en attente que quelqu’un rejoigne
              </div>
            </div>
          ) : isScreenSharingAnyone ? (
            <div className="h-full flex flex-col p-3 gap-3">
              <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-slate-800 relative">
                <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/60 text-white text-xs rounded-full flex items-center gap-1.5">
                  <FaDesktop className="w-3 h-3" />
                  {screenSharing ? 'Vous partagez votre écran' : `${remoteScreenShare?.p?.name || 'Un participant'} partage son écran`}
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto flex-shrink-0 pb-1">
                <div className="w-32 h-20 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0 relative flex items-center justify-center">
                  {camEnabled ? (
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle} />
                  ) : (
                    <FaVideoSlash className="text-slate-500 text-lg" />
                  )}
                  <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 rounded">Vous</span>
                </div>
                {participants.map(p => (
                  <div key={p.identity} className="w-32 h-20 rounded-xl overflow-hidden bg-black border border-slate-700 flex-shrink-0 relative">
                    <video
                      ref={(el) => { if (el) remoteVideoRefs.current[p.identity] = el; }}
                      autoPlay playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle}
                    />
                    <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 rounded truncate max-w-[80%]">
                      {p.name || p.identity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto content-start">
              <div className="rounded-2xl overflow-hidden bg-slate-800 border border-slate-800 aspect-video relative flex items-center justify-center">
                {camEnabled ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle} />
                ) : (
                  <FaVideoSlash className="text-slate-500 text-3xl" />
                )}
                {handRaised && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
                    <FaHandPaper className="w-3.5 h-3.5 text-amber-900" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded flex items-center gap-1.5">
                  Vous {isHost && <FaCrown className="w-3 h-3 text-amber-400" />} {!micEnabled && <FaMicrophoneSlash className="w-3 h-3 text-red-400" />}
                </div>
              </div>
              {participants.map(p => (
                <div key={p.identity} className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video relative group">
                  <video
                    ref={(el) => { if (el) remoteVideoRefs.current[p.identity] = el; }}
                    autoPlay playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle}
                  />
                  {raisedHands[p.identity] && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
                      <FaHandPaper className="w-3.5 h-3.5 text-amber-900" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded truncate max-w-[70%]">
                    {p.name || p.identity}
                  </div>
                  {isHost && (
                    <div className="absolute bottom-2 right-2 hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => muteRemote(p, 'audio')}
                        title="Couper le micro"
                        className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center"
                      >
                        <FaMicrophoneSlash className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        onClick={() => muteRemote(p, 'video')}
                        title="Couper la caméra"
                        className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center"
                      >
                        <FaVideoSlash className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── Réactions façon Google Meet : flottent vers le haut ─── */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full overflow-hidden">
            {floatingReactions.map(r => (
              <div
                key={r.id}
                className="float-reaction absolute bottom-16 text-4xl drop-shadow-lg"
                style={{ left: `${r.left}%` }}
              >
                {r.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showReactions && (
        <div className="flex items-center justify-center gap-2 py-2 bg-slate-900 border-t border-slate-800 flex-shrink-0">
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="text-2xl w-10 h-10 flex items-center justify-center hover:scale-125 hover:bg-white/10 rounded-full transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 py-4 bg-slate-900 flex-shrink-0 flex-wrap px-4">
        <button onClick={toggleMic} title={micEnabled ? 'Couper le micro' : 'Activer le micro'} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${micEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {micEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button onClick={toggleCam} title={camEnabled ? 'Couper la caméra' : 'Activer la caméra'} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${camEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {camEnabled ? <FaVideoIcon /> : <FaVideoSlash />}
        </button>
        <button onClick={toggleScreenShare} title={screenSharing ? 'Arrêter le partage' : 'Partager l’écran'} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${screenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
          <FaDesktop />
        </button>
        <button onClick={toggleRaiseHand} title={handRaised ? 'Baisser la main' : 'Lever la main'} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${handRaised ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
          <FaHandPaper />
        </button>
        <button onClick={() => setShowReactions(v => !v)} title="Réactions" className={`w-11 h-11 rounded-full flex items-center justify-center transition ${showReactions ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
          <FaSmile />
        </button>
        <button onClick={handleLeave} className="px-5 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition">
          Quitter
        </button>
      </div>
    </div>
  );
}