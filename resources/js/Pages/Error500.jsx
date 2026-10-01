import React from 'react';
import { FaCog } from 'react-icons/fa';
import ErrorScreen from '@/Components/ErrorScreen';

export default function Error500() {
    return <ErrorScreen code="500" tone="orange" icon={FaCog} retry title="Une erreur est survenue"
        text="Un problème technique est survenu de notre côté. Réessayez dans un instant ; s'il persiste, prévenez un administrateur." />;
}
