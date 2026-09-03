//@ts-check

'use strict';

const path = require('path');

module.exports = {
    context: path.join(__dirname, '..'),
    mode: 'none',
    target: 'node',
    entry: {
        extension: './src/extension.ts'
    },
    output: {
        path: path.join(__dirname, '../dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader'
                }]
            }
        ]
    },
    externals: {
        vscode: 'commonjs vscode'
    }
};