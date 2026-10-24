export const palette = [
  { code: 0, rgb: [0, 0, 0] },
  { code: 1, rgb: [255, 255, 255] },
  { code: 2, rgb: [255, 255, 0] },
  { code: 3, rgb: [255, 0, 0] },
  { code: 5, rgb: [0, 0, 255] },
  { code: 6, rgb: [0, 128, 0] },
];

export function packLandscape(image) {
  if (image.width !== 600 || image.height !== 400 ||
      image.data.length !== 600 * 400 * 4) {
    throw new Error(`Expected a 600 x 400 RGBA panel capture; got ${image.width} x ${image.height}`);
  }
  const frame = Buffer.alloc(120000);
  const preview = Buffer.alloc(600 * 400 * 4);
  for (let y = 0; y < 400; ++y) {
    for (let x = 0; x < 600; ++x) {
      const source = (y * 600 + x) * 4;
      if (image.data[source + 3] !== 255) {
        throw new Error('Panel capture must be opaque');
      }
      const rgb = image.data.subarray(source, source + 3);
      // Keep neutral antialiased text black/white rather than tinting it green.
      const neutral = Math.max(...rgb) - Math.min(...rgb) <= 2;
      let nearest = neutral ? palette[rgb[0] < 170 ? 0 : 1] : undefined;
      let best = Infinity;
      for (const colour of neutral ? [] : palette) {
        const distance = colour.rgb.reduce(
          (sum, channel, i) => sum + (channel - image.data[source + i]) ** 2, 0);
        if (distance < best) {
          best = distance;
          nearest = colour;
        }
      }
      // Clockwise storage rotation: landscape (x,y) -> native (399-y,x).
      const nativeX = 399 - y;
      const offset = x * 200 + Math.floor(nativeX / 2);
      frame[offset] |= nearest.code << (nativeX % 2 === 0 ? 4 : 0);
      preview.set([...nearest.rgb, 255], source);
    }
  }
  return { frame, preview };
}
