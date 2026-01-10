/**
 * Script to generate PNG and ICO files from SVG icons
 * Requires: sharp (npm install sharp)
 * 
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp package not found. Please install it first:');
  console.error('  npm install --save-dev sharp');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');

async function generateIcons() {
  console.log('Generating icon files from SVG...\n');

  // Generate favicon.ico (multi-size ICO)
  try {
    const faviconSvg = fs.readFileSync(path.join(publicDir, 'favicon.svg'));
    const sizes = [16, 32, 48];
    const icoImages = await Promise.all(
      sizes.map(size =>
        sharp(faviconSvg)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );
    
    // Create individual PNG files
    await sharp(icoImages[2]).toFile(path.join(publicDir, 'favicon-16x16.png'));
    await sharp(icoImages[1]).toFile(path.join(publicDir, 'favicon-32x32.png'));
    await sharp(icoImages[0]).toFile(path.join(publicDir, 'favicon-48x48.png'));
    
    // Create favicon.ico (32x32 PNG as ICO - browsers will accept this)
    // For a proper multi-size ICO, use an online converter or ImageMagick
    await sharp(icoImages[1]).png().toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Generated favicon files');
  } catch (error) {
    console.error('Error generating favicon:', error.message);
  }

  // Generate icon.png (192x192 and 512x512)
  try {
    const iconSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'));
    await sharp(iconSvg).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192x192.png'));
    await sharp(iconSvg).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512x512.png'));
    // Main icon.png (512x512)
    await sharp(iconSvg).resize(512, 512).png().toFile(path.join(publicDir, 'icon.png'));
    console.log('✓ Generated icon.png files');
  } catch (error) {
    console.error('Error generating icon.png:', error.message);
  }

  // Generate apple-icon.png (180x180)
  try {
    const appleIconSvg = fs.readFileSync(path.join(publicDir, 'apple-icon.svg'));
    await sharp(appleIconSvg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-icon.png'));
    console.log('✓ Generated apple-icon.png');
  } catch (error) {
    console.error('Error generating apple-icon.png:', error.message);
  }

  // Generate opengraph-image.png (1200x630)
  try {
    const ogSvg = fs.readFileSync(path.join(publicDir, 'opengraph-image.svg'));
    await sharp(ogSvg).resize(1200, 630).png().toFile(path.join(publicDir, 'opengraph-image.png'));
    console.log('✓ Generated opengraph-image.png');
  } catch (error) {
    console.error('Error generating opengraph-image.png:', error.message);
  }

  // Generate twitter-image.png (1200x630) - same as opengraph for now
  try {
    const ogSvg = fs.readFileSync(path.join(publicDir, 'opengraph-image.svg'));
    await sharp(ogSvg).resize(1200, 630).png().toFile(path.join(publicDir, 'twitter-image.png'));
    console.log('✓ Generated twitter-image.png');
  } catch (error) {
    console.error('Error generating twitter-image.png:', error.message);
  }

  console.log('\n✓ All icon files generated successfully!');
  console.log('\nNote: For a proper multi-size ICO file, you may want to use a tool like:');
  console.log('  - ImageMagick: convert favicon-*.png favicon.ico');
  console.log('  - Online converter: https://convertio.co/png-ico/');
}

generateIcons().catch(console.error);

