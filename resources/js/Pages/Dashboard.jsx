import React from 'react';
import AdminLayout from '../Layouts/AdminLayout';
import { Link, usePage } from '@inertiajs/react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

function Dashboard({ stats = {}, activityByDay = [], topUsers = [], recentActivities = [] }) {
  // Préparation des données pour les graphiques
  const activityLabels = activityByDay.map(a => a.day);
  const activityCounts = activityByDay.map(a => a.count);
  const topUserLabels = topUsers.map(u => u.name);
  const topUserCounts = topUsers.map(u => u.count);

  // Simulation de stats par statut et par type si non fournis
  const tasksByStatus = stats.tasksByStatus || { todo: 12, in_progress: 7, done: 21 };
  const filesByType = stats.filesByType || { image: 8, pdf: 5, doc: 3, excel: 2, autre: 6 };

  return (
    <>
      {/* Suppression du header personnalisé, on laisse le header global gérer l'affichage du nom du projet */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Widget title="Tâches" count={stats.tasks} color="bg-blue-100 dark:bg-blue-900" link="/tasks" icon="📝" />
        <Widget title="Sprints" count={stats.sprints} color="bg-green-100 dark:bg-green-900" link="/sprints" icon="🏁" />
        <Widget title="Projets" count={stats.projects} color="bg-yellow-100 dark:bg-yellow-900" link="/projects" icon="📁" />
        <Widget title="Utilisateurs" count={stats.users} color="bg-purple-100 dark:bg-purple-900" link="#" icon="👤" />
        <Widget title="Fichiers" count={stats.files ?? '-'} color="bg-gray-100 dark:bg-gray-800" link="/files" icon="📄" />
        <Widget title="Messages" count={stats.messages ?? '-'} color="bg-pink-100 dark:bg-pink-900" link="/messages" icon="💬" />
        <Widget title="Audit Logs" count={stats.auditLogs ?? '-'} color="bg-orange-100 dark:bg-orange-900" link="/audit-logs" icon="🕵️" />
        <Widget title="Membres" count={stats.members ?? '-'} color="bg-cyan-100 dark:bg-cyan-900" link="/project-users" icon="👥" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <QuickAccess />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-200">Activité sur 30 jours</h2>
          <Line data={{
            labels: activityLabels,
            datasets: [{
              label: 'Actions',
              data: activityCounts,
              fill: true,
              backgroundColor: 'rgba(59,130,246,0.1)',
              borderColor: 'rgba(59,130,246,1)',
              tension: 0.3,
            }],
          }} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: true } } }} height={120} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-200">Top utilisateurs actifs</h2>
          <Bar data={{
            labels: topUserLabels,
            datasets: [{
              label: 'Actions',
              data: topUserCounts,
              backgroundColor: 'rgba(16,185,129,0.7)',
            }],
          }} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: true } } }} height={120} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-200">Répartition des tâches par statut</h2>
          <Pie data={{
            labels: ['À faire', 'En cours', 'Terminées'],
            datasets: [{
              data: [tasksByStatus.todo, tasksByStatus.in_progress, tasksByStatus.done],
              backgroundColor: ['#60a5fa', '#fbbf24', '#22c55e'],
              borderWidth: 1,
            }],
          }} options={{ responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } } }} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-200">Fichiers par type</h2>
          <Bar data={{
            labels: Object.keys(filesByType),
            datasets: [{
              label: 'Fichiers',
              data: Object.values(filesByType),
              backgroundColor: ['#f472b6', '#f87171', '#60a5fa', '#34d399', '#a78bfa'],
            }],
          }} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: true } } }} height={120} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col gap-4 items-center justify-center">
          <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-200">Rapports</h2>
          <div className="flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2" onClick={() => alert('Export PDF à venir !')}>Exporter PDF</button>
            <a href="/activities/export" target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2">Exporter Excel</a>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-200">Activités récentes</h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivities.length === 0 && <li className="text-gray-500 dark:text-gray-300">Aucune activité récente.</li>}
            {recentActivities.map(a => (
              <li key={a.id} className="py-2 flex flex-col md:flex-row md:items-center md:gap-2">
                <span className="font-semibold text-blue-700 dark:text-blue-300">{a.user?.name || 'Système'}</span>
                <span className="text-gray-600 dark:text-gray-200">{a.action}</span>
                {a.project && <span className="text-gray-500 dark:text-gray-400">sur <span className="font-semibold">{a.project.name}</span></span>}
                <span className="text-xs text-gray-400 ml-auto">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
Dashboard.layout = page => <AdminLayout children={page} />;
export default Dashboard;

function Widget({ title, count, color, link, icon }) {
  return (
    <Link href={link} className={`rounded-lg shadow p-6 flex flex-col items-center ${color} hover:scale-105 transition group` }>
      <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">{icon} {count ?? '-'}</div>
      <div className="text-lg font-semibold">{title}</div>
    </Link>
  );
}

function QuickAccess() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-200">Accès rapide</h2>
      <Link href="/tasks/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-center">Nouvelle tâche</Link>
      <Link href="/sprints/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow text-center">Nouveau sprint</Link>
      <Link href="/projects/create" className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow text-center">Nouveau projet</Link>
      <Link href="/files/create" className="bg-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded shadow text-center">Nouveau fichier</Link>
      <Link href="/messages/create" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded shadow text-center">Nouveau message</Link>
    </div>
  );
}
