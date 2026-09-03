import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { execFile } from 'child_process';
import * as vscode from 'vscode';

interface ReleaseAsset {
    name: string;
    browser_download_url: string;
}

interface Release {
    assets: ReleaseAsset[];
}

function requestJson(url: string): Promise<Release> {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'vscode-oss-latex-extension' } }, response => {
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                requestJson(response.headers.location).then(resolve, reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`GitHub antwortete mit HTTP ${response.statusCode ?? 'unbekannt'}.`));
                return;
            }
            let body = '';
            response.setEncoding('utf8');
            response.on('data', chunk => body += chunk);
            response.on('end', () => {
                try {
                    resolve(JSON.parse(body) as Release);
                } catch {
                    reject(new Error('Die Release-Informationen waren ungültig.'));
                }
            });
        }).on('error', reject);
    });
}

function download(url: string, target: string): Promise<void> {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'vscode-oss-latex-extension' } }, response => {
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                download(response.headers.location, target).then(resolve, reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Download fehlgeschlagen: HTTP ${response.statusCode ?? 'unbekannt'}.`));
                return;
            }
            const file = fs.createWriteStream(target);
            response.pipe(file);
            file.on('finish', () => file.close(() => resolve()));
            file.on('error', reject);
        }).on('error', reject);
    });
}

function extractArchive(archive: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
        execFile('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
            '-Command', `Expand-Archive -LiteralPath '${archive.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force`
        ], error => error ? reject(error) : resolve());
    });
}

export async function installTectonic(context: vscode.ExtensionContext): Promise<void> {
    if (process.platform !== 'win32') {
        vscode.window.showErrorMessage('Der Tectonic-Installer ist derzeit nur für Windows verfügbar.');
        return;
    }

    const settings = vscode.workspace.getConfiguration('latex');
    const currentPath = settings.get<string>('compilerPath');
    if (currentPath && fs.existsSync(currentPath)) {
        vscode.window.showInformationMessage('Tectonic ist bereits installiert.');
        return;
    }

    const bundledExecutable = path.join(context.extensionPath, 'bin', 'tectonic.exe');
    if (fs.existsSync(bundledExecutable)) {
        await settings.update('compilerPath', bundledExecutable, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Die mitgelieferte Tectonic-Version ist jetzt aktiviert.');
        return;
    }

    const choice = await vscode.window.showWarningMessage(
        'Tectonic ist nicht mitgeliefert. Es wird aus dem offiziellen GitHub-Release heruntergeladen und im VS-Code-Extension-Speicher installiert.',
        { modal: true },
        'Herunterladen und installieren'
    );
    if (choice !== 'Herunterladen und installieren') {
        return;
    }

    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Tectonic wird installiert',
            cancellable: false
        }, async progress => {
            progress.report({ message: 'Release wird abgerufen' });
            const release = await requestJson('https://api.github.com/repos/tectonic-typesetting/tectonic/releases/latest');
            const asset = release.assets.find(item => /x86_64-pc-windows-msvc\.zip$/i.test(item.name));
            if (!asset) {
                throw new Error('Kein passendes offizielles Windows-Release gefunden.');
            }

            const directory = path.join(context.globalStorageUri.fsPath, 'tectonic');
            const archive = path.join(context.globalStorageUri.fsPath, asset.name);
            await fs.promises.mkdir(directory, { recursive: true });
            progress.report({ message: 'Release wird heruntergeladen' });
            await download(asset.browser_download_url, archive);
            progress.report({ message: 'Dateien werden entpackt' });
            await extractArchive(archive, directory);
            await fs.promises.unlink(archive);

            const executable = path.join(directory, 'tectonic.exe');
            if (!fs.existsSync(executable)) {
                throw new Error('Tectonic.exe wurde im Release nicht gefunden.');
            }
            await vscode.workspace.getConfiguration('latex').update('compilerPath', executable, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Tectonic wurde erfolgreich installiert.');
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Tectonic-Installation fehlgeschlagen: ${message}`);
    }
}
