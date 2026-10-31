// Shim temporaire pour awareness
export class Awareness {
  constructor() {}
  on() {}
  off() {}
  destroy() {}
  setLocalStateField() {}
  getStates() { return new Map(); }
}
export default { Awareness };
