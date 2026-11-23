// Renders the link-preview images (1200x630) used in Open Graph / Twitter meta tags.
//
//   npm install --no-save playwright && npx playwright install chromium
//   node tools/make-og-cards.js
//
// Writes images/og/home.jpg and images/og/<post-slug>.jpg for every post listed in index.html.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'images', 'og');
const template = 'file:///' + path.join(__dirname, 'og-card.html').replace(/\\/g, '/');

function loadPosts() {
    const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const files = [...index.matchAll(/<script src="(blogs\/[^"]+\.js)"><\/script>/g)].map(match => match[1]);
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox));
    return sandbox.window.blogPosts || [];
}

function formatDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

(async () => {
    fs.mkdirSync(outDir, { recursive: true });
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    const jobs = [{ file: 'home.jpg', query: 'kind=home' }];
    loadPosts().forEach((post, index) => {
        const query = new URLSearchParams({
            kind: 'post',
            title: post.title,
            kicker: `§06 Writing · ${formatDate(post.date)} · ${post.readingTime} min read`,
            tags: (post.tags || []).slice(0, 4).join(' · '),
            seed: String(23 + index * 11)
        });
        jobs.push({ file: `${post.slug}.jpg`, query: query.toString() });
    });
    for (const job of jobs) {
        await page.goto(`${template}?${job.query}`);
        await page.waitForSelector('body[data-ready="true"]', { timeout: 15000 });
        await page.screenshot({ path: path.join(outDir, job.file), type: 'jpeg', quality: 88 });
        console.log('wrote images/og/' + job.file);
    }
    await browser.close();
})();
