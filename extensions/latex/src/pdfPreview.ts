import * as vscode from 'vscode';

export function openPdfPreview(pdfPath: string) {
    if (!require('fs').existsSync(pdfPath)) {
        vscode.window.showErrorMessage(`PDF nicht gefunden: ${pdfPath}`);
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'pdfPreview',
        'PDF Preview',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(require('path').dirname(pdfPath))]
        }
    );

    const pdfUri = panel.webview.asWebviewUri(vscode.Uri.file(pdfPath));
    const html = `
        <!DOCTYPE html>
        <html><body style="margin:0;overflow:hidden;background:#202124;">
        <embed src="${pdfUri}" type="application/pdf" style="width:100vw;height:100vh;">
        </body></html>
    `;
    panel.webview.html = html;
}
