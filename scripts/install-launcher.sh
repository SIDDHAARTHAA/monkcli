#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
PREFIX_DIR="${MONKCLI_NPM_PREFIX:-$HOME/.local}"
BIN_PATH="${PREFIX_DIR}/bin/monkcli"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required (usually bundled with Node.js)." >&2
  exit 1
fi

PNPM_CMD=()
if command -v pnpm >/dev/null 2>&1; then
  PNPM_CMD=(pnpm)
elif command -v corepack >/dev/null 2>&1; then
  PNPM_CMD=(corepack pnpm)
else
  echo "Error: pnpm not found. Install pnpm or enable corepack." >&2
  echo "Try: corepack enable" >&2
  exit 1
fi

# npm link with custom prefix expects these paths to exist.
mkdir -p "${PREFIX_DIR}/bin" "${PREFIX_DIR}/lib"

"${PNPM_CMD[@]}" -C "${REPO_DIR}" install
"${PNPM_CMD[@]}" -C "${REPO_DIR}" build

# Replace old manual symlink launcher if present.
if [[ -L "${BIN_PATH}" ]]; then
  rm -f "${BIN_PATH}"
fi

npm link --prefix "${PREFIX_DIR}" "${REPO_DIR}"

cat <<MSG
Global launcher installed via npm link.

Binary location:
  ${BIN_PATH}

You can now run:
  monkcli

If command is not found, add this to your shell profile (~/.bashrc, ~/.zshrc):
  export PATH="${PREFIX_DIR}/bin:\$PATH"
MSG
