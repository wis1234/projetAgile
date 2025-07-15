import AdminLayout from '../../Layouts/AdminLayout';

export default function Show() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Détail d'activité</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">Le détail des activités est désormais consultable dans le <b>Journal d'activité</b>.<br/>Utilisez le menu "Journal d'activité" pour voir toutes les actions détaillées.</p>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />; 