import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                // Police principale – style Slack / Linear
                sans: ['Inter', 'Lato', 'Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Charte ProJA – Bleu foncé signature + ergonomie Slack
                proja: {
                    dark:      '#0F1E36', // Bleu nuit très foncé (fond sidebar)
                    darker:    '#0A1526', // Bleu foncé profond (header sidebar / accents)
                    border:    '#1B2E4B', // Séparateurs discrets
                    hover:     '#1A2F50', // Hover éléments
                    active:    '#203A63', // Sélection active
                    blue:      '#2563EB', // Bleu ProJA éclatant
                    lightBlue: '#38BDF8', // Accent cyan/bleu clair
                    textDim:   '#94A3B8', // Texte secondaire de la sidebar
                },
                dark: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                    950: '#030712',
                },
            },
            boxShadow: {
                'sidebar': '2px 0 8px rgba(0,0,0,0.24)',
            },
        },
    },

    plugins: [forms],
};
