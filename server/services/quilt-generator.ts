import type { PromptInterpretResponse, InsertDesignVariation, InsertCutListItem, InsertPiecingStep } from "@shared/schema";
import { calculateYardage, calculateBinding, calculateBacking, calculateBatting, withSeamAllowance } from "./quilt-math";

/**
 * Block pattern definitions with their characteristics
 */
interface BlockPattern {
  name: string;
  difficulty: number; // 1-5
  shapes: string[]; // Shapes used in this block
  minColors: number;
  maxColors: number;
  category: string; // traditional, modern, geometric
}

const BLOCK_PATTERNS: BlockPattern[] = [
  { name: "Nine Patch", difficulty: 1, shapes: ["squares"], minColors: 2, maxColors: 3, category: "traditional" },
  { name: "Four Patch", difficulty: 1, shapes: ["squares"], minColors: 2, maxColors: 2, category: "traditional" },
  { name: "Rail Fence", difficulty: 1, shapes: ["rectangles"], minColors: 3, maxColors: 4, category: "traditional" },
  { name: "Log Cabin", difficulty: 2, shapes: ["rectangles"], minColors: 2, maxColors: 4, category: "traditional" },
  { name: "Irish Chain", difficulty: 3, shapes: ["squares"], minColors: 2, maxColors: 3, category: "traditional" },
  { name: "Flying Geese", difficulty: 3, shapes: ["triangles", "rectangles"], minColors: 2, maxColors: 3, category: "traditional" },
  { name: "Plus Quilt", difficulty: 2, shapes: ["rectangles"], minColors: 2, maxColors: 3, category: "modern" },
  { name: "Coins", difficulty: 1, shapes: ["rectangles"], minColors: 3, maxColors: 6, category: "modern" },
  { name: "Bricks", difficulty: 1, shapes: ["rectangles"], minColors: 2, maxColors: 5, category: "modern" },
];

const LAYOUT_STRATEGIES = [
  "grid",
  "brick-layout",
  "coin-stack",
  "modern-improv",
  "row-by-row",
];

const QUILTING_MOTIFS = [
  "Straight Line",
  "Echo Quilting",
  "Crosshatch",
  "Baptist Fan",
  "Meandering",
  "Stippling",
  "Channel Quilting",
  "Grid Pattern",
];

/**
 * Generate quilt design variations based on specifications
 */
export function generateDesigns(
  spec: PromptInterpretResponse["spec"],
  count: number = 12
): Array<{
  design: Omit<InsertDesignVariation, "specId">;
  cutList: Omit<InsertCutListItem, "designId">[];
  steps: Omit<InsertPiecingStep, "designId">[];
}> {
  const results: Array<{
    design: Omit<InsertDesignVariation, "specId">;
    cutList: Omit<InsertCutListItem, "designId">[];
    steps: Omit<InsertPiecingStep, "designId">[];
  }> = [];

  // Filter patterns based on constraints
  let availablePatterns = [...BLOCK_PATTERNS];
  
  // Filter by avoided shapes
  if (spec.constraints?.avoid && spec.constraints.avoid.length > 0) {
    const avoidLower = spec.constraints.avoid.map(s => s.toLowerCase());
    availablePatterns = availablePatterns.filter(p => 
      !p.shapes.some(shape => avoidLower.includes(shape))
    );
  }

  // Filter by allowed shapes (if specified)
  if (spec.constraints?.shapes && spec.constraints.shapes.length > 0) {
    const allowedLower = spec.constraints.shapes.map(s => s.toLowerCase());
    availablePatterns = availablePatterns.filter(p =>
      p.shapes.every(shape => allowedLower.includes(shape))
    );
  }

  // If no patterns match, use simplest ones
  if (availablePatterns.length === 0) {
    availablePatterns = BLOCK_PATTERNS.filter(p => p.difficulty <= 2);
  }

  // Generate variations
  for (let i = 0; i < count; i++) {
    const patternIndex = i % availablePatterns.length;
    const pattern = availablePatterns[patternIndex];
    const layoutIndex = i % LAYOUT_STRATEGIES.length;
    const layout = LAYOUT_STRATEGIES[layoutIndex];

    // Generate this variation
    const variation = generateSingleDesign(spec, pattern, layout, i);
    results.push(variation);
  }

  return results;
}

