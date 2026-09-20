import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { FaEye, FaEyeSlash, FaCheckCircle, FaShieldAlt, FaSpinner, FaExclamationCircle, FaUserGraduate, FaUserTie } from 'react-icons/fa';
import useRegistration from '@/hooks/useRegistration';

const field = (err) => `h-14 w-full rounded-2xl border bg-white px-4 text-[16px] text-slate-900 shadow-sm placeholder:text-slate-400 focus:ring-2 dark:bg-slate-900 dark:text-white ${err ? 'border-red-400 bg-red-50/60 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 dark:border-slate-700'}`;
const label = 'mb-1.5 block text-[13px] font-bold text-slate-700 dark:text-slate-300';

export default function MobileRegister({ defaultRole = 'user' }) {
  const r = useRegistration(defaultRole);
  const { data, setData, errors, errorFor } = r;
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const match = data.password_confirmation && data.password === data.password_confirmation;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800" style={{ paddingTop: 'var(--safe-top)' }}>
      <Head title="Créer un compte" />
      <div className="px-6 pb-6 pt-8 text-white">
        <Link href="/" className="mb-5 flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-black">P</span><span className="text-xl font-extrabold tracking-wide">PROJA</span></Link>
        <h1 className="text-3xl font-black leading-tight">Créez votre compte</h1>
        <p className="mt-1 text-sm text-blue-100">Gérez vos projets et passez vos évaluations en quelques instants.</p>
      </div>

      <form onSubmit={r.submit} noValidate className="space-y-4 rounded-t-[32px] bg-slate-50 px-5 pb-10 pt-7 dark:bg-slate-950" style={{ paddingBottom: 'calc(2.5rem + var(--safe-bottom))' }}>
        {errors.form && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><FaExclamationCircle className="mt-0.5 flex-shrink-0" />{errors.form}</div>}

        <div>
          <span className={label}>Je m&apos;inscris en tant que</span>
          <div className="grid grid-cols-2 gap-2">
            {[['user', 'Utilisateur', FaUserTie, 'Projets, tâches, équipes'], ['candidate', 'Candidat', FaUserGraduate, 'Quiz et évaluations']].map(([v, l, Icon, hint]) => (
              <button key={v} type="button" onClick={() => setData('role', v)} className={`rounded-2xl border-2 p-3 text-left transition active:scale-[.98] ${data.role === v ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
                <Icon className={`mb-1 text-lg ${data.role === v ? 'text-blue-600' : 'text-slate-400'}`} /><p className="text-sm font-extrabold text-slate-900 dark:text-white">{l}</p><p className="text-[11px] text-slate-500">{hint}</p>
              </button>
            ))}
          </div>
          {/* Champ « select » standard conservé pour l'accessibilité / les lecteurs d'écran */}
          <select id="role" name="role" value={data.role} onChange={(e) => setData('role', e.target.value)} className="sr-only" tabIndex={-1} aria-label="Type de compte"><option value="user">Utilisateur</option><option value="candidate">Candidat</option></select>
          {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
        </div>

        <div><label htmlFor="name" className={label}>Nom complet</label>
          <input id="name" value={data.name} onChange={r.onChange('name')} onBlur={r.onBlur('name')} autoComplete="name" placeholder="Ronaldo Agbohou" className={field(errorFor('name'))} aria-invalid={!!errorFor('name')} />
          {errorFor('name') && <p className="mt-1 text-xs text-red-500">{errorFor('name')}</p>}</div>

        <div><label htmlFor="email" className={label}>Adresse email</label>
          <div className="relative"><input id="email" type="email" inputMode="email" autoCapitalize="none" value={data.email} onChange={r.onChange('email')} onBlur={r.onBlur('email')} autoComplete="username" placeholder="vous@entreprise.com" className={`${field(errorFor('email'))} pr-11`} aria-invalid={!!errorFor('email')} />
            {r.emailOk && !errorFor('email') && <FaCheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}</div>
          {errorFor('email') && <p className="mt-1 text-xs text-red-500">{errorFor('email')}</p>}
          {r.emailSuggestion && !errorFor('email') && <p className="mt-1 text-xs text-amber-600">Vouliez-vous dire <button type="button" className="font-bold underline" onClick={() => setData('email', r.emailSuggestion)}>{r.emailSuggestion}</button> ?</p>}</div>

        <div><label htmlFor="password" className={label}>Mot de passe</label>
          <div className="relative"><input id="password" type={show ? 'text' : 'password'} value={data.password} onChange={r.onChange('password')} onBlur={r.onBlur('password')} autoComplete="new-password" placeholder="8 caractères minimum" className={`${field(errorFor('password'))} pr-12`} aria-invalid={!!errorFor('password')} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400" aria-label="Afficher le mot de passe">{show ? <FaEyeSlash /> : <FaEye />}</button></div>
          {data.password && <div className="mt-2 flex items-center gap-2"><div className="flex flex-1 gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= r.strength.score ? r.strength.color : 'bg-slate-200'}`} />)}</div><span className="text-[11px] font-bold text-slate-500">{r.strength.label}</span></div>}
          {errorFor('password') && <p className="mt-1 text-xs text-red-500">{errorFor('password')}</p>}</div>

        <div><label htmlFor="password_confirmation" className={label}>Confirmer le mot de passe</label>
          <div className="relative"><input id="password_confirmation" type={show2 ? 'text' : 'password'} value={data.password_confirmation} onChange={r.onChange('password_confirmation')} onBlur={r.onBlur('password_confirmation')} autoComplete="new-password" placeholder="Ressaisissez le mot de passe" className={`${field(errorFor('password_confirmation'))} pr-12`} aria-invalid={!!errorFor('password_confirmation')} />
            <button type="button" onClick={() => setShow2((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400" aria-label="Afficher la confirmation">{show2 ? <FaEyeSlash /> : <FaEye />}</button></div>
          {match && !errorFor('password_confirmation') && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600"><FaCheckCircle /> Les mots de passe correspondent</p>}
          {errorFor('password_confirmation') && <p className="mt-1 text-xs text-red-500">{errorFor('password_confirmation')}</p>}</div>

        <div ref={r.captchaBox} className={`rounded-2xl border p-3.5 ${r.recaptchaError || errors.recaptcha_token ? 'border-red-300 bg-red-50/60' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"><FaShieldAlt className="text-slate-400" /> Vérification de sécurité{data.recaptcha_token && <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600"><FaCheckCircle /> Validée</span>}</div>
          <div id="recaptcha-element" className="max-w-full overflow-x-auto" />
          {!r.captchaLoaded && !r.recaptchaError && <p className="mt-2 flex items-center gap-2 text-sm text-amber-600"><FaSpinner className="animate-spin" />{r.captchaSlow ? 'Le chargement est plus long que prévu…' : 'Chargement de la vérification…'}</p>}
          {(r.recaptchaError || errors.recaptcha_token) && <p role="alert" className="mt-2 text-sm text-red-600">{r.recaptchaError || errors.recaptcha_token}</p>}
          {(!r.captchaLoaded || r.captchaSlow) && <button type="button" onClick={r.retryCaptcha} className="mt-2 text-sm font-bold text-blue-600 underline">Réessayer</button>}
        </div>

        <button type="submit" disabled={r.processing} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/30 transition active:scale-[.98] disabled:opacity-70">
          {r.processing ? <><FaSpinner className="animate-spin" /> Création de votre compte…</> : 'Créer mon compte'}
        </button>
        <p className="text-center text-sm text-slate-500">Déjà inscrit ? <Link href={route('login')} className="font-extrabold text-blue-600">Se connecter</Link></p>
      </form>
    </div>
  );
}
