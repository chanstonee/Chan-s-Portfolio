import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { restoreAssets } from './restore-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'source');
await restoreAssets(source);
const config = JSON.parse(await readFile(path.join(root, 'config/site.json'), 'utf8'));
const base = process.env.BASE_PATH || config.basePath || '/';
if (!/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(base)) throw new Error('BASE_PATH must be / or /repository-name/');
const out = path.resolve(root, process.env.BUILD_DIR || 'dist');
if (![path.join(root, 'dist'), path.join(root, 'dist-test')].includes(out)) throw new Error('Unsupported build directory');
const siteUrl = (process.env.SITE_URL || config.siteUrl || '').replace(/\/$/, '');
const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
const pages = ['/', '/projects/dssystem', '/projects/shmycar', '/projects/playon', '/projects/gacha', '/projects/captain-crix', '/404'];
const origin = 'https://chanstone.framer.website';
const canonical = value => { try { const u = new URL(value.replaceAll('&amp;', '&')); return u.origin + u.pathname; } catch { return value; } };
const mapping = new Map(Object.entries(manifest).filter(([,v]) => v.file.startsWith('files/')).map(([url,v]) => [url, base + 'assets/' + path.basename(v.file)]));

function localize(text, url) {
  // Work cards in both column and list variants navigate in the current tab.
  text = text.replace(/openInNewTab:!0,scopeId:`(hZ_InEJqT|MKxXJ_5KD)`/g, 'openInNewTab:!1,scopeId:`$1`');
  text = text.replace(/(["'`])\.\/#(hero|work|about|services|contact)\1/g, (_, quote, section) => quote + base + '#' + section + quote);
  // CMS bundle URLs are computed from module URLs; resolve before relocating modules.
  text = text.replace(/new URL\(`([^`]+)`,`(https?[^`]+)`\)\.href\.replace\(`\/modules\/`,`\/cms\/`\)/g, (all, relative, originalBase) => {
    const cmsUrl = new URL(relative, originalBase).href.replace('/modules/', '/cms/');
    const target = mapping.get(canonical(cmsUrl));
    if (!target) throw new Error(`Missing CMS asset: ${cmsUrl}`);
    return `new URL(${JSON.stringify(target)},location.origin).href`;
  });
  text = text.replace(/https?:\/\/[^\s"'<>`\\)]+/g, value => mapping.get(canonical(value)) || value);
  text = text.replace(/(["'`])((?:\.\/|\.\.\/)[^"'`\s]+\.(?:mjs|js|css|json))\1/g, (all, quote, value) => {
    const target = mapping.get(canonical(new URL(value, url).href));
    return target ? quote + target + quote : all;
  });
  return text;
}

await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'assets'), { recursive: true });
const copied = [];
for (const [url, record] of Object.entries(manifest)) {
  if (!record.file.startsWith('files/')) continue;
  const input = path.join(source, record.file);
  const target = path.join(out, 'assets', path.basename(record.file));
  if (input.endsWith('.framercms')) {
    // The binary CMS index stores byte offsets. Preserve every string's byte length.
    const data = await readFile(input);
    const localized = data.toString('latin1').replace(/https?:\/\/[^\x00-\x20\x7f-\xff"'<>`\\)]+/g, value => {
      const target = mapping.get(canonical(value));
      if (!target) return value;
      if (target.length > value.length) throw new Error('BASE_PATH is too long for the preserved CMS index');
      return target + (target.length < value.length ? '?' + 'x'.repeat(value.length-target.length-1) : '');
    });
    await writeFile(target, Buffer.from(localized, 'latin1'));
  } else if (/\.(?:mjs|js|css|json)$/.test(input)) {
    let text = localize(await readFile(input, 'utf8'), url);
    if (input.includes('shared-lib.')) {
      // Framer's CMS endpoint implements ?range=; static hosts serve the full file.
      // Read the small local CMS file and assemble the same byte ranges client-side.
      text = text.replace('a.searchParams.set(`range`,o);', '');
      text = text.replace('let c=await s.arrayBuffer(),l=new Uint8Array(c);if(l.length!==i)',
        'let c=await s.arrayBuffer(),l=new Uint8Array(i),off=0;for(let part of n){let bytes=new Uint8Array(c).subarray(part.from,part.to);l.set(bytes,off);off+=bytes.length}if(off!==i)');
    }
    if (input.includes('script_main.')) {
      // The editor belongs in Framer, not in the independently hosted site.
      text = text.replace('EditorBar:l===void 0?void 0:', 'EditorBar:true?void 0:');
      text = text.replace('ti&&u(()=>{S(document.getElementById(`__framer-badge-container`)', 'false&&u(()=>{S(document.getElementById(`__framer-badge-container`)');
      text = text.replaceAll('siteCanonicalURL:`https://chanstone.framer.website`', 'siteCanonicalURL:location.origin');
      text = text.replaceAll('path:`/`', `path:\`${base}\``)
        .replaceAll('path:`/404`', `path:\`${base}404\``)
        .replaceAll('path:`/projects/:tbC4actbE`', `path:\`${base}projects/:tbC4actbE\``);
    }
    text = text.replace(/\/\/# sourceMappingURL=.*$/gm, '');
    await writeFile(target, text);
  } else {
    await copyFile(input, target);
  }
  copied.push({ url, file: 'assets/' + path.basename(record.file), bytes: record.bytes });
}

for (const route of pages) {
  const file = route === '/' ? 'home.html' : route.slice(1).replaceAll('/', '-') + '.html';
  let html = localize(await readFile(path.join(source, file), 'utf8'), origin + route);
  html = html.replace(/<a\b[^>]*>/g, tag => /href="[^"]*\/projects\//.test(tag) ? tag.replace(/\s+target="_blank"/g, '') : tag);
  const badgeStart = html.indexOf('<div id="__framer-badge-container">');
  if (badgeStart !== -1) {
    let depth = 0;
    for (const tag of html.slice(badgeStart).matchAll(/<\/?div\b[^>]*>/g)) {
      depth += tag[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        html = html.slice(0, badgeStart) + html.slice(badgeStart + tag.index + tag[0].length);
        break;
      }
    }
  }
  html = html.replace(/<script\b[^>]*src="https:\/\/events\.framer\.com[^>]*><\/script>/g, '');
  html = html.replace(/<script>try\{if\(localStorage\.get\("__framer_force_showing_editorbar_since"\)\)[\s\S]*?<\/script>/g, '');
  html = html.replace(/<link\b[^>]*rel="(?:preconnect|dns-prefetch)"[^>]*>/g, '');
  html = html.replace(/<link\b[^>]*rel="canonical"[^>]*>/g, '');
  html = html.replace(/<meta\b[^>]*property="og:url"[^>]*>/g, '');
  // Resolve relative navigation against the original document before relocating it.
  html = html.replace(/href="((?:\.\.?\/|#)[^"]*)"/g, (all, value) => {
    const u = new URL(value, origin + route);
    return u.origin === origin ? `href="${base}${u.pathname.slice(1)}${u.search}${u.hash}"` : all;
  });
  const runtimeConfig = JSON.stringify({ ...config, basePath: base, siteUrl }).replaceAll('<', '\\u003c');
  const canonicalTag = siteUrl ? `<link rel="canonical" href="${siteUrl}${route === '/' ? '/' : route}">` : '';
  html = html.replace('<head>', `<head>\n${canonicalTag}\n<script>window.CHANSTONE_CONFIG=${runtimeConfig};if(location.pathname.endsWith('/')&&location.pathname.includes('/projects/'))history.replaceState(history.state,'',location.pathname.slice(0,-1)+location.search+location.hash);</script>\n<script src="${base}assets/self-host.js"></script>`);
  const relativeOut = route === '/' ? 'index.html' : route === '/404' ? '404.html' : route.slice(1) + '/index.html';
  await mkdir(path.dirname(path.join(out, relativeOut)), { recursive: true });
  await writeFile(path.join(out, relativeOut), html);
}
await copyFile(path.join(root, 'src/self-host.js'), path.join(out, 'assets/self-host.js'));
await writeFile(path.join(out, '.nojekyll'), '');
await writeFile(path.join(out, 'build-info.json'), JSON.stringify({ name: config.name, basePath: base, routes: pages, assets: copied.length, contactMode: config.contactMode }, null, 2));
await writeFile(path.join(out, 'asset-manifest.json'), JSON.stringify(copied, null, 2));
console.log(`Built ${pages.length} pages and ${copied.length} local assets → ${path.relative(root,out)}/ (base ${base})`);
