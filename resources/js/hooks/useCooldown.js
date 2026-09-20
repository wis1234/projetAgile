import { useCallback, useEffect, useState } from 'react';

/**
 * Compte à rebours (secondes) pour bloquer temporairement un bouton (ex. « Renvoyer l'e-mail »).
 *   const { seconds, start } = useCooldown(60);
 */
export default function useCooldown(initial = 0) {
    const [seconds, setSeconds] = useState(initial);

    useEffect(() => {
        if (seconds <= 0) return undefined;
        const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds]);

    const start = useCallback((value = 60) => setSeconds(value), []);

    return { seconds, start, active: seconds > 0 };
}
