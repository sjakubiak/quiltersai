/**
 * Quilt Math Utilities
 * Standard quilting calculations with proper seam allowances and fabric requirements
 */

export const WOF_DEFAULT = 42; // Width of fabric in inches (usable width)
export const SEAM_ALLOWANCE = 0.25; // 1/4 inch standard
export const BINDING_STRIP_WIDTH = 2.5; // Standard binding strip width

export interface FabricPiece {
  width: number;
  height: number;
  quantity: number;
  color: string;
}

export interface YardageCalculation {
  color: string;
  pieces: FabricPiece[];
  totalYardage: number;
  strips?: number;
}

/**
 * Calculate yardage for a set of fabric pieces
 * Accounts for WOF and efficient cutting layouts
 */
export function calculateYardage(
  pieces: FabricPiece[],
  wof: number = WOF_DEFAULT
): YardageCalculation[] {
  const byColor = pieces.reduce((acc, piece) => {
    if (!acc[piece.color]) {
      acc[piece.color] = [];
    }
    acc[piece.color].push(piece);
    return acc;
  }, {} as Record<string, FabricPiece[]>);

  return Object.entries(byColor).map(([color, colorPieces]) => {
    let totalInches = 0;

    for (const piece of colorPieces) {
      // Calculate how many pieces fit across WOF
      const piecesPerWidth = Math.floor(wof / piece.width);
      
      if (piecesPerWidth === 0) {
        // Piece is wider than WOF, need to cut lengthwise
        totalInches += piece.height * piece.quantity;
      } else {
        // Calculate rows needed
        const rows = Math.ceil(piece.quantity / piecesPerWidth);
        totalInches += rows * piece.height;
      }
    }

    // Convert to yards and round to nearest 1/8 yard
    const yards = totalInches / 36;
    const roundedYards = Math.ceil(yards * 8) / 8;

    return {
      color,
      pieces: colorPieces,
      totalYardage: roundedYards,
    };
  });
}

/**
 * Calculate binding requirements
 */
export function calculateBinding(
  quiltWidth: number,
  quiltHeight: number,
  stripWidth: number = BINDING_STRIP_WIDTH,
  wof: number = WOF_DEFAULT
): {
  yardage: number;
  stripWidthIn: number;
  totalLengthIn: number;
  numberOfStrips: number;
} {
  // Perimeter + 10% for mitering and joining
  const perimeter = (quiltWidth + quiltHeight) * 2;
  const totalLength = perimeter * 1.1;
  
  // Calculate strips needed (WOF - 2" for safety)
  const usableStripLength = wof - 2;
  const numberOfStrips = Math.ceil(totalLength / usableStripLength);
  
  // Yardage = strips * strip width, converted to yards, rounded to 1/8
  const inches = numberOfStrips * stripWidth;
  const yards = Math.ceil((inches / 36) * 8) / 8;

  return {
    yardage: yards,
    stripWidthIn: stripWidth,
    totalLengthIn: totalLength,
    numberOfStrips,
  };
}

/**
 * Calculate backing requirements
 */
export function calculateBacking(
  quiltWidth: number,
  quiltHeight: number,
  overhang: number = 5, // inches per side
  wof: number = WOF_DEFAULT
): {
  yardage: number;
  widthIn: number;
  heightIn: number;
  piecingPlan: string;
} {
  const neededWidth = quiltWidth + overhang * 2;
  const neededHeight = quiltHeight + overhang * 2;

  // If quilt fits within WOF, single piece
  if (neededWidth <= wof) {
    const yards = Math.ceil((neededHeight / 36) * 8) / 8;
    return {
      yardage: yards,
      widthIn: neededWidth,
      heightIn: neededHeight,
      piecingPlan: "Single piece, no seaming required",
    };
  }

  // Need to piece backing - calculate for horizontal seam
  const panels = Math.ceil(neededWidth / wof);
  const yardage = Math.ceil(((neededHeight * panels) / 36) * 8) / 8;

  return {
    yardage,
    widthIn: neededWidth,
    heightIn: neededHeight,
    piecingPlan: `${panels} panels with ${panels - 1} vertical seam${panels > 2 ? 's' : ''}`,
  };
}

/**
 * Calculate batting requirements
 */
export function calculateBatting(
  quiltWidth: number,
  quiltHeight: number,
  overhang: number = 3 // inches per side for batting
): {
  widthIn: number;
  heightIn: number;
} {
  return {
    widthIn: quiltWidth + overhang * 2,
    heightIn: quiltHeight + overhang * 2,
  };
}

/**
 * Add seam allowance to a measurement
 */
export function withSeamAllowance(measurement: number, sides: number = 4): number {
  return measurement + SEAM_ALLOWANCE * sides;
}

/**
 * Convert fractional inches to decimal
 */
export function fractionalToDecimal(inches: number, fraction: number, denominator: number): number {
  return inches + fraction / denominator;
}

/**
 * Format decimal inches to fractional display (e.g., "12.5" -> "12 1/2")
 */
export function formatFractional(decimal: number): string {
  const whole = Math.floor(decimal);
  const remainder = decimal - whole;
  
  if (remainder === 0) return `${whole}`;
  if (Math.abs(remainder - 0.25) < 0.01) return `${whole} 1/4`;
  if (Math.abs(remainder - 0.5) < 0.01) return `${whole} 1/2`;
  if (Math.abs(remainder - 0.75) < 0.01) return `${whole} 3/4`;
  if (Math.abs(remainder - 0.125) < 0.01) return `${whole} 1/8`;
  if (Math.abs(remainder - 0.375) < 0.01) return `${whole} 3/8`;
  if (Math.abs(remainder - 0.625) < 0.01) return `${whole} 5/8`;
  if (Math.abs(remainder - 0.875) < 0.01) return `${whole} 7/8`;
  
  return decimal.toFixed(2);
}
