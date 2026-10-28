/*
 * 把一串原图批量压成站内的「主图 + 缩略图」两级，写进 assets/img/<series>/。
 *
 * 为什么用 Chrome 来压：本机不需要装任何图像库。浏览器解码出来的自然尺寸已按 EXIF 方向
 * 旋转过，重新画到 canvas 时方向会被烘焙进像素，省得自己处理 Orientation。
 * 注意：页面必须开在「原图服务器」上，页面和图片同源，canvas 才不会被污染，
 * toDataURL 才能导出数据。
 *
 * 用法：
 *   1) 先把放原图的目录跑成一个静态服务（例如 python -m http.server 8124），
 *      要求浏览器能读到形如 http://127.0.0.1:8124/XXX.JPG 的图片；
 *   2) node tools/import-local.cjs <系列ID> <主图长边> <缩略图长边> <原图服务地址>
 *      例：node tools/import-local.cjs baoding 2000 1000 http://127.0.0.1:8124
 *
 * 输出：assets/img/<系列ID>/NN.jpg 与 assets/img/<系列ID>/thumbs/NN.jpg
 * 并在标准 output 里打印每张的 { src, w, h }，可直接粘到 assets/js/data.js。
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const SERIES_ID = process.argv[2] || 'misc';
const LONG_EDGE = parseInt(process.argv[3] || '2000', 10);
const THUMB_EDGE = parseInt(process.argv[4] || '1000', 10);
const SOURCE = process.argv[5] || 'http://127.0.0.1:8124';

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets/img', SERIES_ID);
const THUMB_DIR = path.join(OUT_DIR, 'thumbs');
const PORT = 9341;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const USER_DATA = path.join(require('os').tmpdir(), 'import-local-profile');

const get = (u) =>
  new Promise((res, rej) => {
    http.get(u, (r) => { let s = ''; r.on('data', (d) => (s += d)); r.on('end', () => res(s)); }).on('error', rej);
  });

async function main() {
  const chrome = spawn(
    CHROME,
    ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--hide-scrollbars', '--mute-audio', '--user-data-dir=' + USER_DATA,
      '--remote-debugging-port=' + PORT, 'about:blank'],
    { stdio: 'ignore' }
  );

  let wsUrl = null;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const list = JSON.parse(await get('http://127.0.0.1:' + PORT + '/json/list'));
      const page = list.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) { wsUrl = page.webSocketDebuggerUrl; break; }
    } catch (e) { /* 还没起来 */ }
  }
  if (!wsUrl) { chrome.kill(); throw new Error('Chrome 未就绪'); }

  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pend = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  };
  const send = (method, params) =>
    new Promise((r) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params: params || {} })); pend.set(i, r); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await new Promise((r) => (ws.onopen = r));

  await send('Page.enable');
  await send('Runtime.enable');
  /* 开在原图服务器上：页面与图片同源，canvas 不污染 */
  await send('Page.navigate', { url: SOURCE + '/' });
  await sleep(1800);

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (!r || !r.result) throw new Error('RAW ' + JSON.stringify(r).slice(0, 300));
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result.result.value;
  };

  /* 目录列表页：python -m http.server 会列出 <a href="*.JPG"> */
  const files = await ev(`(function(){
    return [].map.call(document.querySelectorAll('a'), function(a){ return a.getAttribute('href'); })
            .filter(function(h){ return /\\.(jpe?g|png)$/i.test(h || ''); });
  })()`);
  if (!files || !files.length) throw new Error('源文件列表里没有找到图片链接');
  files.sort();

  fs.mkdirSync(THUMB_DIR, { recursive: true });

  await ev(`(function(){
    window.__resize = async function(url, longEdge){
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      await img.decode();
      var nw = img.naturalWidth, nh = img.naturalHeight;
      var s = Math.min(1, longEdge / Math.max(nw, nh));
      var w = Math.round(nw * s), h = Math.round(nh * s);
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      return { data: c.toDataURL('image/jpeg', 0.8).split(',')[1], w: w, h: h, nw: nw, nh: nh };
    };
  })()`);

  const out = [];
  for (let i = 0; i < files.length; i++) {
    const url = SOURCE.replace(/\/$/, '') + '/' + files[i].replace(/^\//, '');
    const full = await ev(`window.__resize(${JSON.stringify(url)}, ${LONG_EDGE})`);
    const thumb = await ev(`window.__resize(${JSON.stringify(url)}, ${THUMB_EDGE})`);
    const nn = String(i + 1).padStart(2, '0') + '.jpg';
    fs.writeFileSync(path.join(OUT_DIR, nn), Buffer.from(full.data, 'base64'));
    fs.writeFileSync(path.join(THUMB_DIR, nn), Buffer.from(thumb.data, 'base64'));
    out.push({ src: nn, w: full.w, h: full.h, natural: full.nw + 'x' + full.nh, kb: Math.round(Buffer.from(full.data, 'base64').length / 1024) });
    process.stdout.write('.');
  }

  console.log('\n' + JSON.stringify(out, null, 1));
  ws.close();
  chrome.kill();
}

main().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
