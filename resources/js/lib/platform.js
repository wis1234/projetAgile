import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';

/**
 * Pont natif -> JS pour transmettre les infos d'un appel LiveKit accepté
 * depuis IncomingCallActivity (voir CallBridgePlugin.java côté Android).
 *   - getPendingCall() : cold start, l'app vient d'être lancée par l'appel.
 *   - 'callAnswered'   : warm start, l'app tournait déjà.
 */
const CallBridge = registerPlugin('CallBridge');

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

/**
 * Construit l'URL interne de la page projet avec le flag join-call=1,
 * exactement comme le fait guestJoinPage() côté serveur (LiveKitController::guestJoinPage
 * -> redirect('/projects/' . $project_id . '?join-call=1')). On réutilise
 * ce même contrat plutôt que d'inventer une route dédiée à l'app native.
 */
const buildCallDeepLinkUrl = (projectId) =>
  `${window.location.origin}/projects/${projectId}?join-call=1`;

/**
 * Redispatche vers le mécanisme de deep-link déjà en place (écouté dans
 * app.jsx via 'proja:deep-link'), pour que router.visit() prenne le relais.
 */
const dispatchCallDeepLink = (projectId) => {
  if (!projectId) return;
  window.dispatchEvent(
    new CustomEvent('proja:deep-link', { detail: { url: buildCallDeepLinkUrl(projectId) } })
  );
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

  // Cold start : MainActivity vient d'être créée directement par
  // IncomingCallActivity suite à "Répondre" (app pas en mémoire).
  try {
    const { projectId } = await CallBridge.getPendingCall();
    dispatchCallDeepLink(projectId);
  } catch (error) {
    console.warn('[Native] CallBridge.getPendingCall indisponible:', error);
  }

  // Warm start : l'app tournait déjà quand on a appuyé sur "Répondre".
  const callAnswered = await CallBridge.addListener('callAnswered', ({ projectId }) => {
    dispatchCallDeepLink(projectId);
  });

  return () => {
    backButton.remove();
    appState.remove();
    deepLink.remove();
    callAnswered.remove();
  };
};