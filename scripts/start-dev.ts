import { spawn, type ChildProcess } from 'node:child_process';
import { format } from 'node:util';
import {
    getConfig,
    getServicesManifest,
    prettyLog,
    type T_ServiceManifestItem,
} from '@portfolio/core';

class DevProcesses {
    private readonly children = new Set<ChildProcess>();
    private stopping = false;
    // Keep the validated manifest and the launched services in sync.
    private readonly services: readonly T_ServiceManifestItem[] = getServicesManifest();

    /**
     * @description Loads the service manifest and requires shell-ui to be present.
     *
     * @throws If the manifest does not contain shell-ui or cannot be read.
     *
     * @example
     * const processes = new DevProcesses();
     */
    constructor() {
        if (!this.services.some((service) => service.name === 'shell-ui')) {
            throw new Error('Shell is missing from the services manifest');
        }
    }

    /**
     * @description Initiates shutdown once, setting the process exit code and
     * sending SIGTERM to each detached child process group. Already-exited
     * groups are ignored; other signaling errors are logged and set exit code 1.
     *
     * @param exitCode - Exit code to use unless signaling a child fails.
     *
     * @example
     * processes.stop(0);
     *
     * @example
     * processes.stop(1);
     */
    stop(exitCode: number) {
        // Multiple child exits and signals can trigger shutdown at the same time.
        if (this.stopping) return;

        this.stopping = true;

        process.exitCode = exitCode;

        for (const child of this.children) {
            if (child.pid === undefined) continue;

            try {
                // A negative PID targets the detached process group, including npm's children.
                process.kill(-child.pid, 'SIGTERM');
            } catch (error) {
                // The process may have already exited before the signal was sent.
                if (error instanceof Error && 'code' in error && error.code === 'ESRCH') continue;

                prettyLog(format('Failed to stop development process:', error), 'error');

                process.exitCode = 1;
            }
        }
    }

    /**
     * @description Starts an npm development script in a detached process group
     * with inherited output. A spawn error or unexpected exit stops the other
     * tracked processes and sets exit code 1.
     *
     * @param name - Service name used in log messages.
     * @param cwd - Directory in which to run npm.
     *
     * @example
     * processes.start('server', getConfig().SERVER_DIR);
     */
    start(name: string, cwd: string) {
        prettyLog(`Starting ${name}`);

        const child = spawn('npm', ['run', 'dev'], {
            cwd,
            detached: true,
            stdio: 'inherit',
        });

        this.children.add(child);

        // Listen for errors and exit events to manage the process lifecycle
        child.on('error', (error) => {
            this.children.delete(child);

            prettyLog(format('Failed to start %s:', name, error), 'error');

            this.stop(1);
        });

        // Listen for the exit event to handle unexpected terminations
        child.on('exit', (code, signal) => {
            this.children.delete(child);

            if (this.stopping) return;

            // Stop the remaining services if any one of them exits unexpectedly.
            prettyLog(`${name} exited unexpectedly (${signal ?? code})`, 'error');

            this.stop(1);
        });
    }

    /**
     * @description Starts the shell and each service from the loaded manifest.
     *
     * @example
     * processes.runServices();
     */
    runServices() {
        for (const service of this.services) {
            this.start(service.name, service.directory);
        }
    }
}

const processes = new DevProcesses();

// Handle SIGINT and SIGTERM to stop all child processes gracefully
process.on('SIGINT', () => processes.stop(0));
process.on('SIGTERM', () => processes.stop(0));

// Start the server
processes.start('server', getConfig().SERVER_DIR);
// Start all services from the manifest
processes.runServices();
