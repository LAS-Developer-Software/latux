export const customStartPageHtml = `
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h1>Willkommen in deinem Editor</h1>
    <button onclick="acquireVsCodeApi().postMessage({ command: 'openOverleaf' })"
        style="padding: 10px 20px; font-size: 16px;">
        Overleaf öffnen
    </button>
</body>
</html>
`;
