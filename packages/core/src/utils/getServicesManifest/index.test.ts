import path from 'node:path';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getConfig: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    prettyLog: vi.fn(),
}));

vi.mock('node:fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:fs')>()),
    readdirSync: mocks.readdirSync,
    readFileSync: mocks.readFileSync,
}));
vi.mock('../getConfig/index.js', () => ({ default: mocks.getConfig }));
vi.mock('../prettyLog/index.js', () => ({ default: mocks.prettyLog }));

const root = path.resolve('manifest-test-root');
const mfeDir = path.join(root, 'mfe');
const shellDir = path.join(root, 'shell-ui');
const appDir = path.join(mfeDir, 'app');
const appPackage = path.join(appDir, 'package.json');
const shellPackage = path.join(shellDir, 'package.json');

const entry = (parentPath: string, name: string, isDirectory = true) => ({
    parentPath,
    name,
    isDirectory: () => isDirectory,
});

const packageJson = (title: string, devPort: number) =>
    JSON.stringify({
        version: '1.0.0',
        app_meta_data: {
            title,
            route: `/${title}`,
            framework: 'vite',
            src: `/${title}/`,
            devPort,
        },
    });

let getServicesManifest: typeof import('./index.js').default;

beforeEach(async () => {
    vi.resetModules();
    mocks.getConfig.mockReset().mockReturnValue({ ROOT_DIR: root, MFE_DIR: mfeDir });
    mocks.prettyLog.mockReset();

    mocks.readdirSync.mockReset().mockImplementation((directory: string) => {
        if (directory === mfeDir) return [entry(mfeDir, 'app')];
        if (directory === root) return [entry(root, 'shell-ui')];

        throw new Error(`Unexpected directory: ${directory}`);
    });

    mocks.readFileSync.mockReset().mockImplementation((file: string) => {
        if (file === appPackage) return packageJson('app', 5000);
        if (file === shellPackage) return packageJson('shell', 4000);

        throw new Error(`Unexpected package: ${file}`);
    });

    getServicesManifest = (await import('./index.js')).default;
});

it('returns the discovered service metadata and directories', () => {
    expect(getServicesManifest()).toEqual([
        {
            name: 'app',
            version: '1.0.0',
            title: 'app',
            route: '/app',
            framework: 'vite',
            src: '/app/',
            directory: appDir,
            devPort: 5000,
        },
        {
            name: 'shell-ui',
            version: '1.0.0',
            title: 'shell',
            route: '/shell',
            framework: 'vite',
            src: '/shell/',
            directory: shellDir,
            devPort: 4000,
        },
    ]);
});

it('ignores non-directory MFE entries', () => {
    mocks.readdirSync.mockImplementation((directory: string) =>
        directory === mfeDir
            ? [entry(mfeDir, 'readme.txt', false), entry(mfeDir, 'app')]
            : [entry(root, 'shell-ui')],
    );

    expect(getServicesManifest().map((service) => service.name)).toEqual(['app', 'shell-ui']);
});

it('returns the same cached manifest on subsequent calls', () => {
    const first = getServicesManifest();

    expect(getServicesManifest()).toBe(first);
});

it('does not read directories again after a successful discovery', () => {
    getServicesManifest();
    getServicesManifest();

    expect(mocks.readdirSync).toHaveBeenCalledTimes(2);
});

it.each([
    ['missing', [entry(root, 'another-directory')]],
    ['not a directory', [entry(root, 'shell-ui', false)]],
])('returns an empty manifest when shell-ui is %s', (_description, rootEntries) => {
    mocks.readdirSync.mockImplementation((directory: string) =>
        directory === root ? rootEntries : [entry(mfeDir, 'app')],
    );

    expect(getServicesManifest()).toEqual([]);
});

