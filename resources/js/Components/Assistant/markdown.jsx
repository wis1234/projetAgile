import React from 'react';

/** Rendu Markdown minimal et SÛR (aucun HTML brut) : **gras**, `code`, [texte](/lien-interne), listes à puces / numérotées. */
const inline = (text, key, onLink) => {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g;
  let last = 0; let m; let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={`${key}-${i}`} className="font-semibold">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={`${key}-${i}`} className="rounded bg-slate-200/70 px-1 py-0.5 font-mono text-[0.85em] dark:bg-slate-700">{tok.slice(1, -1)}</code>);
    else {
      const [, label, url] = tok.match(/^\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)$/);
      out.push(<a key={`${key}-${i}`} href={url} onClick={(e) => { e.preventDefault(); onLink?.(url); }} className="font-medium text-blue-600 underline dark:text-blue-300">{label}</a>);
    }
    last = m.index + tok.length; i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

export default function Markdown({ text = '', onLink }) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || num) {
      const kind = bullet ? 'ul' : 'ol';
      if (!list || list.kind !== kind) { flush(); list = { kind, items: [] }; }
      list.items.push((bullet || num)[1]);
    } else if (line.trim() === '') {
      flush();
    } else {
      flush();
      blocks.push({ kind: 'p', text: line });
    }
  });
  flush();

  return (
    <div className="space-y-2 break-words">
      {blocks.map((b, i) => {
        if (b.kind === 'p') return <p key={i}>{inline(b.text, i, onLink)}</p>;
        const Tag = b.kind;
        return (
          <Tag key={i} className={`${b.kind === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 pl-5`}>
            {b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`, onLink)}</li>)}
          </Tag>
        );
      })}
    </div>
  );
}
