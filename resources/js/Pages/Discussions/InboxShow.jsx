import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InboxThread from '@/Components/Inbox/InboxThread';

/** /inbox/{contact} — conversation privée (web). Toute la logique vit dans InboxThread (partagé avec le mobile). */
export default function InboxShow({ contactId }) {
  return (
    <>
      <Head title="Message privé" />
      <InboxThread contactId={contactId} variant="web" />
    </>
  );
}

InboxShow.layout = (page) => <AdminLayout children={page} />;
