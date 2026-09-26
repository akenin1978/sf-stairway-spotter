import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm, rename } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { PUBLIC_METADATA, APP_METADATA } from '../src/publicMetadata.js';
const outputArg = process.argv.indexOf('--outDir');
const out = path.resolve(outputArg >= 0 ? process.argv[outputArg+1] : 'dist');
const shell = await readFile(path.join(out,'index.html'),'utf8');
const manifest = JSON.parse(await readFile(path.join(out,'.vite/manifest.json'),'utf8'));
const cacheDir = await mkdtemp(path.join(tmpdir(),'sf-public-render-'));
const server = await createServer({cacheDir, optimizeDeps:{noDiscovery:true,include:[]}, server:{middlewareMode:true,hmr:{server:createHttpServer()},watch:null},appType:'custom'});
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
try {
  const { renderPublicPage, renderMapIntroduction } = await server.ssrLoadModule('/src/prerender.jsx');
  const imageEntry = Object.values(manifest).find(entry => entry.src?.endsWith('AppIcon-512@2x.png'));
  if (!imageEntry) throw new Error('Missing social preview image');
  const image = `https://www.sfstairwayspotter.com/${imageEntry.file}`;
  function documentFor(markup, title, description, canonical) {
    markup = markup.replace(/\?opened=\d+/g, '');
    for (const [source, entry] of Object.entries(manifest)) {
      markup = markup.replaceAll(`"/${source}"`, `"/${entry.file}"`);
    }
    if (/="\/(src|ios)\//.test(markup)) throw new Error('Unresolved source asset in generated HTML');
    return shell.replace('<html lang="en">','<html lang="en" class="public-page-document">')
      .replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SF Stairway Spotter" />
    <meta property="og:title" content="${escape(title)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="SF Stairway Spotter app icon" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escape(title)}" />
    <meta name="twitter:description" content="${escape(description)}" />
    <meta name="twitter:image" content="${image}" />`)
      .replace('<div id="root"></div>',`<div id="root">${markup}</div>`);
  }
  for(const [route,[title,description]] of Object.entries(PUBLIC_METADATA)) {
    const dir=path.join(out,route.slice(1)); await mkdir(dir,{recursive:true});
    const canonical=`https://www.sfstairwayspotter.com${route === '/welcome' ? '/' : route}`;
    await writeFile(path.join(dir,'index.html'),documentFor(renderPublicPage(route),title,description,canonical));
  }
  await writeFile(path.join(out,'index.html'),documentFor(renderMapIntroduction(),...APP_METADATA,'https://www.sfstairwayspotter.app/'));
  if (process.argv.includes('--web')) await rename(path.join(out,'index.html'), path.join(out,'app-shell.html'));
  const urls = Object.keys(PUBLIC_METADATA).map(route => `https://www.sfstairwayspotter.com${route === '/welcome' ? '/' : route}`);
  await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
  await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://www.sfstairwayspotter.com/sitemap.xml\n');
  console.log(`Generated ${Object.keys(PUBLIC_METADATA).length} public pages and readable map introduction.`);
} finally { await server.close(); await rm(cacheDir,{recursive:true,force:true}); }
