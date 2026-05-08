// Quick script to generate placeholder PNG icons
const { createCanvas } = require('canvas');
const fs = require('fs');

const sizes = [16, 32, 180, 192, 512];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Blue background
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);
  
  // White text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', size/2, size/2);
  
  const buffer = canvas.toBuffer('image/png');
  const filename = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`;
  fs.writeFileSync(`public/${filename}`, buffer);
  console.log(`✅ Created ${filename}`);
});