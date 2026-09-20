import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import toast from '@/lib/toast';

export const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const FIELD_ORDER = ['name', 'email', 'password', 'password_confirmation'];

const validators = {
  name: (v) => (!v.trim() ? 'Indiquez votre nom complet.' : v.trim().length < 2 ? 'Votre nom doit contenir au moins 2 caractères.' : ''),
  email: (v) => (!v.trim() ? 'Indiquez votre adresse email.' : !EMAIL_RX.test(v.trim()) ? "Cette adresse email n'est pas valide (exemple : nom@entreprise.com)." : ''),
  password: (v) => (!v ? 'Choisissez un mot de passe.' : v.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères.' : ''),
  password_confirmation: (v, all) => (!v ? 'Confirmez votre mot de passe.' : v !== all.password ? 'Les deux mots de passe ne correspondent pas.' : ''),
};

const TYPOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gamil.com': 'gmail.com', 'yahooo.com': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com' };

export function passwordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [{ label: 'Faible', color: 'bg-red-500' }, { label: 'Moyen', color: 'bg-amber-500' }, { label: 'Bon', color: 'bg-blue-500' }, { label: 'Excellent', color: 'bg-emerald-500' }];
  return { score, ...levels[Math.max(score - 1, 0)] };
}

/**
 * Logique d'inscription (version mobile) : validation en direct, reCAPTCHA, notifications et
 * messages d'erreur explicites. Même comportement que la page d'inscription web.
 */
