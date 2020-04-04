import * as vscode from 'vscode';
import * as units from './units';

/**
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private regexGauge: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    private unitsSI : units.unitSet = new units.unitSet();
    private gaugeSI : units.unitGauge = new units.unitGauge();
    public c_comment() : string {
        return JSON.stringify(this.gaugeSI);
    }
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    
    constructor() {
//        this.regex = /"(([0-9]*.)?[0-9]+([eE][-+]?[0-9]+)?[a-zA-Z/][a-zA-Z/0-9]*)"/g;
        this.regex = /(?<![0-9a-zA-Z])(([0-9]*[.])?[0-9]+([eE][+\\-]?[0-9]+)?[a-df-zA-DF-Z/][a-zA-Z/0-9]*)(?![0-9a-zA-Z])/g;

        this.regexGauge = /<[^>]*value *= *"([^"]*)"[^>]*gauge *= *"([^"]*)"[^>]*>/gm;
        this.unitsSI.value(2);
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        if (vscode.workspace.getConfiguration("tclb-helper").get("enableCodeLens", true)) {
            this.codeLenses = [];
            const regex = new RegExp(this.regex);
            const regexGauge = new RegExp(this.regexGauge);
            const text = document.getText();
            let matches;
            this.gaugeSI = new units.unitGauge();
            while ((matches = regexGauge.exec(text)) !== null) {
                let val1 : units.unitValue | null = this.unitsSI.readText(matches[1]);
                if (! val1) continue;
                let val2 : units.unitValue | null = this.unitsSI.readText(matches[2]);
                if (! val2) continue;
                this.gaugeSI.add(val1,val2);
            }
            this.gaugeSI.solve();
            while ((matches = regex.exec(text)) !== null) {
                let line = document.lineAt(document.positionAt(matches.index).line);
                let indexOf = line.text.indexOf(matches[0]);
                let position = new vscode.Position(line.lineNumber, indexOf);
                let range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                if (range) {
                    let c_title : string = "";
                    let c_message : string = "";
                    let val : string = matches[1];
                    let unitval : units.unitValue | null = this.unitsSI.readText(val);
                    if (unitval) {
                        if (this.gaugeSI.singular) {
                            c_title = val + " = NA (singular)";
                            c_message = "The gauge matrix cannot be solved.";
                        } else {
                            let unitless : { value: number, resolved: boolean} = this.gaugeSI.unitless(unitval)!;
                            if (unitless.resolved) {
                                c_title = val + " = " + unitless.value.toPrecision(3);
                                c_message = val + " = " + unitless.value.toString();
                            } else {
                                c_title = val + " = " + unitless.value.toPrecision(3) + " (gauge not set)";
                                c_message = "Gauge not set for some of units used";
                            }
                        }
                    } else {
                        c_title = val + " - unknown unit";
                        c_message = "Malformed unit: " + val;
                    }
                    let command = {
                        title: c_title,
                        tooltip: c_message,
                        command: "tclb-helper.codelensAction",
                        arguments: [c_message]
                    };
                    this.codeLenses.push(new vscode.CodeLens(range, command));
                }
            }
            return this.codeLenses;
        }
        return [];
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        if (vscode.workspace.getConfiguration("tclb-helper").get("enableCodeLens", true)) {
            return codeLens;
        }
        return null;
    }
}

