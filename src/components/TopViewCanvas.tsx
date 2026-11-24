import { useEffect, useRef } from 'react';
import { MotionProgress } from '../physics/projectile';
import { drawGhostBall, drawSportsBall } from './canvasUtils';

interface TopViewCanvasProps {
  width: number;
  height: number;
  tableEdgeX: number;
  throwSpanPx: number;
  ballRadius: number;
  motion: MotionProgress;
  strobes: MotionProgress[];
  showStrobes: boolean;
  showGuides: boolean;
}

export function TopViewCanvas({
  width,
  height,
  tableEdgeX,
  throwSpanPx,
  ballRadius,
  motion,
  strobes,
  showStrobes,
  showGuides,
}: TopViewCanvasProps) {
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

    const centerY = Math.round(height * 0.56);

    // 1. Clean warm studio floor
    ctx.fillStyle = '#fcfcfd';
    ctx.fillRect(0, 0, width, height);

    // Subtle soft floor tiles
    ctx.strokeStyle = '#f1f2f6';
    ctx.lineWidth = 1;
    const tile = 54;
    for (let x = tableEdgeX; x < width; x += tile) {
      const px = Math.round(x) + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }
    for (let y = centerY % tile; y < height; y += tile) {
      const py = Math.round(y) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    // 2. Modern wooden table seen from above
    const tableHeight = Math.min(height * 0.52, 88);
    const tableLeft = 18;
    const tableTop = centerY - tableHeight / 2;
    const tableWidth = Math.max(24, tableEdgeX - tableLeft);

    // Soft ambient shadow under table
    ctx.save();
    ctx.fillStyle = 'rgba(24, 24, 27, 0.06)';
    ctx.beginPath();
    ctx.roundRect(tableLeft + 4, tableTop + 5, tableWidth, tableHeight, 8);
    ctx.fill();
    ctx.restore();

    const woodGrad = ctx.createLinearGradient(tableLeft, tableTop, tableEdgeX, tableTop + tableHeight);
    woodGrad.addColorStop(0, '#f3d9bc');
    woodGrad.addColorStop(1, '#e7c196');
    ctx.fillStyle = woodGrad;
    ctx.strokeStyle = '#c99864';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(tableLeft, tableTop, tableWidth, tableHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Subtle wood grain
    ctx.strokeStyle = 'rgba(180, 123, 68, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableLeft + 10, centerY - 14);
    ctx.lineTo(tableEdgeX - 10, centerY - 14);
    ctx.moveTo(tableLeft + 14, centerY + 14);
    ctx.lineTo(tableEdgeX - 12, centerY + 14);
    ctx.stroke();

    const ballX = tableEdgeX + throwSpanPx * motion.xRatio;

    // 3. Straight horizontal path trail
    if (motion.progress > 0) {
      ctx.save();
      const trailGrad = ctx.createLinearGradient(tableEdgeX, centerY, ballX, centerY);
      trailGrad.addColorStop(0, 'rgba(245, 133, 41, 0.45)');
      trailGrad.addColorStop(1, 'rgba(221, 42, 123, 0.5)');
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(tableEdgeX, centerY);
      ctx.lineTo(ballX, centerY);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Vertical alignment guide down toward Front View
    if (showGuides) {
      ctx.save();
      ctx.strokeStyle = 'rgba(129, 52, 175, 0.48)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(ballX, centerY);
      ctx.lineTo(ballX, height);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Equal-interval strobe ghost balls
    if (showStrobes) {
      for (const sample of strobes) {
        const sx = tableEdgeX + throwSpanPx * sample.xRatio;
        drawGhostBall(ctx, sx, centerY, ballRadius * 0.72);
      }
    }

    // 6. Main ball
    drawSportsBall(ctx, ballX, centerY, ballRadius);

    ctx.restore();
  }, [
    width,
    height,
    tableEdgeX,
    throwSpanPx,
    ballRadius,
    motion.progress,
    motion.xRatio,
    strobes,
    showStrobes,
    showGuides,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="absolute inset-0 block select-none"
      aria-label="위에서 본 모습 (등속 운동)"
    />
  );
}
