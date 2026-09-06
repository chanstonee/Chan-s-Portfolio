import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import path from 'node:path';
export async function restoreAssets(source){
  const manifest=JSON.parse(await readFile(path.join(source,'packed-assets.json'),'utf8'));
  await mkdir(path.join(source,'files'),{recursive:true});
  const hash=data=>createHash('sha256').update(data).digest('hex');
  let restored=0;
  for(const part of manifest.parts){
    if(!/^packed\/assets-\d+\.json\.gz$/.test(part.file))throw Error('Invalid asset bundle path');
    const data=await readFile(path.join(source,part.file));
    if(hash(data)!==part.sha256)throw Error(`Corrupt asset bundle: ${part.file}`);
    for(const [name,item] of Object.entries(JSON.parse(gunzipSync(data).toString('utf8')))){
      if(!/^files\/[A-Za-z0-9_.-]+$/.test(name))throw Error('Invalid asset path');
      const target=path.join(source,name);
      try{await access(target);continue;}catch{}
      const bytes=Buffer.from(item.content,'base64');if(hash(bytes)!==item.sha256)throw Error(`Corrupt asset: ${name}`);
      await writeFile(target,bytes);restored++;
    }
  }
  if(restored)console.log(`Restored ${restored} bundled assets`);
}
