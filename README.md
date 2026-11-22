# Portfolio

A personal project for experimenting with microfrontends. The repository is
an npm workspaces monorepo: a Fastify server proxies Vite applications, while
shared utilities and styles live in separate packages.

## Project structure

| Path                                                       | Purpose                                               |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| [`server/`](./server/)                                     | Fastify server, health check, and development proxy   |
| [`mfe/shell/`](./mfe/shell/)                               | Main page built with Vite and TypeScript              |
| [`mfe/react-rick-and-morty/`](./mfe/react-rick-and-morty/) | Example React application                             |
| [`packages/core/`](./packages/core/)                       | Configuration, service manifest, and shared utilities |
| [`packages/ui-tokens/`](./packages/ui-tokens/)             | Shared Sass utilities                                 |
| [`scripts/start-dev.ts`](./scripts/start-dev.ts)           | Development server and MFE launcher                   |
| [`docker/`](./docker/)                                     | Docker development configuration                      |

## Quick start with Docker

Docker and Docker Compose with Watch support are required. From the repository
root, run:

```bash
docker compose -f docker/compose.yaml up --build --watch
```

Open <http://localhost:3000/>. The health check is available at
<http://localhost:3000/health>. Press `Ctrl+C` to stop.

Compose starts one container with the server and applications in `mfe/`.
Source changes are synced to the container; local `node_modules` are not used.
The server port is exposed only on the local machine. To change the host port:

```bash
DEV_PORT=3001 docker compose -f docker/compose.yaml up --build --watch
```

After adding an application or changing dependencies, update the lockfile,
stop the environment, and run the command with `--build` again. The launcher
reads the application manifest at startup.

## Local development without Docker

Use Node.js 24 and npm. Install dependencies from the repository root:

```bash
npm ci
```

Start the server and all discovered applications with one command:

```bash
npm run dev
```

To start components individually, use separate terminals:

```bash
npm run dev --workspace @portfolio/server
npm run dev --workspace @portfolio/shell
npm run dev --workspace react-rick-and-morty
```

By default, the server listens on port `3000`, shell on `4000`, and the React
application on `5001`. Vite ports are read from `app_meta_data.devPort`; if a
port is occupied, the application will not automatically switch to another.

## Development routes

| URL through the server       | Purpose                |
| ---------------------------- | ---------------------- |
| `/`                          | Shell                  |
| `/health`                    | Fastify health check   |
| `/mfe/react-rick-and-morty/` | React application      |
| `/mfe/<directory-name>/`     | Another registered MFE |

The proxy supports WebSockets for Vite HMR. Unknown requests to `/api` and
`/mfe` are not forwarded to shell. The server also enables cookie handling,
a limit of 200 requests per minute, and the `Content-Security-Policy` and
`X-Content-Type-Options` headers.

## Adding an MFE

1. Create an application in `mfe/<directory-name>/` and add a `dev` script.
2. Add metadata to its `package.json`, for example:

    ```json
    {
        "app_meta_data": {
            "title": "Example",
            "route": "/example",
            "framework": "vite",
            "src": "/mfe/example/",
            "devPort": 5002
        }
    }
    ```

3. Configure the dev server to use the specified port and the base path
   `/mfe/<directory-name>/`. The proxy preserves this prefix when forwarding
   requests. The base path for `shell` is `/`.
4. Update the dependencies and lockfile, then restart the dev environment.

### Metadata fields

| Field | Type | Purpose |
| ----- | ---- | ------- |
| `title` | string | Human-readable application name, intended for display in the shell. Currently only stored in the manifest. |
| `route` | string | Intended route within the shell, for example `/example`. Shell navigation is not implemented yet; this field is currently only stored in the manifest. |
| `framework` | string | Identifies the application's framework or tooling, for example `react` or `vite`. Currently only stored in the manifest. |
| `src` | string | Browser-accessible application URL, intended for a future iframe in the shell. Currently only stored in the manifest; iframe rendering is not implemented yet. |
| `devPort` | number | Integer port from 1 to 65535 for the application's development server. The proxy uses it to forward requests, and it must be unique among applications. |

For example, the shell could eventually use `route` to select an application
and `src` to load it in an iframe. The proxy itself builds the URL path from
the **directory name**, not from `route` or `src`, so `src` should match
`/mfe/<directory-name>/` (`/` for the shell).

All five fields and their types are validated. The manifest also contains
`directory`, a filesystem path generated by the server and used to start the
application; it is not part of `app_meta_data`. If services have duplicate
ports, the manifest will not be registered.

## Server configuration

| Variable   | Default   | Purpose                                                                  |
| ---------- | --------- | ------------------------------------------------------------------------ |
| `NODE_ENV` | unset     | `production` enables production mode; otherwise development mode is used |
| `PORT`     | `3000`    | Fastify port                                                             |
| `HOST`     | `0.0.0.0` | Fastify listening address                                                |

Docker sets `NODE_ENV=development` and `HOST=0.0.0.0` in the container.
`DEV_PORT` changes only the published host port, not the port inside the
container.

## Checks and builds

Run all commands from the repository root:

```bash
# Build the applications and Sass utilities
npm run build --workspace @portfolio/shell
npm run build --workspace react-rick-and-morty
npm run build:utility --workspace @portfolio/ui-tokens
```

In development, the server and launcher import `@portfolio/core` directly
from its TypeScript source. The server watches for changes; changes to the
launcher or manifest require restarting the environment. Production uses the
built package.

**Production static serving is not complete.** The server expects files in
`server/dist`, while Vite builds shell into `mfe/shell/dist` by default. The
shell build is not yet copied to the server directory automatically.

License: ISC.
