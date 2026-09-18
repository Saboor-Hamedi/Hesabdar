# Agent Prompt: How to Diagnose & Improve an Existing Application Icon in an Electron Project

> **Agent Prompt / Instruction**:
> Copy and paste this prompt directly into your agent working on any existing Electron project to diagnose, upgrade, and optimize its application icon for high-clarity display on Windows, macOS, and Linux taskbars.

---

```markdown
You are tasked with improving the existing desktop application icon in this Electron project. 
Currently, the icon may look blurry, tiny, or poorly visible on the operating system taskbar, dock, or window switcher (Alt+Tab).

Follow these exact steps to diagnose and improve the existing icon:

---

### Step 1: Diagnose the Existing Icon

1. Locate the current icon file (typically in `resources/icon.png`, `assets/icon.png`, or `build/icon.png`).
2. Inspect the icon:
   - **Is it a marketing poster / card?** Does it have brand text, slogans, or wide margins around a small central symbol? At 24×24px on the taskbar, text turns into illegible noise and the logo becomes microscopic.
   - **Does it have a solid square background?** Solid black/white boxes clash with Windows 11/10 taskbars and macOS Docks.
   - **Is the central symbol too small?** The symbol should fill ~85–90% of the canvas.
   - **Are multi-platform formats missing?** Windows requires a multi-layered `.ico` (16, 24, 32, 48, 64, 128, 256px). macOS requires `.icns`. Linux requires 512×512 PNG and standard size packs.

---

### Step 2: Install Image Utilities

Ensure the project has the required icon generation dependencies installed in `devDependencies`:

```bash
npm install --save-dev jimp icon-gen
```

---

### Step 3: Implement the Auto-Enhancement Script

Create `scripts/make-icons.js` (or update existing) with logic that automatically:
1. Detects if the current image is an unoptimized poster/card with solid background corners.
2. Extracts and crops strictly the central emblem/symbol (ignoring peripheral text).
3. Converts the solid background to transparent with smooth edge antialiasing.
4. Centers and scales the emblem to occupy **86% of the master canvas**, so it pops out prominently on small taskbars.
5. Uses high-quality **Bicubic resampling** across all standard sizes: `[16, 24, 32, 48, 64, 128, 256, 512, 1024]`.
6. Compiles native `.ico` for Windows and `.icns` for macOS.

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const icongen = require('icon-gen');

const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

async function prepareEmblem(inputPath) {
  const rawImage = await Jimp.read(inputPath);
  const w = rawImage.bitmap.width;
  const h = rawImage.bitmap.height;

  // Check if corners have a solid background (card / poster style)
  const cornerColor = Jimp.intToRGBA(rawImage.getPixelColor(10, 10));
  const isSolidCard = cornerColor.a > 200 && cornerColor.r < 50 && cornerColor.g < 55 && cornerColor.b < 70;

  if (isSolidCard) {
    console.log('   Detected solid card. Isolating central emblem for taskbar visibility...');

    // Scan top 65% area to locate central symbol and ignore lower text
    let minX = w, maxX = 0, minY = h, maxY = 0;
    const scanLimitY = Math.floor(h * 0.65);

    for (let y = 0; y < scanLimitY; y++) {
      for (let x = 0; x < w; x++) {
        const c = Jimp.intToRGBA(rawImage.getPixelColor(x, y));
        const isBg = c.r < 40 && c.g < 45 && c.b < 60;
        if (!isBg) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const cropX = Math.max(0, minX - 2);
    const cropY = Math.max(0, minY - 2);
    const cropW = Math.min(w - cropX, (maxX - minX) + 4);
    const cropH = Math.min(h - cropY, (maxY - minY) + 4);

    const emblemCrop = rawImage.clone().crop(cropX, cropY, cropW, cropH);

    // Make outer background transparent with antialiasing
    const bgR = cornerColor.r, bgG = cornerColor.g, bgB = cornerColor.b;
    emblemCrop.scan(0, 0, emblemCrop.bitmap.width, emblemCrop.bitmap.height, function (x, y, idx) {
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

    // Scale emblem to fill ~86% of a 1024x1024 master canvas
    const masterSize = 1024;
    const targetH = Math.round(masterSize * 0.86);
    const targetW = Math.round(cropW * (targetH / cropH));
    emblemCrop.resize(targetW, targetH, Jimp.RESIZE_BICUBIC);

    const master = new Jimp(masterSize, masterSize, 0x00000000);
    const posX = Math.floor((masterSize - targetW) / 2);
    const posY = Math.floor((masterSize - targetH) / 2);
    master.composite(emblemCrop, posX, posY);

    return master;
  } else {
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

  [buildDir, iconsDir, stagingDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  console.log('📐 Generating multi-resolution PNGs with Bicubic smoothing...');
  for (const size of SIZES) {
    const resized = masterImage.clone().resize(size, size, Jimp.RESIZE_BICUBIC);
    const stagingFile = path.join(stagingDir, `${size}.png`);
    await resized.writeAsync(stagingFile);

    const linuxIconFile = path.join(iconsDir, `${size}x${size}.png`);
    await resized.writeAsync(linuxIconFile);
  }

  const png512 = masterImage.clone().resize(512, 512, Jimp.RESIZE_BICUBIC);
  await png512.writeAsync(path.join(buildDir, 'icon.png'));
  await png512.writeAsync(inputPath);

  console.log('🪟 Generating Windows multi-resolution icon (.ico)...');
  await icongen(stagingDir, buildDir, {
    ico: { name: 'icon' },
    report: false
  });
  fs.copyFileSync(
    path.join(buildDir, 'icon.ico'),
    path.join(rootDir, 'resources', 'icon.ico')
  );

  console.log('🍎 Generating macOS icon (.icns)...');
  await icongen(stagingDir, buildDir, {
    icns: { name: 'icon' },
    report: false
  });

  fs.rmSync(stagingDir, { recursive: true, force: true });

  console.log('\n🎉 Application icons generated with maximum clarity!');
  console.log('   - Windows (.ico): build/icon.ico, resources/icon.ico');
  console.log('   - macOS (.icns):   build/icon.icns');
  console.log('   - Linux (.png):    build/icon.png, build/icons/*');
}

main().catch((err) => {
  console.error('❌ Failed to generate icons:', err);
  process.exit(1);
});
```

---

### Step 4: Wire Build Scripts & Electron Runtime

1. **In `package.json`**:
   Add `"make:icon": "node scripts/make-icons.js"` to `"scripts"`.

2. **In Main Process (`src/main/index.ts` or `src/main.js`)**:
   Check `createWindow()`:
   * **Do NOT** limit icon to Linux: remove `...(process.platform === 'linux' ? { icon } : {})`.
   * Set `icon` unconditionally so the custom icon appears during development on Windows & Linux:
     ```typescript
     const mainWindow = new BrowserWindow({
       ...
       icon, // Points to resources/icon.png
     })
     ```
   * Set `app.setAppUserModelId('com.yourcompany.app')` inside `app.whenReady()` to bind the Windows taskbar pinned icon correctly.

3. **In `electron-builder.yml`**:
   Explicitly link icon paths for all platforms:
   ```yaml
   directories:
     buildResources: build

   win:
     icon: build/icon.ico

   mac:
     icon: build/icon.icns

   linux:
     icon: build/icons
   ```

---

### Step 5: Execute & Verify
Run the generator:
```bash
npm run make:icon
```
Then verify with:
```bash
npm run typecheck
npm run build
```
```