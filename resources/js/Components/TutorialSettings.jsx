import { useState } from 'react';
import { useTutorials } from '@/contexts/TutorialContext';
import { Cog6ToothIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function TutorialSettings() {
    const { showTutorials, toggleTutorials, resetTutorial } = useTutorials();
    const [isOpen, setIsOpen] = useState(false);
    const [resetConfirm, setResetConfirm] = useState(false);

    const handleResetTutorials = () => {
        if (resetConfirm) {
            // Réinitialiser tous les tutorails
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('tutorial_')) {
                    localStorage.removeItem(key);
                }
            });
            window.location.reload();
        } else {
            setResetConfirm(true);
            setTimeout(() => setResetConfirm(false), 3000);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-40">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
                title="Paramètres des tutoriels"
            >
                <Cog6ToothIcon className="h-6 w-6 text-gray-700" />
            </button>

            {isOpen && (
                <div className="absolute bottom-16 right-0 w-64 bg-white rounded-lg shadow-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900">Aide et tutoriels</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Afficher les tutoriels</span>
                        <button
                            onClick={toggleTutorials}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${showTutorials ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                            <span
                                className={`${showTutorials ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                        <button
                            onClick={handleResetTutorials}
                            className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md ${resetConfirm ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {resetConfirm ? (
                                <>
                                    <CheckIcon className="h-4 w-4 mr-2" />
                                    Cliquez à nouveau pour confirmer
                                </>
                            ) : (
                                'Réinitialiser tous les tutoriels'
                            )}
                        </button>
                    </div>

                    <div className="pt-2 text-xs text-gray-500">
                        Les tutoriels vous guident à travers les fonctionnalités clés de l'application.
                    </div>
                </div>
            )}
        </div>
    );
}
