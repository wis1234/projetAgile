import { Capacitor } from '@capacitor/core';

/**
 * True uniquement quand l'app tourne dans le conteneur natif Capacitor
 * (APK Android / IPA iOS) — jamais dans un navigateur mobile classique.
 * C'est CE signal, et lui seul, qui doit décider d'activer la couche Mobile UI.
 */
export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** 'ios' | 'android' | 'web' */
export const getNativePlatform = () => {
  try {
    return Capacitor.getPlatform();
  } catch {
    return 'web';
  }
};