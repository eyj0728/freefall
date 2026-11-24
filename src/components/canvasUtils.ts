export interface BallPalette {
  highlight: string;
  mid: string;
  deep: string;
  rim: string;
  ghostFill: string;
  ghostStroke: string;
}

export const BALL_PALETTES = {
  sunset: {
    highlight: '#fff1e6',
    mid: '#f77737',
    deep: '#dd2a7b',
    rim: 'rgba(131, 24, 67, 0.72)',
    ghostFill: 'rgba(221, 42, 123, 0.13)',
    ghostStroke: 'rgba(221, 42, 123, 0.5)',
  },
  plum: {
    highlight: '#f3e8ff',
    mid: '#a855f7',
    deep: '#7e22ce',
    rim: 'rgba(88, 28, 135, 0.75)',
    ghostFill: 'rgba(129, 52, 175, 0.13)',
    ghostStroke: 'rgba(129, 52, 175, 0.5)',
  },
  orange: {
    highlight: '#fff7ed',
    mid: '#fb923c',
    deep: '#ea580c',
    rim: 'rgba(154, 52, 18, 0.72)',
    ghostFill: 'rgba(245, 133, 41, 0.15)',
    ghostStroke: 'rgba(234, 88, 12, 0.52)',
  },
  rose: {
    highlight: '#ffe4e6',
    mid: '#fb7185',
    deep: '#dd2a7b',
    rim: 'rgba(131, 24, 67, 0.72)',
    ghostFill: 'rgba(221, 42, 123, 0.14)',
    ghostStroke: 'rgba(221, 42, 123, 0.52)',
  },
} as const;

export function drawSportsBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  palette: BallPalette = BALL_PALETTES.sunset
): void {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(
    x - radius * 0.34,
    y - radius * 0.34,
    radius * 0.08,
    x + radius * 0.15,
    y + radius * 0.2,
    radius * 1.15
  );
  grad.addColorStop(0, palette.highlight);
  grad.addColorStop(0.28, palette.mid);
  grad.addColorStop(0.75, palette.deep);
  grad.addColorStop(1, palette.rim);

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.lineWidth = 1.4;
  ctx.strokeStyle = palette.rim;
  ctx.stroke();

  // Subtle curved seam
  ctx.beginPath();
  ctx.arc(x, y, radius - 0.8, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(x - radius, y + radius * 0.05);
  ctx.quadraticCurveTo(x, y - radius * 0.38, x + radius, y + radius * 0.05);
  ctx.stroke();

  ctx.restore();
}

export function drawGhostBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  palette: BallPalette = BALL_PALETTES.sunset
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = palette.ghostFill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = palette.ghostStroke;
  ctx.stroke();
  ctx.restore();
}

export function drawFloorShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  ballRadius: number,
  fallProgressY: number
): void {
  const proximity = Math.max(0.25, Math.min(1, fallProgressY));
  const rx = ballRadius * (0.55 + 0.55 * proximity);
  const ry = Math.max(2, ballRadius * 0.22);
  const alpha = 0.07 + 0.14 * proximity;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, groundY + 1, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(24, 24, 27, ${alpha.toFixed(3)})`;
  ctx.fill();
  ctx.restore();
}
