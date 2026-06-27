# qwinto

`qwinto` is an independent Svelte/Vite implementation of the Qwinto game.

## Prerequisites

Required dependencies:

- Node.js `>=24`

Recommended:

<details>
<summary>Prepare Nix environment</summary>

Official docs:

- [Nix installation](https://nixos.org/download/)
- [Nix flakes](https://nix.dev/concepts/flakes)
- [direnv installation](https://direnv.net/docs/installation.html)
- [direnv shell hook](https://direnv.net/docs/hook.html)
- [nix-direnv](https://github.com/nix-community/nix-direnv)

Optional direnv and nix-direnv setup through Nix:

```sh
nix profile install nixpkgs#direnv nixpkgs#nix-direnv
mkdir -p ~/.config/direnv
printf 'source $HOME/.nix-profile/share/nix-direnv/direnvrc\n' >> ~/.config/direnv/direnvrc
```

Add the direnv hook for your shell, then restart the shell. For bash:

```sh
printf 'eval "$(direnv hook bash)"\n' >> ~/.bashrc
```

For other shells, use the [direnv hook docs](https://direnv.net/docs/hook.html).

</details>

<br>

- Enter the environment with `nix develop`, or run `direnv allow` once and let direnv load it automatically.
- The flake provides Node.js plus the repository command tooling.

Manual setup:

- Install and configure the required dependencies above manually.
- Use pnpm and Just when running the project commands outside the Nix shell.

## Quick Start

```sh
just serve
```

Open [http://localhost:5173](http://localhost:5173).

The Vite server uses `VITE_PORT` or defaults to `5173`. The server is configured with
`strictPort: true`, so choose another port explicitly if `5173` is already in use.

## Local Module Development

Use this workflow when developing a D20 iframe module together with a local D20 shell.
The shell owns the shared Traefik entrypoint and external Docker network; each module
repository joins that network and publishes its own slug-based host.

Start the local shell first from wherever that repository lives:

```sh
just up
```

Then start this module repository:

```sh
just up
```

Open [http://localhost:5000](http://localhost:5000). D20 derives iframe URLs from the
module slug and the shell request host. A module with slug `<module-slug>` resolves to
`http://<module-slug>.localhost` when the shell is opened at `localhost:5000`.

For a module repository, the local Compose contract is:

- Join the external Docker network named `d20`.
- Register a Traefik router whose host matches the module slug, such as ``Host(`<module-slug>.localhost`)``.
- Route that host to the module development server port. For this Vite-based module, the default port is `5173`.

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
| `just up`        | Start this module's Vite service through Compose. |
| `just down`      | Stop the Compose service.                         |
| `just setup`     | Install project dependencies.                     |
| `just start`     | Start the Vite development server.                |
| `just serve`     | Install dependencies and start the Vite server.   |
| `just build`     | Build the app for production.                    |
| `just check`     | Run formatting checks, linting, and type checks. |
| `just format`    | Format source files.                             |
| `just typecheck` | Run Svelte and TypeScript checks.                |
| `just preview`   | Preview the production build.                    |

## Testing and Checks

```sh
just check
just build
```

There are no gameplay tests yet. `just check` currently validates formatting, linting,
Svelte, and TypeScript.

## License

No license has been declared yet.
