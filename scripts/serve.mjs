import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(project, process.env.BUILD_DIR || 'dist');
try { await stat(path.join(root, 'index.html')); } catch { await import('./build.mjs'); }
const info = JSON.parse(await readFile(path.join(root, 'build-info.json'), 'utf8'));
const args = process.argv.slice(2);
const arg = (key, fallback) => args.includes(key) ? args[args.indexOf(key)+1] : fallback;
const port = Number(arg('--port', process.env.PORT || '4173'));
const host = arg('--host', '127.0.0.1');
const types = { '.html':'text/html; charset=utf-8','.mjs':'application/javascript','.js':'application/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.gif':'image/gif' };
const server = http.createServer(async (req,res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url,'http://local').pathname);
    if (info.basePath !== '/') {
      if (!pathname.startsWith(info.basePath)) { res.writeHead(404);res.end('Outside site base path');return; }
      pathname = pathname.slice(info.basePath.length);
    }
    let file = path.resolve(root, '.' + (pathname.startsWith('/') ? pathname : '/' + pathname));
    if (!file.startsWith(root + path.sep) && file !== root) {res.writeHead(403);res.end();return;}
    let status = 200;
    let metadata;
    try { metadata=await stat(file);if(metadata.isDirectory())file=path.join(file,'index.html');metadata=await stat(file); }
    catch {file=path.join(root,'404.html');metadata=await stat(file);status=404;}
    const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    let start=0,end=metadata.size-1;
    if(req.headers.range && status===200){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match){res.writeHead(416,{'Content-Range':`bytes */${metadata.size}`});res.end();return;}
      start=match[1]?Number(match[1]):Math.max(0,metadata.size-Number(match[2]));
      end=match[1]&&match[2]?Math.min(Number(match[2]),end):end;
      if(start>end||start>=metadata.size){res.writeHead(416,{'Content-Range':`bytes */${metadata.size}`});res.end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${metadata.size}`;
    }
    headers['Content-Length']=end-start+1;
    res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch{res.writeHead(400);res.end('Bad request');}
});
server.listen(port,host,()=>console.log(`CHANSTONE preview: http://${host}:${port}${info.basePath}`));