function generateSingleDesign(
  spec: PromptInterpretResponse["spec"],
  pattern: BlockPattern,
  layoutStrategy: string,
  seed: number
): {
  design: Omit<InsertDesignVariation, "specId">;
  cutList: Omit<InsertCutListItem, "designId">[];
  steps: Omit<InsertPiecingStep, "designId">[];
} {
  // Determine block size based on pattern and quilt size
  const blockSize = determineBlockSize(spec.size.width_in, spec.size.height_in, pattern);
  const sashingWidth = spec.sashing ? 2 : 0;
  const borderWidth = spec.border || 0;

  // Calculate layout grid
  const { cols, rows, blocks } = calculateLayout(
    spec.size.width_in,
    spec.size.height_in,
    blockSize,
    sashingWidth,
    borderWidth
  );

  // Select colors from palette
  const colors = selectColors(spec.palette, pattern.minColors, pattern.maxColors, seed);

  // Generate SVG mockup
  const svgMockup = generateMockupSVG(pattern.name, cols, rows, blockSize, colors, sashingWidth, borderWidth);

  // Generate cut list
  const cutList = generateCutList(pattern, blocks, blockSize, colors, sashingWidth, borderWidth, cols, rows);

  // Calculate total yardage
  const fabricPieces = cutList.map(item => ({
    width: item.widthIn,
    height: item.heightIn,
    quantity: item.quantity,
    color: item.fabricColor,
  }));
  const yardageByColor = calculateYardage(fabricPieces);
  const totalYardage = yardageByColor.reduce((sum, y) => sum + y.totalYardage, 0);

  // Generate piecing steps
  const steps = generatePiecingSteps(pattern, blockSize);

  // Select quilting motifs
  const motifs = selectQuiltingMotifs(pattern, seed);

  // Estimate time based on difficulty and size
  const estimatedHours = estimateTime(pattern.difficulty, blocks);

  const design: Omit<InsertDesignVariation, "specId"> = {
    name: `${pattern.name} ${layoutStrategy.replace(/-/g, ' ')} #${seed + 1}`,
    blockPattern: pattern.name,
    layoutStrategy: layoutStrategy,
    svgMockup,
    previewPng: null,
    difficulty: pattern.difficulty,
    estimatedHours,
    scrapFriendly: pattern.name === "Coins" || pattern.name === "Bricks" || pattern.maxColors >= 4 ? 1 : 0,
    totalYardage,
    blockSizeIn: blockSize,
    sashingIn: sashingWidth,
    borderIn: borderWidth,
    quiltingMotifs: motifs,
    metadata: {
      colors,
      cols,
      rows,
      totalBlocks: blocks,
    },
  };

  return { design, cutList, steps };
}

function determineBlockSize(width: number, height: number, pattern: BlockPattern): number {
  const avgDimension = (width + height) / 2;
  
  if (avgDimension < 50) return 8;  // Baby quilts
  if (avgDimension < 70) return 10; // Throw quilts
  if (avgDimension < 90) return 12; // Twin/Full
  return 14; // Queen/King
}

function calculateLayout(
  width: number,
  height: number,
  blockSize: number,
  sashingWidth: number,
  borderWidth: number
): { cols: number; rows: number; blocks: number } {
  const availableWidth = width - 2 * borderWidth;
  const availableHeight = height - 2 * borderWidth;

  const cols = Math.max(1, Math.floor((availableWidth + sashingWidth) / (blockSize + sashingWidth)));
  const rows = Math.max(1, Math.floor((availableHeight + sashingWidth) / (blockSize + sashingWidth)));

  return { cols, rows, blocks: cols * rows };
}

