# Qwinto

Svelte 5 and Vite client for Qwinto, hosted by the [D20 shell](https://github.com/ravecat/d20). D20 owns the [game session specification](https://github.com/ravecat/d20/blob/master/priv/specs/qwinto.yaml) and supplies authoritative game state, legal actions and scoring. Without D20, this client shows only a static board shell; it cannot run a game.

[![CI](https://github.com/ravecat/qwinto/actions/workflows/ci.yml/badge.svg)](https://github.com/ravecat/qwinto/actions/workflows/ci.yml) [![Node.js 24](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](flake.nix) [![pnpm 10](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](package.json) [![Nix dev shell](https://img.shields.io/badge/Nix-dev_shell-5277C3?logo=nixos&logoColor=white)](flake.nix) [![D20 shell](https://img.shields.io/badge/D20-shell_required_for_play-555555)](https://github.com/ravecat/d20)

## Prerequisites

- Node.js 24 for the client. The [flake](flake.nix) supplies it; [package.json](package.json) declares the frontend dependencies.
- A running [D20 shell](https://github.com/ravecat/d20#local-module-development) for playable sessions. Follow its setup instructions for the backend and database; neither is provided by this client.
- For local Compose development only, [Docker Engine and Compose](https://docs.docker.com/engine/install/) and D20's external `d20` network. Neither is needed to view the static client.

### Prepare the environment

**Nix (recommended):** Install [Nix](https://nixos.org/download/) with [flakes enabled](https://nix.dev/concepts/flakes), then run `nix develop`. This supplies Node.js, pnpm, Just, Concurrently, Docker command tools, and Playwright's pinned Chromium with a stable font configuration. To load it automatically on entering the repository, install [direnv](https://direnv.net/docs/installation.html) and [nix-direnv](https://github.com/nix-community/nix-direnv), set up your [shell hook](https://direnv.net/docs/hook.html), and run `direnv allow` once. The `.envrc` also loads `envs/.env` when present; `nix develop` alone does not.

**Manual:** Install [Node.js 24](https://nodejs.org/en/download), [Just](https://just.systems/man/en/packages.html), and pnpm 10 (the version in [package.json](package.json); for example, `npm install --global pnpm@10.33.2`). Install [Concurrently](https://www.npmjs.com/package/concurrently) for `just up` (for example, `npm install --global concurrently`). To run browser tests without Nix, install Chromium after dependencies with `pnpm exec playwright install chromium`; on Linux, follow [Playwright's system-dependency instructions](https://playwright.dev/docs/browsers#install-system-dependencies). For reproducible screenshot references, use the pinned Nix shell instead.

## Quick Start

```sh
just serve
```

Open [http://localhost:5173](http://localhost:5173). Outside a D20 session this shows only the board shell; to play, use the embedded integration below. The Vite server uses `VITE_PORT` or defaults to `5173` and requires an available port.

## Local Module Development

Use this workflow when developing a D20 iframe module together with a local D20 shell.
The shell owns the shared Traefik entrypoint and external Docker network; each module
repository joins that network and publishes its own slug-based host.

Start [`just up` in the D20 repository](https://github.com/ravecat/d20#local-module-development) first, then run `just up` here in a second terminal. Open [http://localhost:5000](http://localhost:5000) for the D20 shell or [http://qwinto.localhost](http://qwinto.localhost) for this routed module. Storybook is available at [http://localhost:6006](http://localhost:6006). D20 owns the shared Traefik entrypoint; this project's Compose service joins its external `d20` network and routes the `qwinto.localhost` host to Vite on port `5173`.

## Stack

| Area                    | Version source files         |
| ----------------------- | ---------------------------- |
| Development environment | [flake.nix](flake.nix)       |
| Frontend dependencies   | [package.json](package.json) |

## Configuration

| Key         | Production required? | Purpose                                           |
| ----------- | -------------------- | ------------------------------------------------- |
| `VITE_PORT` | No                   | Vite development server port. Defaults to `5173`. |

Local development variables can be placed in `envs/.env`. Use `envs/.env.example` as
the template.

## Commands

| Command          | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `just up`        | Start the Compose Vite service and Storybook.    |
| `just down`      | Stop the Compose service.                        |
| `just setup`     | Install project dependencies.                    |
| `just start`     | Start the Vite development server.               |
| `just storybook` | Start Storybook on port 6006.                    |
| `just serve`     | Install dependencies and start the Vite server.  |
| `just build`     | Build the app for production.                    |
| `just test ...`  | Run browser and Storybook screenshot tests.      |
| `just check`     | Run formatting checks, linting, and type checks. |
| `just format`    | Format source files.                             |
| `just preview`   | Preview the production build.                    |

## Testing and Checks

```sh
just check
just test
just build
```

Run screenshot comparisons in the Nix shell: its Chromium version is checked against `package.json`, and `FONTCONFIG_FILE` pins the fonts used by Playwright. CI uses the same shell rather than downloading an OS-specific browser. Stories are compared at desktop, tablet and mobile sizes against committed images in `__screenshots__/`:

```sh
just test --project desktop
just test
```

New stories fail until references are reviewed. For an intentional visual change, run `just test --project desktop --project tablet --project mobile --update`, inspect every changed PNG in `__screenshots__/`, then rerun `just test` without `--update`. On CI failure, the `ci-visual-references` artifact contains images captured with the same Nix browser and fonts for review; normal runs never replace committed references.

## License

No license has been declared yet.

## Fonts and visual references

The application root and Storybook preview load Source Code Pro at normal weights 400 and 700 through matching anonymous-CORS Google Fonts links with `display=swap`. Production retains a visible fallback. Google font responses are not lockfile-pinned.

Visual tests require network access to Google Fonts. They verify loaded Latin, Cyrillic, and required symbol faces before interactions and again before capture. Missing required fonts fail the test instead of accepting host fallback text.
