import { T_Config } from '../../types.js';
import getRootDir from '../getRootDir/index.js';
import path from 'node:path';

/**
 * @description Creates the shared configuration from the current environment and
 * repository paths. Only NODE_ENV=production enables production mode. PORT is
 * converted to a number and falls back to 3000 if the result is falsy; HOST
 * falls back to 0.0.0.0 when unset or empty.
 *
 * @returns The current server configuration and absolute project paths.
 *
 * @example
 * const config = getConfig();
 * console.log(config.PORT, config.SHELL_UI_DIR);
 */
export default function getConfig(): T_Config {
    return {
        IS_DEV: process.env.NODE_ENV !== 'production',
        IS_PROD: process.env.NODE_ENV === 'production',
        API_PREFIX: '/api',
        MFE_PREFIX: '/mfe',
        PORT: Number(process.env.PORT) || 3000,
        HOST: process.env.HOST || '0.0.0.0',
        ROOT_DIR: getRootDir(),
        SERVER_DIR: path.resolve(getRootDir(), 'server'),
        SHELL_UI_DIR: path.resolve(getRootDir(), 'shell-ui'),
        MFE_DIR: path.resolve(getRootDir(), 'mfe'),
        PACKAGES_DIR: path.resolve(getRootDir(), 'packages'),
        PUBLIC_DIR: path.resolve(getRootDir(), 'server/public'),
    };
}
