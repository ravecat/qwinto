default:
    @just --list

setup:
    pnpm install

[arg("host", long="host")]
start host="0.0.0.0":
    pnpm exec vite --host "{{ host }}"

storybook *args:
    pnpm exec storybook dev --port 6006 --ci {{ args }}

serve: setup
    just start

up: setup
    docker compose up -d
    concurrently \
        --kill-others-on-fail \
        --names vite,storybook \
        --prefix-colors cyan,magenta \
        "docker compose logs --follow" \
        "just storybook"

down:
    docker compose down

build:
    pnpm exec vite build

test *args:
    pnpm exec vitest run --passWithNoTests --reporter=verbose {{ args }}

format:
    pnpm exec eslint . --fix
    pnpm exec oxfmt .

check:
    pnpm exec oxfmt --check .
    pnpm exec eslint .
    pnpm exec svelte-check --tsconfig ./tsconfig.json
    pnpm exec tsc -p tsconfig.test.json --noEmit

preview:
    pnpm exec vite preview
