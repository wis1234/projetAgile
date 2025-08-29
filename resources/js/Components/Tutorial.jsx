import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, LightBulbIcon } from '@heroicons/react/24/outline';

export default function Tutorial({ id, title, steps, onComplete, showTutorials = true }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Vérifier si le tutoriel a déjà été complété
    useEffect(() => {
        const tutorialCompleted = localStorage.getItem(`tutorial_${id}_completed`);
        if (tutorialCompleted === 'true') {
            setIsVisible(false);
        }
    }, [id]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        if (dontShowAgain) {
            localStorage.setItem(`tutorial_${id}_completed`, 'true');
        }
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    if (!isVisible || !showTutorials) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-700">{steps[currentStep].content}</p>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <input
                            id={`dont-show-${id}`}
                            type="checkbox"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`dont-show-${id}`} className="ml-2 text-sm text-gray-600">
                            Ne plus afficher ce tutoriel
                        </label>
                    </div>
                    <div className="flex space-x-2">
                        {currentStep > 0 && (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Précédent
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                        >
                            {currentStep === steps.length - 1 ? (
                                <>
                                    <CheckIcon className="h-4 w-4 mr-1" />
                                    J'ai compris
                                </>
                            ) : (
                                'Suivant'
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex justify-center mt-4 space-x-1">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 w-2 rounded-full ${currentStep === index ? 'bg-blue-600' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
