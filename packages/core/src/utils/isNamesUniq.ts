import { T_ServiceManifestItem } from '../types.js';
import prettyLog from './prettyLog.js';

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
