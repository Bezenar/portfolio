import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// TODO : EXTRACT TO UTILS IN PACKAGES
const port = JSON.parse(readFileSync('./package.json', 'utf-8')).app_meta_data.devPort;

export default defineConfig({
    base: '/',
    server: {
        port: port,
        strictPort: true,
    },
});
