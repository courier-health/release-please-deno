# Release Please Deno Plugin

A [`release-please`](https://github.com/googleapis/release-please) plugin for Deno projects.

This plugin allows `release-please` to manage versions in `deno.json` or `deno.jsonc` files. It's built on top of the `node` strategy from the core `release-please` library, so it will also update `package.json` if it finds one.

## Usage

In your repository, create a `.release-please-config.json` file:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "strategy": "deno",
      "package-name": "my-deno-package",
      "changelog-path": "CHANGELOG.md"
    }
  }
}
```

Then, create a `.github/workflows/release-please.yml` file and add the `@courier-health/release-please-deno` to the `steps`:

```yaml
on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

name: release-please

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v4
        with:
          command: manifest
          config-file: .release-please-config.json
          manifest-file: .releases.json
          extra-plugins: |
            @courier-health/release-please-deno
```

### Configuration

The Deno strategy supports the following options in your `.release-please-config.json`:

- `package-name`: The name of your package. This is used in the `changelog.json`.
- `changelog-path`: The path to your changelog file. Defaults to `CHANGELOG.md`.
- `changelog-sections`: Custom sections for your changelog. See the [`release-please` documentation](https://github.com/googleapis/release-please/blob/main/docs/configuration.md) for more details.

The plugin will automatically look for `deno.json`, `deno.jsonc`, or `package.json` to update the version.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[Apache 2.0](LICENSE)
