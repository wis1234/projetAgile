import React, { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import {
  FaTimes, FaMicrophone, FaMicrophoneSlash, FaVideo as FaVideoIcon, FaVideoSlash,
  FaDesktop, FaSmile, FaUsers, FaExpand, FaCompress, FaCircle,
} from 'react-icons/fa';

const REACTIONS = ['👍', '❤️', '😂', '👏', '🎉', '😮', '🙌', '🔥'];

export default function LiveKitCallModal({ tokenEndpoint, title, onClose, onAnswered }) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connectionState, setConnectionState] = useState('connecting');
  const [callStarted, setCallStarted] = useState(false); // true dès qu'un autre participant est présent

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const containerRef = useRef(null);
  const ringbackRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const answeredNotifiedRef = useRef(false);

  // ─── Tonalité d'appel sortant (tant qu'on est seul dans la room) ────
  const startRingback = () => {
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

  const stopRingback = () => {
    if (!ringbackRef.current) return;
    clearInterval(ringbackRef.current.interval);
    ringbackRef.current.audioCtx.close().catch(() => {});
    ringbackRef.current = null;
  };

  // ─── Connexion à la room ───────────────────────────────────────────
  useEffect(() => {
    let activeRoom;

    const connect = async () => {
      try {
        const res = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
        });
        if (!res.ok) throw new Error('Impossible de récupérer le token ProJA');
        const { token, url } = await res.json();

        activeRoom = new Room({ adaptiveStream: true, dynacast: true });
        setRoom(activeRoom);

        activeRoom.on(RoomEvent.TrackSubscribed, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.ParticipantConnected, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.ParticipantDisconnected, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state);
        });
        activeRoom.on(RoomEvent.DataReceived, (payload) => {
          try {
            const text = new TextDecoder().decode(payload);
            const data = JSON.parse(text);
            if (data.type === 'reaction') {
              const id = `${Date.now()}_${Math.random()}`;
              setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, from: data.name }]);
              setTimeout(() => {
                setFloatingReactions(prev => prev.filter(r => r.id !== id));
              }, 2500);
            }
          } catch (e) { /* ignore */ }
        });

        await activeRoom.connect(url, token);
        await activeRoom.localParticipant.setMicrophoneEnabled(true);
        await activeRoom.localParticipant.setCameraEnabled(true);

        const camPub = [...activeRoom.localParticipant.videoTrackPublications.values()]
          .find(pub => pub.source === Track.Source.Camera);
        if (camPub?.track && localVideoRef.current) {
          camPub.track.attach(localVideoRef.current);
        }

        const initialParticipants = [...activeRoom.remoteParticipants.values()];
        setParticipants(initialParticipants);
        setConnecting(false);

        // Si des participants sont déjà là, c'est que quelqu'un "décroche" en nous rejoignant
        if (initialParticipants.length > 0 && !answeredNotifiedRef.current) {
          answeredNotifiedRef.current = true;
          onAnswered?.();
        }
      } catch (err) {
        console.error('Erreur connexion ProJA:', err);
        setError(err.message || 'Impossible de rejoindre l’appel');
        setConnecting(false);
      }
    };

    connect();

    return () => {
      clearInterval(timerIntervalRef.current);
      stopRingback();
      activeRoom?.disconnect();
    };
  }, [tokenEndpoint]);

  // ─── Gère le passage "en attente" → "appel démarré" ─────────────────
  useEffect(() => {
    if (connecting) return;

    if (participants.length === 0) {
      startRingback();
      return;
    }

    stopRingback();
    if (!answeredNotifiedRef.current) {
      answeredNotifiedRef.current = true;
      onAnswered?.();
    }
    if (!callStarted) {
      setCallStarted(true);
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
  }, [participants.length, connecting]);

  // ─── Attacher les flux distants (caméra + partage d'écran) ─────────
  useEffect(() => {
    participants.forEach(p => {
      const camPub = [...p.videoTrackPublications.values()].find(pub => pub.source === Track.Source.Camera && pub.track);
      const el = remoteVideoRefs.current[p.identity];
      if (camPub?.track && el) camPub.track.attach(el);

      const audioPub = [...p.audioTrackPublications.values()].find(pub => pub.track);
      if (audioPub?.track) audioPub.track.attach();
    });
  }, [participants]);

  const remoteScreenShare = participants
    .map(p => ({ p, pub: [...p.videoTrackPublications.values()].find(pub => pub.source === Track.Source.ScreenShare && pub.track) }))
    .find(x => x.pub);

  useEffect(() => {
    if (remoteScreenShare?.pub?.track && screenVideoRef.current) {
      remoteScreenShare.pub.track.attach(screenVideoRef.current);
    }
  }, [remoteScreenShare]);

  // ─── Contrôles ───────────────────────────────────────────────────
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
    if (next) {
      const camPub = [...room.localParticipant.videoTrackPublications.values()]
        .find(pub => pub.source === Track.Source.Camera);
      if (camPub?.track && localVideoRef.current) camPub.track.attach(localVideoRef.current);
    }
  };

  const toggleScreenShare = async () => {
    if (!room) return;
    try {
      const next = !screenSharing;
      await room.localParticipant.setScreenShareEnabled(next, { audio: true });
      setScreenSharing(next);
      if (next) {
        setTimeout(() => {
          const pub = [...room.localParticipant.videoTrackPublications.values()]
            .find(p => p.source === Track.Source.ScreenShare);
          if (pub?.track && screenVideoRef.current) pub.track.attach(screenVideoRef.current);
        }, 300);
      }
    } catch (err) {
      console.error('Erreur partage d’écran:', err);
      setError('Impossible de démarrer le partage d’écran.');
    }
  };

  const sendReaction = (emoji) => {
    if (!room) return;
    const payload = new TextEncoder().encode(JSON.stringify({
      type: 'reaction',
      emoji,
      name: room.localParticipant.name || 'Vous',
    }));
    room.localParticipant.publishData(payload, { reliable: true });

    const id = `${Date.now()}_local`;
    setFloatingReactions(prev => [...prev, { id, emoji, from: 'Vous' }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 2500);
    setShowReactions(false);
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

  const handleLeave = () => {
    stopRingback();
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
  const isScreenSharingAnyone = screenSharing || !!remoteScreenShare;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold truncate">ProJA — {title}</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2 py-1 rounded-full">
            <FaCircle className={`w-1.5 h-1.5 ${connectionState === 'connected' && callStarted ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
            {connecting
              ? 'Connexion…'
              : callStarted
              ? formatElapsed(elapsedSeconds)
              : 'En attente de participants…'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
          >
            <FaUsers className="w-3.5 h-3.5" /> {totalCount}
          </button>
          <button onClick={toggleFullscreen} className="text-white/80 hover:text-white p-1.5">
            {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
          <button onClick={handleLeave} className="text-white/80 hover:text-white p-1.5">
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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Participants ({totalCount})</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">Moi</div>
                <span className="text-sm text-white truncate">Vous</span>
                {!micEnabled && <FaMicrophoneSlash className="w-3 h-3 text-red-400 ml-auto" />}
              </div>
              {participants.map(p => (
                <div key={p.identity} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5">
                  <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">
                    {(p.name || p.identity).slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-200 truncate">{p.name || p.identity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {connecting ? (
            <div className="h-full flex items-center justify-center text-white">Connexion en cours…</div>
          ) : !callStarted ? (
            /* ─── EN ATTENTE : personne d'autre encore présent ─── */
            <div className="h-full flex flex-col items-center justify-center gap-4 text-white">
              <div className="w-40 h-40 rounded-2xl overflow-hidden bg-black border border-slate-700 relative">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" />
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
                <div className="w-32 h-20 rounded-xl overflow-hidden bg-black border border-slate-700 flex-shrink-0 relative">
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" />
                  <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 rounded">Vous</span>
                </div>
                {participants.map(p => (
                  <div key={p.identity} className="w-32 h-20 rounded-xl overflow-hidden bg-black border border-slate-700 flex-shrink-0 relative">
                    <video
                      ref={(el) => { if (el) remoteVideoRefs.current[p.identity] = el; }}
                      autoPlay playsInline className="w-full h-full object-cover bg-black"
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
              <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video relative">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded flex items-center gap-1.5">
                  Vous {!micEnabled && <FaMicrophoneSlash className="w-3 h-3 text-red-400" />}
                </div>
              </div>
              {participants.map(p => (
                <div key={p.identity} className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video relative">
                  <video
                    ref={(el) => { if (el) remoteVideoRefs.current[p.identity] = el; }}
                    autoPlay playsInline className="w-full h-full object-cover bg-black"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-semibold rounded truncate max-w-[85%]">
                    {p.name || p.identity}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-end gap-1">
            {floatingReactions.map(r => (
              <div key={r.id} className="animate-bounce text-3xl drop-shadow-lg">{r.emoji}</div>
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

      <div className="flex items-center justify-center gap-3 py-4 bg-slate-900 flex-shrink-0">
        <button onClick={toggleMic} title={micEnabled ? 'Couper le micro' : 'Activer le micro'} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${micEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {micEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button onClick={toggleCam} title={camEnabled ? 'Couper la caméra' : 'Activer la caméra'} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${camEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {camEnabled ? <FaVideoIcon /> : <FaVideoSlash />}
        </button>
        <button onClick={toggleScreenShare} title={screenSharing ? 'Arrêter le partage' : 'Partager l’écran'} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${screenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
          <FaDesktop />
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