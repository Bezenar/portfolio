import { LogType } from '../types.js';

const colors: Record<LogType, string> = {
    default: '\x1b[0m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
};

export default function prettyLog(message: string, type: LogType = 'default'): void {
    const date = new Date().toLocaleString();

    console.log(`[${date}]: ${colors[type]}${message}\x1b[0m`);
}
