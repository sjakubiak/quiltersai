/**
 * SVG utility functions for quilt design generation and manipulation
 */

export interface BlockColor {
  fill: string;
  stroke?: string;
}

export interface QuiltBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  colors: BlockColor[];
  pattern: string;
}

/**
 * Generate a simple quilt block SVG
 */
export function generateQuiltBlockSVG(
  pattern: string,
  size: number,
  colors: string[]
): string {
  const viewBox = `0 0 ${size} ${size}`;
  
  switch (pattern.toLowerCase()) {
    case "nine patch":
      return generateNinePatchSVG(size, colors);
    case "four patch":
      return generateFourPatchSVG(size, colors);
    case "rail fence":
      return generateRailFenceSVG(size, colors);
    case "log cabin":
      return generateLogCabinSVG(size, colors);
    case "flying geese":
      return generateFlyingGeeseSVG(size, colors);
    case "plus quilt":
      return generatePlusSVG(size, colors);
    case "coins":
    case "bricks":
      return generateCoinsSVG(size, colors);
    default:
      return generateNinePatchSVG(size, colors);
  }
}

function generateNinePatchSVG(size: number, colors: string[]): string {
  const third = size / 3;
  const c = colors.length >= 2 ? colors : ["#E0E0E0", "#757575"];
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${third}" height="${third}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="${third}" y="0" width="${third}" height="${third}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="${third * 2}" y="0" width="${third}" height="${third}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${third}" width="${third}" height="${third}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="${third}" y="${third}" width="${third}" height="${third}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="${third * 2}" y="${third}" width="${third}" height="${third}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${third * 2}" width="${third}" height="${third}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="${third}" y="${third * 2}" width="${third}" height="${third}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="${third * 2}" y="${third * 2}" width="${third}" height="${third}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
    </svg>
  `;
}

function generateFourPatchSVG(size: number, colors: string[]): string {
  const half = size / 2;
  const c = colors.length >= 2 ? colors : ["#E0E0E0", "#757575"];
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${half}" height="${half}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="${half}" y="0" width="${half}" height="${half}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${half}" width="${half}" height="${half}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="${half}" y="${half}" width="${half}" height="${half}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
    </svg>
  `;
}

function generateRailFenceSVG(size: number, colors: string[]): string {
  const c = colors.length >= 3 ? colors : ["#E0E0E0", "#757575", "#424242"];
  const stripHeight = size / 3;
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${stripHeight}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${stripHeight}" width="${size}" height="${stripHeight}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${stripHeight * 2}" width="${size}" height="${stripHeight}" fill="${c[2]}" stroke="#333" stroke-width="1"/>
    </svg>
  `;
}

function generateLogCabinSVG(size: number, colors: string[]): string {
  const c = colors.length >= 2 ? colors : ["#E0E0E0", "#757575"];
  const center = size / 5;
  const centerPos = (size - center) / 2;
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${size}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="${size/5}" y="${size/5}" width="${size*3/5}" height="${size*3/5}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="${centerPos}" y="${centerPos}" width="${center}" height="${center}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
    </svg>
  `;
}

function generateFlyingGeeseSVG(size: number, colors: string[]): string {
  const c = colors.length >= 2 ? colors : ["#E0E0E0", "#757575"];
  const half = size / 2;
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,0 ${size},${half} 0,${size}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <polygon points="0,0 ${size},0 ${size},${half}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <polygon points="${size},${half} ${size},${size} 0,${size}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
    </svg>
  `;
}

function generatePlusSVG(size: number, colors: string[]): string {
  const c = colors.length >= 2 ? colors : ["#E0E0E0", "#757575"];
  const third = size / 3;
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${size}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="${third}" y="0" width="${third}" height="${size}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${third}" width="${size}" height="${third}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
    </svg>
  `;
}

function generateCoinsSVG(size: number, colors: string[]): string {
  const c = colors.length >= 4 ? colors : ["#E0E0E0", "#757575", "#424242", "#212121"];
  const quarter = size / 4;
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${quarter}" fill="${c[0]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${quarter}" width="${size}" height="${quarter}" fill="${c[1]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${quarter*2}" width="${size}" height="${quarter}" fill="${c[2]}" stroke="#333" stroke-width="1"/>
      <rect x="0" y="${quarter*3}" width="${size}" height="${quarter}" fill="${c[3]}" stroke="#333" stroke-width="1"/>
    </svg>
  `;
}

/**
 * Generate a complete quilt mockup SVG with multiple blocks
 */
export function generateQuiltMockupSVG(
  pattern: string,
  layout: { cols: number; rows: number },
  blockSize: number,
  colors: string[],
  sashing?: number,
  border?: number
): string {
  const { cols, rows } = layout;
  const sashingWidth = sashing || 0;
  const borderWidth = border || 0;
  
  const quiltWidth = cols * blockSize + (cols - 1) * sashingWidth + 2 * borderWidth;
  const quiltHeight = rows * blockSize + (rows - 1) * sashingWidth + 2 * borderWidth;
  
  let svg = `<svg viewBox="0 0 ${quiltWidth} ${quiltHeight}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Border
  if (borderWidth > 0) {
    svg += `<rect x="0" y="0" width="${quiltWidth}" height="${quiltHeight}" fill="${colors[0] || '#E0E0E0'}" stroke="#333" stroke-width="2"/>`;
  }
  
  // Blocks
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = borderWidth + col * (blockSize + sashingWidth);
      const y = borderWidth + row * (blockSize + sashingWidth);
      
      // Sashing background
      if (sashingWidth > 0 && (col > 0 || row > 0)) {
        const sashColor = colors[colors.length - 1] || '#BDBDBD';
        if (col > 0) {
          svg += `<rect x="${x - sashingWidth}" y="${y}" width="${sashingWidth}" height="${blockSize}" fill="${sashColor}" stroke="#333" stroke-width="0.5"/>`;
        }
        if (row > 0) {
          svg += `<rect x="${x}" y="${y - sashingWidth}" width="${blockSize}" height="${sashingWidth}" fill="${sashColor}" stroke="#333" stroke-width="0.5"/>`;
        }
      }
      
      // Block
      const blockSVG = generateQuiltBlockSVG(pattern, blockSize, colors);
      const blockContent = blockSVG.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
      svg += `<g transform="translate(${x}, ${y})">${blockContent}</g>`;
    }
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Convert SVG string to data URL for preview images
 */
export function svgToDataURL(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}
