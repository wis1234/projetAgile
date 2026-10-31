import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const hasYjs = fs.existsSync(path.resolve(__dirname, 'node_modules/yjs'));
const hasYProtocols = fs.existsSync(path.resolve(__dirname, 'node_modules/y-protocols'));
const hasTiptapCollab = fs.existsSync(path.resolve(__dirname, 'node_modules/@tiptap/extension-collaboration'));
const hasTiptapYTiptap = fs.existsSync(path.resolve(__dirname, 'node_modules/@tiptap/y-tiptap'));
const hasTiptapTable = fs.existsSync(path.resolve(__dirname, 'node_modules/@tiptap/extension-table'));
const hasTiptapSubscript = fs.existsSync(path.resolve(__dirname, 'node_modules/@tiptap/extension-subscript'));
const hasTiptapSuperscript = fs.existsSync(path.resolve(__dirname, 'node_modules/@tiptap/extension-superscript'));
const hasFflate = fs.existsSync(path.resolve(__dirname, 'node_modules/fflate'));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    define: {
        'process.env': {},
        'import.meta.env.VITE_APP_ENV': JSON.stringify(process.env.VITE_APP_ENV || 'development'),
        'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify(process.env.VITE_RECAPTCHA_SITE_KEY || ''),
        'import.meta.env.VITE_DROPBOX_APP_KEY': JSON.stringify(process.env.VITE_DROPBOX_APP_KEY || ''),
        'import.meta.env.VITE_DROPBOX_APP_SECRET': JSON.stringify(process.env.VITE_DROPBOX_APP_SECRET || ''),
        'import.meta.env.VITE_DROPBOX_ACCESS_TOKEN': JSON.stringify(process.env.VITE_DROPBOX_ACCESS_TOKEN || ''),
        'import.meta.env.VITE_DROPBOX_REFRESH_TOKEN': JSON.stringify(process.env.VITE_DROPBOX_REFRESH_TOKEN || '')
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
            buildDirectory: 'build', // <-- génère directement dans public_html/build
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
            '@config': path.resolve(__dirname, './resources/js/config'),
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
            ...(!hasYjs ? { 'yjs': path.resolve(__dirname, './resources/js/shims/yjs.js') } : {}),
            ...(!hasYProtocols ? { 'y-protocols/awareness': path.resolve(__dirname, './resources/js/shims/y-protocols.js') } : {}),
            ...(!hasTiptapCollab ? {
                '@tiptap/extension-collaboration': path.resolve(__dirname, './resources/js/shims/tiptap-collab.js'),
                '@tiptap/extension-collaboration-caret': path.resolve(__dirname, './resources/js/shims/tiptap-collab.js'),
            } : {}),
            ...(!hasTiptapYTiptap ? {
                '@tiptap/y-tiptap': path.resolve(__dirname, './resources/js/shims/tiptap-collab.js'),
            } : {}),
            ...(!hasTiptapTable ? {
                '@tiptap/extension-table': path.resolve(__dirname, './resources/js/shims/tiptap-table.js'),
            } : {}),
            ...(!hasTiptapSubscript ? {
                '@tiptap/extension-subscript': path.resolve(__dirname, './resources/js/shims/tiptap-table.js'),
            } : {}),
            ...(!hasTiptapSuperscript ? {
                '@tiptap/extension-superscript': path.resolve(__dirname, './resources/js/shims/tiptap-table.js'),
            } : {}),
            ...(!hasFflate ? {
                'fflate': path.resolve(__dirname, './resources/js/shims/fflate.js'),
            } : {}),
        },
    },
    envPrefix: 'VITE_',
    build: {
        manifest: true,
        outDir: 'build', // <-- IMPORTANT : pas de "public/", car index.php est déjà à la racine
        emptyOutDir: true,
    },
}));