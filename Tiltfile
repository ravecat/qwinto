namespace = "d20"

repo_dir = os.getcwd()

def register():
    docker_build(
        "d20/qwinto",
        repo_dir,
        target = "development",
        live_update = [
            fall_back_on(os.path.join(repo_dir, "Dockerfile")),
            fall_back_on(os.path.join(repo_dir, "flake.nix")),
            fall_back_on(os.path.join(repo_dir, "flake.lock")),
            sync(os.path.join(repo_dir, "src"), "/app/src"),
            sync(os.path.join(repo_dir, "assets"), "/app/assets"),
            sync(os.path.join(repo_dir, "index.html"), "/app/index.html"),
            sync(os.path.join(repo_dir, "svelte.config.js"), "/app/svelte.config.js"),
            sync(os.path.join(repo_dir, "vite.config.ts"), "/app/vite.config.ts"),
            sync(os.path.join(repo_dir, "tsconfig.json"), "/app/tsconfig.json"),
            sync(os.path.join(repo_dir, "package.json"), "/app/package.json"),
            sync(os.path.join(repo_dir, "pnpm-lock.yaml"), "/app/pnpm-lock.yaml"),
            run(
                "cd /app && nix develop .#container --command pnpm install --frozen-lockfile",
                trigger = [
                    os.path.join(repo_dir, "package.json"),
                    os.path.join(repo_dir, "pnpm-lock.yaml"),
                ],
            ),
        ],
    )

    k8s_yaml(os.path.join(repo_dir, "k8s.yaml"))

    k8s_resource("qwinto", links = ["http://qwinto.d20.localhost"], labels = ["game"])
