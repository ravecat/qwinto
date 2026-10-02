{
  description = "The Qwinto tabletop game";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs =
    { nixpkgs, ... }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forAllSystems = f: nixpkgs.lib.genAttrs supportedSystems (system: f system);
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          fontsConf = pkgs.writeText "playwright-fonts.conf" ''
            <?xml version="1.0"?>
            <!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
            <fontconfig>
              <dir>${pkgs.source-code-pro}/share/fonts/opentype</dir>
              <cachedir prefix="xdg">fontconfig</cachedir>
            </fontconfig>
          '';
          playwright = (pkgs.callPackage "${nixpkgs}/pkgs/development/web/playwright/driver.nix" {
            makeFontsConf = _: fontsConf;
          }).playwright-core;
          browsers =
            assert pkgs.lib.assertMsg
              (playwright.version == (builtins.fromJSON (builtins.readFile ./package.json)).devDependencies.playwright)
              "The Nix browser package must match the Playwright version in package.json.";
            playwright.selectBrowsers {
              withFirefox = false;
              withWebkit = false;
              withFfmpeg = false;
            };
        in
        {
          default = pkgs.mkShellNoCC {
            PLAYWRIGHT_BROWSERS_PATH = "${browsers}";
            FONTCONFIG_FILE = "${fontsConf}";
            LANG = "C.UTF-8";
            LANGUAGE = "C";
            LC_ALL = "C.UTF-8";
            buildInputs = with pkgs; [
              concurrently
              docker-client
              docker-compose
              git
              just
              nodejs_24
              pnpm_10
            ];

            shellHook = ''
              echo "Node version: $(node --version)"
              echo "pnpm version: $(pnpm --version)"
            '';
          };
        }
      );
    };
}
