import React from 'react';
import { Link } from '@inertiajs/react';

export default function GlobalFooter({ className = '' }) {
    return (
        <div className={`w-full text-center py-6 ${className}`}>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                &copy; {new Date().getFullYear()} ProJA - Tous droits réservés.
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
                <Link href={route('about')} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition">À propos</Link>
                <Link href={route('contact')} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition">Contact</Link>
                <Link href={route('privacy.policy')} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition">Politique de confidentialité</Link>
                <Link href={route('terms.of.service')} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition">Conditions d'utilisation</Link>
            </div>
        </div>
    );
}
