import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(process.env.BUILD_DIR || 'dist');
const info=JSON.parse(await readFile(path.join(root,'build-info.json'),'utf8'));
const assets=JSON.parse(await readFile(path.join(root,'asset-manifest.json'),'utf8'));
let checked=0;
for(const item of assets){
  const s=await stat(path.join(root,item.file));
  assert(s.size>0,`Empty asset: ${item.file}`);
  assert(s.size<100*1024*1024,`File exceeds normal GitHub git size limit: ${item.file}`);
  if (item.file.endsWith('.framercms')) {
    assert.equal(s.size, item.bytes, 'CMS byte offsets must be preserved');
    const data = await readFile(path.join(root,item.file));
    assert(!data.includes(Buffer.from('https://framerusercontent.com/images/')), 'Remote CMS image reference');
  }
}
async function walk(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){await walk(file);continue;}
    if(!/\.(html|mjs|js|css)$/.test(file))continue;
    const text=await readFile(file,'utf8');
    const base=info.basePath.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const refs=[...text.matchAll(new RegExp(base+'assets/[^\\s"\'<>`\\\\)]+','g'))].map(x=>x[0]);
    for(const ref of new Set(refs.filter(ref => !ref.includes('${')))){
      const relative=ref.slice(info.basePath.length).split(/[?#]/)[0];
      assert((await stat(path.join(root,relative))).isFile(),`Missing local reference in ${file}: ${ref}`);
      checked++;
    }
    if(file.endsWith('.html')){
      assert(!text.includes('src="https://events.framer.com'), 'Framer analytics must not be loaded');
      assert(!/\b(?:src|srcset)="https:\/\/(?:framerusercontent.com|fonts.gstatic.com)/.test(text),'Remote media reference');
      assert(text.includes('self-host.js'),'Missing contact adapter');
      assert(!text.includes('<div id="__framer-badge-container">'),'Framer badge remains');
    }
  }
}
await walk(root);
for(const route of info.routes){
  const file=route==='/'?'index.html':route==='/404'?'404.html':route.slice(1)+'/index.html';
  assert((await stat(path.join(root,file))).isFile(),`Missing page ${route}`);
}
console.log(`PASS: ${info.routes.length} routes, ${assets.length} local assets, ${checked} static asset references, base ${info.basePath}`);