export default function useRegistration(defaultRole = 'user') {
  const { data, setData, post, processing, errors, clearErrors } = useForm({ name: '', email: '', password: '', password_confirmation: '', role: defaultRole, recaptcha_token: '' });
  const widgetId = useRef(null);
  const captchaBox = useRef(null);
  const busy = useRef(false);
  const [recaptchaError, setRecaptchaError] = useState('');
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [captchaSlow, setCaptchaSlow] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const clientErrors = useMemo(() => Object.fromEntries(FIELD_ORDER.map((f) => [f, validators[f](data[f], data)]).filter(([, m]) => m)), [data]);
  const errorFor = (f) => errors[f] || ((touched[f] || submitted) ? clientErrors[f] : '') || '';
  const emailSuggestion = useMemo(() => { const [l, d] = data.email.trim().toLowerCase().split('@'); return d && TYPOS[d] ? `${l}@${TYPOS[d]}` : null; }, [data.email]);

  const onChange = (f) => (e) => { setData(f, e.target.value); if (errors[f]) clearErrors(f); if (errors.form) clearErrors('form'); };
  const onBlur = (f) => () => setTouched((t) => ({ ...t, [f]: true }));
  const focusField = (f) => { const el = document.getElementById(f); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el?.focus({ preventScroll: true }), 250); };
  const scrollCaptcha = () => captchaBox.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const onOk = useCallback((token) => { setData('recaptcha_token', token); setRecaptchaError(''); clearErrors('recaptcha_token'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const onExpired = useCallback(() => { setData('recaptcha_token', ''); setRecaptchaError('La vérification a expiré. Cochez à nouveau la case.'); toast.warning('La vérification anti-robot a expiré. Cochez à nouveau la case avant de valider.', { title: 'Vérification expirée' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const onError = useCallback(() => { setData('recaptcha_token', ''); setRecaptchaError('La vérification a rencontré une erreur. Réessayez.'); toast.error('La vérification anti-robot a rencontré une erreur. Touchez « Réessayer ».', { title: 'Vérification indisponible' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetCaptcha = () => { try { if (window.grecaptcha && widgetId.current !== null) window.grecaptcha.reset(widgetId.current); } catch { /* noop */ } setData('recaptcha_token', ''); };

  const initCaptcha = useCallback(() => {
    if (!window.grecaptcha) { setCaptchaLoaded(false); return; }
    const box = document.getElementById('recaptcha-element');
    if (box?.hasChildNodes()) { setCaptchaLoaded(true); setCaptchaSlow(false); return; }
    window.grecaptcha.ready(() => {
      try {
        widgetId.current = window.grecaptcha.render('recaptcha-element', { sitekey: window.recaptchaSiteKey || '6Lcvg8krAAAAAEoghMGKFg4jZwQkh-vYfzzYMFcN', callback: onOk, 'expired-callback': onExpired, 'error-callback': onError, theme: 'light', size: 'normal' });
        setCaptchaLoaded(true); setCaptchaSlow(false); setRecaptchaError('');
      } catch { setRecaptchaError("La vérification de sécurité n'a pas pu se charger. Réessayez."); setCaptchaLoaded(false); }
    });
  }, [onOk, onExpired, onError]);

  useEffect(() => {
    const loaded = () => initCaptcha();
    const failed = () => { setCaptchaLoaded(false); setRecaptchaError('Impossible de charger la vérification de Google. Vérifiez votre connexion.'); toast.error("La vérification anti-robot n'a pas pu se charger. Vérifiez votre connexion puis touchez « Réessayer ».", { title: 'Vérification indisponible' }); };
    if (window.grecaptcha) loaded();
    document.addEventListener('recaptcha-loaded', loaded);
    document.addEventListener('recaptcha-error', failed);
    const slow = setTimeout(() => { if (!document.getElementById('recaptcha-element')?.hasChildNodes()) { setCaptchaSlow(true); toast.warning('La vérification met du temps à se charger. Vérifiez votre connexion.', { title: 'Chargement lent' }); } }, 12000);
    const off = () => toast.warning('Connexion internet perdue.', { title: 'Hors ligne' });
    const on = () => toast.success('Connexion rétablie.', { title: 'De retour en ligne' });
    window.addEventListener('offline', off); window.addEventListener('online', on);
    return () => { clearTimeout(slow); document.removeEventListener('recaptcha-loaded', loaded); document.removeEventListener('recaptcha-error', failed); window.removeEventListener('offline', off); window.removeEventListener('online', on); };
  }, [initCaptcha]);

  const retryCaptcha = () => {
    setRecaptchaError(''); setCaptchaSlow(false);
    if (window.grecaptcha) { initCaptcha(); return; }
    const s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit'; s.async = true;
    s.onerror = () => document.dispatchEvent(new Event('recaptcha-error'));
    document.head.appendChild(s);
  };

  const serverErrors = (errs) => {
    if (errs.form) toast.error(errs.form, { title: 'Inscription impossible' });
    if (errs.recaptcha_token) { setRecaptchaError(errs.recaptcha_token); resetCaptcha(); toast.warning(errs.recaptcha_token, { title: 'Vérification anti-robot' }); scrollCaptcha(); return; }
    if (errs.email && /déjà/i.test(errs.email)) { toast.error(errs.email, { title: 'Adresse email déjà utilisée', action: { label: 'Se connecter', href: route('login') } }); focusField('email'); return; }
    const keys = Object.keys(errs).filter((k) => FIELD_ORDER.includes(k));
    if (keys.length) { toast.error(keys.length === 1 ? errs[keys[0]] : `Veuillez corriger ${keys.length} champs avant de continuer.`, { title: 'Formulaire incomplet' }); focusField(FIELD_ORDER.find((f) => keys.includes(f))); return; }
    if (!errs.form) toast.error("L'inscription n'a pas pu aboutir. Vérifiez vos informations puis réessayez.", { title: 'Inscription impossible' });
  };

  const submit = (e) => {
    e.preventDefault();
    if (processing || busy.current) return;
    setSubmitted(true); clearErrors();
    const first = FIELD_ORDER.find((f) => clientErrors[f]);
    if (first) { const n = Object.keys(clientErrors).length; toast.error(n === 1 ? clientErrors[first] : `Veuillez corriger ${n} champs avant de continuer.`, { title: 'Formulaire incomplet' }); focusField(first); return; }
    if (navigator.onLine === false) { toast.error('Vous semblez hors ligne. Vérifiez votre connexion puis réessayez.', { title: 'Connexion impossible' }); return; }
    if (!data.recaptcha_token) {
      const m = !captchaLoaded ? "La vérification anti-robot n'est pas encore chargée. Patientez ou touchez « Réessayer »." : 'Cochez la case « Je ne suis pas un robot » avant de continuer.';
      setRecaptchaError(m); toast.warning(m, { title: 'Vérification anti-robot' }); if (!captchaLoaded) initCaptcha(); scrollCaptcha(); return;
    }
    busy.current = true;
    post(route('register'), { preserveScroll: true, preserveState: true, onError: serverErrors, onFinish: () => { busy.current = false; } });
  };

  return { data, setData, errors, processing, errorFor, onChange, onBlur, emailSuggestion, submit, captchaBox, captchaLoaded, captchaSlow, recaptchaError, retryCaptcha, strength: passwordStrength(data.password), emailOk: EMAIL_RX.test(data.email.trim()) };
}