function selectColors(palette: string[], min: number, max: number, seed: number): string[] {
  // Ensure palette has at least some colors, use defaults if empty
  const defaultPalette = ["#8B4513", "#F5DEB3", "#CD853F", "#DEB887"];
  const safePalette = palette && palette.length > 0 ? palette : defaultPalette;
  
  const count = Math.min(Math.max(min, 2 + (seed % (max - min + 1))), safePalette.length);
  return safePalette.slice(0, Math.max(count, min));
}

function generateMockupSVG(
  pattern: string,
  cols: number,
  rows: number,
  blockSize: number,
  colors: string[],
  sashing: number,
  border: number
): string {
  const quiltWidth = cols * blockSize + (cols - 1) * sashing + 2 * border;
  const quiltHeight = rows * blockSize + (rows - 1) * sashing + 2 * border;

  let svg = `<svg viewBox="0 0 ${quiltWidth} ${quiltHeight}" xmlns="http://www.w3.org/2000/svg" width="1000">`;

  // Border
  if (border > 0) {
    svg += `<rect x="0" y="0" width="${quiltWidth}" height="${quiltHeight}" fill="${colors[0]}" stroke="#333" stroke-width="1"/>`;
  }

  // Blocks
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = border + col * (blockSize + sashing);
      const y = border + row * (blockSize + sashing);

      // Sashing
      if (sashing > 0) {
        const sashColor = colors[colors.length - 1];
        if (col > 0) {
          svg += `<rect x="${x - sashing}" y="${y}" width="${sashing}" height="${blockSize}" fill="${sashColor}" opacity="0.7"/>`;
        }
        if (row > 0) {
          svg += `<rect x="${x}" y="${y - sashing}" width="${blockSize}" height="${sashing}" fill="${sashColor}" opacity="0.7"/>`;
        }
      }

      // Block pattern
      svg += generateBlockSVG(pattern, x, y, blockSize, colors, (row + col) % 2);
    }
  }

  svg += '</svg>';
  return svg;
}

function generateBlockSVG(pattern: string, x: number, y: number, size: number, colors: string[], alternate: number): string {
  const c1 = colors[0] || '#E0E0E0';
  const c2 = colors[1] || '#757575';
  const c3 = colors[2] || '#424242';

  switch (pattern) {
    case "Nine Patch":
      return generateNinePatch(x, y, size, c1, c2);
    case "Four Patch":
      return generateFourPatch(x, y, size, c1, c2);
    case "Rail Fence":
      return generateRailFence(x, y, size, colors);
    case "Log Cabin":
      return generateLogCabin(x, y, size, c1, c2);
    case "Plus Quilt":
      return generatePlus(x, y, size, c1, c2);
    case "Coins":
    case "Bricks":
      return generateCoins(x, y, size, colors);
    default:
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${c1}" stroke="#333" stroke-width="0.5"/>`;
  }
}

function generateNinePatch(x: number, y: number, size: number, c1: string, c2: string): string {
  const third = size / 3;
  let svg = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const color = (i + j) % 2 === 0 ? c1 : c2;
      svg += `<rect x="${x + j * third}" y="${y + i * third}" width="${third}" height="${third}" fill="${color}" stroke="#333" stroke-width="0.5"/>`;
    }
  }
  return svg;
}

function generateFourPatch(x: number, y: number, size: number, c1: string, c2: string): string {
  const half = size / 2;
  return `
    <rect x="${x}" y="${y}" width="${half}" height="${half}" fill="${c1}" stroke="#333" stroke-width="0.5"/>
    <rect x="${x + half}" y="${y}" width="${half}" height="${half}" fill="${c2}" stroke="#333" stroke-width="0.5"/>
    <rect x="${x}" y="${y + half}" width="${half}" height="${half}" fill="${c2}" stroke="#333" stroke-width="0.5"/>
    <rect x="${x + half}" y="${y + half}" width="${half}" height="${half}" fill="${c1}" stroke="#333" stroke-width="0.5"/>
  `;
}

