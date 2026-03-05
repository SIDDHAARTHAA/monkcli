# monkcli

CLI typing test inspired by Monkeytype.

## Requirements

- Node.js 20+ (Node 22 recommended)
- npm (bundled with Node.js)

Check:

```bash
node -v
npm -v
```

## Install From Cloned Repo

Clone and enter the repo, then follow your OS section.

### Linux (Recommended)

Use a user-local npm prefix (no sudo needed):

```bash
MONKCLI_NPM_PREFIX="$HOME/.local" npm run install:global
```

Add to PATH (if needed):

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verify:

```bash
which monkcli
monkcli
```

### macOS

Option A (recommended): use a user-local prefix.

```bash
MONKCLI_NPM_PREFIX="$HOME/.local" npm run install:global
```

Add to PATH for zsh (default mac shell):

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Option B: use your npm global prefix (depends on your Node install):

```bash
npm run install:global
```

Verify:

```bash
which monkcli
monkcli
```

### Windows (PowerShell)

Use a user-local prefix:

```powershell
$env:MONKCLI_NPM_PREFIX = "$HOME\\AppData\\Local\\monkcli-npm"
npm run install:global
$env:Path = "$env:MONKCLI_NPM_PREFIX;$env:Path"
where monkcli
monkcli
```

If it works, add that prefix to User PATH permanently in Windows Environment Variables.

## Isolated Test (Fresh Environment Simulation)

Use a temporary npm prefix to validate install flow without touching your normal global setup.

Linux/macOS:

```bash
tmp_prefix="$(mktemp -d)/monkcli-npm"
MONKCLI_NPM_PREFIX="$tmp_prefix" npm run install:global
PATH="$tmp_prefix/bin:$PATH" monkcli
```

Windows (PowerShell):

```powershell
$prefix = Join-Path $env:TEMP "monkcli-npm-test"
Remove-Item -Recurse -Force $prefix -ErrorAction Ignore
$env:MONKCLI_NPM_PREFIX = $prefix
npm run install:global
$env:Path = "$prefix;$env:Path"
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

## Troubleshooting

- `monkcli: command not found`
  - Linux/macOS: ensure `<prefix>/bin` is in PATH.
  - Windows: ensure `<prefix>` is in PATH.
- Permission errors on install
  - Use `MONKCLI_NPM_PREFIX` with a user-owned directory (examples above).
- `node` or `npm` not found
  - Reinstall Node.js and reopen terminal.

## Notes

- Engine data is read from `engine-data/`.
- Results are stored at `~/.monkcli/results.json`.
- Settings are stored at `~/.monkcli/settings.json`.
- Theme override:
  - `MONKCLI_THEME=auto` (default)
  - `MONKCLI_THEME=high-contrast`
  - `MONKCLI_THEME=mono`
