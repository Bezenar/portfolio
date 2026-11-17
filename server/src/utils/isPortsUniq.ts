import { T_ServiceManifestItem } from '../types.js';
import prettyLog from './prettyLog.js';

export default function isPortsUniq(apps: T_ServiceManifestItem[]): boolean {
    const ports: Record<number, string> = {};

    for (const app of apps) {
        if (ports[app.devPort]) {
            prettyLog(`Port ${app.devPort} is already used by ${ports[app.devPort]}`, 'error');
            return false;
        }

        ports[app.devPort] = app.name;
    }

    return true;
}
