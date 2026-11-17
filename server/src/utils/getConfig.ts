import { T_Config } from '../types.js';
import getRootDir from './getRootDir.js';
import path from 'node:path';

// TODO : EXTRACT TO A SEPARATE PACKAGE
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
        MFE_DIR: path.resolve(getRootDir(), 'mfe'),
        PACKAGES_DIR: path.resolve(getRootDir(), 'packages'),
        BUILD_OUTPUT_DIR: path.resolve(getRootDir(), 'server/dist'),
    };
}
