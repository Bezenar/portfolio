# Portfolio

A personal project for experimenting with microfrontends. The repository is
an npm workspaces monorepo: a Fastify server proxies Vite applications in
development and serves their built files in production. Shared configuration
and styles live in separate packages.

## Project structure

| Path                                                       | Purpose                                              |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| [`server/`](./server/)                                     | Fastify server, health check, and development proxy  |
| [`shell-ui/`](./shell-ui/)                                 | Main page built with Vite and TypeScript             |
| [`mfe/react-rick-and-morty/`](./mfe/react-rick-and-morty/) | Example React application                            |
| [`packages/core/`](./packages/core/)                       | Shared configuration, service discovery, and logging |
| [`packages/core-styles/`](./packages/core-styles/)         | Shared Sass utilities                                |
| [`scripts/start-dev.ts`](./scripts/start-dev.ts)           | Development server and MFE launcher                  |
| [`scripts/build-prod.ts`](./scripts/build-prod.ts)         | Production build and static file preparation         |
| [`docker/`](./docker/)                                     | Docker development and production configurations     |

## Quick start with Docker

Docker, Docker Compose with Watch support, and npm are required for these
scripts. From the repository root, run:

```bash
npm run docker:dev
```

Open <http://localhost:3000/>. The health check is available at
<http://localhost:3000/health>. Press `Ctrl+C` to stop, then remove the
development container and network with `npm run docker:dev-down`.

Compose starts one container with the server, shell, and applications in `mfe/`.
Source changes are synced to the container; local `node_modules` are not used.
The server port is exposed only on the local machine. To change the host port:

```bash
DEV_PORT=3001 npm run docker:dev
```

After adding an application or changing dependencies, update the lockfile,
stop the environment, and run `npm run docker:dev` again; it rebuilds the
image. The launcher reads the application manifest at startup, so changes to
the manifest or launcher also require a restart.

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
npm run dev --workspace @portfolio/shell-ui
npm run dev --workspace react-rick-and-morty
```

By default, the server listens on port `3000`, shell on `4000`, and the React
application on `5001`. The included Vite applications read their ports from
`app_meta_data.devPort` and use `strictPort`, so they do not automatically
switch ports if one is occupied.

## Linting

Run Oxlint for the repository or for the React workspace:

```bash
npm run lint
npm run lint --workspace react-rick-and-morty
```

The root configuration contains shared JavaScript and TypeScript rules; the
React-specific rules apply only to `mfe/react-rick-and-morty/`. When adding an
MFE that needs framework-specific rules, add a matching override or a nested
config that extends the root configuration. Oxlint checks only script blocks
in Vue and Svelte files, not their templates or styles.

## Formatting

Format supported files across the repository, or check them without changes:

```bash
npm run format
npm run format:check
```

Both commands also work for individual workspaces, for example:

```bash
npm run format --workspace @portfolio/core
npm run format:check --workspace react-rick-and-morty
```

Oxfmt uses the root configuration. Formatting writes files in place; the check
command reports files that need formatting and exits with a non-zero status.
Ignored build output and dependency directories are not formatted.

## Tests

Run all workspace tests once, or watch for changes:

```bash
npm test
npm run test:watch
```

Run tests for an individual workspace:

```bash
npm test --workspace @portfolio/server
npm test --workspace @portfolio/shell-ui
npm test --workspace react-rick-and-morty
npm test --workspace @portfolio/core
npm test --workspace @portfolio/core-styles
```

Vitest uses Node.js for server and package tests and jsdom for shell and MFE
tests. Test files can be named `*.test.ts`, `*.spec.ts`, or use the equivalent
JavaScript and JSX/TSX extensions. The example tests are starting points, not
application coverage. Vitest does not replace TypeScript type-checking.

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

1. Create an application in `mfe/<directory-name>/` with `dev` and `build`
   scripts. The production build must produce `dist/index.html`.
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

3. Configure Vite to use the specified port with `strictPort: true`, and set
   the base path to `/mfe/<directory-name>/` for development and production.
   The proxy preserves this prefix when forwarding requests. The base path
   for `shell` is `/`.
4. Update the dependencies and lockfile, then restart the dev environment.

### Metadata fields

| Field       | Type   | Purpose                                                                                                                                                   |
| ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`     | string | Human-readable application name, intended for display in the shell. Currently only stored in the manifest.                                                |
| `route`     | string | Intended route within the shell, for example `/example`. Shell navigation is not implemented yet; this field is currently only stored in the manifest.    |
| `framework` | string | Identifies the application's framework or tooling, for example `react` or `vite`. Currently only stored in the manifest.                                  |
| `src`       | string | Browser-accessible application URL, intended for use by the shell. Currently only stored in the manifest; the shell iframe uses a hard-coded URL instead. |
| `devPort`   | number | Integer port from 1 to 65535 for the application's development server. The proxy uses it to forward requests, and it must be unique among applications.   |

