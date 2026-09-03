/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Complete list of directories where yarn should be executed to install node modules
exports.dirs = [
    '',
    'build',
    'build/lib/watch',
    'extensions',
    'extensions/image-preview',
    'extensions/json-language-features',
    'extensions/json-language-features/server',
    'extensions/markdown-language-features',
    'extensions/markdown-math',
    'remote',
    'remote/web',
    'test/automation',
    'test/integration/browser',
    'test/monaco',
    'test/smoke',
	'extensions/latex' // <-- Hier hinzufügen --- IGNORE ---
];