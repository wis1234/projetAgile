import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';

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

export const nativeStorage = {
  async get(key, fallback = null) {
    if (!isNativeApp()) return fallback;
    const { value } = await Preferences.get({ key });
    if (value === null) return fallback;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  async set(key, value) {
    if (!isNativeApp()) return;
    await Preferences.set({ key, value: JSON.stringify(value) });
  },

  async remove(key) {
    if (!isNativeApp()) return;
    await Preferences.remove({ key });
  },
};

export const nativeFeedback = {
  async tap() {
    if (isNativeApp()) await Haptics.impact({ style: ImpactStyle.Light });
  },

  async success() {
    if (isNativeApp()) await Haptics.notification({ type: NotificationType.Success });
  },
};

export const takePhoto = async () => {
  if (!isNativeApp()) return null;
  return Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt,
  });
};

export const getCurrentPosition = async () => {
  if (!isNativeApp()) return null;
  return Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
};

export const requestNativePermissions = async () => {
  if (!isNativeApp()) return {};
  const [camera, location] = await Promise.all([
    Camera.requestPermissions({ permissions: ['camera', 'photos'] }),
    Geolocation.requestPermissions(),
  ]);
  return { camera, location };
};

export const initializeNativeApp = async () => {
  if (!isNativeApp()) return () => {};

  await SplashScreen.hide();

  const backButton = await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) window.history.back();
    else if (getNativePlatform() === 'android') App.exitApp();
  });
  const appState = await App.addListener('appStateChange', ({ isActive }) => {
    window.dispatchEvent(new CustomEvent('proja:app-state', { detail: { isActive } }));
  });
  const deepLink = await App.addListener('appUrlOpen', ({ url }) => {
    window.dispatchEvent(new CustomEvent('proja:deep-link', { detail: { url } }));
  });

  return () => {
    backButton.remove();
    appState.remove();
    deepLink.remove();
  };
};