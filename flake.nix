{
  description = "A Nix-flake-based development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-25.05-darwin";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, nixpkgs-unstable, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        inherit (nixpkgs) lib;
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            (final: prev: rec {
              nodejs = prev.nodejs_22;
              nodejs-slim = prev.nodejs-slim_22;
              yarn = (prev.yarn.override { inherit nodejs; });
            })
          ];
          config = { allowUnfree = true; };
        };
        pkgs-unstable = import nixpkgs-unstable {
          inherit system;
          overlays = [
            (final: prev: rec {
              nodejs = prev.nodejs_22;
              nodejs-slim = prev.nodejs-slim_22;
              yarn = (prev.yarn.override { inherit nodejs; });
            })
          ];
          config = { allowUnfree = true; };
        };

        claude-code-version = "1.0.44";

        claude-code-simple = pkgs.runCommand "claude-code" {
          buildInputs = [ pkgs.nodejs pkgs.cacert ];

          # SSL certificate configuration for npm
          SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
          NODE_EXTRA_CA_CERTS = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
        } ''
          mkdir -p $out/bin
          export HOME=$(mktemp -d)
          export npm_config_cache=$(mktemp -d)

          # Ensure npm can find certificates
          export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
          export NODE_EXTRA_CA_CERTS=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt

          # To find the latest version: npm view @anthropic-ai/claude-code version
          npm install -g --prefix $out @anthropic-ai/claude-code@${claude-code-version}

          # Create wrapper script if needed
          if [ -f $out/lib/node_modules/@anthropic/claude-code/bin/claude-code ]; then
            ln -s $out/lib/node_modules/@anthropic/claude-code/bin/claude-code $out/bin/claude-code
          fi
        '';

      in
      {

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            actionlint
            bats
            claude-code-simple
            pkgs-unstable.deno
            git
            git-cliff
            go-task
            pkgs-unstable.jujutsu
            podman
            podman-tui
            node2nix
            nodejs
            nodePackages.pnpm
            shellcheck
            swc
            yarn
            yq-go
          ];
          shellHook = ''
            echo "release-please deno plugin development platform environment loaded"

            # Setup environment variables
            export PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo $PWD)

          '';
        };
      }
    );
}
