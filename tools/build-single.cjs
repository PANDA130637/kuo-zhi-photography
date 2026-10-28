/*
 * 构建单文件版：把全部 CSS / JS / 字体 / 照片内联进一个 HTML。
 *
 * 照片先在无头 Chrome 里用 canvas 重编码（长边 1440 · JPEG q0.72），再以 base64 进 HTML，
 * 体积从 21MB 压到几 MB，方便微信 / 邮件直接发。收件人双击即看，无需解压、无需联网。
 *
 * 前提：站点本地服务已开（默认 http://127.0.0.1:8123）。
 * 用法：node tools/build-single.cjs [输出文件]   # 默认输出到桌面「阔之神来之眼-单文件版.html」
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');

const SITE = 'http://127.0.0.1:8123';
const PORT = 9352;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const LONG_EDGE = parseInt(process.env.SINGLE_LONG_EDGE || '1440', 10);
const QUALITY = parseFloat(process.env.SINGLE_QUALITY || '0.72');
const COUNT = 34;

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(os.homedir(), 'Desktop', '阔之神来之眼-单文件版.html');

const get = (u) => new Promise((res, rej) => {
  http.get(u, (r) => { let s = ''; r.on('data', (d) => (s += d)); r.on('end', () => res(s)); }).on('error', rej);
});

async function withChrome(fn) {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--mute-audio', '--user-data-dir=' + path.join(os.tmpdir(), 'build-single-profile'),
    '--remote-debugging-port=' + PORT, 'about:blank'
  ], { stdio: 'ignore' });
  try {
    let wsUrl = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const list = JSON.parse(await get('http://127.0.0.1:' + PORT + '/json/list'));
        const page = list.find((t) => t.type === 'page');
        if (page && page.webSocketDebuggerUrl) { wsUrl = page.webSocketDebuggerUrl; break; }
      } catch (e) { /* 还没起来 */ }
    }
    if (!wsUrl) throw new Error('Chrome 未就绪');
    return await fn(wsUrl);
  } finally {
    chrome.kill();
  }
}

async function encodeImages(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params) => new Promise((r) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params: params || {} })); pend.set(i, r); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await new Promise((r) => (ws.onopen = r));

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: SITE + '/index.html' });
  await sleep(1500);

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (!r || !r.result) throw new Error('RAW ' + JSON.stringify(r).slice(0, 300));
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result.result.value;
  };

  await ev(`(function(){
    window.__enc = async function(name, longEdge, q){
      var img = new Image();
      img.src = 'assets/img/baoding/' + name;
      await img.decode();
      var s = Math.min(1, longEdge / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      var ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', q);
    };
  })()`);

  const imgs = {};
  for (let i = 1; i <= COUNT; i++) {
    const name = String(i).padStart(2, '0') + '.jpg';
    imgs[name] = await ev(`window.__enc(${JSON.stringify(name)}, ${LONG_EDGE}, ${QUALITY})`);
    process.stdout.write('.');
  }
  ws.close();
  return imgs;
}

function buildHtml(imgs) {
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  let html = read('index.html');

  /* 1) 去掉「file:// 协议切换字体」的脚本：单文件里字体已直接内联 */
  html = html.replace(/<script>\s*\/\* file:\/\/[\s\S]*?<\/script>/, '<!-- 单文件版：样式、脚本、字体、图片全部内联 -->');

  /* 2) 样式表内联；fonts.css 用 base64 内联版（单文件没有独立字体文件可加载） */
  html = html.replace(/<link rel="stylesheet" href="([^"]+)"[^>]*\/?>(?:<\/link>)?/g, (m, href) => {
    const rel = href.replace(/^\//, '');
    const file = rel === 'assets/fonts/fonts.css' ? 'assets/fonts/fonts-inline.css' : rel;
    return '<style>\n' + read(file) + '\n</style>';
  });

  /* 3) 脚本内联；data.js 注入 base64 图片表并改写 local() */
  const dataJs = read('assets/js/data.js').replace(
    /function local\(name, w, h\) \{[\s\S]*?\n  \}/,
    `function local(name, w, h) {
    var d = window.__IMG[name];
    return { src: d, thumb: d, w: w, h: h };
  }`
  );
  if (dataJs.indexOf('window.__IMG') < 0) throw new Error('data.js 的 local() 没改写成功');

  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    const rel = src.replace(/^\//, '');
    if (rel === 'assets/js/data.js') {
      return '<script>\nwindow.__IMG = ' + JSON.stringify(imgs) + ';\n</script>\n<script>\n' + dataJs + '\n</script>';
    }
    return '<script>\n' + read(rel) + '\n</script>';
  });

  if (html.includes('<script src=') || html.includes('<link rel="stylesheet" href="assets')) {
    throw new Error('仍有未内联的外部引用，检查 index.html 结构');
  }
  return html;
}

(async () => {
  console.log('重编码照片（长边 ' + LONG_EDGE + ' · q' + QUALITY + '）...');
  const imgs = await withChrome(encodeImages);
  console.log('\n组装 HTML...');
  const html = buildHtml(imgs);
  fs.writeFileSync(OUT, html);
  const kb = fs.statSync(OUT).size / 1048576;
  console.log('输出: ' + OUT);
  console.log('体积: ' + kb.toFixed(1) + ' MB');
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
