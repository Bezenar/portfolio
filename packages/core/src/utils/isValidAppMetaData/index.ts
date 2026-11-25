import { T_ServiceManifestItem } from '../../types.js';

const stringKeys = ['title', 'route', 'framework', 'src'] as const;

/**
 * @description Checks that metadata has string title, route, framework and src
 * fields and an integer devPort between 1 and 65535. Empty strings and extra
 * fields are allowed. A successful check narrows the value's TypeScript type.
 *
 * @param metaData - The value to validate.
 *
 * @returns Whether the value contains valid application metadata.
 *
 * @example
 * isValidAppMetaData({
 *     title: 'Example',
 *     route: '/example',
 *     framework: 'React',
 *     src: '/mfe/example/',
 *     devPort: 5001,
 * }); // true
 * @example
 * isValidAppMetaData({ devPort: 0 }); // false
 */
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