function generateRailFence(x: number, y: number, size: number, colors: string[]): string {
  const stripHeight = size / Math.min(colors.length, 4);
  let svg = '';
  for (let i = 0; i < Math.min(colors.length, 4); i++) {
    svg += `<rect x="${x}" y="${y + i * stripHeight}" width="${size}" height="${stripHeight}" fill="${colors[i]}" stroke="#333" stroke-width="0.5"/>`;
  }
  return svg;
}

function generateLogCabin(x: number, y: number, size: number, c1: string, c2: string): string {
  const center = size / 5;
  const centerPos = (size - center) / 2;
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${c1}" stroke="#333" stroke-width="0.5"/>
    <rect x="${x + size/5}" y="${y + size/5}" width="${size*3/5}" height="${size*3/5}" fill="${c2}" stroke="#333" stroke-width="0.5"/>
    <rect x="${x + centerPos}" y="${y + centerPos}" width="${center}" height="${center}" fill="${c1}" stroke="#333" stroke-width="0.5"/>
  `;
}

function generatePlus(x: number, y: number, size: number, c1: string, c2: string): string {
  const third = size / 3;
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${c1}" stroke="#333" stroke-width="0.5"/>
    <rect x="${x + third}" y="${y}" width="${third}" height="${size}" fill="${c2}" stroke="#333" stroke-width="0.5"/>
    <rect x="${x}" y="${y + third}" width="${size}" height="${third}" fill="${c2}" stroke="#333" stroke-width="0.5"/>
  `;
}

function generateCoins(x: number, y: number, size: number, colors: string[]): string {
  const stripCount = Math.min(colors.length, 5);
  const stripHeight = size / stripCount;
  let svg = '';
  for (let i = 0; i < stripCount; i++) {
    svg += `<rect x="${x}" y="${y + i * stripHeight}" width="${size}" height="${stripHeight}" fill="${colors[i % colors.length]}" stroke="#333" stroke-width="0.5"/>`;
  }
  return svg;
}

function generateCutList(
  pattern: BlockPattern,
  blocks: number,
  blockSize: number,
  colors: string[],
  sashingWidth: number,
  borderWidth: number,
  cols: number,
  rows: number
): Omit<InsertCutListItem, "designId">[] {
  const cutList: Omit<InsertCutListItem, "designId">[] = [];

  // Simplified cut list - calculate pieces per block
  const piecesPerBlock = pattern.name === "Nine Patch" ? 9 : pattern.name === "Four Patch" ? 4 : 3;
  const pieceSize = blockSize / Math.sqrt(piecesPerBlock);
  const pieceSizeWithSeam = withSeamAllowance(pieceSize, 4);

  // Main fabric pieces
  colors.forEach((color, idx) => {
    const quantity = Math.ceil((blocks * piecesPerBlock) / colors.length);
    const yardageCalc = calculateYardage([{
      width: pieceSizeWithSeam,
      height: pieceSizeWithSeam,
      quantity,
      color,
    }]);

    cutList.push({
      fabricColor: color,
      pieceType: "square",
      widthIn: pieceSizeWithSeam,
      heightIn: pieceSizeWithSeam,
      quantity,
      yardage: yardageCalc[0]?.totalYardage || 0,
      notes: `For ${pattern.name} blocks`,
    });
  });

  // Sashing if needed
  if (sashingWidth > 0 && colors.length > 0) {
    const sashingColor = colors[colors.length - 1] || "#FFFFFF"; // Fallback to white if undefined
    const horizontalSashing = rows * (cols - 1);
    const verticalSashing = cols * (rows - 1);
    
    cutList.push({
      fabricColor: sashingColor,
      pieceType: "strip",
      widthIn: sashingWidth + 0.5,
      heightIn: blockSize + 0.5,
      quantity: horizontalSashing + verticalSashing,
      yardage: calculateYardage([{
        width: sashingWidth + 0.5,
        height: blockSize + 0.5,
        quantity: horizontalSashing + verticalSashing,
        color: sashingColor,
      }])[0]?.totalYardage || 0,
      notes: "Sashing strips",
    });
  }

  return cutList;
}

