import React from 'react';
import { Head } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import InboxThread from '@/Components/Inbox/InboxThread';

/** Conversation privée (mobile) : plein écran, sans barre basse, comme une vraie messagerie. */
export default function MobileInboxShow({ contactId }) {
  return (
    <MobileLayout hideHeader hideBottomNav fullBleed>
      <Head title="Message privé" />
      <InboxThread contactId={contactId} variant="mobile" />
    </MobileLayout>
  );
}
