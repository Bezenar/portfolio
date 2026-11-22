import { T_ServiceManifestItem } from '../types.js';

const requiredKeys = ['title', 'route', 'framework', 'src', 'devPort'] as const;

function hasRequiredFields(
    metaData: object,
): metaData is Record<(typeof requiredKeys)[number], unknown> {
    return requiredKeys.every((key) => key in metaData);
}

export default function isValidAppMetaData(
    metaData?: unknown,
): metaData is Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'> {
    if (!metaData) return false;
    if (typeof metaData !== 'object') return false;

    return (
        typeof metaData.title === 'string' &&
        typeof metaData.route === 'string' &&
        typeof metaData.framework === 'string' &&
        typeof metaData.src === 'string' &&
        typeof metaData.devPort === 'number' &&
        Number.isInteger(metaData.devPort) &&
        metaData.devPort >= 1 &&
        metaData.devPort <= 65535
    );
}
