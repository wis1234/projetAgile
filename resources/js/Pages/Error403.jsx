import React from 'react';
import { FaLock } from 'react-icons/fa';
import ErrorScreen from '@/Components/ErrorScreen';

export default function Error403({ message }) {
    return <ErrorScreen code="403" tone="red" icon={FaLock} title="Accès refusé"
        text={message || "Vous n'avez pas l'autorisation d'accéder à cette page. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur."} />;
}
