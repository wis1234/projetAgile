// Shim temporaire pour awareness
export class Awareness {
  constructor() {}
  on() {}
  off() {}
  destroy() {}
  setLocalStateField() {}
  getStates() { return new Map(); }
}

export const encodeAwarenessUpdate = () => new Uint8Array();
export const applyAwarenessUpdate = () => {};
export const removeAwarenessStates = () => {};

export default { Awareness };
