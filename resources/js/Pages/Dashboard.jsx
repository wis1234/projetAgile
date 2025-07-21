import React from 'react';
import AdminLayout from '../Layouts/AdminLayout';
import { Link, usePage } from '@inertiajs/react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { FaChartLine, FaUsers, FaTasks, FaProjectDiagram, FaFileAlt, FaComments, FaShieldAlt, FaUserFriends } from 'react-icons/fa';
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
      <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900 rounded-none shadow-none p-0 m-0">
        {/* Contenu principal */}
        <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0">
          <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-gray-900">
            {/* Header section */}
            <div className="flex items-center gap-3 mb-8">
              <FaChartLine className="text-3xl text-blue-600" />
              <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">ProjA - Tableau de bord</h1>
            </div>

            {/* Widgets statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Widget title="Tâches" count={stats.tasks} color="bg-blue-100 dark:bg-blue-900" link="/tasks" icon={<FaTasks className="text-2xl" />} />
              <Widget title="Sprints" count={stats.sprints} color="bg-green-100 dark:bg-green-900" link="/sprints" icon="🏁" />
              <Widget title="Projets" count={stats.projects} color="bg-yellow-100 dark:bg-yellow-900" link="/projects" icon={<FaProjectDiagram className="text-2xl" />} />
              <Widget title="Utilisateurs" count={stats.users} color="bg-purple-100 dark:bg-purple-900" link="/users" icon={<FaUsers className="text-2xl" />} />
              <Widget title="Fichiers" count={stats.files ?? '-'} color="bg-gray-100 dark:bg-gray-800" link="/files" icon={<FaFileAlt className="text-2xl" />} />
              <Widget title="Messages" count={stats.messages ?? '-'} color="bg-pink-100 dark:bg-pink-900" link="/messages" icon={<FaComments className="text-2xl" />} />
              <Widget title="Audit Logs" count={stats.auditLogs ?? '-'} color="bg-orange-100 dark:bg-orange-900" link="/audit-logs" icon={<FaShieldAlt className="text-2xl" />} />
              <Widget title="Membres" count={stats.members ?? '-'} color="bg-cyan-100 dark:bg-cyan-900" link="/project-users" icon={<FaUserFriends className="text-2xl" />} />
            </div>

            {/* Graphiques et accès rapide */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-200 flex items-center gap-2">
                  <FaChartLine /> Activité sur 30 jours
                </h2>
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
              <QuickAccess />
            </div>

            {/* Graphiques statistiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-200">Top utilisateurs actifs</h2>
                <Bar data={{
                  labels: topUserLabels,
                  datasets: [{
                    label: 'Actions',
                    data: topUserCounts,
                    backgroundColor: 'rgba(16,185,129,0.7)',
                  }],
                }} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: true } } }} height={120} />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-200">Répartition des tâches par statut</h2>
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

            {/* Fichiers et rapports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-200">Fichiers par type</h2>
                <Bar data={{
                  labels: Object.keys(filesByType),
                  datasets: [{
                    label: 'Fichiers',
                    data: Object.values(filesByType),
                    backgroundColor: ['#f472b6', '#f87171', '#60a5fa', '#34d399', '#a78bfa'],
                  }],
                }} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: true } } }} height={120} />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-200">Rapports</h2>
                <div className="flex gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2" onClick={() => alert('Export PDF à venir !')}>Exporter PDF</button>
                  <a href="/activities/export" target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2">Exporter Excel</a>
                </div>
              </div>
            </div>

            {/* Activités récentes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-200">Activités récentes</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700">
                    <tr>
                      <th className="p-3 text-left font-bold">Utilisateur</th>
                      <th className="p-3 text-left font-bold">Action</th>
                      <th className="p-3 text-left font-bold">Projet</th>
                      <th className="p-3 text-left font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-400 dark:text-gray-500 text-lg font-semibold">
                          Aucune activité récente.
                        </td>
                      </tr>
                    ) : recentActivities.map(a => (
                      <tr key={a.id} className="hover:bg-blue-50 dark:hover:bg-blue-900 transition">
                        <td className="p-3 font-semibold text-blue-700 dark:text-blue-300">{a.user?.name || 'Système'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-200">{a.action}</td>
                        <td className="p-3 text-gray-500 dark:text-gray-400">{a.project ? <span className="font-semibold">{a.project.name}</span> : '-'}</td>
                        <td className="p-3 text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
Dashboard.layout = page => <AdminLayout children={page} />;
export default Dashboard;

function Widget({ title, count, color, link, icon }) {
  return (
    <Link href={link} className={`rounded-lg shadow p-4 flex flex-col items-center ${color} hover:scale-105 transition group` }>
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-200">
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1 text-blue-800 dark:text-blue-100">{count ?? '-'}</div>
      <div className="text-sm font-semibold text-blue-700 dark:text-blue-200">{title}</div>
    </Link>
  );
}

function QuickAccess() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-200">Accès rapide</h2>
      <div className="flex flex-col gap-3">
        <Link href="/tasks/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded shadow text-center font-semibold transition">Nouvelle tâche</Link>
        <Link href="/sprints/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded shadow text-center font-semibold transition">Nouveau sprint</Link>
        <Link href="/projects/create" className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded shadow text-center font-semibold transition">Nouveau projet</Link>
        <Link href="/files/create" className="bg-gray-700 hover:bg-gray-900 text-white px-4 py-3 rounded shadow text-center font-semibold transition">Nouveau fichier</Link>
        <Link href="/messages/create" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded shadow text-center font-semibold transition">Nouveau message</Link>
      </div>
    </div>
  );
}
