import React, { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { FaTimes, FaMicrophone, FaMicrophoneSlash, FaVideo as FaVideoIcon, FaVideoSlash } from 'react-icons/fa';

export default function LiveKitCallModal({ tokenEndpoint, title, onClose }) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

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
        if (!res.ok) throw new Error('Impossible de récupérer le token LiveKit');
        const { token, url } = await res.json();

        activeRoom = new Room();
        setRoom(activeRoom);

        activeRoom.on(RoomEvent.TrackSubscribed, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });
        activeRoom.on(RoomEvent.ParticipantDisconnected, () => {
          setParticipants([...activeRoom.remoteParticipants.values()]);
        });

        await activeRoom.connect(url, token);
        await activeRoom.localParticipant.setMicrophoneEnabled(true);
        await activeRoom.localParticipant.setCameraEnabled(true);

        const camPub = [...activeRoom.localParticipant.videoTrackPublications.values()][0];
        if (camPub?.track && localVideoRef.current) {
          camPub.track.attach(localVideoRef.current);
        }

        setParticipants([...activeRoom.remoteParticipants.values()]);
        setConnecting(false);
      } catch (err) {
        console.error('Erreur connexion LiveKit:', err);
        setError(err.message || 'Impossible de rejoindre l’appel LiveKit');
        setConnecting(false);
      }
    };

    connect();

    return () => {
      activeRoom?.disconnect();
    };
}, [tokenEndpoint]);

  useEffect(() => {
    participants.forEach(p => {
      const videoPub = [...p.videoTrackPublications.values()].find(pub => pub.track);
      const el = remoteVideoRefs.current[p.identity];
      if (videoPub?.track && el) {
        videoPub.track.attach(el);
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
      const camPub = [...room.localParticipant.videoTrackPublications.values()][0];
      if (camPub?.track && localVideoRef.current) camPub.track.attach(localVideoRef.current);
    }
  };

  const handleLeave = () => {
    room?.disconnect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
        <span className="font-semibold">Appel LiveKit — {title}</span> 
        <button onClick={handleLeave} className="text-white/80 hover:text-white">
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-xl border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {connecting ? (
        <div className="flex-1 flex items-center justify-center text-white">Connexion en cours…</div>
      ) : (
        <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto content-start">
          <div className="rounded-2xl overflow-hidden bg-black border border-slate-700">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-40 object-cover bg-black" />
            <div className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold">Vous</div>
          </div>
          {participants.map(p => (
            <div key={p.identity} className="rounded-2xl overflow-hidden bg-black border border-slate-700">
              <video
                ref={(el) => { if (el) remoteVideoRefs.current[p.identity] = el; }}
                autoPlay
                playsInline
                className="w-full h-40 object-cover bg-black"
              />
              <div className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold">
                {p.name || p.identity}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 py-4 bg-slate-900">
        <button onClick={toggleMic} className={`w-11 h-11 rounded-full flex items-center justify-center ${micEnabled ? 'bg-white/10 text-white' : 'bg-red-600 text-white'}`}>
          {micEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button onClick={toggleCam} className={`w-11 h-11 rounded-full flex items-center justify-center ${camEnabled ? 'bg-white/10 text-white' : 'bg-red-600 text-white'}`}>
          {camEnabled ? <FaVideoIcon /> : <FaVideoSlash />}
        </button>
        <button onClick={handleLeave} className="px-5 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold">
          Quitter
        </button>
      </div>
    </div>
  );
}