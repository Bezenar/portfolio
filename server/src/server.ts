import Fastify from 'fastify';
import path from 'node:path';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { getConfig, prettyLog } from '@portfolio/core';
import devMfeProxy from './dev-mfe-proxy.js';

const CONFIG = getConfig();

const logger = CONFIG.IS_DEV ? { transport: { target: 'pino-pretty' } } : true;

const server = Fastify({ logger });

// Register cookie plugin.
server.register(cookie);
// Limit requests to prevent abuse. 200 requests per minute.
server.register(rateLimit, { max: 200, timeWindow: '1 minute' });

// Page security headers. iframes should only be allowed from the same origin.
server.addHook('onSend', (_, reply, __, done) => {
    reply.header('Content-Security-Policy', "frame-ancestors 'self'");
    reply.header('X-Content-Type-Options', 'nosniff');
    done();
});

// Health check endpoint.
server.get('/health', () => {
    return { status: 'ok' };
});

// Register development MFE proxy in development mode.
if (CONFIG.IS_DEV) {
    server.register(devMfeProxy);
} else {
    // Serve static files from the public directory in production mode.
    server.register(fastifyStatic, {
        root: CONFIG.PUBLIC_DIR,
        prefix: '/',
        index: ['index.html'],
        wildcard: true,
    });
}

// Handle 404 errors and serve the index.html for navigation requests in production.
server.setNotFoundHandler((req, reply) => {
    const isApi = req.url.startsWith(CONFIG.API_PREFIX);
    const isMfe = req.url.startsWith(CONFIG.MFE_PREFIX);

    const pathname = req.url.split('?')[0] ?? '';
    const isAsset = pathname === '/assets' || pathname.startsWith('/assets/');
    const isNavigation =
        req.headers.accept?.includes('text/html') &&
        !isAsset &&
        !path.basename(pathname).includes('.');

    // Serve index.html for navigation requests in production.
    if (
        CONFIG.IS_PROD &&
        (req.method === 'GET' || req.method === 'HEAD') &&
        !isApi &&
        !isMfe &&
        isNavigation
    ) {
        return reply.header('Cache-Control', 'no-cache').sendFile('index.html');
    }

    return reply.status(404).send({ error: 'Not Found' });
});

server.listen({ port: CONFIG.PORT, host: CONFIG.HOST }, (err) => {
    if (err) {
        prettyLog(err.message, 'error');
        process.exit(1);
    }
});
