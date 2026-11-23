import type { T_ServiceManifestItem } from '../types.js';
import getConfig from './getConfig.js';
import isNamesUniq from './isNamesUniq.js';
import path from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import isValidAppMetaData from './isValidAppMetaData.js';
import prettyLog from './prettyLog.js';
import isPortsUniq from './isPortsUniq.js';

let cachedResult: T_ServiceManifestItem[] | null = null;

/**
 * @description Discovers the root shell-ui and directories under mfe, reading
 * their package metadata into a service manifest. Invalid or unreadable package
 * files are logged and skipped. A missing shell-ui or duplicate service names
 * or ports is logged and returns an empty array without caching it. Successful
 * results are cached and returned by reference on subsequent calls.
 *
 * @returns The discovered services, or an empty array if validation fails.
 *
 * @throws If the root or mfe directory cannot be read.
 *
 * @example
 * const services = getServicesManifest();
 * for (const service of services) {
 *     console.log(service.name, service.devPort);
 * }
 */
export default function getServicesManifest(): T_ServiceManifestItem[] {
    if (cachedResult) {
        return cachedResult;
    }

    const CONFIG = getConfig();
    const services = readdirSync(CONFIG.MFE_DIR, { withFileTypes: true });
    const shellUI = readdirSync(CONFIG.ROOT_DIR, { withFileTypes: true })?.find(
        (entry) => entry.name === 'shell-ui' && entry.isDirectory(),
    );
    const entries: T_ServiceManifestItem[] = [];

    if (!shellUI) {
        prettyLog('No shell-ui directory found or it is empty.', 'error');
        return [];
    }

    services.push(shellUI);

    for (const app of services) {
        if (!app.isDirectory()) continue;

        try {
            const rawPkgJson = readFileSync(
                path.join(app.parentPath, app.name, 'package.json'),
                'utf-8',
            );

            const pkgJson = JSON.parse(rawPkgJson);

            if (!isValidAppMetaData(pkgJson.app_meta_data)) {
                prettyLog(
                    `Invalid app metadata for ${app.name}. Expected strings for title, route, framework and src, and an integer devPort between 1 and 65535. Skipping...`,
                    'error',
                );
                continue;
            }

            entries.push({
                name: app.name,
                version: pkgJson.version,
                title: pkgJson.app_meta_data.title,
                route: pkgJson.app_meta_data.route,
                framework: pkgJson.app_meta_data.framework,
                src: pkgJson.app_meta_data.src,
                directory: path.join(app.parentPath, app.name),
                devPort: pkgJson.app_meta_data.devPort,
            });
        } catch (error) {
            prettyLog(`Failed to read or parse package.json for ${app.name}: ${error}`, 'error');
            continue;
        }
    }

    if (!isPortsUniq(entries)) {
        prettyLog('Duplicate ports found in the services manifest. Skipping...', 'error');
        return [];
    }

    if (!isNamesUniq(entries)) {
        prettyLog('Duplicate names found in the services manifest. Skipping...', 'error');
        return [];
    }

    cachedResult = entries;

    return entries;
}
