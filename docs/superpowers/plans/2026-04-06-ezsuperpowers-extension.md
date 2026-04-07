# ezsuperpowers VS Code Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension that auto-installs a Claude plugin injecting a nondev explanation layer into every brainstorming response.

**Architecture:** VS Code extension with a single plugin-bridge module. On activate, copies `claude-plugin/` to `~/.claude/plugins/cache/ezsuperpowers/` and registers it. The Claude plugin's `session-start` hook injects a persistent instruction into Claude's context: every brainstorming response must include a nondev-friendly cause-and-effect section alongside the technical content.

**Tech Stack:** TypeScript, esbuild, VS Code Extension API, bash (hooks)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Create | Extension manifest, identity, no contributes except activation |
| `tsconfig.json` | Create | TypeScript config (CommonJS, ES2024) |
| `esbuild.js` | Create | Bundle src/extension.ts → dist/extension.js |
| `eslint.config.mjs` | Create | Linting rules |
| `.vscodeignore` | Create | Exclude src, node_modules from .vsix |
| `src/types/index.ts` | Create | ExtensionModule interface only |
| `src/utils/index.ts` | Create | log() function only |
| `src/modules/plugin-bridge.ts` | Create | Copy plugin + register in Claude settings |
| `src/extension.ts` | Create | Activate pluginBridgeModule only |
| `claude-plugin/.claude-plugin/plugin.json` | Create | Plugin metadata |
| `claude-plugin/hooks/hooks.json` | Create | Declare SessionStart hook |
| `claude-plugin/hooks/session-start` | Create | Bash script injecting nondev instruction |
| `media/icon.png` | Copy | Marketplace icon (128x128) |

---

## Task 1: Project scaffold and package.json

**Files:**
- Create: `ezsuperpowers/package.json`
- Create: `ezsuperpowers/tsconfig.json`
- Create: `ezsuperpowers/esbuild.js`
- Create: `ezsuperpowers/.vscodeignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "ezsuperpowers",
  "displayName": "ezsuperpowers — Plain Language Mode for Claude",
  "description": "Adds a plain-language explanation layer to Claude brainstorming. Every technical response gets a nondev-friendly cause-and-effect summary.",
  "version": "0.1.0",
  "publisher": "NorwayIsHere",
  "license": "MIT",
  "engines": {
    "vscode": "^1.100.0"
  },
  "categories": ["Other", "Machine Learning"],
  "keywords": ["claude", "claude-code", "ai", "nondev", "brainstorm", "anthropic"],
  "galleryBanner": { "color": "#1a1a2e", "theme": "dark" },
  "icon": "media/icon.png",
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {},
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "npm run check-types && npm run lint && node esbuild.js",
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch",
    "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
    "package": "npm run check-types && npm run lint && node esbuild.js --production",
    "check-types": "tsc --noEmit",
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  },
  "devDependencies": {
    "@eslint/js": "^9.13.0",
    "@types/node": "^22",
    "@types/vscode": "^1.100.0",
    "esbuild": "^0.25.0",
    "eslint": "^9.13.0",
    "npm-run-all": "^4.1.5",
    "typescript": "^5.8.2",
    "typescript-eslint": "^8.26.0"
  },
  "dependencies": {}
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2024",
    "lib": ["ES2024"],
    "outDir": "out",
    "sourceMap": true,
    "strict": true,
    "rootDir": "src",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "out"]
}
```

- [ ] **Step 3: Create esbuild.js** (identical to template)

