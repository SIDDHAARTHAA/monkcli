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
