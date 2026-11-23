import { T_ServiceManifestItem } from '../types.js';
import prettyLog from './prettyLog.js';

/**
 * @description Checks service names for exact duplicates. Logs the first
 * duplicate and stops checking when one is found.
 *
 * @param apps - Services whose names should be checked.
 * @returns Whether every service name is unique.
 *
 * @example
 * isNamesUniq([]); // true
 *
 * @example
 * const [app] = getServicesManifest();
 * if (app) {
 *     isNamesUniq([app, app]); // false; logs the duplicate name
 * }
 */
export default function isNamesUniq(apps: T_ServiceManifestItem[]): boolean {
    const names: Set<string> = new Set();

    for (const app of apps) {
        if (names.has(app.name)) {
            prettyLog(`Name ${app.name} is already used`, 'error');
            return false;
        }

        names.add(app.name);
    }

    return true;
}