function generatePiecingSteps(pattern: BlockPattern, blockSize: number): Omit<InsertPiecingStep, "designId">[] {
  const steps: Omit<InsertPiecingStep, "designId">[] = [];

  switch (pattern.name) {
    case "Nine Patch":
      steps.push(
        { stepNumber: 1, instruction: "Cut all fabric squares to size with 1/4\" seam allowance included.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 2, instruction: "Sew three squares together in a row, alternating colors. Press seams to darker fabric.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 3, instruction: "Repeat to create three rows total. Press seams in opposite directions for each row.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 4, instruction: "Sew the three rows together, nesting seams. Press final seams open or to one side.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 5, instruction: "Square up completed blocks to final size. Repeat for all blocks.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 6, instruction: "Arrange blocks in desired layout. Sew blocks together in rows.", diagramSvg: null, type: "row_assembly" },
        { stepNumber: 7, instruction: "Sew rows together to complete quilt top. Press carefully.", diagramSvg: null, type: "final_assembly" }
      );
      break;

    case "Four Patch":
      steps.push(
        { stepNumber: 1, instruction: "Cut fabric squares to size with seam allowances.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 2, instruction: "Sew two squares together, one light and one dark. Press toward darker fabric.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 3, instruction: "Sew another pair in the same manner. Press seams in opposite direction.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 4, instruction: "Join the two pairs together, nesting center seam. Press.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 5, instruction: "Assemble all blocks in desired layout and sew into rows.", diagramSvg: null, type: "row_assembly" },
        { stepNumber: 6, instruction: "Join rows to complete quilt top.", diagramSvg: null, type: "final_assembly" }
      );
      break;

    case "Rail Fence":
      steps.push(
        { stepNumber: 1, instruction: "Cut fabric into strips of equal width with seam allowances.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 2, instruction: "Sew three strips together lengthwise. Press seams to one side.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 3, instruction: "Sub-cut the strip set into blocks of desired width.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 4, instruction: "Rotate blocks to create rail fence pattern. Arrange in alternating orientations.", diagramSvg: null, type: "row_assembly" },
        { stepNumber: 5, instruction: "Sew blocks into rows, then join rows together.", diagramSvg: null, type: "final_assembly" }
      );
      break;

    default:
      steps.push(
        { stepNumber: 1, instruction: "Cut all fabric pieces according to cut list.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 2, instruction: "Assemble blocks following pattern instructions. Press seams carefully.", diagramSvg: null, type: "block_assembly" },
        { stepNumber: 3, instruction: "Arrange blocks in desired layout.", diagramSvg: null, type: "row_assembly" },
        { stepNumber: 4, instruction: "Sew blocks into rows, then join rows to complete quilt top.", diagramSvg: null, type: "final_assembly" }
      );
  }

  return steps;
}

function selectQuiltingMotifs(pattern: BlockPattern, seed: number): string[] {
  const count = 2 + (seed % 2);
  return QUILTING_MOTIFS.slice(seed % QUILTING_MOTIFS.length, (seed % QUILTING_MOTIFS.length) + count);
}

function estimateTime(difficulty: number, blocks: number): number {
  const baseTime = 4; // hours for a simple small quilt
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.5;
  const blockMultiplier = Math.log(blocks) / Math.log(10);
  return Math.round(baseTime * difficultyMultiplier * blockMultiplier);
}
