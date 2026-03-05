# monkcli

CLI typing test inspired by Monkeytype.

## Requirements

- Node.js 20+
- npm

## Install (Simple)

From repo root:

```bash
npm run install:global
monkcli
```

## If Install Fails (Permissions/PATH)

### Linux / macOS

Use user-local prefix:

```bash
MONKCLI_NPM_PREFIX="$HOME/.local" npm run install:global
```

If `monkcli` is not found:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
# for zsh use ~/.zshrc instead
source ~/.bashrc
```

### Windows (PowerShell)

```powershell
$env:MONKCLI_NPM_PREFIX = "$HOME\\AppData\\Local\\monkcli-npm"
npm run install:global
$env:Path = "$env:MONKCLI_NPM_PREFIX;$env:Path"
monkcli
```

## Uninstall

From repo root:

```bash
npm run uninstall:global
```

If you installed with custom prefix, use the same prefix while uninstalling.

Linux/macOS:

```bash
MONKCLI_NPM_PREFIX="$HOME/.local" npm run uninstall:global
```

Windows (PowerShell):

```powershell
$env:MONKCLI_NPM_PREFIX = "$HOME\\AppData\\Local\\monkcli-npm"
npm run uninstall:global
```

## Reinstall Cleanly

From repo root:

```bash
npm run uninstall:global
npm run install:global
monkcli
```

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

## Local Dev

```bash
npm install
npm run dev
```

## Docker (Optional)

```bash
docker build -t monkcli:local .
docker run --rm -it monkcli:local
```
