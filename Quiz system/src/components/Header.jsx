import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { isAdminUser } from '@/utils/authUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutDashboard, Trophy, Settings, Shield, LogOut, Database, User, Globe, ChevronDown, FileText, Activity } from 'lucide-react';

const Header = () => {
  const { user, signOut, logoutInProgress } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async (e) => {
    e.preventDefault();
    await signOut();
  };

  const toggleLanguage = () => {
    setLanguage(currentLanguage === 'en' ? 'fr' : 'en');
  };

  const isSuperAdmin = user?.role === 'super_admin' || user?.user_metadata?.role === 'super_admin';
  const isAdmin = isAdminUser(user);

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/rankings', label: t('nav.rankings'), icon: Trophy },
    ...(isAdmin ? [{ path: '/survey-solutions', label: t('nav.surveySolutions'), icon: Database }] : []),
    { path: '/rapport', label: t('nav.rapport') || 'RAPPORT', icon: FileText },
    ...(isAdmin ? [{ path: '/admin', label: t('nav.adminPanel'), icon: Shield }] : []),
    { path: '/settings', label: t('nav.settings'), icon: Settings }
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center font-bold text-xl text-blue-600">
              <Trophy className="w-6 h-6 mr-2" />
              QUIZY
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="hidden sm:flex" title="Toggle Language">
              <Globe className="w-4 h-4 mr-2" />
              {currentLanguage.toUpperCase()}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-gray-100">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </span>
                  </div>
                  <User className="w-5 h-5 text-gray-500" />
                  {isSuperAdmin && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 ml-1">
                      👑 Super Admin
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium text-gray-500 truncate">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                {isAdmin && location.pathname.startsWith('/admin') && (
                  <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('nav.switchToUser')}
                  </DropdownMenuItem>
                )}
                {isAdmin && !location.pathname.startsWith('/admin') && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                    <Shield className="w-4 h-4 mr-2" />
                    {t('nav.switchToAdmin')}
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin/diagnostics')} className="cursor-pointer">
                    <Activity className="w-4 h-4 mr-2" />
                    Diagnostics
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={toggleLanguage} className="cursor-pointer sm:hidden">
                  <Globe className="w-4 h-4 mr-2" />
                  Language: {currentLanguage.toUpperCase()}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  disabled={logoutInProgress}
                  className={`cursor-pointer ${logoutInProgress ? 'text-gray-400' : 'text-red-600 focus:text-red-600 focus:bg-red-50'}`}
                >
                  {logoutInProgress ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Logging out...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.logout')}
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;