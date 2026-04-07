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
