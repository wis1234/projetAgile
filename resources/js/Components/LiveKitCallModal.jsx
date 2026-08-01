import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import {
  FaTimes, FaMicrophone, FaMicrophoneSlash, FaVideo as FaVideoIcon, FaVideoSlash,
  FaDesktop, FaExpand, FaCompress, FaSmile, FaUsers, FaSignal
} from 'react-icons/fa';

const REACTIONS = ['👍', '❤️', '😂', '👏', '🎉', '😮', '🙌', '🔥'];

export default function LiveKitCallModal({ tokenEndpoint, title, onClose }) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [activeSpeakerIds, setActiveSpeakerIds] = useState([]);
  const [, forceTick] = useState(0); // force re-render on mute/unmute events

  const localVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const containerRef = useRef(null);
  const roomRef = useRef(null);

  const rerender = useCallback(() => forceTick(t => t + 1), []);

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

        activeRoom = new Room();
        roomRef.current = activeRoom;
        setRoom(activeRoom);

        activeRoom.on(RoomEvent.TrackSubscribed, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.TrackUnsubscribed, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.ParticipantDisconnected, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.ParticipantConnected, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.TrackMuted, rerender);
        activeRoom.on(RoomEvent.TrackUnmuted, rerender);
        activeRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          setActiveSpeakerIds(speakers.map(s => s.sid));
        });
        activeRoom.on(RoomEvent.DataReceived, (payload) => {
          try {
            const text = new TextDecoder().decode(payload);
            const data = JSON.parse(text);
            if (data.type === 'reaction') {
              const id = `${Date.now()}_${Math.random()}`;
              setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, x: Math.random() * 70 + 15 }]);
              setTimeout(() => {
                setFloatingReactions(prev => prev.filter(r => r.id !== id));
              }, 2500);
            }
          } catch (e) { /* ignore malformed data */ }
        });

        await activeRoom.connect(url, token);
        await activeRoom.localParticipant.setMicrophoneEnabled(true);
        await activeRoom.localParticipant.setCameraEnabled(true);

        const camPub = [...activeRoom.localParticipant.videoTrackPublications.values()]
          .find(p => p.source === Track.Source.Camera);
        if (camPub?.track && localVideoRef.current) {
          camPub.track.attach(localVideoRef.current);
        }

        setParticipants([...activeRoom.remoteParticipants.values()]);
        setConnecting(false);
      } catch (err) {
        console.error('Erreur connexion ProJA Call:', err);
        setError(err.message || 'Impossible de rejoindre l’appel ProJA');
        setConnecting(false);
      }
    };

    connect();

    return () => {
      activeRoom?.disconnect();
    };
  }, [tokenEndpoint, rerender]);

  useEffect(() => {
    participants.forEach(p => {
      const videoPub = [...p.videoTrackPublications.values()].find(pub => pub.track && pub.source === Track.Source.Camera);
      const el = remoteVideoRefs.current[p.identity];
      if (videoPub?.track && el) {
        videoPub.track.attach(el);
      }
      const screenPub = [...p.videoTrackPublications.values()].find(pub => pub.track && pub.source === Track.Source.ScreenShare);
      const screenEl = remoteVideoRefs.current[`${p.identity}_screen`];
      if (screenPub?.track && screenEl) {
        screenPub.track.attach(screenEl);
      }
      const audioPub = [...p.audioTrackPublications.values()].find(pub => pub.track);
      if (audioPub?.track) {
        audioPub.track.attach();
      }
    });
  }, [participants]);

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
        .find(p => p.source === Track.Source.Camera);
      if (camPub?.track && localVideoRef.current) camPub.track.attach(localVideoRef.current);
    }
  };

  const toggleScreenShare = async () => {
    if (!room) return;
    try {
      const next = !screenSharing;
      await room.localParticipant.setScreenShareEnabled(next);
      setScreenSharing(next);
      if (next) {
        setTimeout(() => {
          const screenPub = [...room.localParticipant.videoTrackPublications.values()]
            .find(p => p.source === Track.Source.ScreenShare);
          if (screenPub?.track && screenShareRef.current) {
            screenPub.track.attach(screenShareRef.current);
          }
        }, 200);
      }
    } catch (err) {
      // L'utilisateur a probablement annulé la sélection de fenêtre/écran
      console.warn('Partage d’écran annulé ou refusé:', err);
    }
  };

  const sendReaction = (emoji) => {
    if (!room) return;
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji }));
    room.localParticipant.publishData(payload, { reliable: true });
    const id = `local_${Date.now()}`;
    setFloatingReactions(prev => [...prev, { id, emoji, x: Math.random() * 70 + 15 }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
    setShowReactionPicker(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleLeave = () => {
    room?.disconnect();
    onClose();
  };

  const isMicMuted = (p) => {
    const pub = [...p.audioTrackPublications.values()][0];
    return !pub || pub.isMuted;
  };
  const isCamOff = (p) => {
    const pub = [...p.videoTrackPublications.values()].find(v => v.source === Track.Source.Camera);
    return !pub || pub.isMuted;
  };
  const remoteScreenShares = participants.filter(p =>
    [...p.videoTrackPublications.values()].some(v => v.source === Track.Source.ScreenShare && v.track)
  );

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold truncate">ProJA Meet — {title}</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
            <FaUsers className="text-[10px]" /> {participants.length + 1}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
            <FaSignal className="text-[10px]" /> {connecting ? 'Connexion…' : 'En direct'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleFullscreen} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10" title="Plein écran">
            {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
          <button onClick={handleLeave} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-xl border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm flex-shrink-0">
          {error}
        </div>
      )}

      {/* ── Zone vidéo ── */}
      <div className="flex-1 relative overflow-hidden">
        {connecting ? (
          <div className="h-full flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white/70">Connexion à ProJA Meet…</span>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            {/* Partage d'écran : mis en avant en grand si actif */}
            {(screenSharing || remoteScreenShares.length > 0) && (
              <div className="mb-4 rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-lg">
                {screenSharing ? (
                  <video ref={screenShareRef} autoPlay playsInline className="w-full max-h-[60vh] object-contain bg-black" />
                ) : (
                  remoteScreenShares.slice(0, 1).map(p => (
                    <video
                      key={`${p.identity}_screen`}
                      ref={(el) => { if (el) remoteVideoRefs.current[`${p.identity}_screen`] = el; }}
                      autoPlay
                      playsInline
                      className="w-full max-h-[60vh] object-contain bg-black"
                    />
                  ))
                )}
                <div className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5">
                  <FaDesktop className="text-[10px]" /> {screenSharing ? 'Votre écran' : `Écran partagé par ${remoteScreenShares[0]?.name || remoteScreenShares[0]?.identity}`}
                </div>
              </div>
            )}

            {/* Grille des participants */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className={`relative rounded-2xl overflow-hidden bg-black border-2 ${activeSpeakerIds.length && room?.localParticipant && activeSpeakerIds.includes(room.localParticipant.sid) ? 'border-emerald-400' : 'border-slate-700'}`}>
                <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-40 object-cover bg-black ${!camEnabled ? 'opacity-0' : ''}`} />
                {!camEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white text-3xl font-bold">
                    Vous
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                  <span className="text-white text-xs font-semibold">Vous</span>
                  {!micEnabled && <FaMicrophoneSlash className="text-red-400 text-xs" />}
                </div>
              </div>

              {participants.map(p => (
                <div
                  key={p.identity}
                  className={`relative rounded-2xl overflow-hidden bg-black border-2 ${activeSpeakerIds.includes(p.sid) ? 'border-emerald-400' : 'border-slate-700'}`}
                >
                  <video
                    ref={(el) => { if (el) remoteVideoRefs.current[p.identity] = el; }}
                    autoPlay
                    playsInline
                    className={`w-full h-40 object-cover bg-black ${isCamOff(p) ? 'opacity-0' : ''}`}
                  />
                  {isCamOff(p) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white text-xl font-bold">
                      {(p.name || p.identity || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                    <span className="text-white text-xs font-semibold truncate">{p.name || p.identity}</span>
                    {isMicMuted(p) && <FaMicrophoneSlash className="text-red-400 text-xs flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Réactions flottantes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingReactions.map(r => (
            <span
              key={r.id}
              className="absolute bottom-24 text-3xl animate-[float-up_2.5s_ease-out_forwards]"
              style={{ left: `${r.x}%` }}
            >
              {r.emoji}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes float-up {
            0% { transform: translateY(0) scale(0.8); opacity: 0; }
            15% { opacity: 1; transform: translateY(-20px) scale(1.1); }
            100% { transform: translateY(-220px) scale(1); opacity: 0; }
          }
        `}</style>
      </div>

      {/* ── Barre de contrôle ── */}
      <div className="relative flex items-center justify-center gap-3 py-4 bg-slate-900 flex-shrink-0">
        {showReactionPicker && (
          <div className="absolute bottom-full mb-2 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-2 py-1.5">
            {REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-xl w-9 h-9 flex items-center justify-center hover:scale-125 transition-transform hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <button onClick={toggleMic} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${micEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-600 text-white'}`} title={micEnabled ? 'Couper le micro' : 'Activer le micro'}>
          {micEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button onClick={toggleCam} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${camEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-600 text-white'}`} title={camEnabled ? 'Couper la caméra' : 'Activer la caméra'}>
          {camEnabled ? <FaVideoIcon /> : <FaVideoSlash />}
        </button>
        <button onClick={toggleScreenShare} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${screenSharing ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`} title="Partager l’écran">
          <FaDesktop />
        </button>
        <button onClick={() => setShowReactionPicker(prev => !prev)} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${showReactionPicker ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`} title="Réactions">
          <FaSmile />
        </button>
        <button onClick={handleLeave} className="px-5 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition">
          Quitter
        </button>
      </div>
    </div>
  );
}