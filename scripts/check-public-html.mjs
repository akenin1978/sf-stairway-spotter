import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import { PUBLIC_METADATA } from '../src/publicMetadata.js';
const isWeb = process.argv.includes('--web');
const output = isWeb ? 'web-dist' : 'dist';
const config=JSON.parse(await readFile('vercel.json','utf8'));
let checks=0;
for(const [route,[title,description]] of Object.entries(PUBLIC_METADATA)) {
 const html=await readFile(`${output}${route}/index.html`,'utf8');
 assert.ok(html.includes(`<title>${title}</title>`),route+' title');
 assert.ok(html.includes(`<h1>`),route+' visible heading');
 assert.ok(html.includes(description),route+' description');
 for (const property of ['og:title','og:description','og:url','og:image','og:image:alt']) assert.ok(html.includes(`property="${property}"`),route+' '+property);
 assert.ok(html.includes('name="twitter:card"'),route+' social card');
 assert.ok(html.includes('rel="canonical"'),route+' canonical');
 assert.ok(!html.includes('<div id="root"></div>'),route+' not empty');
 assert.ok(!html.includes('="/src/'),route+' no source assets');
 assert.ok(html.includes('class="public-page-document"'),route+' no-JS scrolling');
 assert.ok(config.rewrites.some(r=>r.source===route && r.destination===`${route}/index.html`));
 for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) await access(output+match[1]);
 console.log('PASS HTML, metadata, asset files and routing:',route);checks++;
}
const faq=await readFile(`${output}/faq/index.html`,'utf8');
assert.ok(faq.includes('Purchase restoration instructions will be added'));
assert.ok(faq.includes('Your first 10 unique verified stairways'));
const pricing=await readFile(`${output}/pricing/index.html`,'utf8');
for(const text of ['$6.99','$9.99','$3.99','Paid features are not yet available']) assert.ok(pricing.includes(text));
const app=await readFile(`${output}/${isWeb ? 'app-shell' : 'index'}.html`,'utf8');assert.ok(app.includes('interactive map requires JavaScript'));
assert.ok(config.rewrites.some(r=>r.source==='/' && r.has?.[0]?.type==='host' && r.destination==='/welcome/index.html'));
console.log(`${checks} public routes passed, plus complete FAQ answers, pricing, map fallback and host routing.`);

if (isWeb) {
 await assert.rejects(access('web-dist/index.html'));
 assert.equal(config.rewrites[0].has[0].key,'password-reset');
 console.log('PASS no filesystem root collision; recovery route takes precedence');
}

const signup=await readFile(`${output}/mailing-list/index.html`,'utf8');
assert.ok(signup.includes('urbanhikersf.us6.list-manage.com/subscribe/post?'));
assert.ok(signup.includes('name="EMAIL"'));
assert.ok(signup.includes('name="gdpr[91744]"'));
assert.ok(!signup.includes('checked=""'));
assert.ok(signup.includes('name="b_1554420032553d4d674c87ce9_281e883bf2"'));
assert.ok(!signup.includes('mc-validate.js'));
assert.ok((await readFile(`${output}/sitemap.xml`,'utf8')).includes('/mailing-list'));
assert.ok((await readFile(`${output}/robots.txt`,'utf8')).includes('Sitemap:'));
console.log('PASS signup fields, unchecked consent, spam trap, sitemap and robots');

// Before React starts, the map shell must show only its loading screen.
const initialMap = app.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
assert.ok(initialMap.includes('Loading your map…'));
assert.ok(!initialMap.includes('href="/mailing-list"'));
assert.ok(!initialMap.includes('<form'));
assert.ok(app.includes('<noscript>'));
console.log('PASS map startup has no signup UI; no-JavaScript information preserved');
