import * as vscode from 'vscode';

export async function openOverleaf() {
    try {
        await vscode.commands.executeCommand('simpleBrowser.show', 'https://www.overleaf.com');
    } catch {
        await vscode.env.openExternal(vscode.Uri.parse('https://www.overleaf.com'));
        vscode.window.showWarningMessage('Der integrierte Browser ist nicht verfügbar. Overleaf wurde extern geöffnet.');
    }
}
