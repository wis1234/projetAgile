import React from 'react';

export default function Loader({ fullscreen = false }) {
    return (
        <div className={
            fullscreen
                ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-gray-900/70'
                : 'flex items-center justify-center'
        }>
            <svg className="animate-spin-slow" width="64" height="64" viewBox="0 0 64 64" fill="none">
                <defs>
                    <linearGradient id="loader-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#2563eb" />
                        <stop offset="0.5" stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#a21caf" />
                    </linearGradient>
                </defs>
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="url(#loader-gradient)"
                    strokeWidth="8"
                    fill="none"
                />
            </svg>
            <style>{`
                @keyframes spin-slow {
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 1.2s cubic-bezier(0.4,0,0.2,1) infinite;
                }
            `}</style>
        </div>
    );
} 