import React, { useEffect, useRef, useState } from 'react';
import {
  FaTimes, FaMicrophone, FaMicrophoneSlash, FaVideo as FaVideoIcon, FaVideoSlash,
  FaDesktop, FaSmile, FaUsers, FaExpand, FaCompress, FaCircle, FaHandPaper, FaCrown,
  FaPhone, FaPhoneSlash, FaLink, FaCopy, FaShareAlt, FaCheck, FaImage, FaAdjust,
  FaEllipsisV, FaUserSlash
} from 'react-icons/fa';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

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

export default function LiveKitCallModal({ tokenEndpoint, muteEndpoint, kickEndpoint, isHost, title, callerName, onClose, onAnswered, skipIncomingScreen = false, inviteLink = '' }) {
  const [room, setRoom] = useState(null);
  const [livekitLib, setLivekitLib] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [bgMode, setBgMode] = useState('none'); // 'none', 'blur', 'image'
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
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [pipPos, setPipPos] = useState(null);

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
  const mainVideoRef = useRef(null);
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

        activeRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          if (speakers.length > 0) {
            setActiveSpeaker(speakers[0].identity);
          }
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

  const initialsOf = (name = '') => {
    const w = String(name).trim().split(/\s+/);
    if (!w[0]) return '?';
    return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[w.length - 1][0]).toUpperCase();
  };
  const otherName = (p) => p?.name || p?.identity || 'Participant';

  const pipDragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  const handlePipPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pipDragRef.current = { dragging: true, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePipPointerMove = (e) => {
    if (!pipDragRef.current.dragging) return;
    setPipPos({ x: e.clientX - pipDragRef.current.offsetX, y: e.clientY - pipDragRef.current.offsetY });
  };
  const handlePipPointerUp = () => { pipDragRef.current.dragging = false; };

  // Détecte si quelqu'un (local ou distant) partage son écran
  const remoteScreenShare = participants
    .map(p => ({ p, pub: [...p.videoTrackPublications.values()].find(pub => (pub.source === TrackSourceScreenShare || pub.source === 'screen_share') && pub.track) }))
    .find(x => x.pub);
  const isScreenSharingAnyone = screenSharing || !!remoteScreenShare;
  const isOneOnOne = participants.length === 1 && !isScreenSharingAnyone;
  const soleParticipant = participants[0] || null;
  const remoteHasCamera = soleParticipant
    ? [...soleParticipant.videoTrackPublications.values()].some(pub => (pub.source === TrackSourceCamera || pub.source === 'camera') && pub.track)
    : false;

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

  // ─── Attacher le Main Speaker (façon Google Meet) ───
  const activeIdentity = activeSpeaker || (participants.length > 0 ? participants[0].identity : room?.localParticipant?.identity);
  const isLocalMain = activeIdentity === room?.localParticipant?.identity || (!participants.length);

  useEffect(() => {
    if (isScreenSharingAnyone || !room) return;
    
    let track = null;
    if (isLocalMain) {
      if (camEnabled) {
         const camPub = [...room.localParticipant.videoTrackPublications.values()]
           .find(pub => pub.source === (livekitLib?.Track?.Source?.Camera || 'camera') || pub.source === 'camera');
         track = camPub?.track;
      }
    } else {
      const p = participants.find(p => p.identity === activeIdentity);
      if (p) {
        const camPub = [...p.videoTrackPublications.values()].find(pub => (pub.source === (livekitLib?.Track?.Source?.Camera || 'camera') || pub.source === 'camera') && pub.track);
        track = camPub?.track;
      }
    }

    if (track && mainVideoRef.current) {
      track.attach(mainVideoRef.current);
    }
  }, [activeIdentity, participants, camEnabled, isScreenSharingAnyone, room]);

  const blurProcessorRef = useRef(null); // conservé pour compat, plus vraiment utilisé
  const fileInputRef = useRef(null);
  const segmenterRef = useRef(null);
  const vbVideoRef = useRef(null);
  const vbCanvasRef = useRef(null);
  const vbAnimRef = useRef(null);
  const originalCamTrackRef = useRef(null); // piste caméra brute, pour pouvoir revenir en arrière
  const vbBgImageRef = useRef(null);

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
  };

  const toggleScreenShare = async () => {
    if (!room) return;
    if (typeof navigator.mediaDevices === 'undefined' || typeof navigator.mediaDevices.getDisplayMedia === 'undefined') {
       setError("Le partage d'écran n'est pas supporté sur cet appareil.");
       return;
    }
    try {
      const next = !screenSharing;
      await room.localParticipant.setScreenShareEnabled(next, { audio: true });
      setScreenSharing(next);
    } catch (err) {
      console.error('Erreur partage d’écran:', err);
      setError('Impossible de démarrer le partage d’écran.');
    }
  };

  const getCamTrack = () => {
    return [...room.localParticipant.videoTrackPublications.values()]
      .find(pub => pub.source === (livekitLib?.Track?.Source?.Camera || 'camera') || pub.source === 'camera');
  };

  // ─── Segmentation "personne / fond" via MediaPipe (remplace @livekit/track-processors) ───
  const initSegmenter = async () => {
    if (segmenterRef.current) return segmenterRef.current;
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      outputCategoryMask: true,
    });
    return segmenterRef.current;
  };

  // Arrête l'effet et restaure la piste caméra brute
  const stopVirtualBackground = async (camPub) => {
    if (vbAnimRef.current) {
      cancelAnimationFrame(vbAnimRef.current);
      vbAnimRef.current = null;
    }
    if (camPub?.track && originalCamTrackRef.current) {
      await camPub.track.replaceTrack(originalCamTrackRef.current);
    }
  };

  // Démarre le flou OU l'image de fond, selon `mode`
  const startVirtualBackground = async (camPub, mode) => {
    // Conserve la piste brute la première fois, pour pouvoir revenir en arrière
    if (!originalCamTrackRef.current) {
      originalCamTrackRef.current = camPub.track.mediaStreamTrack;
    }

    const seg = await initSegmenter();

    if (!vbVideoRef.current) {
      vbVideoRef.current = document.createElement('video');
      vbVideoRef.current.muted = true;
      vbVideoRef.current.playsInline = true;
    }
    const videoEl = vbVideoRef.current;
    videoEl.srcObject = new MediaStream([originalCamTrackRef.current]);
    await videoEl.play();

    const width = videoEl.videoWidth || 640;
    const height = videoEl.videoHeight || 480;

    if (!vbCanvasRef.current) vbCanvasRef.current = document.createElement('canvas');
    const canvas = vbCanvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = width;
    bgCanvas.height = height;
    const bgCtx = bgCanvas.getContext('2d');

    const personCanvas = document.createElement('canvas');
    personCanvas.width = width;
    personCanvas.height = height;
    const personCtx = personCanvas.getContext('2d');

    const draw = () => {
      const result = seg.segmentForVideo(videoEl, performance.now());
      const maskData = result.categoryMask.getAsFloat32Array(); // 1 = personne, 0 = fond
      result.close?.();

      // 1) Prépare le fond choisi
      if (mode === 'image' && vbBgImageRef.current) {
        bgCtx.drawImage(vbBgImageRef.current, 0, 0, width, height);
      } else {
        bgCtx.filter = 'blur(12px)';
        bgCtx.drawImage(videoEl, 0, 0, width, height);
        bgCtx.filter = 'none';
      }

      // 2) Découpe la personne via le masque alpha
      personCtx.drawImage(videoEl, 0, 0, width, height);
      const personFrame = personCtx.getImageData(0, 0, width, height);
      for (let i = 0; i < maskData.length; i++) {
        personFrame.data[i * 4 + 3] = maskData[i] > 0.5 ? 255 : 0; // canal alpha
      }
      personCtx.putImageData(personFrame, 0, 0);

      // 3) Compose : fond puis personne par-dessus
      ctx.drawImage(bgCanvas, 0, 0);
      ctx.drawImage(personCanvas, 0, 0);

      vbAnimRef.current = requestAnimationFrame(draw);
    };
    draw();

    const outTrack = canvas.captureStream(30).getVideoTracks()[0];
    await camPub.track.replaceTrack(outTrack);
  };

  const toggleBlur = async () => {
    if (!room) return;
    try {
      const camPub = getCamTrack();
      if (!camPub || !camPub.track) {
        setError("Activez d'abord la caméra pour modifier l'arrière-plan.");
        return;
      }

      const nextMode = bgMode === 'blur' ? 'none' : 'blur';
      if (nextMode === 'blur') {
        vbBgImageRef.current = null;
        await startVirtualBackground(camPub, 'blur');
      } else {
        await stopVirtualBackground(camPub);
      }
      setBgMode(nextMode);
    } catch (err) {
      console.error('Erreur flou:', err);
      setError("Impossible d'activer le flou d'arrière-plan. Vérifiez que WebGL/WASM est supporté.");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !room) return;
    try {
      const camPub = getCamTrack();
      if (!camPub || !camPub.track) {
        setError("Activez d'abord la caméra pour modifier l'arrière-plan.");
        return;
      }

      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      vbBgImageRef.current = img;

      await startVirtualBackground(camPub, 'image');
      setBgMode('image');
    } catch (err) {
      console.error('Erreur fond image:', err);
      setError("Impossible d'appliquer l'image de fond.");
    }
    e.target.value = ''; // reset input
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
      : [...participant.videoTrackPublications.values()].find(p => p.source === (livekitLib?.Track?.Source?.Camera || 'camera') || p.source === 'camera');
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

  const kickRemote = async (participant) => {
    if (!isHost) return;
    // Tente de bannir côté serveur si le endpoint existe
    if (kickEndpoint) {
      try {
        const csrfToken = await getFreshCsrfToken();
        await fetch(kickEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
          },
          body: JSON.stringify({ identity: participant.identity }),
        });
      } catch (err) {
        console.error('Erreur kick participant:', err);
      }
    }
    // Retrait local de la room pour action immédiate (si les droits LiveKit le permettent)
    // livekit-client doesn't expose a straightforward disconnect participant for admin, it's server side.
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

        <div
          className="relative z-10 flex flex-col items-center slide-up"
          style={{ paddingTop: 'calc(4rem + var(--safe-top, 0px))' }}
        >
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

        <div
          className="relative z-10 flex justify-between items-center px-12 slide-up w-full max-w-md mx-auto"
          style={{ paddingBottom: 'calc(5rem + var(--safe-bottom, 0px))' }}
        >
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

  const AvatarCircle = ({ name, size = 'w-28 h-28 text-3xl' }) => (
    <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-xl flex-shrink-0`}>
      {initialsOf(name)}
    </div>
  );

  const statusLabel = connecting
    ? 'Connexion…'
    : callStarted
    ? formatElapsed(elapsedSeconds)
    : 'En attente de participants…';

  // Défini une seule fois et injecté à deux endroits (panneau bureau / feuille mobile) : une simple
  // valeur JSX, jamais un composant imbriqué, pour ne jamais démonter le champ du lien (perte du
  // focus/de la sélection) à chaque re-rendu du parent (le chrono tourne toutes les secondes).
  const participantsListContent = (
    <>
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
            <button onClick={handleCopyLink} className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center flex-shrink-0 transition active:scale-90" title="Copier">
              {linkCopied ? <FaCheck className="w-3 h-3 text-white" /> : <FaCopy className="w-3 h-3 text-white" />}
            </button>
            <button onClick={handleShareLink} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition active:scale-90" title="Partager">
              <FaShareAlt className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Participants ({totalCount})</h4>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">Moi</div>
          <span className="text-sm text-white truncate flex items-center gap-1.5 flex-1">
            Vous {isHost && <FaCrown className="w-3 h-3 text-amber-400" />}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {handRaised && <FaHandPaper className="w-3.5 h-3.5 text-amber-400" />}
            {!micEnabled && <FaMicrophoneSlash className="w-3.5 h-3.5 text-red-400" />}
          </div>
        </div>
        {participants.map(p => (
          <div key={p.identity} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 group">
            <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initialsOf(otherName(p))}
            </div>
            <span className="text-sm text-slate-200 truncate flex-1">{otherName(p)}</span>
            {raisedHands[p.identity] && <FaHandPaper className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
            {isHost && (
              <div className="flex items-center gap-1 flex-shrink-0 md:hidden md:group-hover:flex">
                <button onClick={() => muteRemote(p, 'audio')} title="Couper le micro" className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center active:scale-90">
                  <FaMicrophoneSlash className="w-3.5 h-3.5 text-white" />
                </button>
                <button onClick={() => muteRemote(p, 'video')} title="Couper la caméra" className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center active:scale-90">
                  <FaVideoSlash className="w-3.5 h-3.5 text-white" />
                </button>
                {kickEndpoint && (
                  <button onClick={() => kickRemote(p)} title="Retirer de l'appel" className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center active:scale-90">
                    <FaUserSlash className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
      <style>{`
        @keyframes floatUpMeet {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          15% { opacity: 1; transform: translateY(-10vh) scale(1.1); }
          85% { opacity: 1; }
          100% { transform: translateY(-70vh) scale(1); opacity: 0; }
        }
        .float-reaction { animation: floatUpMeet 3s ease-out forwards; }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sheet-up { animation: sheetUp 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes panelIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .panel-in { animation: panelIn 0.2s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>

      {/* ─── ZONE VIDÉO — plein écran, comme Meet/WhatsApp ─── */}
      <div className="absolute inset-0 bg-black">
        {connecting ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-white">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <p className="text-white/70 text-sm">Connexion en cours…</p>
          </div>
        ) : !callStarted ? (
          // ── Personne d'autre encore : aperçu de soi plein écran, comme la salle d'attente Meet ──
          <div className="relative h-full w-full">
            {camEnabled ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover bg-black" style={mirrorStyle} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                <AvatarCircle name="Vous" size="w-32 h-32 text-4xl" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-40 pointer-events-none">
              <div className="flex items-center gap-2 text-white/90 bg-black/40 backdrop-blur px-4 py-2 rounded-full text-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                En attente que quelqu'un rejoigne…
              </div>
            </div>
          </div>
        ) : isScreenSharingAnyone ? (
          <div className="relative h-full w-full">
            <video ref={screenVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain bg-black" />
            <div
              className="absolute z-10 px-2.5 py-1 bg-black/60 text-white text-xs rounded-full flex items-center gap-1.5"
              style={{ top: 'calc(4.5rem + var(--safe-top, 0px))', left: '1rem' }}
            >
              <FaDesktop className="w-3 h-3" />
              {screenSharing ? 'Vous partagez votre écran' : `${remoteScreenShare?.p?.name || 'Un participant'} partage son écran`}
            </div>
            <div className="absolute inset-x-0 bottom-24 z-10 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-hide">
              <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-800 ring-1 ring-white/10 flex-shrink-0 relative flex items-center justify-center">
                {camEnabled ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle} />
                ) : (
                  <AvatarCircle name="Vous" size="w-8 h-8 text-[10px]" />
                )}
                <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 rounded">Vous</span>
              </div>
              {participants.map(p => (
                <div key={p.identity} className="w-24 h-16 rounded-xl overflow-hidden bg-black ring-1 ring-white/10 flex-shrink-0 relative">
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
        ) : isOneOnOne ? (
          // ─── 1 à 1 : plein écran + bulle flottante déplaçable, exactement comme WhatsApp ───
          <div className="relative h-full w-full">
            {soleParticipant ? (
              remoteHasCamera ? (
                <video ref={mainVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                  <AvatarCircle name={otherName(soleParticipant)} size="w-32 h-32 text-4xl" />
                </div>
              )
            ) : camEnabled ? (
              <video ref={mainVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover bg-black" style={mirrorStyle} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                <AvatarCircle name="Vous" size="w-32 h-32 text-4xl" />
              </div>
            )}

            {!!soleParticipant && raisedHands[soleParticipant.identity] && (
              <div
                className="absolute z-10 w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center animate-bounce"
                style={{ top: 'calc(4.5rem + var(--safe-top, 0px))', right: '1rem' }}
              >
                <FaHandPaper className="w-4 h-4 text-amber-900" />
              </div>
            )}

            {!!soleParticipant && (
              <div
                className="absolute z-10 px-3 py-1.5 bg-black/40 backdrop-blur text-white text-sm font-semibold rounded-full"
                style={{ top: 'calc(4.5rem + var(--safe-top, 0px))', left: '1rem' }}
              >
                {otherName(soleParticipant)}
              </div>
            )}

            {/* Bulle « moi » flottante et déplaçable — le geste WhatsApp par excellence */}
            <div
              onPointerDown={handlePipPointerDown}
              onPointerMove={handlePipPointerMove}
              onPointerUp={handlePipPointerUp}
              onPointerCancel={handlePipPointerUp}
              className="absolute z-20 w-24 h-36 sm:w-28 sm:h-40 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 bg-slate-800 touch-none cursor-grab active:cursor-grabbing"
              style={
                pipPos
                  ? { left: pipPos.x, top: pipPos.y }
                  : { right: '1rem', bottom: 'calc(7.5rem + var(--safe-bottom, 0px))' }
              }
            >
              {camEnabled ? (
                <video ref={soleParticipant ? localVideoRef : mainVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                  <AvatarCircle name="Vous" size="w-12 h-12 text-sm" />
                </div>
              )}
              {handRaised && (
                <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
                  <FaHandPaper className="w-3 h-3 text-amber-900" />
                </div>
              )}
              {!micEnabled && (
                <div className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <FaMicrophoneSlash className="w-3 h-3 text-red-400" />
                </div>
              )}
            </div>
          </div>
        ) : (
          // ─── Groupe (3+) : caméra principale + bandeau de vignettes, façon Meet ───
          <div className="relative h-full w-full">
            <video ref={mainVideoRef} autoPlay playsInline muted={isLocalMain} className="absolute inset-0 w-full h-full object-cover bg-black" style={isLocalMain ? mirrorStyle : {}} />
            {!isLocalMain && raisedHands[activeIdentity] && (
              <div
                className="absolute z-10 w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center animate-bounce"
                style={{ top: 'calc(4.5rem + var(--safe-top, 0px))', right: '1rem' }}
              >
                <FaHandPaper className="w-4 h-4 text-amber-900" />
              </div>
            )}
            <div
              className="absolute z-10 px-3 py-1.5 bg-black/40 backdrop-blur text-white text-sm font-semibold rounded-full flex items-center gap-2"
              style={{ top: 'calc(4.5rem + var(--safe-top, 0px))', left: '1rem' }}
            >
              {isLocalMain ? 'Vous' : (participants.find(p => p.identity === activeIdentity)?.name || activeIdentity)}
              {isLocalMain && isHost && <FaCrown className="w-3.5 h-3.5 text-amber-400" />}
            </div>

            <div className="absolute inset-x-0 bottom-24 z-10 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-hide">
              <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-slate-800 ring-1 ring-white/10 flex-shrink-0 relative flex items-center justify-center">
                {camEnabled ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle} />
                ) : (
                  <AvatarCircle name="Vous" size="w-9 h-9 text-xs" />
                )}
                {handRaised && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
                    <FaHandPaper className="w-2.5 h-2.5 text-amber-900" />
                  </div>
                )}
                <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 rounded flex items-center gap-1">
                  Vous {!micEnabled && <FaMicrophoneSlash className="w-2 h-2 text-red-400" />}
                </span>
              </div>
              {participants.map(p => (
                <div key={p.identity} className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-black ring-1 ring-white/10 flex-shrink-0 relative group">
                  <video
                    ref={(el) => { if (el) remoteVideoRefs.current[p.identity] = el; }}
                    autoPlay playsInline className="w-full h-full object-cover bg-black" style={mirrorStyle}
                  />
                  {raisedHands[p.identity] && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
                      <FaHandPaper className="w-2.5 h-2.5 text-amber-900" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 rounded truncate max-w-[80%]">
                    {p.name || p.identity}
                  </span>
                  {isHost && (
                    <div className="absolute top-1 left-1 hidden group-hover:flex items-center gap-1">
                      <button onClick={() => muteRemote(p, 'audio')} title="Couper le micro" className="w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center">
                        <FaMicrophoneSlash className="w-2.5 h-2.5 text-white" />
                      </button>
                      <button onClick={() => muteRemote(p, 'video')} title="Couper la caméra" className="w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center">
                        <FaVideoSlash className="w-2.5 h-2.5 text-white" />
                      </button>
                      {kickEndpoint && (
                        <button onClick={() => kickRemote(p)} title="Retirer de l'appel" className="w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center">
                          <FaUserSlash className="w-2.5 h-2.5 text-white" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Réactions façon Google Meet : flottent vers le haut ─── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full overflow-hidden z-10">
          {floatingReactions.map(r => (
            <div key={r.id} className="float-reaction absolute bottom-24 text-4xl drop-shadow-lg" style={{ left: `${r.left}%` }}>
              {r.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* ─── En-tête flottant, translucide — se fond dans la vidéo comme Meet/WhatsApp ─── */}
      <div
        className="absolute top-0 inset-x-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 pb-6 bg-gradient-to-b from-black/70 via-black/25 to-transparent text-white"
        style={{ paddingTop: 'calc(0.625rem + var(--safe-top, 0px))' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-black/30 backdrop-blur px-2.5 py-1.5 rounded-full">
            <FaCircle className={`w-1.5 h-1.5 ${connectionState === 'connected' && callStarted ? 'text-emerald-400' : 'text-amber-300 animate-pulse'}`} />
            {statusLabel}
          </span>
          {isHost && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-amber-400 text-amber-900 px-2 py-1 rounded-full flex-shrink-0">
              <FaCrown className="w-3 h-3" /> Hôte
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowParticipants(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-black/30 hover:bg-black/50 backdrop-blur px-3 py-1.5 rounded-full transition active:scale-95"
          >
            <FaUsers className="w-3.5 h-3.5" /> {totalCount}
          </button>
          {inviteLink && (
            <>
              <button
                onClick={handleCopyLink}
                title={linkCopied ? 'Lien copié !' : "Copier le lien d'invitation"}
                className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition backdrop-blur ${
                  linkCopied ? 'bg-emerald-500/30 text-emerald-300' : 'bg-black/30 hover:bg-black/50 text-white'
                }`}
              >
                {linkCopied ? <FaCheck className="w-3 h-3" /> : <FaCopy className="w-3 h-3" />}
                {linkCopied ? 'Copié !' : 'Copier le lien'}
              </button>
              <button
                onClick={handleShareLink}
                title="Partager le lien d'invitation"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold bg-black/30 hover:bg-black/50 backdrop-blur px-3 py-1.5 rounded-full transition"
              >
                <FaShareAlt className="w-3 h-3" /> Partager
              </button>
            </>
          )}
          <button onClick={toggleFullscreen} className="hidden md:flex text-white/90 hover:text-white p-2 rounded-full hover:bg-white/10">
            {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
          <button onClick={handleLeave} className="text-white/90 hover:text-white p-2 rounded-full hover:bg-white/10 active:scale-90" title="Quitter l'appel">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="absolute z-30 left-3 right-3 rounded-xl border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm shadow-lg"
          style={{ top: 'calc(4.25rem + var(--safe-top, 0px))' }}
        >
          {error}
        </div>
      )}

      {/* ─── Réactions rapides — bulle flottante au-dessus du bouton, comme Meet ─── */}
      {showReactions && (
        <div
          className="absolute z-30 right-3 sm:right-6 flex items-center gap-1 bg-slate-900/95 backdrop-blur rounded-full px-2 py-2 shadow-2xl ring-1 ring-white/10"
          style={{ bottom: 'calc(6.25rem + var(--safe-bottom, 0px))' }}
        >
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { sendReaction(emoji); setShowReactions(false); }}
              className="text-2xl w-10 h-10 flex items-center justify-center active:scale-125 hover:bg-white/10 rounded-full transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* ─── Barre de contrôle flottante — une seule ligne, jamais de retour à la ligne ─── */}
      <div
        className="absolute bottom-0 inset-x-0 z-30 flex items-center justify-center gap-2 sm:gap-3 px-3 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        style={{ paddingBottom: 'calc(1.1rem + var(--safe-bottom, 0px))' }}
      >
        <button
          onClick={toggleMic}
          title={micEnabled ? 'Couper le micro' : 'Activer le micro'}
          className={`w-12 h-12 sm:w-[3.25rem] sm:h-[3.25rem] rounded-full flex items-center justify-center transition active:scale-90 ${
            micEnabled ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {micEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button
          onClick={toggleCam}
          title={camEnabled ? 'Couper la caméra' : 'Activer la caméra'}
          className={`w-12 h-12 sm:w-[3.25rem] sm:h-[3.25rem] rounded-full flex items-center justify-center transition active:scale-90 ${
            camEnabled ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {camEnabled ? <FaVideoIcon /> : <FaVideoSlash />}
        </button>

        {/* Contrôles secondaires — toujours visibles à partir de md, regroupés dans « Plus » sur mobile */}
        <button
          onClick={toggleBlur}
          title={bgMode === 'blur' ? 'Désactiver le flou' : 'Activer le flou'}
          className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition active:scale-90 ${
            bgMode === 'blur' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <FaAdjust />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          title={bgMode === 'image' ? "Changer l'image de fond" : 'Fond visuel (image)'}
          className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition active:scale-90 ${
            bgMode === 'image' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <FaImage />
        </button>
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
        <button
          onClick={toggleScreenShare}
          title={screenSharing ? 'Arrêter le partage' : "Partager l'écran"}
          className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition active:scale-90 ${
            screenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <FaDesktop />
        </button>
        <button
          onClick={toggleRaiseHand}
          title={handRaised ? 'Baisser la main' : 'Lever la main'}
          className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition active:scale-90 ${
            handRaised ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <FaHandPaper />
        </button>

        <button
          onClick={() => setShowReactions(v => !v)}
          title="Réactions"
          className={`w-12 h-12 sm:w-[3.25rem] sm:h-[3.25rem] rounded-full flex items-center justify-center transition active:scale-90 ${
            showReactions ? 'bg-amber-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <FaSmile />
        </button>

        {/* « Plus » — regroupe flou / fond / partage d'écran / main levée sur mobile */}
        <button
          onClick={() => setShowMoreSheet(true)}
          title="Plus d'options"
          className={`flex md:hidden w-12 h-12 rounded-full items-center justify-center transition active:scale-90 relative ${
            handRaised || bgMode !== 'none' || screenSharing ? 'bg-blue-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <FaEllipsisV />
          {(handRaised || bgMode !== 'none' || screenSharing) && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-slate-900" />
          )}
        </button>

        <button
          onClick={handleLeave}
          title="Quitter l'appel"
          className="w-12 h-12 sm:w-14 sm:h-[3.25rem] rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition active:scale-90 ml-1"
        >
          <FaPhoneSlash className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Feuille « Plus d'options » — mobile uniquement ─── */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMoreSheet(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="sheet-up absolute bottom-0 inset-x-0 bg-slate-900 rounded-t-3xl px-4 pt-3 shadow-2xl"
            style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto mb-4" />
            <h4 className="text-white/60 text-xs font-bold uppercase tracking-wide mb-3 px-1">Plus d'options</h4>
            <div className="grid grid-cols-4 gap-3 pb-2">
              {[
                { key: 'blur', label: 'Flou', icon: FaAdjust, active: bgMode === 'blur', onClick: () => { toggleBlur(); setShowMoreSheet(false); } },
                { key: 'bg', label: 'Fond', icon: FaImage, active: bgMode === 'image', onClick: () => { fileInputRef.current?.click(); setShowMoreSheet(false); } },
                { key: 'share', label: screenSharing ? 'Arrêter' : 'Partager écran', icon: FaDesktop, active: screenSharing, onClick: () => { toggleScreenShare(); setShowMoreSheet(false); } },
                { key: 'hand', label: handRaised ? 'Main levée' : 'Lever la main', icon: FaHandPaper, active: handRaised, onClick: () => { toggleRaiseHand(); setShowMoreSheet(false); } },
              ].map(({ key, label, icon: Icon, active, onClick }) => (
                <button key={key} onClick={onClick} className="flex flex-col items-center gap-2 py-2">
                  <span className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition active:scale-90 ${active ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
                    <Icon />
                  </span>
                  <span className="text-[11px] text-white/80 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
            {inviteLink && (
              <div className="mt-2 pt-3 border-t border-white/10 flex items-center gap-2">
                <button onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-white/10 text-white text-sm font-semibold active:scale-95">
                  {linkCopied ? <FaCheck className="text-emerald-400" /> : <FaCopy />} {linkCopied ? 'Copié !' : 'Copier le lien'}
                </button>
                <button onClick={handleShareLink} className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-white/10 text-white text-sm font-semibold active:scale-95">
                  <FaShareAlt /> Partager
                </button>
              </div>
            )}
            <button
              onClick={() => { toggleFullscreen(); setShowMoreSheet(false); }}
              className="mt-3 w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-white/10 text-white text-sm font-semibold active:scale-95"
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />} {isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Participants — panneau latéral (bureau) ou feuille du bas (mobile), façon WhatsApp ─── */}
      {showParticipants && (
        <div className="fixed inset-0 z-40" onClick={() => setShowParticipants(false)}>
          <div className="absolute inset-0 bg-black/50 md:bg-black/30" />

          {/* Bureau : panneau latéral */}
          <div
            className="panel-in hidden md:flex md:flex-col absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {participantsListContent}
          </div>

          {/* Mobile : feuille du bas */}
          <div
            className="sheet-up md:hidden absolute bottom-0 inset-x-0 max-h-[80vh] bg-slate-900 rounded-t-3xl px-4 pt-3 flex flex-col"
            style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto mb-3 flex-shrink-0" />
            <div className="overflow-y-auto">
              {participantsListContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
