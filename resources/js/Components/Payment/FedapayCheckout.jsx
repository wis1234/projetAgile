import React, { useState } from 'react';
import { FedaCheckoutButton } from 'fedapay-reactjs';
import { Inertia } from '@inertiajs/inertia';

export default function FedapayCheckout({ amount, description, onSuccess, onError, className = '' }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const PUBLIC_KEY = process.env.MIX_FEDAPAY_PUBLIC_KEY || 'pk_sandbox_XXXXXX';

    const handlePaymentComplete = (response) => {
        setLoading(false);
        
        if (response.reason === 'approved') {
            if (onSuccess) onSuccess(response.transaction);
        } else {
            const errorMsg = response.message || 'Le paiement a échoué. Veuillez réessayer.';
            setError(errorMsg);
            if (onError) onError(errorMsg);
        }
    };

    const handleError = (error) => {
        setLoading(false);
        setError('Une erreur est survenue lors du traitement du paiement.');
        if (onError) onError(error);
    };

    const checkoutOptions = {
        public_key: PUBLIC_KEY,
        transaction: {
            amount: amount * 100, // Convertir en centimes
            description: description || 'Paiement de votre abonnement',
            callback: window.location.href // URL de retour après paiement
        },
        currency: {
            iso: 'XOF'
        },
        button: {
            class: `btn btn-primary ${loading ? 'opacity-75' : ''} ${className}`,
            text: loading ? 'Traitement en cours...' : `Payer ${amount} FCFA`,
            disabled: loading
        },
        onComplete: handlePaymentComplete,
        onError: handleError
    };

    return (
        <div className="fedapay-checkout">
            <FedaCheckoutButton options={checkoutOptions} />
            {error && (
                <div className="mt-2 text-red-600 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
