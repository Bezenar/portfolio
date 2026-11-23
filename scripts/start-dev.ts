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

    constructor() {
        if (!this.services.some((service) => service.name === 'shell-ui')) {
            throw new Error('Shell is missing from the services manifest');
        }
    }

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

    start(name: string, cwd: string) {
        prettyLog(`Starting ${name}`);

        const child = spawn('npm', ['run', 'dev'], {
            cwd,
            detached: true,
            stdio: 'inherit',
        });

        this.children.add(child);

        child.on('error', (error) => {
            this.children.delete(child);

            prettyLog(format('Failed to start %s:', name, error), 'error');

            this.stop(1);
        });

        child.on('exit', (code, signal) => {
            this.children.delete(child);

            if (this.stopping) return;

            // Stop the remaining services if any one of them exits unexpectedly.
            prettyLog(`${name} exited unexpectedly (${signal ?? code})`, 'error');

            this.stop(1);
        });
    }

    runServices() {
        for (const service of this.services) {
            this.start(service.name, service.directory);
        }
    }
}

const processes = new DevProcesses();

process.on('SIGINT', () => processes.stop(0));
process.on('SIGTERM', () => processes.stop(0));

processes.start('server', getConfig().SERVER_DIR);
processes.runServices();
