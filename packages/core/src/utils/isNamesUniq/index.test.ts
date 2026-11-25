import { it, expect, vi } from 'vitest';
import type { T_ServiceManifestItem } from '../../types.js';
import isNamesUniq from './index.js';
import { afterEach } from 'node:test';
import * as prettyLog from '../prettyLog/index.js';

afterEach(() => {
    vi.restoreAllMocks();
});

it('returns true for unique names', () => {
    const services = [{ name: 'service1' }, { name: 'service2' }] as T_ServiceManifestItem[];

    expect(isNamesUniq(services)).toBe(true);
});

it('returns false for duplicate names', () => {
    const services = [{ name: 'service1' }, { name: 'service1' }] as T_ServiceManifestItem[];

    expect(isNamesUniq(services)).toBe(false);
});

it('Should call prettyLog for duplicate names', () => {
    const services = [{ name: 'service1' }, { name: 'service1' }] as T_ServiceManifestItem[];

    const prettyLogMock = vi.spyOn(prettyLog, 'default').mockImplementation(() => {});

    isNamesUniq(services);

    expect(prettyLogMock).toHaveBeenCalledWith('Name service1 is already used', 'error');
});
