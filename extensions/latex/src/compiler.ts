import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export async function repairCompiler(): Promise<void> {
    const compiler = await vscode.window.showQuickPick([
        { label: 'Tectonic', value: 'tectonic' },
        { label: 'pdflatex', value: 'pdflatex' },
        { label: 'latexmk', value: 'latexmk' }
    ], { placeHolder: 'LaTeX-Compiler auswählen' });
    if (!compiler) {
        return;
    }

    const settings = vscode.workspace.getConfiguration('latex');
    await settings.update('compiler', compiler.value, vscode.ConfigurationTarget.Global);
    await settings.update('compilerPath', undefined, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`LaTeX-Compiler auf ${compiler.label} gesetzt.`);
}

export function compileLatex(file: string): Promise<void> {
    const outputDirectory = path.join(path.dirname(file), 'build');
    const settings = vscode.workspace.getConfiguration('latex');
    const compiler = settings.get<string>('compiler', 'tectonic');
    const compilerPath = settings.get<string>('compilerPath') || compiler;
    const cmd = compiler === 'pdflatex'
        ? `pdflatex -interaction=nonstopmode -halt-on-error -output-directory "${outputDirectory}" "${file}"`
        : compiler === 'latexmk'
            ? `latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir="${outputDirectory}" "${file}"`
            : `"${compilerPath}" "${file}" --outdir "${outputDirectory}"`;

    return fs.promises.mkdir(outputDirectory, { recursive: true }).then(() => new Promise((resolve, reject) => {
        exec(cmd, { cwd: path.dirname(file) }, (err, _stdout, stderr) => {
            if (err) {
                const message = err.message.toLowerCase().includes('not found') || err.message.includes('nicht gefunden')
                    ? `Der LaTeX-Compiler "${compilerPath}" wurde nicht gefunden. Installiere ihn über die LaTeX-Seitenleiste oder setze latex.compiler auf "pdflatex".`
                    : stderr.trim() || err.message;
                vscode.window.showErrorMessage(`LaTeX-Kompilierung fehlgeschlagen: ${message}`);
                reject(err);
                return;
            }
            vscode.window.showInformationMessage('LaTeX erfolgreich kompiliert.');
            resolve();
        });
    }));
}
