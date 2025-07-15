import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaPlus, FaUser, FaUsers } from 'react-icons/fa';

function Create() {
  const { errors = {}, flash = {} } = usePage().props;
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setValues(values => ({ ...values, [e.target.id]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/users', values, {
      onSuccess: () => {
        setValues({ name: '', email: '', password: '', password_confirmation: '' });
        setLoading(false);
        setTimeout(() => router.visit('/users'), 1200);
      },
      onError: () => {
        setLoading(false);
      }
    });
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-200"><FaPlus /> Créer un membre</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold mb-1" htmlFor="name">Nom</label>
          <input type="text" id="name" value={values.name} onChange={handleChange} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" required />
          {errors.name && <div className="text-error text-sm mt-1">{errors.name}</div>}
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="email">Email</label>
          <input type="email" id="email" value={values.email} onChange={handleChange} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" required />
          {errors.email && <div className="text-error text-sm mt-1">{errors.email}</div>}
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="password">Mot de passe</label>
          <input type="password" id="password" value={values.password} onChange={handleChange} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" required />
          {errors.password && <div className="text-error text-sm mt-1">{errors.password}</div>}
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="password_confirmation">Confirmer le mot de passe</label>
          <input type="password" id="password_confirmation" value={values.password_confirmation} onChange={handleChange} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" required />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="role">Rôle</label>
          <select id="role" value={values.role} onChange={handleChange} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400">
            <option value="user">Utilisateur</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && <div className="text-error text-sm mt-1">{errors.role}</div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2" disabled={loading}>{loading ? 'Création...' : <><FaPlus /> Créer</>}</button>
          <Link href="/users" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaUsers /> Retour à la liste</Link>
        </div>
      </form>
    </div>
  );
}

Create.layout = page => <AdminLayout children={page} />;
export default Create;
