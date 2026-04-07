import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import type { ExtensionModule } from "../types";
import { log } from "../utils";

const PLUGIN_NAME = "ezsuperpowers";
const PLUGIN_VERSION = "0.4.0";

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
    enablePluginInClaudeSettings();

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
    const filePath = path.join(hooksDir, file);
    if (fs.statSync(filePath).isFile()) {
      fs.chmodSync(filePath, 0o755);
    }
  }
}

function enablePluginInClaudeSettings(): void {
  const settingsPath = path.join(getClaudeConfigDir(), "settings.json");
  try {
    let settings: Record<string, unknown> = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    }
    const enabled = (settings["enabledPlugins"] ?? {}) as Record<string, boolean>;
    enabled[PLUGIN_NAME] = true;
    settings["enabledPlugins"] = enabled;
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    log(`Enabled ${PLUGIN_NAME} in Claude settings.json`);
  } catch (err) {
    log(`Failed to enable plugin in settings.json: ${err}`, "warn");
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
