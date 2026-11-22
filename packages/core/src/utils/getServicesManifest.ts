import type { T_ServiceManifestItem } from '../types.js';
import getConfig from './getConfig.js';
import path from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import isValidAppMetaData from './isValidAppMetaData.js';
import prettyLog from './prettyLog.js';
import isPortsUniq from './isPortsUniq.js';

export default function getServicesManifest(): T_ServiceManifestItem[] {
    const CONFIG = getConfig();
    const services = readdirSync(CONFIG.MFE_DIR, { withFileTypes: true });
    const entries: T_ServiceManifestItem[] = [];

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

    return entries;
}
