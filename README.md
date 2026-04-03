# monkcli

CLI typing test inspired by Monkeytype.

## Requirements

- Node.js 20+
- npm

## Install

### npm

```bash
npm install -g @siddhaartha_bs/monkcli
monkcli
```

### npx

```bash
npx @siddhaartha_bs/monkcli
```

## Upgrade

```bash
npm install -g @siddhaartha_bs/monkcli@latest
```

## Uninstall

```bash
npm uninstall -g @siddhaartha_bs/monkcli
```

## Source Development

```bash
npm install
npm run build
node ./bin/monkcli.mjs
```

For interactive local development without a full rebuild:

```bash
npm run dev
```

## If `monkcli` Is Not Found

This is usually a PATH issue with your npm global bin directory.

```bash
npm prefix -g
```

Make sure the corresponding bin directory is on your PATH:

- Linux: `$(npm prefix -g)/bin`
- macOS: `$(npm prefix -g)/bin`
- Windows: the prefix directory reported by `npm prefix -g`

## Where Data Is Stored

`monkcli` writes three files:
- `results.json` (test history)
- `stats.json` (running totals + average WPM/accuracy)
- `settings.json` (saved language/mode/options)

Default locations:

- Linux:
  - results/stats: `~/.local/state/monkcli/`
  - settings: `~/.config/monkcli/`
- macOS:
  - results/stats/settings: `~/Library/Application Support/monkcli/`
- Windows:
  - results/stats: `%LOCALAPPDATA%\\monkcli\\`
  - settings: `%APPDATA%\\monkcli\\`

Overrides:
- `MONKCLI_DATA_DIR` overrides results + stats directory.
- `MONKCLI_CONFIG_DIR` overrides settings directory.

## Docker (Optional)

```bash
docker build -t monkcli:local .
docker run --rm -it monkcli:local
```
