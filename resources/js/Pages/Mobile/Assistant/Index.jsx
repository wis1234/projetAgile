import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import AssistantPanel from '@/Components/Assistant/AssistantPanel';

/** Assistant IA en plein écran (application mobile). */
export default function MobileAssistant() {
  const { ai } = usePage().props;
  return (
    <MobileLayout hideHeader hideBottomNav fullBleed>
      <Head title="Assistant IA" />
      {ai?.enabled ? (
        <div className="h-full"><AssistantPanel variant="page-mobile" onClose={() => window.history.back()} /></div>
      ) : (
        <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-500">
          L’assistant n’est pas encore activé. Contactez un administrateur.
        </div>
      )}
    </MobileLayout>
  );
}
