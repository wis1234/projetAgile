import { useEffect, useState } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { FaClock } from 'react-icons/fa';

export default function CountdownTimer({ deadline, onExpire, compact = false }) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false
    });

    useEffect(() => {
        if (!deadline) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const targetDate = new Date(deadline);
            const isExpired = now > targetDate;

            if (isExpired) {
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isExpired: true
                });
                if (onExpire) onExpire();
                return;
            }

            const days = differenceInDays(targetDate, now);
            const hours = differenceInHours(targetDate, now) % 24;
            const minutes = differenceInMinutes(targetDate, now) % 60;
            const seconds = differenceInSeconds(targetDate, now) % 60;

            setTimeLeft({
                days,
                hours,
                minutes,
                seconds,
                isExpired: false
            });
        };

        // Calcul initial
        calculateTimeLeft();

        // Mise à jour chaque seconde
        const timer = setInterval(calculateTimeLeft, 1000);

        // Nettoyage
        return () => clearInterval(timer);
    }, [deadline, onExpire]);

    if (!deadline) {
        return null;
    }

    if (timeLeft.isExpired) {
        return compact ? (
            <div className="text-red-600 text-xs font-medium">
                Clôturé
            </div>
        ) : (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
                <div className="flex items-center">
                    <FaClock className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700 font-medium">Date limite dépassée</p>
                </div>
            </div>
        );
    }

    if (compact) {
        // Format court pour la vue cartes
        if (timeLeft.days > 0) {
            return (
                <div className="text-blue-600 text-xs">
                    {timeLeft.days} jour{timeLeft.days > 1 ? 's' : ''} restant{timeLeft.days > 1 ? 's' : ''}
                </div>
            );
        } else if (timeLeft.hours > 0) {
            return (
                <div className="text-blue-600 text-xs">
                    {timeLeft.hours}h {timeLeft.minutes}min restantes
                </div>
            );
        } else {
            return (
                <div className="text-blue-600 text-xs">
                    Moins d'une heure restante
                </div>
            );
        }
    }

    // Vue complète
    return (
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
            <div className="flex items-center mb-2">
                <FaClock className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-sm font-medium text-blue-800">Temps restant pour postuler :</h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2 rounded shadow">
                    <div className="text-2xl font-bold text-blue-600">{timeLeft.days}</div>
                    <div className="text-xs text-gray-500">Jours</div>
                </div>
                <div className="bg-white p-2 rounded shadow">
                    <div className="text-2xl font-bold text-blue-600">{timeLeft.hours}</div>
                    <div className="text-xs text-gray-500">Heures</div>
                </div>
                <div className="bg-white p-2 rounded shadow">
                    <div className="text-2xl font-bold text-blue-600">{timeLeft.minutes}</div>
                    <div className="text-xs text-gray-500">Minutes</div>
                </div>
                <div className="bg-white p-2 rounded shadow">
                    <div className="text-2xl font-bold text-blue-600">{timeLeft.seconds}</div>
                    <div className="text-xs text-gray-500">Secondes</div>
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
                Date limite : {new Date(deadline).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        </div>
    );
}
