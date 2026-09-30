import { zlibSync } from 'fflate';

/**
 * Encodeur APNG (PNG animé) : transparence complète (alpha 8 bits), lisible par toutes les balises <img>
 * modernes (Chrome, Firefox, Safari, Edge, Android, iOS) — c'est ce qui permet des stickers qui bougent
 * SANS fond, comme sur WhatsApp, sans ffmpeg côté serveur.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const u32 = (n) => new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
const u16 = (n) => new Uint8Array([(n >>> 8) & 255, n & 255]);

const concat = (parts) => {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  parts.forEach((p) => { out.set(p, o); o += p.length; });
  return out;
};

const chunk = (type, data) => {
  const typeBytes = new Uint8Array([...type].map((c) => c.charCodeAt(0)));
  const body = concat([typeBytes, data]);
  return concat([u32(data.length), body, u32(crc32(body))]);
};

/** Filtre « Sub » (type 1) : améliore nettement la compression des aplats / dégradés. */
const filterSub = (rgba, w, h) => {
  const stride = w * 4;
  const out = new Uint8Array((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (stride + 1);
    out[row] = 1;
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? rgba[y * stride + x - 4] : 0;
      out[row + 1 + x] = (rgba[y * stride + x] - left) & 255;
    }
  }
  return out;
};

/**
 * @param {Uint8ClampedArray[]|Uint8Array[]} frames  pixels RGBA (w*h*4) de chaque image
 * @param {number} w largeur
 * @param {number} h hauteur
 * @param {number} delayMs durée d'une image en millisecondes
 * @returns {Uint8Array} fichier .png animé
 */
export function encodeAPNG(frames, w, h, delayMs = 50) {
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = concat([u32(w), u32(h), new Uint8Array([8, 6, 0, 0, 0])]); // 8 bits, RGBA
  const parts = [sig, chunk('IHDR', ihdr), chunk('acTL', concat([u32(frames.length), u32(0)]))]; // 0 = boucle infinie

  let seq = 0;
  frames.forEach((px, i) => {
    const fctl = concat([
      u32(seq++), u32(w), u32(h), u32(0), u32(0),
      u16(Math.max(1, Math.round(delayMs))), u16(1000),   // délai = delayMs / 1000 s
      new Uint8Array([1, 0]),                               // dispose = fond transparent, blend = source
    ]);
    parts.push(chunk('fcTL', fctl));

    const z = zlibSync(filterSub(px, w, h), { level: 6 });
    if (i === 0) {
      parts.push(chunk('IDAT', z));
    } else {
      parts.push(chunk('fdAT', concat([u32(seq++), z])));
    }
  });

  parts.push(chunk('IEND', new Uint8Array(0)));
  return concat(parts);
}