```js
const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => { console.log("[watch] build started"); });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`\u2718 [ERROR] ${text}`);
        if (location) {
          console.error(`    ${location.file}:${location.line}:${location.column}:`);
        }
      });
      console.log("[watch] build finished");
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [esbuildProblemMatcherPlugin],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Create .vscodeignore**

```
.vscode/**
src/**
out/**
node_modules/**
.gitignore
eslint.config.*
tsconfig.json
esbuild.js
**/*.ts
**/*.map
*.vsix
.DS_Store
docs/**
```

- [ ] **Step 5: Create eslint.config.mjs** (copy from template at `/Users/lab3/Desktop/agi/ezsuperpower/vs-code-extension-template/eslint.config.mjs`)

- [ ] **Step 6: Install dependencies**

```bash
cd /Users/lab3/Desktop/agi/ezsuperpower/ezsuperpowers
npm install
```

Expected: `node_modules/` created, no errors.

---

## Task 2: TypeScript source files

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/index.ts`
- Create: `src/extension.ts`

- [ ] **Step 1: Create src/types/index.ts**

```typescript
import * as vscode from "vscode";

export interface ExtensionModule {
  readonly id: string;
  activate(context: vscode.ExtensionContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
```

- [ ] **Step 2: Create src/utils/index.ts**

```typescript
import * as vscode from "vscode";

let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("ezsuperpowers");
  }
  return outputChannel;
}

export function log(message: string, level: "debug" | "info" | "warn" | "error" = "info"): void {
  const timestamp = new Date().toISOString();
  getOutputChannel().appendLine(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (level === "error") { console.error(message); }
}
```

- [ ] **Step 3: Create src/extension.ts**

```typescript
import * as vscode from "vscode";
import type { ExtensionModule } from "./types";
import { log } from "./utils";
import { pluginBridgeModule } from "./modules/plugin-bridge";

const modules: ExtensionModule[] = [
  pluginBridgeModule,
];

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  log("Activating ezsuperpowers...");
  for (const mod of modules) {
    try {
      await mod.activate(context);
      log(`Module "${mod.id}" activated`);
    } catch (err) {
      log(`Failed to activate module "${mod.id}": ${err}`, "error");
    }
  }
}

export async function deactivate(): Promise<void> {
  for (const mod of [...modules].reverse()) {
    try {
      await mod.deactivate?.();
    } catch (err) {
      log(`Failed to deactivate module "${mod.id}": ${err}`, "error");
    }
  }
}
```

---

## Task 3: Plugin bridge module

**Files:**
- Create: `src/modules/plugin-bridge.ts`

- [ ] **Step 1: Create src/modules/plugin-bridge.ts**

```typescript
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import type { ExtensionModule } from "../types";
import { log } from "../utils";

const PLUGIN_NAME = "ezsuperpowers";
const PLUGIN_VERSION = "0.1.0";

export const pluginBridgeModule: ExtensionModule = {
  id: "pluginBridge",

  async activate(context) {
    const extensionPath = context.extensionPath;
    const pluginSourceDir = path.join(extensionPath, "claude-plugin");
    const claudePluginsDir = path.join(getClaudeConfigDir(), "plugins", "cache", PLUGIN_NAME);

    try {
      copyDirRecursive(pluginSourceDir, claudePluginsDir);
      makeHooksExecutable(path.join(claudePluginsDir, "hooks"));
      log(`Claude plugin installed to ${claudePluginsDir}`);
    } catch (err) {
      log(`Failed to install Claude plugin: ${err}`, "error");
      return;
    }

    registerPluginInSettings(claudePluginsDir);

    vscode.window.showInformationMessage("ezsuperpowers: plain language mode active in Claude.");
  },
};

function getClaudeConfigDir(): string {
  const home = process.env["HOME"] ?? process.env["USERPROFILE"] ?? "";
  return path.join(home, ".claude");
}

function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    throw new Error(`Plugin source not found: ${src}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function makeHooksExecutable(hooksDir: string): void {
  if (!fs.existsSync(hooksDir)) { return; }
  for (const file of fs.readdirSync(hooksDir)) {
    // Make all files in hooks/ executable (session-start has no extension)
    const filePath = path.join(hooksDir, file);
    if (fs.statSync(filePath).isFile()) {
      fs.chmodSync(filePath, 0o755);
    }
  }
}

function registerPluginInSettings(pluginDir: string): void {
  const installedPluginsPath = path.join(getClaudeConfigDir(), "plugins", "installed_plugins.json");
  try {
    let installed: Record<string, unknown> = { version: 2, plugins: {} };
    if (fs.existsSync(installedPluginsPath)) {
      installed = JSON.parse(fs.readFileSync(installedPluginsPath, "utf-8"));
    }

    const plugins = (installed["plugins"] ?? {}) as Record<string, unknown[]>;
    // Always update to ensure latest version is registered
    plugins[PLUGIN_NAME] = [
      {
        scope: "user",
        installPath: pluginDir,
        version: PLUGIN_VERSION,
        installedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
    ];
    installed["plugins"] = plugins;

    fs.mkdirSync(path.dirname(installedPluginsPath), { recursive: true });
    fs.writeFileSync(installedPluginsPath, JSON.stringify(installed, null, 2));
    log(`Registered ${PLUGIN_NAME} plugin in Claude Code`);
  } catch (err) {
    log(`Failed to register plugin: ${err}`, "warn");
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/lab3/Desktop/agi/ezsuperpower/ezsuperpowers
npm run check-types
```

Expected: No errors.

---

## Task 4: Claude plugin — hooks and metadata

**Files:**
- Create: `claude-plugin/.claude-plugin/plugin.json`
- Create: `claude-plugin/hooks/hooks.json`
- Create: `claude-plugin/hooks/session-start`

- [ ] **Step 1: Create claude-plugin/.claude-plugin/plugin.json**

```json
{
  "name": "ezsuperpowers",
  "description": "Plain language explanation layer for Claude brainstorming — adds a nondev cause-and-effect summary to every technical response",
  "version": "0.1.0"
}
```

- [ ] **Step 2: Create claude-plugin/hooks/hooks.json**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/session-start\"",
            "async": false
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Create claude-plugin/hooks/session-start**

This is the core file — injects the nondev instruction into Claude's context on every session start.

```bash
#!/usr/bin/env bash

INSTRUCTION="## ezsuperpowers: Plain Language Mode

You are in plain language mode. This applies to ALL brainstorming, design questions, and technical decisions.

**RULE:** Every response that discusses a technical topic, a design choice, or a feature decision MUST contain two sections:

### Section 1: [Analysis]
Your normal technical explanation — architecture, trade-offs, implementation details.

### Section 2: [In Plain Terms]
Explain the same thing using cause-and-effect in product/UX language:
- Describe using user actions and visible outcomes: \"click the Login button → a panel slides open → if the password is wrong → the field turns red and shows a message immediately\"
- No technical jargon. If a term is unavoidable, explain it in parentheses right away.
- Maximum 3-4 sentences.
- Focus on: what the user does, what they see, what happens next, and why it matters to them.

This applies to EVERY response, not just complex ones. A simple choice still needs both sections. The [In Plain Terms] section should never be skipped."

ESCAPED=$(echo "$INSTRUCTION" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

echo "{\"hookSpecificOutput\": {\"hookEventName\": \"SessionStart\", \"additionalContext\": $ESCAPED}}"
```

- [ ] **Step 4: Make session-start executable**

```bash
chmod +x /Users/lab3/Desktop/agi/ezsuperpower/ezsuperpowers/claude-plugin/hooks/session-start
```

- [ ] **Step 5: Test the hook output manually**

```bash
/Users/lab3/Desktop/agi/ezsuperpower/ezsuperpowers/claude-plugin/hooks/session-start
```

Expected: Valid JSON output with `hookSpecificOutput.additionalContext` containing the instruction text. No errors.

---

## Task 5: Build and package

**Files:**
- Modify: `dist/extension.js` (generated)

- [ ] **Step 1: Copy icon from template**

```bash
cp /Users/lab3/Desktop/agi/ezsuperpower/vs-code-extension-template/media/icon.png \
   /Users/lab3/Desktop/agi/ezsuperpower/ezsuperpowers/media/icon.png
```

- [ ] **Step 2: Run production build**

```bash
cd /Users/lab3/Desktop/agi/ezsuperpower/ezsuperpowers
npm run package
```

Expected: `dist/extension.js` created, no TypeScript errors, no lint errors.

- [ ] **Step 3: Install vsce and package**

```bash
npm install -g @vscode/vsce
cd /Users/lab3/Desktop/agi/ezsuperpower/ezsuperpowers
vsce package
```

Expected: `ezsuperpowers-0.1.0.vsix` created. Check output — should be small (~50KB).

- [ ] **Step 4: Verify .vsix contents**

```bash
unzip -l ezsuperpowers-0.1.0.vsix
```

Expected output contains:
- `extension/dist/extension.js`
- `extension/claude-plugin/hooks/session-start`
- `extension/claude-plugin/hooks/hooks.json`
- `extension/claude-plugin/.claude-plugin/plugin.json`
- `extension/media/icon.png`
- `extension/package.json`

Does NOT contain: `extension/src/`, `extension/node_modules/`, `extension/tsconfig.json`

- [ ] **Step 5: Commit**

```bash
cd /Users/lab3/Desktop/agi/ezsuperpower/ezsuperpowers
git init
git add package.json tsconfig.json esbuild.js eslint.config.mjs .vscodeignore
git add src/ claude-plugin/ media/
git add docs/
git commit -m "feat: initial ezsuperpowers VS Code extension

Adds plain language layer to Claude via Claude plugin.
Session-start hook injects nondev cause-and-effect instruction."
```
