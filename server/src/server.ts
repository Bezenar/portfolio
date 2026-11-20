import Fastify from 'fastify';
import path from 'node:path';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { readFileSync } from 'node:fs';
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

// Return Shell application static files.
if (CONFIG.IS_DEV) {
    server.register(devMfeProxy);
} else {
    // TODO : ENSURE THAT STATIC FILES ARE SERVED CORRECTLY IN PRODUCTION MODE
    server.register(fastifyStatic, {
        root: CONFIG.BUILD_OUTPUT_DIR,
        prefix: '/',
        index: ['index.html'],
        wildcard: true, // Enable not found handler
    });
}

server.setNotFoundHandler((req, reply) => {
    const isApi = req.url.startsWith(CONFIG.API_PREFIX);
    const isMfe = req.url.startsWith(CONFIG.MFE_PREFIX);

    // If the request is not a GET or is for the API or MFE, return 404.
    if (req.method !== 'GET' || isApi || isMfe) {
        // TODO : ADJUST ERROR FOR GRACEFUL HANDLING
        reply.status(404).send({ error: 'Not Found' });
        return;
    }

    // TODO : ENSURE THAT STATIC FILES ARE SERVED CORRECTLY IN PRODUCTION MODE
    const html = readFileSync(path.join(CONFIG.BUILD_OUTPUT_DIR, 'index.html'), 'utf-8');

    return reply.type('text/html').header('Cache-Control', 'no-cache').send(html);
});

server.listen({ port: CONFIG.PORT, host: CONFIG.HOST }, (err) => {
    if (err) {
        prettyLog(err.message, 'error');
        process.exit(1);
    }
});
