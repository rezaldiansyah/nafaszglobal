import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dynamically find generated page HTML files
function getPageInputs() {
    const pagesDir = path.resolve(__dirname, 'pages');
    const inputs = { main: './index.html' };

    if (fs.existsSync(pagesDir)) {
        const dirs = fs.readdirSync(pagesDir, { withFileTypes: true });
        for (const dir of dirs) {
            if (dir.isDirectory()) {
                const htmlPath = path.join(pagesDir, dir.name, 'index.html');
                if (fs.existsSync(htmlPath)) {
                    inputs[`page-${dir.name}`] = htmlPath;
                }
            }
        }
    }

    return inputs;
}

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        assetsInlineLimit: 4096,
        rollupOptions: {
            input: getPageInputs(),
        },
    },
    server: {
        port: 3000,
        open: true,
    },
});
