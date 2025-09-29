import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { 
  FaMoneyBillWave, 
  FaClock, 
  FaTasks, 
  FaGift, 
  FaHistory,
  FaArrowRight,
  FaUsers,
  FaUserFriends,
  FaArrowLeft
} from 'react-icons/fa';

const RemunerationDashboard = ({ stats, recentRemunerations, isAdmin = false }) => {
  return (
    <>
      <Head title="Tableau de bord des rémunérations" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link 
            href={route('dashboard')} 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Tableau de bord des rémunérations
        </h1>
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title={isAdmin ? "Total versé" : "Total gagné"} 
            value={`${stats.total_earned.toLocaleString('fr-FR')} XOF`} 
            icon={<FaMoneyBillWave className="h-6 w-6 text-green-500" />}
            color="green"
          />
          
          <StatCard 
            title={isAdmin ? "Total en attente" : "En attente"} 
            value={`${stats.pending_amount.toLocaleString('fr-FR')} XOF`} 
            icon={<FaClock className="h-6 w-6 text-yellow-500" />}
            color="yellow"
          />
          
          {isAdmin ? (
            <StatCard 
              title="Utilisateurs actifs" 
              value={stats.active_users || 0} 
              icon={<FaUsers className="h-6 w-6 text-blue-500" />}
              color="blue"
            />
          ) : (
            <StatCard 
              title="Tâches terminées" 
              value={stats.completed_tasks || 0} 
              icon={<FaTasks className="h-6 w-6 text-blue-500" />}
              color="blue"
            />
          )}
          
          {isAdmin ? (
            <StatCard 
              title="Total utilisateurs" 
              value={stats.user_count || 0} 
              icon={<FaUserFriends className="h-6 w-6 text-purple-500" />}
              color="purple"
            />
          ) : (
            <StatCard 
              title="Bonus reçus" 
              value={stats.bonuses || 0} 
              icon={<FaGift className="h-6 w-6 text-purple-500" />}
              color="purple"
            />
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dernières rémunérations */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {isAdmin ? 'Dernières rémunérations' : 'Mes dernières rémunérations'}
                  </h3>
                  <Link 
                    href={isAdmin ? route('remunerations.index') : '#'}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                  >
                    Voir tout
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentRemunerations.length > 0 ? (
                  recentRemunerations.map((remuneration) => (
                    <div key={remuneration.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {remuneration.task?.title || 'Tâche supprimée'}
                            </h4>
                            {isAdmin && remuneration.user && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {remuneration.user.name}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(remuneration.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600 dark:text-green-400">
                            +{parseFloat(remuneration.amount).toLocaleString('fr-FR')} XOF
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            remuneration.status === 'paid' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : remuneration.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {remuneration.status === 'paid' ? 'Payé' : 
                             remuneration.status === 'pending' ? 'En attente' : 'Annulé'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune rémunération récente
                  </div>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right border-t border-gray-200 dark:border-gray-700">
                <Link 
                  href={route('remunerations.index')} 
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  Voir tout <FaArrowRight className="ml-1 w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Actions rapides */}
          <div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Actions rapides
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <Link 
                  href={route('remunerations.index', { status: 'pending' })}
                  className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">Voir les paiements en attente</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {stats.pending_amount > 0 
                      ? `${stats.pending_amount.toLocaleString('fr-FR')} XOF en attente` 
                      : 'Aucun paiement en attente'}
                  </p>
                </Link>
                
                <Link 
                  href={route('tasks.index', { filter: 'my_tasks', status: 'completed' })}
                  className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">Tâches terminées</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {stats.completed_tasks} tâches terminées
                  </p>
                </Link>
                
                <Link 
                  href={route('profile.bank-details')}
                  className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">Mettre à jour vos informations bancaires</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Assurez-vous que vos coordonnées bancaires sont à jour
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, icon, color }) {
  const bgColors = {
    green: 'bg-green-100 dark:bg-green-900/30',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
  };
  
  const textColors = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${bgColors[color]}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className={`text-2xl font-semibold ${textColors[color]}`}>
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

RemunerationDashboard.layout = page => <AdminLayout>{page}</AdminLayout>;

export default RemunerationDashboard;
