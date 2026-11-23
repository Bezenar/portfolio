import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @description Resolves the repository root relative to this module's location,
 * rather than the process's current working directory.
 *
 * @returns The absolute path four levels above this module's directory.
 *
 * @example
 * const rootDir = getRootDir();
 * const serverDir = path.join(rootDir, 'server');
 */
export default function getRootDir() {
    const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

    return ROOT_DIR;
}
