import { afterEach, expect, it, vi } from 'vitest';
import isPortsUniq from './index.js';
import type { T_ServiceManifestItem } from '../../types.js';
import * as prettyLog from '../prettyLog/index.js';

afterEach(() => {
    vi.restoreAllMocks();
});

it('returns true for unique ports', () => {
    const apps = [
        { name: 'app1', devPort: 3000 },
        { name: 'app2', devPort: 3001 },
    ] as T_ServiceManifestItem[];

    expect(isPortsUniq(apps)).toBe(true);
});

it('returns false for duplicate ports', () => {
    const apps = [
        { name: 'app1', devPort: 3000 },
        { name: 'app2', devPort: 3000 },
    ] as T_ServiceManifestItem[];

    expect(isPortsUniq(apps)).toBe(false);
});

it('Should call prettyLog for duplicate ports', () => {
    const prettyLogMock = vi.spyOn(prettyLog, 'default').mockImplementation(() => {});

    const apps = [
        { name: 'app1', devPort: 3000 },
        { name: 'app2', devPort: 3000 },
    ] as T_ServiceManifestItem[];

    isPortsUniq(apps);

    expect(prettyLogMock).toHaveBeenCalledWith('Port 3000 is already used by app1', 'error');
});
