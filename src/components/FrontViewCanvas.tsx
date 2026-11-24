import { useEffect, useRef } from 'react';
import { MotionProgress } from '../physics/projectile';
import { drawFloorShadow, drawGhostBall, drawSportsBall } from './canvasUtils';

interface FrontViewCanvasProps {
  width: number;
  height: number;
  tableEdgeX: number;
  throwSpanPx: number;
  tableTopY: number;
  groundY: number;
  ballRadius: number;
  motion: MotionProgress;
  strobes: MotionProgress[];
  showStrobes: boolean;
  showGuides: boolean;
}

export function FrontViewCanvas({
  width,
  height,
  tableEdgeX,
  throwSpanPx,
  tableTopY,
  groundY,
  ballRadius,
  motion,
  strobes,
  showStrobes,
  showGuides,
}: FrontViewCanvasProps) {
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
    const tableLeft = 18;
    const tableWidth = Math.max(24, tableEdgeX - tableLeft);
    const tabletopThickness = 12;

    // Sleek dark charcoal table legs
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

    // Subtle shadow under tabletop lip
    ctx.fillStyle = 'rgba(24, 24, 27, 0.08)';
    ctx.fillRect(tableLeft + 4, tableTopY + tabletopThickness, tableWidth - 8, 4);

    // Tabletop
    const woodGrad = ctx.createLinearGradient(tableLeft, tableTopY, tableLeft, tableTopY + tabletopThickness);
    woodGrad.addColorStop(0, '#f3d9bc');
    woodGrad.addColorStop(1, '#e4ba8d');
    ctx.fillStyle = woodGrad;
    ctx.strokeStyle = '#c99864';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(tableLeft, tableTopY, tableWidth, tabletopThickness, 4);
    ctx.fill();
    ctx.stroke();

    const startCenterY = tableTopY - ballRadius;
    const dropSpanPx = groundY - tableTopY;
    const ballX = tableEdgeX + throwSpanPx * motion.xRatio;
    const ballY = startCenterY + dropSpanPx * motion.yRatio;

    // 4. Floor shadow underneath ball once it leaves the table
    if (motion.progress > 0.02) {
      drawFloorShadow(ctx, ballX, groundY, ballRadius, motion.yRatio);
    }

    // 5. Alignment guides to Top View (vertical) and Side View (horizontal)
    if (showGuides) {
      ctx.save();
      ctx.strokeStyle = 'rgba(129, 52, 175, 0.48)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(ballX, 0);
      ctx.lineTo(ballX, groundY);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(221, 42, 123, 0.46)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(ballX, ballY);
      ctx.lineTo(width, ballY);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Traveled parabolic arc
    if (motion.progress > 0) {
      ctx.save();
      const arcGrad = ctx.createLinearGradient(tableEdgeX, startCenterY, ballX, ballY);
      arcGrad.addColorStop(0, 'rgba(245, 133, 41, 0.48)');
      arcGrad.addColorStop(1, 'rgba(221, 42, 123, 0.55)');
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const p = (i / steps) * motion.progress;
        const px = tableEdgeX + throwSpanPx * p;
        const py = startCenterY + dropSpanPx * (p * p);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 7. Strobe ghost balls along the parabola
    if (showStrobes) {
      for (const sample of strobes) {
        const sx = tableEdgeX + throwSpanPx * sample.xRatio;
        const sy = startCenterY + dropSpanPx * sample.yRatio;
        drawGhostBall(ctx, sx, sy, ballRadius * 0.72);
      }
    }

    // 8. Main ball
    drawSportsBall(ctx, ballX, ballY, ballRadius);

    ctx.restore();
  }, [
    width,
    height,
    tableEdgeX,
    throwSpanPx,
    tableTopY,
    groundY,
    ballRadius,
    motion.progress,
    motion.xRatio,
    motion.yRatio,
    strobes,
    showStrobes,
    showGuides,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="absolute inset-0 block select-none"
      aria-label="앞에서 본 모습"
    />
  );
}
