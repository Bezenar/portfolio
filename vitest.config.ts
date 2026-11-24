import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    resolve: {
        conditions: ['module', 'node', 'development'],
    },
    // TODO : COULD BE NEEDED TO ENABLE DEVELOPMENT CONDITION
    // ssr: {
    //     noExternal: ['@portfolio/core'],
    // },
    test: {
        coverage: {
            include: [
                'server/src/**/*.{js,jsx,ts,tsx}',
                'shell-ui/src/**/*.{js,jsx,ts,tsx}',
                'mfe/*/src/**/*.{js,jsx,ts,tsx}',
                'packages/*/src/**/*.{js,jsx,ts,tsx}',
            ],
            exclude: ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/*.d.ts'],
        },
        projects: [
            {
                test: {
                    name: 'node',
                    environment: 'node',
                    include: [
                        'server/**/*.{test,spec}.{js,jsx,ts,tsx}',
                        'packages/**/*.{test,spec}.{js,jsx,ts,tsx}',
                    ],
                },
            },
            {
                test: {
                    name: 'ui',
                    environment: 'jsdom',
                    include: [
                        'shell-ui/**/*.{test,spec}.{js,jsx,ts,tsx}',
                        'mfe/**/*.{test,spec}.{js,jsx,ts,tsx}',
                    ],
                },
            },
        ],
    },
});
