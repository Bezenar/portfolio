import { T_ServiceManifestItem } from '../types.js';

export default function isValidAppMetaData(
    metaData?: unknown,
): metaData is Omit<T_ServiceManifestItem, 'name' | 'version'> {
    if (!metaData) return false;
    if (typeof metaData !== 'object') return false;

    const requiredKeys = ['title', 'route', 'framework', 'devPort'];

    return requiredKeys.every((key) => key in metaData);
}
