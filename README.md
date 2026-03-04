# monkcli

CLI typing test inspired by Monkeytype.

## Local Dev

```bash
pnpm install
pnpm dev
```

## Global CLI (Like Standard Node CLIs)

Install globally from this cloned repo:

```bash
bash ./scripts/install-launcher.sh
```

Or:

```bash
pnpm run install:global
```

Then run from anywhere:

```bash
monkcli
```

How it works:
- Runs `pnpm install` + `pnpm build` once.
- Registers `monkcli` globally via `npm link --prefix ~/.local`.
- Global command points to `scripts/monkcli`, which runs built JS directly via Node.

## Docker (Optional)

Docker is still available, but optional:

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
