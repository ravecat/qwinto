runner := "pnpm"

default:
    @just --list

setup:
    {{ runner }} install

[arg("host", long)]
start host="127.0.0.1":
    {{ runner }} exec vite --host "{{host}}"

storybook *args:
    {{ runner }} exec storybook dev --port 6006 --ci {{ args }}

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

test *args:
    {{ runner }} exec vitest run --passWithNoTests --reporter=verbose {{ args }}

check:
    {{ runner }} exec oxfmt --check .
    {{ runner }} exec eslint .
    just typecheck

format:
    {{ runner }} exec eslint . --fix
    {{ runner }} exec oxfmt .

typecheck:
    {{ runner }} exec svelte-check --tsconfig ./tsconfig.json
    {{ runner }} exec tsc -p tsconfig.test.json --noEmit

preview:
    {{ runner }} exec vite preview
