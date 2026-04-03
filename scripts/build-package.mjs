#!/usr/bin/env node
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, "..");
const distDir = path.join(repoDir, "dist");
const entryFile = path.join(repoDir, "apps", "cli", "src", "index.tsx");
const aliasMap = new Map([
  ["@monkcli/contracts", path.join(repoDir, "packages", "contracts", "src", "index.ts")],
  ["@monkcli/engine", path.join(repoDir, "packages", "engine", "src", "index.ts")],
  ["@monkcli/storage-local", path.join(repoDir, "packages", "storage-local", "src", "index.ts")],
]);

const aliasPlugin = {
  name: "monkcli-aliases",
  setup(buildContext) {
    buildContext.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: "react-devtools-core",
      namespace: "monkcli-stubs",
    }));

    buildContext.onLoad({ filter: /^react-devtools-core$/, namespace: "monkcli-stubs" }, () => ({
      contents: [
        "const devtools = {",
        "  initialize() {},",
        "  connectToDevTools() {},",
        "};",
        "export default devtools;",
      ].join("\n"),
      loader: "js",
    }));

    buildContext.onResolve({ filter: /^@monkcli\// }, (args) => {
      const resolved = aliasMap.get(args.path);
      if (!resolved) {
        return {
          errors: [{ text: `Unknown local package alias: ${args.path}` }],
        };
      }

      return { path: resolved };
    });
  },
};

await rm(distDir, { recursive: true, force: true });

await build({
  entryPoints: [entryFile],
  outfile: path.join(distDir, "monkcli.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  jsx: "automatic",
  sourcemap: false,
  packages: "external",
  define: {
    "process.env.DEV": "\"false\"",
  },
  logLevel: "info",
  plugins: [aliasPlugin],
});
