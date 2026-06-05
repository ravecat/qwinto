runner := "pnpm"

default:
    @just --list

setup:
    {{ runner }} install

[arg("host", long)]
start host="127.0.0.1":
    {{ runner }} exec vite --host "{{host}}"

[arg("host", long)]
serve host="127.0.0.1":
    just setup
    just start --host "{{host}}"

up:
    docker compose up --build

down:
    docker compose down

build:
    {{ runner }} exec vite build

check:
    {{ runner }} exec biome ci .
    {{ runner }} exec prettier --check .
    {{ runner }} exec biome lint .
    just typecheck

format:
    {{ runner }} exec biome check --write .
    {{ runner }} exec prettier --write .

typecheck:
    {{ runner }} exec svelte-check --tsconfig ./tsconfig.json
    {{ runner }} exec tsc -p tsconfig.*.json --noEmit

preview:
    {{ runner }} exec vite preview
