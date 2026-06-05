{
  description = "Qwinto dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        tooling = [
          pkgs.git
          pkgs.just
          pkgs.nodejs_24
          pkgs.pnpm
        ];
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.docker-client
            pkgs.docker-compose
          ] ++ tooling;
        };

        devShells.container = pkgs.mkShell {
          packages = tooling;
        };
      }
    );
}
