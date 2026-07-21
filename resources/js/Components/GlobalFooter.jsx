import React from 'react';
import { Link } from '@inertiajs/react';

export default function GlobalFooter({ className = '' }) {
    return (
        <div className={`w-full border-t border-gray-100 dark:border-gray-800 py-3 ${className}`}>
            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center sm:gap-3">
                <span className="text-xs tracking-wide text-gray-400 dark:text-gray-500">
                    &copy; {new Date().getFullYear()} ProJA
                </span>

                <span className="hidden sm:inline text-gray-300 dark:text-gray-700">•</span>

                <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    <Link href={route('about')} className="text-xs font-medium tracking-wide text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        À propos
                    </Link>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <Link href={route('contact')} className="text-xs font-medium tracking-wide text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        Contact
                    </Link>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <Link href={route('privacy.policy')} className="text-xs font-medium tracking-wide text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        Confidentialité
                    </Link>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <Link href={route('terms.of.service')} className="text-xs font-medium tracking-wide text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        Conditions
                    </Link>
                </nav>
            </div>
        </div>
    );
}