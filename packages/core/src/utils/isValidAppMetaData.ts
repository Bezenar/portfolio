import { T_ServiceManifestItem } from '../types.js';

const stringKeys = ['title', 'route', 'framework', 'src'] as const;

export default function isValidAppMetaData(
    metaData?: unknown,
): metaData is Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'> {
    if (!metaData) return false;
    if (typeof metaData !== 'object') return false;

    const devPort: unknown = Reflect.get(metaData, 'devPort');

    return (
        stringKeys.every((key) => typeof Reflect.get(metaData, key) === 'string') &&
        typeof devPort === 'number' &&
        Number.isInteger(devPort) &&
        devPort >= 1 &&
        devPort <= 65535
    );
}
