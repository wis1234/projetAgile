import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ServerPointVerification from './ServerPointVerification';

const ServerPointTab = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="w-full">
      <ServerPointVerification user={user} t={t} />
    </div>
  );
};

export default ServerPointTab;