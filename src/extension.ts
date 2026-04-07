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
