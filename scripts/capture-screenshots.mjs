// Captures REAL application screenshots with a disposable in-memory demo library.
// Never opens or uploads the user's personal photo library.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, unlink } from 'node:fs/promises';
import { join, resolve, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootPath = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mediaDir = join(rootPath, 'demo-gallery');
const html = await readFile(join(rootPath, '__gallery', 'index.html'));
const files = {};
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collect(full);
    else if (entry.isFile()) files[relative(mediaDir, full).split('\\').join('/')] = await readFile(full, 'utf8');
  }
}
await collect(mediaDir);
const mediaPaths = Object.keys(files).filter(p => /\.(?:svg|png|jpe?g|webp|gif)$/i.test(p));
if (mediaPaths.length < 12) throw new Error('Demo photo library was not found');

const server = createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();

let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 2048, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.dismiss());
  await page.addInitScript((contents) => {
    class MockFile {
      kind = 'file';
      constructor(name, text) { this.name = name; this.body = text; this.lastModified = 1731000000000; }
      async getFile() {
        const type = /\.svg$/i.test(this.name) ? 'image/svg+xml'
          : /\.txt$|\.tsv$|\.json$/i.test(this.name) ? 'text/plain' : 'application/octet-stream';
        return new File([this.body], this.name, { type, lastModified: this.lastModified });
      }
      async createWritable() {
        const self = this;
        return { async write(payload) {
          self.body = typeof payload === 'string' ? payload : await new Response(payload).text();
        }, async close() {} };
      }
    }
    class MockDir {
      kind = 'directory';
      constructor(name) { this.name = name; this.nodes = new Map(); }
      async getDirectoryHandle(name, opts = {}) {
        let node = this.nodes.get(name);
        if (!node && opts.create) { node = new MockDir(name); this.nodes.set(name, node); }
        if (!node || node.kind !== 'directory') throw new DOMException('Directory not found: ' + name, 'NotFoundError');
        return node;
      }
      async getFileHandle(name, opts = {}) {
        let node = this.nodes.get(name);
        if (!node && opts.create) { node = new MockFile(name, ''); this.nodes.set(name, node); }
        if (!node || node.kind !== 'file') throw new DOMException('File not found: ' + name, 'NotFoundError');
        return node;
      }
      async removeEntry(name) {
        if (!this.nodes.has(name)) throw new DOMException('Not found', 'NotFoundError');
        this.nodes.delete(name);
      }
      async *entries() { for (const item of this.nodes) yield item; }
      async queryPermission() { return 'granted'; }
      async requestPermission() { return 'granted'; }
      async isSameEntry(handle) { return this === handle; }
      async resolve(handle) { return this === handle ? [] : null; }
    }
    const root = new MockDir('demo-gallery');
    for (const [path, value] of Object.entries(contents)) {
      const parts = path.split('/'); const name = parts.pop();
      let dir = root;
      for (const segment of parts) {
        let next = dir.nodes.get(segment);
        if (!next) { next = new MockDir(segment); dir.nodes.set(segment, next); }
        dir = next;
      }
      dir.nodes.set(name, new MockFile(name, value));
    }
    Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, value: async () => root });
    window.__demoRoot = root;
    window.__demoMediaPaths = Object.keys(contents).filter(p => /\.(?:svg|png|jpe?g|webp|gif)$/i.test(p));
  }, files);

  await page.goto('http://127.0.0.1:' + address.port + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#themeSelect').selectOption('dark');
  try {
    await page.locator('#openFolder').click({ timeout: 10000 });
    await page.waitForFunction(() => typeof images !== 'undefined' && images.length >= 12 && !scanInProgress, null, { timeout: 20000 });
  } catch (pickerError) {
    // Browser permissions differ between automation environments. Fall back to
    // the app's real metadata/index/render functions with the same fake handles.
    await page.evaluate(async () => {
      root = window.__demoRoot;
      if (typeof loadMetadata === 'function') await loadMetadata();
      installItems(window.__demoMediaPaths.map(p => buildItem(p)), 'loaded from index');
    });
    await page.waitForFunction(() => typeof images !== 'undefined' && images.length >= 12, null, { timeout: 10000 });
  }

  await page.waitForFunction(() => document.querySelectorAll('#gallery .photo').length >= 12, null, { timeout: 20000 });
  await page.waitForFunction(()=>[...document.querySelectorAll('#gallery .thumb')].some(x=>x.complete&&x.naturalWidth>0));
  const baseline=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('#gallery .photo')];
    window.__retainedFilterCards=cards.map(card=>({card,thumb:card.querySelector('.thumb'),src:card.querySelector('.thumb').getAttribute('src')}));
    const b=document.getElementById('gallery').getBoundingClientRect();return {width:b.width,count:cards.length};
  });
  for(const control of ['#folderLockLabel','#collectionOperator','#collectionOperator','#collectionOperator','#folderLockLabel']){
    await page.locator(control).click();
    await page.waitForFunction(base=>{
      const cards=[...document.querySelectorAll('#gallery .photo')],b=document.getElementById('gallery').getBoundingClientRect();
      return cards.length===base.count&&Math.abs(b.width-base.width)<1&&window.__retainedFilterCards.every((entry,i)=>entry.card===cards[i]&&entry.thumb===cards[i].querySelector('.thumb')&&(!entry.src||entry.thumb.getAttribute('src')===entry.src||!entry.src.startsWith('blob:')));
    },baseline);
  }
  console.log('PASS: no-op lock/operator toggles keep card nodes, loaded blobs and grid width');

  // Give even the small demo a scrollable background for the real wheel regression.
  const backgroundScrollStart=await page.evaluate(()=>{
    const before=window.scrollY,spacer=document.createElement('div');
    spacer.id='modal-scroll-test-spacer';spacer.style.height='160vh';document.body.append(spacer);return before;
  });
  await page.locator('#gallery .photo > img.thumb').first().click();
  await page.waitForFunction(()=>!document.getElementById('bigImage').hidden&&document.getElementById('bigImage').naturalWidth>0);
  const lockedScroll=await page.evaluate(()=>({y:window.scrollY,width:document.documentElement.clientWidth,overflow:getComputedStyle(document.documentElement).overflowY}));
  if(lockedScroll.overflow!=='hidden')throw Error('Modal did not lock the document');
  await page.mouse.move(2,2);await page.mouse.wheel(0,600);
  await page.waitForTimeout(150);
  if(await page.evaluate(()=>window.scrollY)!==lockedScroll.y)throw Error('Background moved while viewer was open');

  await page.locator('#viewerStage').click({position:{x:4,y:4}});
  if(!await page.locator('#viewer').isVisible())throw Error('Clicking the stage closed the photo');
  await page.locator('#bigImage').hover();await page.mouse.wheel(0,-400);
  await page.waitForFunction(()=>viewerZoom.scale>1);
  await page.mouse.wheel(0,1200);await page.waitForFunction(()=>viewerZoom.scale===1);
  await page.locator('#closeViewer').click();
  const unlockedScroll=await page.evaluate(()=>({y:window.scrollY,width:document.documentElement.clientWidth,overflow:getComputedStyle(document.documentElement).overflowY}));
  if(unlockedScroll.overflow==='hidden')throw Error('Closing modal did not restore scrolling');
  if(unlockedScroll.width!==lockedScroll.width)throw Error('Modal changed scrollbar gutter width');
  await page.mouse.move((page.viewportSize()?.width||1000)-30,(page.viewportSize()?.height||700)-100);
  await page.mouse.wheel(0,400);
  await page.waitForFunction(y=>window.scrollY>y,unlockedScroll.y);
  await page.evaluate(y=>{document.getElementById('modal-scroll-test-spacer').remove();window.scrollTo(0,y)},backgroundScrollStart);
  console.log('PASS: modal prevents background wheel scrolling and restores scrolling when closed');

  console.log('PASS: viewer stage stays open and wheel zoom returns to fit');

  await page.waitForTimeout(900);
  const dest = join(rootPath, 'docs', 'screenshots');
  await mkdir(dest, { recursive: true });
  async function snap(name) {
    await page.screenshot({ path: join(dest, name + '.png'), animations: 'disabled', fullPage: false });
    console.log('Captured', name + '.png');
  }
  // Keep exactly three screenshots in README and distribution ZIPs.
  // Remove obsolete captures from previous gallery versions.
  const desired = new Set(['classic-dark.png', 'classic-light.png', 'instagram-dark.png']);
  for (const filename of await readdir(dest)) {
    if (filename.toLowerCase().endsWith('.png') && !desired.has(filename))
      await unlink(join(dest, filename));
  }

  // Real app screenshots at one consistent viewport with the same demo media.
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap('classic-dark');

  // Capture the real Instagram view, then return to Classic for Light mode.
  await page.locator('#layoutToggle').click();
  await page.waitForFunction(() =>
    document.getElementById('layoutToggle')?.getAttribute('aria-pressed') === 'true'
  );
  await page.waitForTimeout(450);
  await snap('instagram-dark');
  await page.locator('#layoutToggle').click();
  await page.waitForFunction(() =>
    document.getElementById('layoutToggle')?.getAttribute('aria-pressed') === 'false'
  );

  await page.locator('#themeSelect').selectOption('light');
  await page.waitForTimeout(450);
  await snap('classic-light');
  if (errors.length) console.warn('Browser JavaScript warnings:', errors.slice(0, 5).join('; '));
  await context.close();
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
