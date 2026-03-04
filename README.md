# monkcli

CLI typing test inspired by Monkeytype.

## Local

```bash
pnpm install
pnpm dev
```

## Docker

Build and run interactively:

```bash
docker build -t monkcli:local .
docker run --rm -it monkcli:local
```

Or with compose:

```bash
docker compose up --build
```

## Notes

- Engine data is read from `engine-data/`.
- Results are stored at `~/.monkcli/results.json`.
- Settings are stored at `~/.monkcli/settings.json`.
- Theme override:
  - `MONKCLI_THEME=auto` (default)
  - `MONKCLI_THEME=high-contrast`
  - `MONKCLI_THEME=mono`
