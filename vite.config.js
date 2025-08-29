import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            '@Components': path.resolve(__dirname, './resources/js/Components'),
            '@Layouts': path.resolve(__dirname, './resources/js/Layouts'),
            '@Pages': path.resolve(__dirname, './resources/js/Pages'),
            '@Hooks': path.resolve(__dirname, './resources/js/Hooks'),
            '@Utils': path.resolve(__dirname, './resources/js/Utils'),
            '@Models': path.resolve(__dirname, './resources/js/Models'),
            '@contexts': path.resolve(__dirname, './resources/js/contexts'),
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        },
    },
    // Exposer les variables d'environnement avec le préfixe VITE_
    define: {
        'import.meta.env.VITE_DROPBOX_APP_KEY': JSON.stringify(process.env.VITE_DROPBOX_APP_KEY || ''),
        'import.meta.env.VITE_DROPBOX_APP_SECRET': JSON.stringify(process.env.VITE_DROPBOX_APP_SECRET || ''),
        'import.meta.env.VITE_DROPBOX_ACCESS_TOKEN': JSON.stringify(process.env.VITE_DROPBOX_ACCESS_TOKEN || ''),
        'import.meta.env.VITE_DROPBOX_REFRESH_TOKEN': JSON.stringify(process.env.VITE_DROPBOX_REFRESH_TOKEN || '')
    },
}));
