import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getConfig, getServicesManifest } from '@portfolio/core';

class ProdProcesses {
    private readonly CONFIG = getConfig();
    private readonly SERVICES = getServicesManifest();
    private readonly SHELL_APP = this.SERVICES.find((service) => service.name === 'shell');
    private readonly APP_DIRECTORIES = readdirSync(this.CONFIG.MFE_DIR, {
        withFileTypes: true,
    }).filter((entry) => entry.isDirectory());

    constructor() {
        if (!this.SHELL_APP || this.SERVICES.length !== this.APP_DIRECTORIES.length) {
            throw new Error(
                'Cannot build: shell is missing or one or more MFE manifests are invalid.',
            );
        }
    }

    private build(directory: string) {
        const result = spawnSync('npm', ['run', 'build'], { cwd: directory, stdio: 'inherit' });

        if (result.error) throw result.error;

        if (result.status !== 0) {
            throw new Error(`Build failed in ${directory} (${result.signal ?? result.status}).`);
        }
    }

    private buildServices() {
        for (const service of this.SERVICES) {
            this.build(service.directory);

            if (!existsSync(path.join(service.directory, 'dist', 'index.html'))) {
                throw new Error(`Build output is missing index.html for ${service.name}.`);
            }
        }
    }

    private preparePublicDir() {
        if (!this.SHELL_APP) throw new Error('Shell app is missing.');

        rmSync(this.CONFIG.PUBLIC_DIR, { recursive: true, force: true });
        mkdirSync(this.CONFIG.PUBLIC_DIR, { recursive: true });
        cpSync(path.join(this.SHELL_APP.directory, 'dist'), this.CONFIG.PUBLIC_DIR, {
            recursive: true,
        });
    }

    private copyServicesToPublicDir() {
        for (const service of this.SERVICES) {
            if (service.name === 'shell') continue;
            cpSync(
                path.join(service.directory, 'dist'),
                path.join(this.CONFIG.PUBLIC_DIR, 'mfe', service.name),
                { recursive: true },
            );
        }
    }

    init() {
        this.build(path.join(this.CONFIG.PACKAGES_DIR, 'core'));
        this.build(this.CONFIG.SERVER_DIR);

        this.buildServices();

        if (this.SHELL_APP && existsSync(path.join(this.SHELL_APP.directory, 'dist', 'mfe'))) {
            throw new Error(
                'Shell build cannot contain an mfe directory; it is reserved for MFE builds.',
            );
        }

        this.preparePublicDir();
        this.copyServicesToPublicDir();
    }
}

const prodProcesses = new ProdProcesses();

prodProcesses.init();