it('logs when the shell directory is missing', () => {
    mocks.readdirSync.mockImplementation((directory: string) =>
        directory === root ? [] : [entry(mfeDir, 'app')],
    );

    getServicesManifest();

    expect(mocks.prettyLog).toHaveBeenCalledWith(
        'No shell-ui directory found or it is empty.',
        'error',
    );
});

it('retries discovery after a missing shell instead of caching the failure', () => {
    mocks.readdirSync
        .mockImplementationOnce(() => [entry(mfeDir, 'app')])
        .mockImplementationOnce(() => []);

    getServicesManifest();

    expect(getServicesManifest().map((service) => service.name)).toEqual(['app', 'shell-ui']);
});

it.each([
    ['invalid metadata', JSON.stringify({ version: '1.0.0', app_meta_data: {} })],
    ['invalid JSON', '{'],
])('skips an application with %s', (_description, content) => {
    mocks.readFileSync.mockImplementation((file: string) =>
        file === appPackage ? content : packageJson('shell', 4000),
    );

    expect(getServicesManifest().map((service) => service.name)).toEqual(['shell-ui']);
});

it('logs an application with invalid metadata', () => {
    mocks.readFileSync.mockImplementation((file: string) =>
        file === appPackage ? JSON.stringify({ app_meta_data: {} }) : packageJson('shell', 4000),
    );

    getServicesManifest();

    expect(mocks.prettyLog).toHaveBeenCalledWith(
        'Invalid app metadata for app. Expected strings for title, route, framework and src, and an integer devPort between 1 and 65535. Skipping...',
        'error',
    );
});

it('logs and skips an unreadable package', () => {
    mocks.readFileSync.mockImplementation((file: string) => {
        if (file === appPackage) throw new Error('read failed');

        return packageJson('shell', 4000);
    });
    getServicesManifest();

    expect(mocks.prettyLog).toHaveBeenCalledWith(
        'Failed to read or parse package.json for app: Error: read failed',
        'error',
    );
});

it('rejects duplicate development ports', () => {
    mocks.readFileSync.mockImplementation((file: string) =>
        file === appPackage ? packageJson('app', 4000) : packageJson('shell', 4000),
    );

    expect(getServicesManifest()).toEqual([]);
});

it('logs duplicate development ports', () => {
    mocks.readFileSync.mockImplementation((file: string) =>
        file === appPackage ? packageJson('app', 4000) : packageJson('shell', 4000),
    );
    getServicesManifest();

    expect(mocks.prettyLog).toHaveBeenCalledWith(
        'Duplicate ports found in the services manifest. Skipping...',
        'error',
    );
});

it('rejects duplicate service names', () => {
    mocks.readdirSync.mockImplementation((directory: string) =>
        directory === mfeDir ? [entry(mfeDir, 'shell-ui')] : [entry(root, 'shell-ui')],
    );

    mocks.readFileSync.mockImplementation((file: string) =>
        file === shellPackage ? packageJson('shell', 4000) : packageJson('app', 5000),
    );

    expect(getServicesManifest()).toEqual([]);
});

it('logs duplicate service names', () => {
    mocks.readdirSync.mockImplementation((directory: string) =>
        directory === mfeDir ? [entry(mfeDir, 'shell-ui')] : [entry(root, 'shell-ui')],
    );

    mocks.readFileSync.mockImplementation((file: string) =>
        file === shellPackage ? packageJson('shell', 4000) : packageJson('app', 5000),
    );

    getServicesManifest();

    expect(mocks.prettyLog).toHaveBeenCalledWith(
        'Duplicate names found in the services manifest. Skipping...',
        'error',
    );
});

it.each(['MFE', 'root'])('propagates errors reading the %s directory', (directoryName) => {
    const failingDirectory = directoryName === 'MFE' ? mfeDir : root;

    mocks.readdirSync.mockImplementation((directory: string) => {
        if (directory === failingDirectory) throw new Error('directory read failed');

        return [entry(mfeDir, 'app')];
    });

    expect(() => getServicesManifest()).toThrow('directory read failed');
});
