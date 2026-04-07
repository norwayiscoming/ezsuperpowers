import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import type { ExtensionModule } from "../types";
import { log } from "../utils";

const PLUGIN_NAME = "ezsuperpowers";
const PLUGIN_VERSION = "0.5.0";

export const pluginBridgeModule: ExtensionModule = {
  id: "pluginBridge",

  async activate(context) {
    const pluginSourceDir = path.join(context.extensionPath, "claude-plugin");

    if (!fs.existsSync(pluginSourceDir)) {
      log(`Claude plugin source not found: ${pluginSourceDir}`, "error");
      return;
    }

    try {
      makeHooksExecutable(path.join(pluginSourceDir, "hooks"));
    } catch (err) {
      log(`Failed to chmod hooks: ${err}`, "warn");
    }

    registerPluginInSettings(pluginSourceDir);
    enablePluginInClaudeSettings();

    vscode.window.showInformationMessage("ezsuperpowers: plain language mode active in Claude.");
    log(`Claude plugin registered from ${pluginSourceDir}`);
  },
};

function getClaudeConfigDir(): string {
  const home = process.env["HOME"] ?? process.env["USERPROFILE"] ?? "";
  return path.join(home, ".claude");
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
    log(`Registered ${PLUGIN_NAME} plugin pointing to ${pluginDir}`);
  } catch (err) {
    log(`Failed to register plugin: ${err}`, "warn");
  }
}
