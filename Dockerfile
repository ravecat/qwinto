FROM nixos/nix:2.34.7 AS dependencies

WORKDIR /app

ENV NIX_CONFIG="experimental-features = nix-command flakes"

RUN printf "[safe]\n\tdirectory = /app\n" > /root/.gitconfig

COPY flake.nix flake.lock package.json pnpm-lock.yaml ./
RUN nix develop .#container --command pnpm install --frozen-lockfile

FROM dependencies AS development

COPY . .

EXPOSE 5173

CMD ["nix", "develop", ".#container", "--command", "just", "start", "--host", "0.0.0.0"]

FROM dependencies AS build

COPY . .
RUN nix develop .#container --command pnpm exec vite build

FROM nginx:1.30.3-alpine3.23-slim

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
