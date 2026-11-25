import { expect, it } from 'vitest';
import isValidAppMetaData from './index.js';
import { T_ServiceManifestItem } from '../../index.js';

it.each([null, undefined, false, 0, ''])(
    'Should return false if metadata is falsy value - "%s"',
    (value) => {
        expect(isValidAppMetaData(value)).toBe(false);
    },
);

it.each(['string', 123, true, () => {}])(
    'Should return false if type of metadata is not a object - "%s"',
    (value) => {
        expect(isValidAppMetaData(value)).toBe(false);
    },
);

it.each<keyof Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'>>([
    'title',
    'route',
    'framework',
    'src',
    'devPort',
])('Should return false if metadata is missing required field "%s"', (field) => {
    const validMetaData: Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'> = {
        title: 'App Title',
        route: '/app-route',
        framework: 'react',
        src: 'src/index.tsx',
        devPort: 3000,
    };

    delete validMetaData[field];

    expect(isValidAppMetaData(validMetaData)).toBe(false);
});

it.each<keyof Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'>>([
    'title',
    'route',
    'framework',
    'src',
])('Should return false if metadata required field "%s" is not a string', (field) => {
    const validMetaData: Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'> = {
        title: 'App Title',
        route: '/app-route',
        framework: 'react',
        src: 'src/index.tsx',
        devPort: 3000,
    };

    //@ts-expect-error Assigning wrong type intentionally for test
    validMetaData[field] = 123;

    expect(isValidAppMetaData(validMetaData)).toBe(false);
});

it('Should return false if metadata "devPort" is not a number', () => {
    const invalidMetaData: Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'> = {
        title: 'App Title',
        route: '/app-route',
        framework: 'react',
        src: 'src/index.tsx',
        devPort: 'not-a-number' as any,
    };

    expect(isValidAppMetaData(invalidMetaData)).toBe(false);
});

it('Should return false if metadata "devPort" is float number', () => {
    const invalidMetaData: Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'> = {
        title: 'App Title',
        route: '/app-route',
        framework: 'react',
        src: 'src/index.tsx',
        devPort: 3000.5,
    };

    expect(isValidAppMetaData(invalidMetaData)).toBe(false);
});

it('Should return false if metadata "devPort" is less than 1', () => {
    const invalidMetaData: Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'> = {
        title: 'App Title',
        route: '/app-route',
        framework: 'react',
        src: 'src/index.tsx',
        devPort: 0,
    };

    expect(isValidAppMetaData(invalidMetaData)).toBe(false);
});

it('Should return false if metadata "devPort" is greater than 65535', () => {
    const invalidMetaData: Omit<T_ServiceManifestItem, 'name' | 'version' | 'directory'> = {
        title: 'App Title',
        route: '/app-route',
        framework: 'react',
        src: 'src/index.tsx',
        devPort: 70000,
    };

    expect(isValidAppMetaData(invalidMetaData)).toBe(false);
});

it('Should validate correct app metadata', () => {
    const validMetaData = {
        title: 'App Title',
        route: '/app-route',
        framework: 'react',
        src: 'src/index.tsx',
        devPort: 3000,
    };

    expect(isValidAppMetaData(validMetaData)).toBe(true);
});
