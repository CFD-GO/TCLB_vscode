// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, languages, commands, Disposable, workspace, window } from 'vscode';
import { CodelensProvider } from './CodelensProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

var disposables: Disposable[] = [];

export function activate(context: ExtensionContext) {
    let codelensProvider = new CodelensProvider();

    languages.registerCodeLensProvider({language: "xml"}, codelensProvider);

    commands.registerCommand("tclb-helper.enableCodeLens", () => {
        workspace.getConfiguration("tclb-helper").update("enableCodeLens", true, true);
    });

    commands.registerCommand("tclb-helper.disableCodeLens", () => {
        workspace.getConfiguration("tclb-helper").update("enableCodeLens", false, true);
    });

    commands.registerCommand("tclb-helper.codelensAction", (args) => {
        window.showInformationMessage(args);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (disposables) {
        disposables.forEach(item => item.dispose());
    }
    disposables = [];
}
