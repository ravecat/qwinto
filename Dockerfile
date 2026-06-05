FROM nixos/nix:latest AS dev

WORKDIR /app

ENV NIX_CONFIG="experimental-features = nix-command flakes"

RUN printf "[safe]\n\tdirectory = /app\n" > /root/.gitconfig

CMD ["nix", "develop", ".#container", "--command", "just", "serve", "--host", "0.0.0.0"]

FROM nixos/nix:latest AS build

WORKDIR /app

ENV NIX_CONFIG="experimental-features = nix-command flakes"

COPY flake.nix flake.lock package.json pnpm-lock.yaml ./
RUN nix develop .#container --command pnpm install --frozen-lockfile

COPY . .
RUN nix develop .#container --command pnpm exec vite build

FROM nginx:stable-alpine3.23-slim AS production

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
