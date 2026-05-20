pnpm := "pnpm"
svg_files := "assets/**/*.svg"

default:
    @just --list

setup:
    {{ pnpm }} install

start:
    {{ pnpm }} exec vite

serve:
    just setup
    just start

build:
    {{ pnpm }} exec vite build

check: format-check lint typecheck

format:
    {{ pnpm }} exec biome check --write .
    {{ pnpm }} exec prettier --write --no-error-on-unmatched-pattern "{{ svg_files }}"

format-check:
    {{ pnpm }} exec biome ci .
    {{ pnpm }} exec prettier --check --no-error-on-unmatched-pattern "{{ svg_files }}"

format-svg:
    {{ pnpm }} exec prettier --write --no-error-on-unmatched-pattern "{{ svg_files }}"

lint:
    {{ pnpm }} exec biome lint .

typecheck:
    {{ pnpm }} exec svelte-check --tsconfig ./tsconfig.json
    {{ pnpm }} exec tsc -p tsconfig.*.json --noEmit

preview:
    {{ pnpm }} exec vite preview
