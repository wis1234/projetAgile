import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowDown, FaArrowUp, FaChartLine, FaCheck, FaSave, FaShieldAlt, FaUsers } from 'react-icons/fa';

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

async function save(url, body) {
  const response = await fetch(url, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Enregistrement impossible.');
  return data;
}

function Stat({ label, value, detail }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value ?? 0}</p>{detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}</div>;
}

export default function AssistantAdmin({ settings: initialSettings, providers, transcriptionProviders = [], stats, users: initialUsers }) {
  const [settings, setSettings] = useState(initialSettings);
  const [users, setUsers] = useState(initialUsers.map((user) => ({ ...user, draftLimit: user.daily_limit ?? '', draftEnabled: user.enabled })));
  const [saving, setSaving] = useState(false);
  const [savingUser, setSavingUser] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const moveProvider = (index, offset) => {
    const next = [...settings.provider_order];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSettings((current) => ({ ...current, provider_order: next }));
  };

  const toggleProvider = (name) => {
    setSettings((current) => ({
      ...current,
      enabled_providers: current.enabled_providers.includes(name)
        ? current.enabled_providers.filter((provider) => provider !== name)
        : [...current.enabled_providers, name],
    }));
  };

  const saveSettings = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try { const data = await save('/assistant/admin/settings', settings); setNotice(data.message); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const saveUser = async (user) => {
    setSavingUser(user.id); setError(''); setNotice('');
    try {
      const data = await save(`/assistant/admin/users/${user.id}`, { daily_limit: user.draftLimit === '' ? null : Number(user.draftLimit), enabled: user.draftEnabled });
      setNotice(`${user.name} : ${data.message}`);
    } catch (e) { setError(e.message); }
    finally { setSavingUser(null); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <Head title="Administration de l’assistant IA" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-semibold text-blue-600">ProJA · Administration</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Usage de l’assistant IA</h1><p className="mt-1 text-sm text-slate-500">Suivez la consommation, gérez les quotas et configurez les fournisseurs de secours.</p></div>
        <Link href="/assistant" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Retour au chat</Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Requêtes aujourd’hui" value={stats.requests_today} detail="Toutes tentatives incluses" />
        <Stat label="Transcriptions vocales" value={stats.transcriptions_today} detail="Service audio serveur" />
        <Stat label="Réponses réussies" value={stats.success_today} />
        <Stat label="Échecs aujourd’hui" value={stats.errors_today} />
        <Stat label="Requêtes sur 7 jours" value={stats.requests_7d} />
      </section>

      {(notice || error) && <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>{error || notice}</div>}

      <form onSubmit={saveSettings} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><FaShieldAlt /></span><div><h2 className="font-bold text-slate-900 dark:text-white">Configuration globale</h2><p className="text-sm text-slate-500">Les secrets API restent dans l’environnement serveur et ne sont jamais affichés ici.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium dark:border-slate-700"><input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />Assistant activé</label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Quota par défaut / jour<input type="number" min="0" max="10000" value={settings.daily_limit} onChange={(e) => setSettings({ ...settings, daily_limit: Number(e.target.value) })} className="mt-1 block w-full rounded-xl border-slate-300 dark:border-slate-600 dark:bg-slate-900" /></label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Jetons maximum / réponse<input type="number" min="128" max="32000" value={settings.max_tokens} onChange={(e) => setSettings({ ...settings, max_tokens: Number(e.target.value) })} className="mt-1 block w-full rounded-xl border-slate-300 dark:border-slate-600 dark:bg-slate-900" /></label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Délai fournisseur (secondes)<input type="number" min="10" max="300" value={settings.timeout} onChange={(e) => setSettings({ ...settings, timeout: Number(e.target.value) })} className="mt-1 block w-full rounded-xl border-slate-300 dark:border-slate-600 dark:bg-slate-900" /></label>
        </div>
        <div className="mt-5"><h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Modèles autorisés et ordre de secours</h3><p className="mb-3 mt-1 text-xs text-slate-500">Seuls les modèles cochés peuvent répondre aux utilisateurs. Si un modèle actif échoue, ProJA essaie le suivant parmi les modèles cochés. Les clés API restent dans la configuration serveur.</p>
          <div className="space-y-2">{settings.provider_order.map((name, index) => { const provider = providers.find((item) => item.name === name); const checked = settings.enabled_providers.includes(name); return <div key={name} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 dark:border-slate-700 ${checked ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-500/5' : 'border-slate-200'}`}><label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" checked={checked} onChange={() => toggleProvider(name)} aria-label={`Autoriser le modèle ${provider?.model || name}`} className="rounded text-blue-600 focus:ring-blue-500" /><span className="min-w-0"><span className="block text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">{name}</span><span className="block truncate text-xs text-slate-500">{provider?.model || 'Modèle non configuré'}</span></span></label><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${provider?.available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>{provider?.available ? 'Clé configurée' : 'Clé manquante'}</span><span className={`w-16 text-right text-[10px] font-bold ${checked ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400'}`}>{checked ? 'ACTIF' : 'INACTIF'}</span><span className="text-xs font-bold text-slate-400">{index + 1}</span><button type="button" onClick={() => moveProvider(index, -1)} disabled={index === 0} aria-label={`Monter ${name}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"><FaArrowUp /></button><button type="button" onClick={() => moveProvider(index, 1)} disabled={index === settings.provider_order.length - 1} aria-label={`Descendre ${name}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"><FaArrowDown /></button></div>; })}</div>
        </div>
        <button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><FaSave />{saving ? 'Enregistrement…' : 'Enregistrer la configuration'}</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="font-bold text-slate-900 dark:text-white">Transcription vocale côté serveur</h2>
        <p className="mt-1 text-sm text-slate-500">L’audio est transmis au fournisseur configuré puis converti en texte avant d’être envoyé au chat. Aucun service de reconnaissance vocale du navigateur n’est utilisé.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{transcriptionProviders.map((provider) => <div key={provider.name} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"><div><p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">{provider.name}</p><p className="text-xs text-slate-500">{provider.model}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${provider.available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>{provider.available ? 'Clé configurée' : 'Clé manquante'}</span></div>)}</div>
        {!transcriptionProviders.some((provider) => provider.available) && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Configurez CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_AI_API_TOKEN pour utiliser le quota gratuit, ou ajoutez une clé Groq/OpenAI côté serveur.</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-700"><FaUsers className="text-blue-600" /><div><h2 className="font-bold text-slate-900 dark:text-white">Quotas et accès par utilisateur</h2><p className="text-sm text-slate-500">Laissez le quota vide pour appliquer le quota global.</p></div><FaChartLine className="ml-auto text-slate-400" /></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/60"><tr><th className="px-5 py-3">Utilisateur</th><th className="px-4 py-3">Requêtes aujourd’hui</th><th className="px-4 py-3">Quota / jour</th><th className="px-4 py-3">Accès</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{users.map((user) => <tr key={user.id}><td className="px-5 py-3"><p className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></td><td className="px-4 py-3 tabular-nums">{user.requests_today} / {user.effective_limit}</td><td className="px-4 py-3"><input aria-label={`Quota journalier de ${user.name}`} type="number" min="0" max="10000" placeholder={`Global (${settings.daily_limit})`} value={user.draftLimit} onChange={(e) => setUsers((current) => current.map((row) => row.id === user.id ? { ...row, draftLimit: e.target.value } : row))} className="w-32 rounded-lg border-slate-300 text-sm dark:border-slate-600 dark:bg-slate-900" /></td><td className="px-4 py-3"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={user.draftEnabled} onChange={(e) => setUsers((current) => current.map((row) => row.id === user.id ? { ...row, draftEnabled: e.target.checked } : row))} className="rounded text-blue-600 focus:ring-blue-500" /><span className="text-xs">{user.draftEnabled ? 'Actif' : 'Désactivé'}</span></label></td><td className="px-5 py-3"><button onClick={() => saveUser(user)} disabled={savingUser === user.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">{savingUser === user.id ? '…' : <><FaCheck /> Enregistrer</>}</button></td></tr>)}</tbody></table></div>
        {users.length >= 500 && <p className="p-4 text-xs text-slate-500">Affichage limité aux 500 premiers utilisateurs.</p>}
      </section>
    </div>
  );
}

AssistantAdmin.layout = (page) => <AdminLayout>{page}</AdminLayout>;
