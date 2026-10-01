import React from 'react';
import { FaSearch } from 'react-icons/fa';
import ErrorScreen from '@/Components/ErrorScreen';

export default function Error404() {
    return <ErrorScreen code="404" icon={FaSearch} title="Page introuvable"
        text="La page demandée n'existe pas ou n'existe plus. Vérifiez l'adresse ou revenez à l'accueil." />;
}
