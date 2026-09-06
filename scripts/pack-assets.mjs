import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'source');
const manifest=JSON.parse(await readFile(path.join(dir,'manifest.json'),'utf8'));
const all=[...new Map(Object.values(manifest).filter(x=>x.file.startsWith('files/')).map(x=>[x.file,x])).values()];
const keep=all.filter(x=>x.bytes>=4*1024*1024).map(x=>x.file);
const packed=path.join(dir,'packed');await mkdir(packed,{recursive:true});
for(const name of await readdir(packed))if(/^assets-\d+\.json\.gz$/.test(name))await rm(path.join(packed,name));
let batch={},bytes=0;const parts=[];
async function flush(){if(!Object.keys(batch).length)return;const name=`assets-${String(parts.length+1).padStart(2,'0')}.json.gz`;const data=gzipSync(JSON.stringify(batch),{level:6});await writeFile(path.join(packed,name),data);parts.push({file:`packed/${name}`,sha256:createHash('sha256').update(data).digest('hex')});batch={};bytes=0;}
for(const item of all){if(keep.includes(item.file))continue;if(bytes+item.bytes>8*1024*1024)await flush();const data=await readFile(path.join(dir,item.file));batch[item.file]={content:data.toString('base64'),sha256:createHash('sha256').update(data).digest('hex')};bytes+=data.length;}
await flush();await writeFile(path.join(dir,'packed-assets.json'),JSON.stringify({version:1,keep,parts},null,2)+'\n');
console.log(`Packed ${all.length-keep.length} assets into ${parts.length} bundles; ${keep.length} large files remain direct.`);
