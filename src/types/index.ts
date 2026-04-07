import * as vscode from "vscode";

export interface ExtensionModule {
  readonly id: string;
  activate(context: vscode.ExtensionContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
