// 生成PWA图标
const fs = require('fs')
const path = require('path')

// 使用简单的SVG生成图标
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// 生成SVG内容
const generateSVG = (size) => {
  const fontSize = size * 0.6
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="${fontSize}">🏠</text>
</svg>`
}

// 生成所有图标
sizes.forEach(size => {
  const svg = generateSVG(size)
  fs.writeFileSync(path.join(__dirname, `icon-${size}x${size}.svg`), svg)
  console.log(`✅ Generated icon-${size}x${size}.svg`)
})

console.log('\n🎉 所有图标已生成！')
console.log('注意：实际部署时建议将SVG转换为PNG格式以获得最佳兼容性')