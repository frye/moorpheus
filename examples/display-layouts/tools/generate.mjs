import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { packLandscape } from './pixels.mjs';

const assets = new URL('../assets/', import.meta.url);
const gallery = new URL('../../../layouts/index.html', import.meta.url);
const concepts = ['watch', 'big', 'grid', 'swing', 'ledger'];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1,
  });
  await page.goto(gallery.href);
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 16px Satoshi'),
      document.fonts.load('700 16px Satoshi'),
      document.fonts.load('400 16px "JetBrains Mono"'),
      document.fonts.load('700 16px "JetBrains Mono"'),
    ]);
    await document.fonts.ready;
    for (const family of ['Satoshi', 'JetBrains Mono']) {
      if (![...document.fonts].some((font) =>
        font.family.replaceAll('"', '') === family && font.status === 'loaded')) {
        throw new Error(`Required gallery font did not load: ${family}`);
      }
    }
  });
  await page.addStyleTag({ content: `
    .em-scope {
      --e-bg: #fff; --e-ink: #000; --e-dim: #000; --e-faint: #000;
      --e-line: #000; --e-blue: #00f; --e-green: #008000;
      --e-yellow: #ff0; --e-red: #f00;
    }
    #fitbox {
      position: fixed; left: 0; top: 0; width: 600px;
      pointer-events: none; z-index: 9999;
    }
    #fitbox .e-label { display: none; }
    #fitbox .fit-inner { transform: none !important; }
    .epaper { border: 0; border-radius: 0; box-shadow: none; }
    .e-mbar .zone-g { background: var(--e-green); }
    .e-mbar .zone-y { background: var(--e-yellow); }
    .e-mbar .zone-r { background: var(--e-red); }
  ` });
  await mkdir(assets, { recursive: true });
  const manifest = { rotation: 'clockwise', width: 400, height: 600, frames: [] };
  for (const [index, concept] of concepts.entries()) {
    await page.locator(`#conceptTabs [data-id="${concept}"]`).click();
    await page.evaluate(({ index, total }) => {
      const panel = document.querySelector('#fitbox .epaper');
      panel.querySelector('.e-clock').textContent = 'SIMULATED DATA';
      panel.querySelector('.e-foot').innerHTML =
        `<span>DEMO ${index + 1}/${total} - NOT AN ANCHOR ALARM</span>` +
        '<span>NO LIVE SENSORS</span>';
    }, { index, total: concepts.length });
    const png = PNG.sync.read(await page.locator('#fitbox .epaper').screenshot());
    const { frame, preview } = packLandscape(png);
    const image = new PNG({ width: 600, height: 400 });
    image.data = preview;
    await writeFile(new URL(`${concept}.bin`, assets), frame);
    await writeFile(new URL(`${concept}.png`, assets), PNG.sync.write(image));
    manifest.frames.push({
      id: concept, bytes: frame.length,
      sha256: createHash('sha256').update(frame).digest('hex'),
    });
    console.log(`Packed ${concept}: ${frame.length} bytes`);
  }
  await writeFile(new URL('manifest.json', assets), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Assets: ${fileURLToPath(assets)}`);
} finally {
  await browser.close();
}
