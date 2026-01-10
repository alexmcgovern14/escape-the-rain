# Icon Generation Guide

This directory contains SVG source files for all icons and social sharing images. To generate the required PNG and ICO files:

## Quick Start

1. Install the required dependency:
   ```bash
   npm install --save-dev sharp
   ```

2. Run the generation script:
   ```bash
   node scripts/generate-icons.js
   ```

This will generate:
- `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`
- `icon.png` (512x512), `icon-192x192.png`, `icon-512x512.png`
- `apple-icon.png` (180x180)
- `opengraph-image.png` (1200x630)
- `twitter-image.png` (1200x630)

## Manual Generation (Alternative)

If you prefer to generate icons manually or use online tools:

1. **Favicon**: Use [favicon.io](https://favicon.io/) or [realfavicongenerator.net](https://realfavicongenerator.net/)
   - Upload `favicon.svg`
   - Download the generated favicon package

2. **PNG Icons**: Use [CloudConvert](https://cloudconvert.com/svg-to-png) or similar
   - Convert `icon.svg` to 192x192 and 512x512 PNG
   - Convert `apple-icon.svg` to 180x180 PNG

3. **Social Images**: Use [CloudConvert](https://cloudconvert.com/svg-to-png)
   - Convert `opengraph-image.svg` to 1200x630 PNG

## SVG Source Files

- `favicon.svg` - Base favicon (24x24 viewBox)
- `icon.svg` - PWA icon (512x512)
- `apple-icon.svg` - iOS icon (180x180)
- `opengraph-image.svg` - Social sharing image (1200x630)

All icons use a sun icon design with yellow/golden colors (#fbbf24, #f59e0b) on white backgrounds.

