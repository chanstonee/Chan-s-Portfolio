import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=process.env.BUILD_DIR || 'dist';
const assets=JSON.parse(await readFile(`${root}/asset-manifest.json`,'utf8'));
const file=assets.find(x=>x.file.includes('shared-lib.')).file;
const bundle=await readFile(`${root}/${file}`,'utf8');
const start=bundle.indexOf('async function Kt('),end=bundle.indexOf('function qt(',start);
assert(start>=0 && end>start,'CMS range reader must be identifiable');
const bytes=Uint8Array.from({length:100},(_,i)=>i);
class RangeStore {
  constructor(){this.data=new Uint8Array(100);}
  write(offset,data){this.data.set(data,offset);}
  read(offset,length){return this.data.slice(offset,offset+length);}
}
let requested;
const context=vm.createContext({URL,Uint8Array,hn:RangeStore,Jt:r=>[...r].sort((a,b)=>a.from-b.from),mn:async url=>{
  requested=url;return {status:200,arrayBuffer:async()=>bytes.buffer};
}});
vm.runInContext(bundle.slice(start,end),context);
const ranges=[{from:20,to:40},{from:4,to:8}];
const output=await context.Kt('https://portfolio.test/assets/example.framercms',ranges);
assert(!requested.searchParams.has('range'),'Static hosts must receive a full-file request');
output.forEach((part,i)=>assert.deepEqual([...part],[...bytes.slice(ranges[i].from,ranges[i].to)]));
console.log('PASS: published CMS reader extracts multiple byte ranges from an ordinary static file response');
