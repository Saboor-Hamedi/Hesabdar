#!/usr/bin/env node

/**
 * scripts/make-icons.js
 *
 * Professional Multi-Platform Icon Generator for Hesabdar
 * - Extracts and optimizes the shield emblem for maximum clarity on taskbars
 * - Generates multi-resolution .ico for Windows (16x16 up to 256x256)
 * - Generates .icns for macOS Dock & DMG
 * - Generates high-res PNG pack for Linux (build/icons/*.png)
 * - Produces crystal-clear transparent icons that stand out on both dark and light OS themes
 */

const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const icongen = require('icon-gen');

const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

async function prepareEmblem(inputPath) {
  const rawImage = await Jimp.read(inputPath);
  const w = rawImage.bitmap.width;
  const h = rawImage.bitmap.height;

  // Check if this image has dark solid corners (like the raw uploaded poster/logo card)
  const cornerColor = Jimp.intToRGBA(rawImage.getPixelColor(10, 10));
  const isSolidDarkCard = cornerColor.a > 200 && cornerColor.r < 40 && cornerColor.g < 45 && cornerColor.b < 60;

  if (isSolidDarkCard) {
    console.log('   Detected raw logo card. Isolating and optimizing shield emblem for taskbar visibility...');

    // Find bounding box of the shield (ignoring lower text)
    let minX = w, maxX = 0, minY = h, maxY = 0;
    const scanLimitY = Math.floor(h * 0.65);

    for (let y = 0; y < scanLimitY; y++) {
      for (let x = 0; x < w; x++) {
        const c = Jimp.intToRGBA(rawImage.getPixelColor(x, y));
        const isBg = c.r < 35 && c.g < 40 && c.b < 55;
        if (!isBg) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Add 2px margin around shield bounds
    const cropX = Math.max(0, minX - 2);
    const cropY = Math.max(0, minY - 2);
    const cropW = Math.min(w - cropX, (maxX - minX) + 4);
    const cropH = Math.min(h - cropY, (maxY - minY) + 4);

    const shieldCrop = rawImage.clone().crop(cropX, cropY, cropW, cropH);

    // Make background transparent with soft antialiasing
    const bgR = cornerColor.r, bgG = cornerColor.g, bgB = cornerColor.b;
    shieldCrop.scan(0, 0, shieldCrop.bitmap.width, shieldCrop.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];

      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      if (dist < 26) {
        this.bitmap.data[idx + 3] = 0;
      } else if (dist < 42) {
        const alpha = (dist - 26) / (42 - 26);
        this.bitmap.data[idx + 3] = Math.floor(alpha * 255);
      }
    });

    // Scale shield to fill ~86% of a 1024x1024 master canvas
    const masterSize = 1024;
    const targetH = Math.round(masterSize * 0.86); // ~880px
    const targetW = Math.round(cropW * (targetH / cropH));
    shieldCrop.resize(targetW, targetH, Jimp.RESIZE_BICUBIC);

    const master = new Jimp(masterSize, masterSize, 0x00000000);
    const posX = Math.floor((masterSize - targetW) / 2);
    const posY = Math.floor((masterSize - targetH) / 2);
    master.composite(shieldCrop, posX, posY);

    return master;
  } else {
    // Already transparent or custom icon — ensure 1024x1024 square with bicubic filter
    return rawImage.clone().resize(1024, 1024, Jimp.RESIZE_BICUBIC);
  }
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const inputPath = path.join(rootDir, 'resources', 'icon.png');
  const buildDir = path.join(rootDir, 'build');
  const iconsDir = path.join(buildDir, 'icons');
  const stagingDir = path.join(rootDir, 'build', '.icon-staging');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Source icon not found at: ${inputPath}`);
    process.exit(1);
  }

  console.log(`🎨 Processing source icon: ${inputPath}...`);
  const masterImage = await prepareEmblem(inputPath);

  // Ensure directories exist
  [buildDir, iconsDir, stagingDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  console.log('📐 Generating multi-resolution PNGs with Bicubic smoothing...');
  for (const size of SIZES) {
    const resized = masterImage.clone().resize(size, size, Jimp.RESIZE_BICUBIC);
    // Write staging file for icongen (${size}.png)
    const stagingFile = path.join(stagingDir, `${size}.png`);
    await resized.writeAsync(stagingFile);

    // Write Linux icon pack (${size}x${size}.png)
    const linuxIconFile = path.join(iconsDir, `${size}x${size}.png`);
    await resized.writeAsync(linuxIconFile);
  }

  // Write high-res 512x512 files
  const png512 = masterImage.clone().resize(512, 512, Jimp.RESIZE_BICUBIC);
  await png512.writeAsync(path.join(buildDir, 'icon.png'));
  await png512.writeAsync(inputPath);

  console.log('🪟 Generating Windows multi-resolution icon (.ico)...');
  await icongen(stagingDir, buildDir, {
    ico: { name: 'icon' },
    report: false
  });
  // Copy to resources for development and main process runtime
  fs.copyFileSync(
    path.join(buildDir, 'icon.ico'),
    path.join(rootDir, 'resources', 'icon.ico')
  );

  console.log('🍎 Generating macOS icon (.icns)...');
  await icongen(stagingDir, buildDir, {
    icns: { name: 'icon' },
    report: false
  });

  // Clean up staging directory
  fs.rmSync(stagingDir, { recursive: true, force: true });

  console.log('\n======================================================');
  console.log('🎉 All application icons generated with ULTRA clarity!');
  console.log('   - Windows (.ico):    build/icon.ico, resources/icon.ico');
  console.log('   - macOS (.icns):     build/icon.icns');
  console.log('   - Linux (.png):      build/icon.png, build/icons/*');
  console.log('   - Shield Emblem:     Centered, filling ~86% with transparent background');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('❌ Failed to generate icons:', err);
  process.exit(1);
});
