# monkcli

CLI typing test inspired by Monkeytype.

## Local Dev

```bash
npm install
npm run dev
```

## Global CLI (Cross-Platform)

If you cloned this repo, install globally with only Node.js + npm:

```bash
npm run install:global
```

Then run from anywhere:

```bash
monkcli
```

How it works:
- Uses only `node` + `npm` (no `pnpm` required for users).
- Installs dependencies and builds packages.
- Registers `monkcli` globally via `npm link` (defaults to `~/.local` prefix on Linux/macOS).
- The global command executes `bin/monkcli.mjs` (Node launcher).

Optional:

```bash
MONKCLI_NPM_PREFIX="$HOME/.local" npm run install:global
```

## Docker (Optional)

```bash
docker build -t monkcli:local .
docker run --rm -it monkcli:local
```

## Notes

- Engine data is read from `engine-data/`.
- Results are stored at `~/.monkcli/results.json`.
- Settings are stored at `~/.monkcli/settings.json`.
- Theme override:
  - `MONKCLI_THEME=auto` (default)
  - `MONKCLI_THEME=high-contrast`
  - `MONKCLI_THEME=mono`
