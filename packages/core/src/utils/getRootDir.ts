import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function getRootDir() {
    const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

    return ROOT_DIR;
}
