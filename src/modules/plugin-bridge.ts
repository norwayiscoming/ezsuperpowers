import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import type { ExtensionModule } from "../types";
import { log } from "../utils";

const PLUGIN_NAME = "ezsuperpowers";

export const pluginBridgeModule: ExtensionModule = {
  id: "pluginBridge",

  async activate(context) {
    const pluginSourceDir = path.join(context.extensionPath, "claude-plugin");
    const customPluginDir = path.join(getClaudeConfigDir(), "custom-plugins", PLUGIN_NAME);

    if (!fs.existsSync(pluginSourceDir)) {
      log(`Claude plugin source not found: ${pluginSourceDir}`, "error");
      return;
    }

    try {
      copyDirRecursive(pluginSourceDir, customPluginDir);
      makeHooksExecutable(path.join(customPluginDir, "hooks"));
      log(`Claude plugin installed to ${customPluginDir}`);
    } catch (err) {
      log(`Failed to install Claude plugin: ${err}`, "error");
      return;
    }

    vscode.window.showInformationMessage("ezsuperpowers: plain language mode active in Claude.");
  },
};

function getClaudeConfigDir(): string {
  const home = process.env["HOME"] ?? process.env["USERPROFILE"] ?? "";
  return path.join(home, ".claude");
}

function copyDirRecursive(src: string, dest: string): void {
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
