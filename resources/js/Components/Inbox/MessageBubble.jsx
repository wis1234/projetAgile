import React, { memo, useEffect, useRef, useState } from 'react';
import { FaCheck, FaCheckDouble, FaClock, FaChevronDown, FaReply, FaCopy, FaExclamationCircle } from 'react-icons/fa';
import AudioPlayer from '@/Components/AudioPlayer';
import StickerMessage from '@/Components/Stickers/StickerMessage';
import { formatClock, resolveMedia } from '@/lib/inbox';

/** ✓ envoyé · ✓✓ bleu = lu · horloge = en cours d'envoi */
function Ticks({ m, light }) {
  if (m._failed) return <FaExclamationCircle className="h-3 w-3 text-red-300" />;
  if (m._pending) return <FaClock className={`h-2.5 w-2.5 ${light ? 'text-white/70' : 'text-slate-400'}`} />;
  if (m.read_at) return <FaCheckDouble className="h-3 w-3 text-sky-300" />;
  return <FaCheck className={`h-2.5 w-2.5 ${light ? 'text-white/70' : 'text-slate-400'}`} />;
}

function ReplyQuote({ reply, mine, onJump }) {
  if (!reply) return null;
  return (
    <button
      type="button"
      onClick={() => onJump?.(reply.id)}
      className={`mb-1.5 block w-full rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs ${
        mine ? 'border-white/70 bg-white/15 text-white/90' : 'border-blue-500 bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
      }`}
    >
      <span className={`block text-[11px] font-bold ${mine ? 'text-white' : 'text-blue-600 dark:text-blue-300'}`}>
        {reply.is_me ? 'Vous' : 'Message'}
      </span>
      <span className="line-clamp-2 break-words">{reply.preview}</span>
    </button>
  );
}

function MessageBubble({ m, mine, onReply, onRetry, onOpenMedia, onJump, compact }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);

  const time = formatClock(m.created_at);
  const src = resolveMedia(m.attachment_path);
  const isSticker = m.type === 'sticker';

  const copy = async () => {
    try { await navigator.clipboard.writeText(m.content || ''); } catch { /* indisponible */ }
    setMenu(false);
  };

  const actions = (
    <div className={`relative flex-shrink-0 self-center ${menu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'} transition-opacity ${compact ? 'opacity-100' : ''}`}>
      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        aria-label="Options du message"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm hover:text-slate-800 dark:bg-slate-800/90 dark:text-slate-300"
      >
        <FaChevronDown className="h-2.5 w-2.5" />
      </button>
      {menu && (
        <div className={`absolute z-30 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-800 ${mine ? 'right-0' : 'left-0'}`}>
          <button type="button" onClick={() => { setMenu(false); onReply?.(m); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700">
            <FaReply className="text-slate-400" /> Répondre
          </button>
          {!!m.content && (
            <button type="button" onClick={copy} className="flex w-full items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700">
              <FaCopy className="text-slate-400" /> Copier
            </button>
          )}
        </div>
      )}
    </div>
  );

  const bubbleCls = mine
    ? `${m._failed ? 'bg-red-100 text-red-900' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'} rounded-br-md`
    : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-bl-md';

  return (
    <div id={`msg-${m.id}`} ref={ref} className={`group flex items-end gap-1 ${mine ? 'flex-row-reverse' : ''} ${m._pending ? 'opacity-80' : ''}`}>
      {isSticker ? (
        <div className="max-w-[78%]">
          <ReplyQuote reply={m.reply_to} mine={false} onJump={onJump} />
          <StickerMessage
            imagePath={m.attachment_kind === 'video' ? null : m.attachment_path}
            videoPath={m.attachment_kind === 'video' ? m.attachment_path : null}
            time={time} isMe={mine} pending={m._pending} failed={m._failed}
            onRetry={m._failed ? () => onRetry?.(m) : null} compact={compact}
          />
        </div>
      ) : (
        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[15px] shadow-sm sm:max-w-[70%] ${bubbleCls}`}>
          <ReplyQuote reply={m.reply_to} mine={mine} onJump={onJump} />

          {m.type === 'image' && (
            <button type="button" onClick={() => onOpenMedia?.({ type: 'image', src })} className="mb-1 block overflow-hidden rounded-xl">
              <img src={src} alt="Photo" loading="lazy" className="max-h-72 w-full min-w-[160px] object-cover" />
            </button>
          )}
          {m.type === 'video' && (
            <video src={src} controls preload="metadata" playsInline className="mb-1 max-h-72 w-full min-w-[200px] rounded-xl bg-black" />
          )}
          {m.type === 'audio' && <AudioPlayer src={m.attachment_path} isMe={mine} />}

          {/* Texte brut : React échappe le contenu */}
          {!!m.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>}

          <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/75' : 'text-slate-400'}`}>
            <span>{time}</span>
            {mine && <Ticks m={m} light />}
          </div>
          {m._failed && (
            <button type="button" onClick={() => onRetry?.(m)} className="mt-1 text-xs font-bold underline">
              Échec d'envoi — Réessayer
            </button>
          )}
        </div>
      )}
      {actions}
    </div>
  );
}

export default memo(MessageBubble);
