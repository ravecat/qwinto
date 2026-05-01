PNPM := pnpm
SVG_FILES := assets/**/*.svg

.DEFAULT_GOAL := check

.PHONY: serve build check format format\:check format\:svg lint typecheck preview

serve:
	$(PNPM) exec vite

build:
	$(PNPM) exec vite build

check: format\:check lint typecheck

format:
	$(PNPM) exec biome check --write .
	$(PNPM) exec prettier --write --no-error-on-unmatched-pattern "$(SVG_FILES)"

format\:check:
	$(PNPM) exec biome ci .
	$(PNPM) exec prettier --check --no-error-on-unmatched-pattern "$(SVG_FILES)"

format\:svg:
	$(PNPM) exec prettier --write --no-error-on-unmatched-pattern "$(SVG_FILES)"

lint:
	$(PNPM) exec biome lint .

typecheck:
	$(PNPM) exec svelte-check --tsconfig ./tsconfig.json
	$(PNPM) exec tsc -p tsconfig.*.json --noEmit

preview:
	$(PNPM) exec vite preview
