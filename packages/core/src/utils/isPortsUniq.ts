import { T_ServiceManifestItem } from '../types.js';
import prettyLog from './prettyLog.js';

/**
 * @description Checks development ports for duplicates. Logs the first
 * duplicate and the name of the service that already uses it, then stops.
 *
 * @param apps - Services whose development ports should be checked.
 *
 * @returns Whether every development port is unique.
 *
 * @example
 * isPortsUniq([]); // true
 *
 * @example
 * const [app] = getServicesManifest();
 * if (app) {
 *     isPortsUniq([app, app]); // false; logs the duplicate port
 * }
 */
export default function isPortsUniq(apps: T_ServiceManifestItem[]): boolean {
    const ports: Map<number, string> = new Map();

    for (const app of apps) {
        if (ports.has(app.devPort)) {
            prettyLog(`Port ${app.devPort} is already used by ${ports.get(app.devPort)}`, 'error');
            return false;
        }

        ports.set(app.devPort, app.name);
    }

    return true;
}
