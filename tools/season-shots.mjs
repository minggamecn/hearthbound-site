/**
 * The site's season screenshots: the store colony (sims/tools/store/colony.ts) in autumn and in winter, shown with
 * the game's `?season=` preview at the smoke test's iPhone size (390 x 844 CSS px at 3x), in English and Chinese.
 * Needs the game's web build and the store colony's saves:
 *
 *   (in sims) ./tools/build.ps1 web-mobile; npx tsx tools/store/colony.ts
 *   node tools/season-shots.mjs [path to sims]     # writes sims/build/site/*.png, then run make-images.py
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(process.argv[2] ?? join(import.meta.dirname, '../../sims'));
const { chromium } = await import(pathToFileURL(join(ROOT, 'node_modules/playwright-core/index.mjs')).href);
const BUILD = join(ROOT, 'build/web-mobile');
const SAVES = join(ROOT, 'build/store/saves');
const OUT = join(ROOT, 'build/site');
mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.wasm': 'application/wasm', '.bin': 'application/octet-stream', '.cconb': 'application/octet-stream' };
const SHOTS = [
    { name: 'autumn', save: 'colony', season: 'autumn:0.75', hour: 11 },
    { name: 'winter', save: 'winter', season: 'winter:0.4', hour: 11 },
];

const server = await new Promise((resolve) => {
    const s = createServer((req, res) => {
        const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
        let file = join(BUILD, path || 'index.html');
        if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
        if (!existsSync(file)) return res.writeHead(404).end();
        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
        createReadStream(file).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => resolve(s));
});
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.HB_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const lang of ['en', 'zh-Hans']) {
    for (const shot of SHOTS) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: lang === 'en' ? 'en-US' : 'zh-CN' });
        await context.addInitScript((text) => {
            localStorage.clear();
            localStorage.setItem('hearthbound.save.1', text);
            // The game's guide (sims docs/GUIDE.md): no tip, advice, welcome or "what's new" line over the shots.
            localStorage.setItem('hearthbound.settings', JSON.stringify({ tips: false, advice: false }));
            localStorage.setItem('hearthbound.guide.1', JSON.stringify({ seen: [], welcomed: true }));
        }, readFileSync(join(SAVES, `${shot.save}.json`), 'utf8'));
        const page = await context.newPage();
        page.on('pageerror', (e) => console.log(`page error: ${e.message}`));
        await page.goto(`${url}?lang=${lang}&season=${shot.season}`);
        await page.waitForFunction(() => globalThis.hearthbound?.artReady === true, null, { timeout: 60000 });
        await page.waitForTimeout(1500);
        await page.evaluate(() => {
            const g = globalThis.hearthbound;
            const r = g.root;
            for (let i = 0; i < 40 && r.cards.isOpen; i++) r.cards.showNext();
            const events = g.world.events;
            for (let i = events.length - 1; i >= 0; i--) if (events[i].text?.k === 'root.welcomeBack') events.splice(i, 1);
            const xs = [], ys = [];
            for (const room of g.world.structures.rooms) { xs.push(room.x, room.x + room.def.width - 1); ys.push(room.y, room.y + room.def.height - 1); }
            const pad = 2, x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
            r.focusRect(x0, y0, Math.max(...xs) - x0 + pad + 1, Math.max(...ys) - y0 + pad + 1);
        });
        await page.waitForFunction(() => !globalThis.hearthbound.root.camGoal, null, { timeout: 10000 }).catch(() => console.log('camera did not settle'));
        // Let the fades finish (FADE_SECONDS) and particles fill the air.
        await page.waitForTimeout(4000);
        const file = join(OUT, `${shot.name}${lang === 'en' ? '' : '-zh'}.png`);
        await page.screenshot({ path: file });
        console.log(file, await page.evaluate(() => { const w = globalThis.hearthbound.world; return `day ${w.clock.day} ${w.clock.hour}:00 ${w.season}`; }));
        await context.close();
    }
}
await browser.close();
server.close();
