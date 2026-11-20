import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';

// TODO : EXTRACT TO UTILS IN PACKAGES
const port = JSON.parse(readFileSync('./package.json', 'utf-8')).app_meta_data.devPort;

// https://vite.dev/config/
export default defineConfig({
    base: '/mfe/react-rick-and-morty/',
    plugins: [react()],
    server: {
        port: port,
        strictPort: true,
    },
});
