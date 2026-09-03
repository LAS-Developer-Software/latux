import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class LatexProjectProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly changedEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData = this.changedEmitter.event;
    private watcher?: vscode.FileSystemWatcher;

    constructor() {
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{tex,pdf}');
        this.watcher.onDidCreate(() => this.refresh());
        this.watcher.onDidDelete(() => this.refresh());
        this.watcher.onDidChange(() => this.refresh());
    }

    dispose() {
        this.watcher?.dispose();
        this.changedEmitter.dispose();
    }

    refresh() {
        this.changedEmitter.fire(undefined);
    }

    getTreeItem(item: vscode.TreeItem) {
        return item;
    }

    async getChildren(element?: LatexProjectItem): Promise<vscode.TreeItem[]> {
        if (element) {
            return this.readDirectory(element.resourceUri.fsPath);
        }

        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            return [new OverleafItem(), new RepairCompilerItem(), new InstallTectonicItem()];
        }
        return [new OverleafItem(), new RepairCompilerItem(), new InstallTectonicItem(), ...folders.map(folder => new LatexProjectItem(
            folder.name,
            folder.uri,
            vscode.TreeItemCollapsibleState.Collapsed,
            true
        ))];
    }

    private async readDirectory(directory: string): Promise<LatexProjectItem[]> {
        try {
            const entries = await fs.promises.readdir(directory, { withFileTypes: true });
            return entries
                .filter(entry => entry.isDirectory() || /\.(tex|pdf)$/i.test(entry.name))
                .filter(entry => !entry.name.startsWith('.'))
                .sort((left, right) => Number(right.isDirectory()) - Number(left.isDirectory()) || left.name.localeCompare(right.name))
                .map(entry => {
                    const resourceUri = vscode.Uri.file(path.join(directory, entry.name));
                    return new LatexProjectItem(
                        entry.name,
                        resourceUri,
                        entry.isDirectory() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                        entry.isDirectory()
                    );
                });
        } catch {
            return [];
        }
    }
}

class InstallTectonicItem extends vscode.TreeItem {
    constructor() {
        super('Tectonic installieren', vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'latexInstallTectonic';
        this.iconPath = new vscode.ThemeIcon('cloud-download');
        this.command = {
            command: 'latex.installTectonic',
            title: 'Tectonic installieren'
        };
    }
}

class OverleafItem extends vscode.TreeItem {
    constructor() {
        super('Overleaf.com im Browser öffnen', vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('globe');
        this.command = { command: 'latex.openOverleaf', title: 'Overleaf öffnen' };
    }
}

class RepairCompilerItem extends vscode.TreeItem {
    constructor() {
        super('Compiler reparieren', vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('tools');
        this.command = { command: 'latex.repairCompiler', title: 'Compiler reparieren' };
    }
}

export class LatexProjectItem extends vscode.TreeItem {
    constructor(
        label: string,
        public override readonly resourceUri: vscode.Uri,
        collapsibleState: vscode.TreeItemCollapsibleState,
        isDirectory: boolean
    ) {
        super(label, collapsibleState);
        this.contextValue = isDirectory ? 'latexProjectFolder' : 'latexProjectFile';
        this.iconPath = isDirectory ? new vscode.ThemeIcon('folder') : new vscode.ThemeIcon(resourceUri.path.toLowerCase().endsWith('.pdf') ? 'file-pdf' : 'file-code');
        if (!isDirectory) {
            this.command = {
                command: 'vscode.open',
                title: 'Open LaTeX file',
                arguments: [resourceUri]
            };
        }
    }
}
