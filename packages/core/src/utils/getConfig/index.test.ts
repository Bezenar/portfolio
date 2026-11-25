import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import getConfig from './index.js';
import { T_Config } from '../../index.js';

const mode = 'production';
const port = '3000';
const host = '1.1.1.1';

vi.mock('../getRootDir/index.js', () => ({
    default: vi.fn(() => '/mock/root/dir'),
}));

beforeEach(() => {
    vi.stubEnv('NODE_ENV', mode);
    vi.stubEnv('PORT', port);
    vi.stubEnv('HOST', host);
});

afterEach(() => {
    vi.unstubAllEnvs();
});

it('Should return property "IS_DEV" with falsy value, when NODE_ENV is "production"', () => {
    expect(getConfig().IS_DEV).toBeFalsy();
});

it('Should return property "IS_DEV" with truthy value, when NODE_ENV is not "production"', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(getConfig().IS_DEV).toBeTruthy();
});

it('Should return property "IS_PROD" with truthy value, when NODE_ENV is "production"', () => {
    expect(getConfig().IS_PROD).toBeTruthy();
});

it('Should return property "IS_PROD" with falsy value, when NODE_ENV is not "production"', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(getConfig().IS_PROD).toBeFalsy();
});

it.each<[keyof T_Config, string]>([
    ['API_PREFIX', '/api'],
    ['MFE_PREFIX', '/mfe'],
])('Should return property "%s" with value "%s"', (key, value) => {
    expect(getConfig()[key]).toBe(value);
});

it('Should return fallback property for PORT when PORT is not set', () => {
    vi.stubEnv('PORT', '');

    expect(getConfig().PORT).toBe(3000);
});

it('Should return fallback property for PORT process env value are incorrect number', () => {
    vi.stubEnv('PORT', 'invalid');

    expect(getConfig().PORT).toBe(3000);
});

it('Should return process env value for PORT when PORT is set', () => {
    vi.stubEnv('PORT', '4000');

    expect(getConfig().PORT).toBe(4000);
});

it('Should return fallback property for HOST when HOST is not set', () => {
    vi.stubEnv('HOST', '');

    expect(getConfig().HOST).toBe('0.0.0.0');
});

it('Should return process env value for HOST when HOST is set', () => {
    expect(getConfig().HOST).toBe('1.1.1.1');
});

it.each<[keyof T_Config, string]>([
    ['ROOT_DIR', '/mock/root/dir'],
    ['SERVER_DIR', '/mock/root/dir/server'],
    ['SHELL_UI_DIR', '/mock/root/dir/shell-ui'],
    ['MFE_DIR', '/mock/root/dir/mfe'],
    ['PACKAGES_DIR', '/mock/root/dir/packages'],
    ['PUBLIC_DIR', '/mock/root/dir/server/public'],
])('Should return property "%s" with value "%s"', (key, value) => {
    expect(getConfig()[key]).toBe(value);
});
