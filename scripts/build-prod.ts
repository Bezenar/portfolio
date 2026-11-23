import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getConfig, getServicesManifest } from '@portfolio/core';

class ProdProcesses {
    private readonly CONFIG = getConfig();
    private readonly SERVICES = getServicesManifest();
    private readonly SHELL_APP = this.SERVICES.find((service) => service.name === 'shell-ui');
    private readonly APP_DIRECTORIES = readdirSync(this.CONFIG.MFE_DIR, {
        withFileTypes: true,
    }).filter((entry) => entry.isDirectory());

    /**
     * @description Loads the service manifest and MFE directories, requiring
     * shell-ui and one manifest entry for each MFE directory.
     *
     * @throws If the manifest is incomplete or the directories cannot be read.
     *
     * @example
     * const prodProcesses = new ProdProcesses();
     */
    constructor() {
        if (!this.SHELL_APP || this.SERVICES.length - 1 !== this.APP_DIRECTORIES.length) {
            throw new Error(
                'Cannot build: shell is missing or one or more MFE manifests are invalid.',
            );
        }
    }

    /**
     * @description Runs the npm build script synchronously in a directory,
     * inheriting its output.
     *
     * @param directory - Directory in which to run npm.
     *
     * @throws If npm cannot be started or the build exits unsuccessfully.
     *
     * @example
     * this.build(this.CONFIG.SERVER_DIR);
     */
    private build(directory: string) {
        const result = spawnSync('npm', ['run', 'build'], { cwd: directory, stdio: 'inherit' });

        if (result.error) throw result.error;

        if (result.status !== 0) {
            throw new Error(`Build failed in ${directory} (${result.signal ?? result.status}).`);
        }
    }

    /**
     * @description Builds every service in the manifest and checks that each
     * output contains a dist/index.html file.
     *
     * @throws If a build fails or its index.html is missing.
     *
     * @example
     * this.buildServices();
     */
    private buildServices() {
        for (const service of this.SERVICES) {
            this.build(service.directory);

            if (!existsSync(path.join(service.directory, 'dist', 'index.html'))) {
                throw new Error(`Build output is missing index.html for ${service.name}.`);
            }
        }
    }

    /**
     * @description Replaces the entire server public directory with the shell's
     * build output. Any existing contents of that directory are deleted.
     *
     * @throws If the shell is missing or a filesystem operation fails.
     *
     * @example
     * this.preparePublicDir();
     */
    private preparePublicDir() {
        if (!this.SHELL_APP) throw new Error('Shell app is missing.');

        rmSync(this.CONFIG.PUBLIC_DIR, { recursive: true, force: true });
        mkdirSync(this.CONFIG.PUBLIC_DIR, { recursive: true });
        cpSync(path.join(this.SHELL_APP.directory, 'dist'), this.CONFIG.PUBLIC_DIR, {
            recursive: true,
        });
    }

    /**
     * @description Copies each MFE's build output into public/mfe/<service-name>.
     * The shell is excluded because its output occupies the public root.
     *
     * @throws If a filesystem operation fails.
     *
     * @example
     * this.copyServicesToPublicDir();
     */
    private copyServicesToPublicDir() {
        for (const service of this.SERVICES) {
            if (service.name === 'shell-ui') continue;

            cpSync(
                path.join(service.directory, 'dist'),
                path.join(this.CONFIG.PUBLIC_DIR, 'mfe', service.name),
                { recursive: true },
            );
        }
    }

    /**
     * @description Builds core, the server and all services, then replaces the
     * public directory with the shell output and copies MFE outputs into it.
     *
     * @throws If a build or copy fails, an index.html is missing, or the shell
     * output contains an mfe directory reserved for MFE builds.
     *
     * @example
     * prodProcesses.init();
     */
    init() {
        // Build packages/core
        this.build(path.join(this.CONFIG.PACKAGES_DIR, 'core'));
        // Build the server
        this.build(this.CONFIG.SERVER_DIR);

        // Build all services, e.g.: shell-ui, mfe/*
        this.buildServices();

        // Ensure the shell build does not contain an mfe directory
        if (this.SHELL_APP && existsSync(path.join(this.SHELL_APP.directory, 'dist', 'mfe'))) {
            throw new Error(
                'Shell build cannot contain an mfe directory; it is reserved for MFE builds.',
            );
        }

        // Clean public directory and copy shell build into it
        this.preparePublicDir();
        // Copy MFE builds into the public directory
        this.copyServicesToPublicDir();
    }
}

const prodProcesses = new ProdProcesses();

prodProcesses.init();
