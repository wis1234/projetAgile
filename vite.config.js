import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        },
    },
});
