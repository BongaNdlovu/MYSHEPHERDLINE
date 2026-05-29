/**
 * Regenerates Expo raster icons from assets/logo/myshepherdline-mark.svg.
 * Run: node scripts/generate-brand-icons.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = path.join(root, 'assets', 'logo', 'myshepherdline-mark.svg');
const imagesDir = path.join(root, 'assets', 'images');

const BG = '#14532d';

async function main() {
  let Resvg;
  try {
    ({ Resvg } = await import('@resvg/resvg-js'));
  } catch {
    console.warn('[generate-brand-icons] @resvg/resvg-js not installed; skipping raster generation.');
    console.warn('Install with: npm install --save-dev @resvg/resvg-js');
    process.exit(0);
  }

  const svg = await readFile(svgPath, 'utf8');
  await mkdir(imagesDir, { recursive: true });

  const sizes = {
    'icon.png': 1024,
    'favicon.png': 48,
    'android-icon-foreground.png': 432,
    'android-icon-monochrome.png': 432,
    'splash-icon.png': 1024,
  };

  for (const [name, size] of Object.entries(sizes)) {
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: Math.round(size * 0.72) },
      background: name === 'android-icon-monochrome.png' ? 'transparent' : BG,
    });
    const png = resvg.render().asPng();
    await writeFile(path.join(imagesDir, name), png);
    console.log(`Wrote ${name} (${size}px canvas)`);
  }

  const bgResvg = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432"><rect width="432" height="432" fill="${BG}"/></svg>`,
    { fitTo: { mode: 'width', value: 432 } },
  );
  await writeFile(path.join(imagesDir, 'android-icon-background.png'), bgResvg.render().asPng());
  console.log('Wrote android-icon-background.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
