// Shim temporaire en attendant que yjs soit installé
export class Doc {
  constructor() {}
  getXmlFragment() { return {}; }
  getText() { return { toString: () => '' }; }
  on() {}
  off() {}
  destroy() {}
}
export const encodeStateAsUpdate = () => new Uint8Array();
export const applyUpdate = () => {};
export const encodeStateVector = () => new Uint8Array();
export default { Doc, encodeStateAsUpdate, applyUpdate, encodeStateVector };