For example, the shell could eventually use `route` to select an application
and `src` to load it in an iframe. The proxy itself builds the URL path from
the **directory name**, not from `route` or `src`, so `src` should match
`/mfe/<directory-name>/` (`/` for the shell).

All five fields and their types are validated. The manifest also contains
`directory`, a filesystem path generated by the server and used to start the
application; it is not part of `app_meta_data`. Service names are derived from
directory names, including `shell-ui`. If services have duplicate names or
ports, the manifest will not be registered.

## Server configuration

| Variable   | Default   | Purpose                                                                  |
| ---------- | --------- | ------------------------------------------------------------------------ |
| `NODE_ENV` | unset     | `production` enables production mode; otherwise development mode is used |
| `PORT`     | `3000`    | Fastify port                                                             |
| `HOST`     | `0.0.0.0` | Fastify listening address                                                |

The development image sets `NODE_ENV=development`; the production image sets
`NODE_ENV=production`. Both listen on `0.0.0.0:3000` inside the container.
`DEV_PORT` and `PROD_PORT` change only the respective published host ports.

## Production with Docker

Build and start the production container:

```bash
npm run docker:prod
```

Open <http://localhost:3000/>. The server is published on the local machine
only. To use another host port, set `PROD_PORT`:

```bash
PROD_PORT=3001 npm run docker:prod
```

Press `Ctrl+C` to stop, then remove the container and network with:

```bash
npm run docker:prod-down
```

The development and production scripts use separate Compose project names.
Use different host ports if running both at the same time. The `down` scripts
remove their project's containers and network, but not images or volumes.

The multi-stage image builds the applications separately from the runtime
image. The runtime contains the compiled server and core package, public
files, and production dependencies; it runs as a non-root user. Docker checks
the `/health` endpoint to report container health. Source changes require
rebuilding the image.

## Production build without Docker

From the repository root, build and start the application:

```bash
npm run build
npm start
```

The build compiles `@portfolio/core` and the server, builds `shell-ui` and
every application in `mfe/`, and copies their output into `server/public`.
Shell files are at the public root; other applications are under
`mfe/<directory-name>/`. The `mfe` directory name is reserved in the shell
build. After compiling the
applications, the build replaces `server/public`; do not keep manually
created files there. Server JavaScript remains in `server/dist` and is not
served as static content.

`npm start` sets `NODE_ENV=production` and starts the compiled server (the
command uses POSIX shell syntax). Open <http://localhost:3000/> for shell,
<http://localhost:3000/mfe/react-rick-and-morty/> for the React MFE, and
<http://localhost:3000/health> for the health check. Unknown shell navigation
URLs fall back to shell's `index.html` for HTML requests without a dot in the
last path segment. Missing files under `/assets` or with a dot in the last
path segment, and unknown API or MFE paths, return 404. MFE-specific
client-side route fallback is not implemented.

To check the running server manually:

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/
curl -i http://localhost:3000/mfe/react-rick-and-morty/
curl -i http://localhost:3000/assets/missing.js
```

The first three requests should return `200`; the missing file should return
`404`. Rebuild before testing changes to the server or applications.

In development, the server and launcher import `@portfolio/core` directly
from its TypeScript source. The server watches for changes; changes to the
launcher or manifest require restarting the environment. Production uses the
built package.

The Sass utilities can also be built separately with
`npm run build:utility --workspace @portfolio/core-styles`.

License: ISC.
