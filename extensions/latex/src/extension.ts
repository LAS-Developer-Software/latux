import * as vscode from 'vscode';
import { openOverleaf } from './overleafPanel';
import { compileLatex, repairCompiler } from './compiler';
import { openMiniEditor } from './miniEditor';
import { openPdfPreview } from './pdfPreview';
import { LatexProjectProvider } from './latexProject';
import { installTectonic } from './tectonicInstaller';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const isLatexEditor = () => vscode.window.activeTextEditor?.document.languageId === 'latex';
    const getActiveTexFile = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'latex') {
            vscode.window.showErrorMessage('Öffne zuerst ein LaTeX-Dokument.');
            return undefined;
        }
        return editor.document.fileName;
    };

    // Overleaf im integrierten Browser öffnen
    context.subscriptions.push(
        vscode.commands.registerCommand('latex.openOverleaf', () => {
            void openOverleaf();
        })
    );

    // LaTeX kompilieren
    context.subscriptions.push(vscode.commands.registerCommand('latex.compile', () => {
        const file = getActiveTexFile();
        if (file) {
            void compileLatex(file).catch(() => undefined);
        }
    }));

    // PDF Preview öffnen
    context.subscriptions.push(
        vscode.commands.registerCommand('latex.previewPdf', async () => {
            const file = getActiveTexFile();
            if (!file) {
                return;
            }
            const pdfPath = path.join(path.dirname(file), 'build', path.basename(file).replace(/\.tex$/i, '.pdf'));
            if (!require('fs').existsSync(pdfPath)) {
                const choice = await vscode.window.showWarningMessage(
                    'Die PDF existiert noch nicht.',
                    'Jetzt kompilieren'
                );
                if (choice === 'Jetzt kompilieren') {
                    try {
                        await compileLatex(file);
                    } catch {
                        return;
                    }
                } else {
                    return;
                }
            }
            openPdfPreview(pdfPath);
        })
    );

    // Mini-Editor öffnen
    context.subscriptions.push(
        vscode.commands.registerCommand('latex.openMiniEditor', () => {
            openMiniEditor(context);
        })
    );

    // IntelliSense (LaTeX Vorschläge)
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('latex', {
            provideCompletionItems() {
                return [
                    new vscode.CompletionItem('\\section{}', vscode.CompletionItemKind.Snippet),
                    new vscode.CompletionItem('\\subsection{}', vscode.CompletionItemKind.Snippet),
                    new vscode.CompletionItem('\\begin{itemize}', vscode.CompletionItemKind.Snippet),
                    new vscode.CompletionItem('\\begin{figure}', vscode.CompletionItemKind.Snippet),
                    new vscode.CompletionItem('\\begin{table}', vscode.CompletionItemKind.Snippet),
                ];
            }
        })
    );

    const projectProvider = new LatexProjectProvider();
    context.subscriptions.push(projectProvider);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('latexProject', projectProvider));
    context.subscriptions.push(vscode.window.registerTreeDataProvider('latexToolsView', projectProvider));
    context.subscriptions.push(vscode.commands.registerCommand('latex.refreshProject', () => projectProvider.refresh()));
    context.subscriptions.push(vscode.commands.registerCommand('latex.installTectonic', () => installTectonic(context)));
    context.subscriptions.push(vscode.commands.registerCommand('latex.repairCompiler', () => repairCompiler()));

    const compileButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    compileButton.text = '$(play) LaTeX';
    compileButton.tooltip = 'LaTeX kompilieren';
    compileButton.command = 'latex.compile';
    compileButton.show();
    context.subscriptions.push(compileButton);

    const previewButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    previewButton.text = '$(open-preview) PDF';
    previewButton.tooltip = 'PDF-Preview öffnen';
    previewButton.command = 'latex.previewPdf';
    previewButton.show();
    context.subscriptions.push(previewButton);

    const updateStatusBar = () => {
        const visible = isLatexEditor();
        compileButton[visible ? 'show' : 'hide']();
        previewButton[visible ? 'show' : 'hide']();
    };
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBar));
    updateStatusBar();
}

export function deactivate() {}
