import * as vscode from 'vscode';
import * as path from 'path';

export function openMiniEditor(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'miniEditor',
        'Mini Editor',
        vscode.ViewColumn.Active,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    const htmlPath = path.join(context.extensionPath, 'media', 'miniEditor.html');
    panel.webview.html = require('fs').readFileSync(htmlPath, 'utf8');

    panel.webview.onDidReceiveMessage(msg => {
        if (msg.command === 'insert') {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.insertSnippet(new vscode.SnippetString(msg.text));
            }
        }
    });
}
