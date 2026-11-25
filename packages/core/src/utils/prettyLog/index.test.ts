import { afterEach, expect, it, vi } from 'vitest';
import prettyLog, { colors } from './index.js';
import { LogType } from '../../types.js';

const spyOnConsole = vi.spyOn(console, 'log').mockImplementation(() => {});

afterEach(() => {
    spyOnConsole.mockClear();
});

it('Should call console.log', () => {
    prettyLog('Test message');

    expect(spyOnConsole).toHaveBeenCalled();
});

it('Should show date at the beginning of the log', () => {
    prettyLog('Test message');

    const logMessage = spyOnConsole.mock.calls[0]![0];
    const dateRegex = new RegExp(/^\[\d{2}\/\d{2}\/\d{4}\, \d{2}:\d{2}:\d{2} (PM|AM)\]/);

    expect(dateRegex.test(logMessage)).toBe(true);
});

it.each<LogType>(['default', 'error', 'warning', 'success'])(
    'Should apply correct color for type "%s"',
    (type) => {
        prettyLog('Test message', type);

        const logMessage = spyOnConsole.mock.calls[0]![0];

        expect(logMessage).toContain(colors[type]);
    },
);
