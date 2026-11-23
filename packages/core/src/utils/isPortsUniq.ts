import { T_ServiceManifestItem } from '../types.js';
import prettyLog from './prettyLog.js';

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
