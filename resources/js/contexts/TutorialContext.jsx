import React, { createContext, useContext, useState, useEffect } from 'react';

const TutorialContext = createContext();

export function TutorialProvider({ children }) {
    const [showTutorials, setShowTutorials] = useState(true);
    const [completedTutorials, setCompletedTutorials] = useState({});

    // Charger l'état des tutoriaux depuis le stockage local
    useEffect(() => {
        const savedShowTutorials = localStorage.getItem('show_tutorials');
        if (savedShowTutorials !== null) {
            setShowTutorials(savedShowTutorials === 'true');
        }
        
        const savedCompletedTutorials = localStorage.getItem('completed_tutorials');
        if (savedCompletedTutorials) {
            setCompletedTutorials(JSON.parse(savedCompletedTutorials));
        }
    }, []);

    // Sauvegarder l'état des tutoriaux dans le stockage local
    useEffect(() => {
        localStorage.setItem('show_tutorials', showTutorials);
        localStorage.setItem('completed_tutorials', JSON.stringify(completedTutorials));
    }, [showTutorials, completedTutorials]);

    const completeTutorial = (tutorialId) => {
        setCompletedTutorials(prev => ({
            ...prev,
            [tutorialId]: true
        }));
    };

    const resetTutorial = (tutorialId) => {
        const newCompletedTutorials = { ...completedTutorials };
        delete newCompletedTutorials[tutorialId];
        setCompletedTutorials(newCompletedTutorials);
    };

    const toggleTutorials = () => {
        setShowTutorials(prev => !prev);
    };

    return (
        <TutorialContext.Provider 
            value={{
                showTutorials,
                completedTutorials,
                completeTutorial,
                resetTutorial,
                toggleTutorials
            }}
        >
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorials() {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorials must be used within a TutorialProvider');
    }
    return context;
}
