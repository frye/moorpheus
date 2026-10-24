import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packLandscape, palette } from './pixels.mjs';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { createHash } from 'node:crypto';

test('native rotation, nibble order and all six palette entries', () => {
  const image = { width: 600, height: 400, data: Buffer.alloc(600 * 400 * 4, 255) };
  const set = (x, y, rgb) => image.data.set([...rgb, 255], (y * 600 + x) * 4);
  set(0, 0, [255, 0, 0]);
  set(0, 1, [0, 0, 255]);
  set(599, 399, [255, 255, 0]);
  set(599, 398, [0, 128, 0]);
  set(30, 40, [0, 0, 0]);
  set(31, 40, [128, 128, 128]);
  const { frame, preview } = packLandscape(image);
  assert.equal(frame.length, 120000);
  assert.equal(frame[199], 0x53);
  assert.equal(frame[599 * 200], 0x26);
  assert.equal(frame[30 * 200 + 179], 0x10);
  assert.equal(frame[31 * 200 + 179], 0x10);
  assert.equal(frame[100 * 200 + 100], 0x11);
  assert.deepEqual([...preview.subarray(0, 4)], [255, 0, 0, 255]);
  const valid = new Set(palette.map((p) => p.code));
  for (const byte of frame) {
    assert(valid.has(byte >> 4) && valid.has(byte & 15));
  }
});

test('all checked-in previews reconstruct exactly from native packed frames', () => {
  const root = new URL('../assets/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root)));
  assert.deepEqual(manifest.frames.map((entry) => entry.id),
    ['watch', 'big', 'grid', 'swing', 'ledger']);
  for (const entry of manifest.frames) {
    const frame = readFileSync(new URL(`${entry.id}.bin`, root));
    const image = PNG.sync.read(readFileSync(new URL(`${entry.id}.png`, root)));
    assert.equal(frame.length, 120000);
    assert.equal(createHash('sha256').update(frame).digest('hex'), entry.sha256);
    assert.equal(image.width, 600);
    assert.equal(image.height, 400);
    for (let nativeY = 0; nativeY < 600; ++nativeY) {
      for (let nativeX = 0; nativeX < 400; ++nativeX) {
        const byte = frame[nativeY * 200 + (nativeX >> 1)];
        const code = nativeX % 2 === 0 ? byte >> 4 : byte & 15;
        const colour = palette.find((item) => item.code === code);
        assert(colour, `${entry.id}: invalid colour ${code}`);
        const landscapeX = nativeY;
        const landscapeY = 399 - nativeX;
        const offset = (landscapeY * 600 + landscapeX) * 4;
        assert.equal(image.data[offset], colour.rgb[0]);
        assert.equal(image.data[offset + 1], colour.rgb[1]);
        assert.equal(image.data[offset + 2], colour.rgb[2]);
        assert.equal(image.data[offset + 3], 255);
      }
    }
  }
});

test('reject wrong dimensions and transparency', () => {
  assert.throws(() => packLandscape({ width: 400, height: 600, data: [] }));
  assert.throws(() => packLandscape({
    width: 600, height: 400, data: Buffer.alloc(600 * 400 * 4),
  }));
});
