import { LogType } from '../types.js';

const colors: Record<LogType, string> = {
    default: '\x1b[0m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
};

/**
 * @description Writes a timestamped message to the console with an ANSI color
 * selected by its type. All types, including errors, use console.log.
 *
 * @param message - The message to print.
 * @param type - The color category; defaults to "default".
 *
 * @example
 * prettyLog('This is a success message', 'success');
 *
 * @example
 * prettyLog('This is a default message');
 *
 * @example
 * prettyLog('This is a warning message', 'warning');
 *
 * @example
 * prettyLog('This is an error message', 'error');
 */
export default function prettyLog(message: string, type: LogType = 'default'): void {
    const date = new Date().toLocaleString();

    console.log(`[${date}]: ${colors[type]}${message}\x1b[0m`);
}
