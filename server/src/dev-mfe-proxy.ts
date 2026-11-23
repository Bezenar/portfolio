import type { FastifyPluginAsync } from 'fastify';
import httpProxy from '@fastify/http-proxy';
import { getConfig, getServicesManifest } from '@portfolio/core';

const devMfeProxy: FastifyPluginAsync = async (server) => {
    const CONFIG = getConfig();
    const SERVICES_MANIFEST = getServicesManifest();

    for (const service of SERVICES_MANIFEST) {
        // Shared configuration for all services
        const mainConfig = {
            upstream: `http://localhost:${service.devPort}`,
            websocket: true,
        };

        // Special handling for the shell service to render shell at root route
        if (service.name === 'shell-ui') {
            server.register(httpProxy, {
                ...mainConfig,
                preHandler: (request, reply, done) => {
                    const isNotAvailable =
                        (request.method !== 'GET' && request.method !== 'HEAD') ||
                        request.url.startsWith(CONFIG.API_PREFIX) ||
                        request.url.startsWith(CONFIG.MFE_PREFIX);

                    if (isNotAvailable) {
                        reply.status(404).send({ error: 'Not Found' });

                        return;
                    }

                    done();
                },
            });

            continue;
        }

        server.register(httpProxy, {
            ...mainConfig,
            prefix: `/mfe/${service.name}`,
            rewritePrefix: `/mfe/${service.name}`,
        });
    }
};

export default devMfeProxy;
