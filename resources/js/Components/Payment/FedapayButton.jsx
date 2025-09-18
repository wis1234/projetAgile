import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/inertia-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';

const FedapayButton = ({ 
    amount, 
    description, 
    email, 
    firstname, 
    lastname, 
    className = '',
    buttonText = "Payer maintenant",
    onSuccess = () => {},
    onError = () => {},
    disabled = false
}) => {
    const buttonRef = useRef(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Vérifier si le script est déjà chargé
        if (window.FedaPay) {
            initializeFedapay();
            return;
        }

        // Charger le script FedaPay
        const script = document.createElement('script');
        script.src = 'https://checkout.fedapay.com/js/checkout.js';
        script.async = true;
        script.onload = () => {
            if (window.FedaPay) {
                initializeFedapay();
            } else {
                setError("Impossible de charger le service de paiement");
                setIsInitializing(false);
            }
        };
        script.onerror = () => {
            setError("Erreur lors du chargement du service de paiement");
            setIsInitializing(false);
        };

        document.body.appendChild(script);

        return () => {
            // Nettoyage
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const initializeFedapay = () => {
        if (!buttonRef.current) {
            setError("Erreur d'initialisation du bouton de paiement");
            setIsInitializing(false);
            return;
        }

        try {
            // Cloner le bouton pour éviter les doublons d'écouteurs
            const newButton = buttonRef.current.cloneNode(true);
            buttonRef.current.parentNode.replaceChild(newButton, buttonRef.current);
            buttonRef.current = newButton;

            // Initialiser FedaPay
            window.FedaPay.init(buttonRef.current, {
                public_key: 'pk_live_NVw62EiQ_Yu6mvPq13vuUapq',
                transaction: {
                    amount: amount,
                    description: description,
                    currency: 'XOF'
                },
                customer: {
                    email: email,
                    firstname: firstname,
                    lastname: lastname
                },
                onComplete: function() {
                    onSuccess();
                },
                onError: function(error) {
                    const errorMsg = error?.message || "Une erreur est survenue lors du paiement";
                    setError(errorMsg);
                    onError(errorMsg);
                }
            });

            setIsInitializing(false);
        } catch (err) {
            console.error("Erreur d'initialisation FedaPay:", err);
            setError("Erreur lors de l'initialisation du paiement");
            setIsInitializing(false);
        }
    };

    return (
        <>
            <Head>
                <link 
                    rel="stylesheet" 
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer" 
                />
            </Head>

            <div className={`fedapay-container ${className}`}>
                {error && (
                    <div className="text-red-500 text-sm mb-2">
                        {error}
                    </div>
                )}
                
                <button
                    ref={buttonRef}
                    className={`
                        bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full
                        transition-all duration-200 ease-in-out transform hover:-translate-y-0.5
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                        inline-flex items-center justify-center space-x-2
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={disabled || isInitializing}
                >
                    {isInitializing ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                            Chargement...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faLock} className="mr-2" />
                            {buttonText} - {amount} FCFA
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

export default FedapayButton;