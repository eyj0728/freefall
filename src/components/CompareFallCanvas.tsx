import { useEffect, useRef } from 'react';
import { MotionProgress } from '../physics/projectile';
import { BALL_PALETTES, drawFloorShadow, drawGhostBall, drawSportsBall } from './canvasUtils';

interface CompareFallCanvasProps {
  width: number;
  height: number;
  motion: MotionProgress;
  strobes: MotionProgress[];
  showStrobes: boolean;
  showHeightLine: boolean;
}

const BALL_CASES = [
  {
    id: 'freefall',
    label: '자유낙하',
    rangeRatio: 0,
    palette: BALL_PALETTES.plum,
    trailColor: 'rgba(129, 52, 175, 0.4)',
    labelColor: '#6b21a8',
  },
  {
    id: 'gentle',
    label: '살살 던진 공',
    rangeRatio: 0.38,
    palette: BALL_PALETTES.orange,
    trailColor: 'rgba(234, 88, 12, 0.42)',
    labelColor: '#c2410c',
  },
  {
    id: 'fast',
    label: '세게 던진 공',
    rangeRatio: 0.86,
    palette: BALL_PALETTES.rose,
    trailColor: 'rgba(221, 42, 123, 0.46)',
    labelColor: '#be185d',
  },
] as const;

export function CompareFallCanvas({
  width,
  height,
  motion,
  strobes,
  showStrobes,
  showHeightLine,
}: CompareFallCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    const ballRadius = 11.5;
    const tableEdgeX = 112;
    const maxSpanPx = Math.max(160, width - tableEdgeX - 64);
    const groundY = Math.max(200, height - 42);
    const tableTopY = Math.max(64, Math.round(groundY * 0.22));
    const startCenterY = tableTopY - ballRadius;
    const dropSpanPx = groundY - tableTopY;

    // 1. Soft studio daylight wall
    const wallGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    wallGrad.addColorStop(0, '#fffaf8');
    wallGrad.addColorStop(0.55, '#ffffff');
    wallGrad.addColorStop(1, '#fafafa');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, groundY);

    // 2. Floor band
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, groundY, width, height - groundY);

    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // 3. Modern wooden table on the left
    const tableLeft = 20;
    const tableWidth = Math.max(28, tableEdgeX - tableLeft);
    const tabletopThickness = 12;

    // Sleek dark charcoal legs
    ctx.fillStyle = '#52525b';
    ctx.beginPath();
    ctx.roundRect(
      tableLeft + 10,
      tableTopY + tabletopThickness - 1,
      7,
      groundY - (tableTopY + tabletopThickness) + 1,
      [0, 0, 3, 3]
    );
    ctx.roundRect(
      tableEdgeX - 17,
      tableTopY + tabletopThickness - 1,
      7,
      groundY - (tableTopY + tabletopThickness) + 1,
      [0, 0, 3, 3]
    );
    ctx.fill();

    // Tabletop lip shadow
    ctx.fillStyle = 'rgba(24, 24, 27, 0.08)';
    ctx.fillRect(tableLeft + 4, tableTopY + tabletopThickness, tableWidth - 8, 4);

    // Tabletop
    const woodGrad = ctx.createLinearGradient(
      tableLeft,
      tableTopY,
      tableLeft,
      tableTopY + tabletopThickness
    );
    woodGrad.addColorStop(0, '#f3d9bc');
    woodGrad.addColorStop(1, '#e4ba8d');
    ctx.fillStyle = woodGrad;
    ctx.strokeStyle = '#c99864';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(tableLeft, tableTopY, tableWidth, tabletopThickness, 4);
    ctx.fill();
    ctx.stroke();

    const currentY = startCenterY + dropSpanPx * motion.yRatio;
    const fastBallX = tableEdgeX + maxSpanPx * BALL_CASES[2].rangeRatio * motion.xRatio;

    // 4. Shared instantaneous horizontal height comparison line (높이 비교선)
    if (showHeightLine) {
      ctx.save();
      ctx.strokeStyle = 'rgba(24, 24, 27, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(tableEdgeX - 24, currentY);
      ctx.lineTo(Math.max(tableEdgeX + 40, fastBallX + 24), currentY);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Floor shadows, trails, and strobe ghost balls for each of the 3 balls
    for (const ballCase of BALL_CASES) {
      const span = maxSpanPx * ballCase.rangeRatio;
      const bx = tableEdgeX + span * motion.xRatio;

      if (motion.progress > 0.02) {
        drawFloorShadow(ctx, bx, groundY, ballRadius, motion.yRatio);
      }

      // Trajectory dashed curve
      if (motion.progress > 0) {
        ctx.save();
        ctx.strokeStyle = ballCase.trailColor;
        ctx.lineWidth = 2.25;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const steps = 44;
        for (let i = 0; i <= steps; i++) {
          const p = (i / steps) * motion.progress;
          const px = tableEdgeX + span * p;
          const py = startCenterY + dropSpanPx * (p * p);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Strobe ghost snapshots
      if (showStrobes) {
        for (const sample of strobes) {
          const sx = tableEdgeX + span * sample.xRatio;
          const sy = startCenterY + dropSpanPx * sample.yRatio;
          drawGhostBall(ctx, sx, sy, ballRadius * 0.7, ballCase.palette);
        }
      }
    }

    // 6. Main balls & clear labels once separated
    for (const ballCase of BALL_CASES) {
      const span = maxSpanPx * ballCase.rangeRatio;
      const bx = tableEdgeX + span * motion.xRatio;

      drawSportsBall(ctx, bx, currentY, ballRadius, ballCase.palette);

      if (motion.progress > 0.08) {
        ctx.save();
        ctx.font = '600 11px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
        ctx.fillStyle = ballCase.labelColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(ballCase.label, bx, currentY - ballRadius - 6);
        ctx.restore();
      }
    }

    ctx.restore();
  }, [width, height, motion.progress, motion.xRatio, motion.yRatio, strobes, showStrobes, showHeightLine]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="absolute inset-0 block select-none"
      aria-label="자유낙하와 수평으로 던진 공의 동시 낙하 비교 화면"
    />
  );
}
