import { unzlibSync } from 'fflate';

/**
 * Décodeur APNG minimal (RGBA 8 bits) : permet de jouer l'animation nous-mêmes sur un <canvas>
 * sans dépendre de la lecture d'APNG par la balise <img> (proxy, WebView, mode économie d'énergie…).
 * Retourne null si le fichier n'est pas un APNG exploitable (on retombe alors sur <img>).
 */
const cache = new Map();

const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u16 = (b, o) => (b[o] << 8) | b[o + 1];

function unfilter(raw, w, h) {
  const stride = w * 4;
  const out = new Uint8ClampedArray(stride * h);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? out[dst + x - 4] : 0;
      const b = y > 0 ? out[dst - stride + x] : 0;
      const c = x >= 4 && y > 0 ? out[dst - stride + x - 4] : 0;
      let add = 0;
      if (ft === 1) add = a;
      else if (ft === 2) add = b;
      else if (ft === 3) add = (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[dst + x] = (raw[src + x] + add) & 255;
    }
  }
  return out;
}

export async function loadApng(url) {
  if (cache.has(url)) return cache.get(url);
  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = new Uint8Array(await res.arrayBuffer());
      let o = 8, w = 0, h = 0, animated = false;
      const frames = [];
      let cur = null;
      while (o < buf.length) {
        const len = u32(buf, o);
        const type = String.fromCharCode(buf[o + 4], buf[o + 5], buf[o + 6], buf[o + 7]);
        const d = o + 8;
        if (type === 'IHDR') {
          w = u32(buf, d); h = u32(buf, d + 4);
          if (buf[d + 8] !== 8 || buf[d + 9] !== 6 || buf[d + 12] !== 0) return null; // RGBA 8 bits non entrelacé seulement
        } else if (type === 'acTL') animated = true;
        else if (type === 'fcTL') {
          const num = u16(buf, d + 20), den = u16(buf, d + 22) || 100;
          cur = { w: u32(buf, d + 4), h: u32(buf, d + 8), x: u32(buf, d + 12), y: u32(buf, d + 16),
            delay: Math.max(20, (num / den) * 1000), dispose: buf[d + 24], blend: buf[d + 25], data: [] };
          frames.push(cur);
        } else if (type === 'IDAT' && cur) cur.data.push(buf.subarray(d, d + len));
        else if (type === 'fdAT' && cur) cur.data.push(buf.subarray(d + 4, d + len));
        else if (type === 'IEND') break;
        o += 12 + len;
      }
      if (!animated || frames.length < 2) return null;
      const out = frames.map((f) => {
        const z = new Uint8Array(f.data.reduce((s, c) => s + c.length, 0));
        let k = 0; f.data.forEach((c) => { z.set(c, k); k += c.length; });
        const px = unfilter(unzlibSync(z), f.w, f.h);
        const c = document.createElement('canvas');
        c.width = f.w; c.height = f.h;
        c.getContext('2d').putImageData(new ImageData(px, f.w, f.h), 0, 0);
        return { canvas: c, x: f.x, y: f.y, delay: f.delay, dispose: f.dispose, blend: f.blend };
      });
      return { w, h, frames: out };
    } catch {
      return null;
    }
  })();
  cache.set(url, p);
  return p;
}
