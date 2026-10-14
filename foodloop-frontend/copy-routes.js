import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');

if (fs.existsSync(distDir)) {
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
        const indexHtml = fs.readFileSync(indexPath, 'utf8');

        // Always create 404.html for static hosting fallback
        fs.writeFileSync(path.join(distDir, '404.html'), indexHtml);

        // Pre-render route folders with index.html for all SPA routes
        const routes = [
            'register',
            'login',
            'dashboard',
            'donate',
            'available-food',
            'my-requests',
            'donor-requests',
            'my-donations'
        ];

        routes.forEach((route) => {
            const routeDir = path.join(distDir, route);
            if (!fs.existsSync(routeDir)) {
                fs.mkdirSync(routeDir, { recursive: true });
            }
            fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml);
        });

        console.log('✓ Successfully generated SPA route HTML files (register, login, etc.) and 404.html fallback.');
    }
}
