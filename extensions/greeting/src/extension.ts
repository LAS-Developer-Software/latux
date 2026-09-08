import * as vscode from 'vscode';

const CONFIG_KEY = 'greeting.userName';

function getGreetingByTime(): string {
	const hour = new Date().getHours();

	if (hour >= 6 && hour < 11) {
		return '🌄 Guten Morgen';
	} else if (hour >= 11 && hour < 17) {
		return '☀️ Guten Tag';
	} else if (hour >= 17 && hour < 22) {
		return '🌆 Guten Abend';
	} else {
		return '🌙 Gute Nacht';
	}
}

async function getUserName(): Promise<string | undefined> {
	const config = vscode.workspace.getConfiguration();
	return config.get<string>(CONFIG_KEY);
}

async function setUserName(name: string): Promise<void> {
	const config = vscode.workspace.getConfiguration();
	await config.update(CONFIG_KEY, name, vscode.ConfigurationTarget.Global);
}

async function showWelcomeMessage(): Promise<void> {
	let userName = await getUserName();

	if (!userName) {
		// First time: ask for name
		const inputName = await vscode.window.showInputBox({
			prompt: 'Wie möchtest du genannt werden? / What\'s your name?',
			placeHolder: 'Max Mustermann',
			ignoreFocusOut: true,
		});

		if (inputName) {
			userName = inputName.trim();
			await setUserName(userName);
		} else {
			return; // User cancelled
		}
	}

	// Show greeting with name
	const greeting = getGreetingByTime();
	const message = `${greeting}, ${userName}! 👋`;

	vscode.window.showInformationMessage(message);

	// Also show in output channel for persistence
	const outputChannel = vscode.window.createOutputChannel('Greeting');
	outputChannel.appendLine(`${new Date().toLocaleString()} - ${message}`);
}

async function changeUserName(): Promise<void> {
	const currentName = await getUserName();
	const newName = await vscode.window.showInputBox({
		prompt: 'Gib deinen neuen Namen ein / Enter your new name',
		value: currentName || '',
		placeHolder: 'Max Mustermann',
		ignoreFocusOut: true,
	});

	if (newName) {
		await setUserName(newName.trim());
		vscode.window.showInformationMessage(`👤 Name updated to: ${newName}`);
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Greeting extension is now active');

	// Show welcome on startup
	showWelcomeMessage();

	// Register commands
	const showWelcomeDisposable = vscode.commands.registerCommand(
		'greeting.showWelcome',
		showWelcomeMessage
	);

	const changeNameDisposable = vscode.commands.registerCommand(
		'greeting.changeName',
		changeUserName
	);

	context.subscriptions.push(showWelcomeDisposable, changeNameDisposable);
}

export function deactivate() {
	console.log('Greeting extension is now deactivated');
}
