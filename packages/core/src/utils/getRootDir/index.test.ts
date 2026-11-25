import { expect, it, vi } from 'vitest';
import getRootDir from './index.js';

vi.mock('node:url', async () => ({
    ...(await vi.importActual('node:url')),
    fileURLToPath: vi.fn(() => 'root/mocked/path/to/file/as/js/module'),
}));

it('Should return the correct root directory', () => {
    expect(getRootDir().endsWith('root/mocked')).toBe(true);
});
