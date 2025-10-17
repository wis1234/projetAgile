
import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaPlay, FaTrash } from 'react-icons/fa';

export default function VoiceRecorder({ onRecordingComplete, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
        setAudioURL(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev < 120 ? prev + 1 : stopRecording());
      }, 1000);
      
    } catch (err) {
      console.error('Erreur d\'accès au microphone:', err);
      alert('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state !== 'inactive') {
      mediaRecorder.current?.stop();
      mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioURL('');
    onCancel?.();
  };

  const sendRecording = () => {
    if (audioURL) {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
      onRecordingComplete(audioBlob, recordingTime);
      setAudioURL('');
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop();
      }
      clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4 mt-4">
      {audioURL ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <audio src={audioURL} controls className="w-full" />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={cancelRecording}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
              title="Supprimer"
            >
              <FaTrash />
            </button>
            <button
              onClick={sendRecording}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Envoyer
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full ${
              isRecording 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            {isRecording ? <FaStop /> : <FaMicrophone />}
          </button>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isRecording 
              ? `Enregistrement... ${formatTime(recordingTime)}`
              : 'Appuyez pour enregistrer un message'}
          </div>
        </div>
      )}
    </div>
  );
}
