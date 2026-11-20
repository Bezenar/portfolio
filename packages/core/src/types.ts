export type T_Config = {
    IS_DEV: boolean;
    IS_PROD: boolean;
    API_PREFIX: string;
    MFE_PREFIX: string;
    PORT: number;
    HOST: string;
    ROOT_DIR: string;
    SERVER_DIR: string;
    MFE_DIR: string;
    PACKAGES_DIR: string;
    BUILD_OUTPUT_DIR: string;
};

export type T_ServiceManifestItem = {
    name: string;
    version: string;
    title: string;
    route: string;
    framework: string;
    src: string;
    devPort: number;
};

export type LogType = 'default' | 'success' | 'error' | 'warning';
