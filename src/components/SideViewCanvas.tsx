import { useEffect, useRef } from 'react';
import { MotionProgress } from '../physics/projectile';
import { drawFloorShadow, drawGhostBall, drawSportsBall } from './canvasUtils';

interface SideViewCanvasProps {
  width: number;
  height: number;
  tableTopY: number;
  groundY: number;
  ballRadius: number;
  motion: MotionProgress;
  strobes: MotionProgress[];
  showStrobes: boolean;
  showGuides: boolean;
}

export function SideViewCanvas({
  width,
  height,
  tableTopY,
  groundY,
  ballRadius,
  motion,
  strobes,
  showStrobes,
  showGuides,
}: SideViewCanvasProps) {
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

    const centerX = Math.round(width / 2);

    // 1. Soft studio daylight wall (matching Front View)
    const wallGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    wallGrad.addColorStop(0, '#fffaf8');
    wallGrad.addColorStop(0.55, '#ffffff');
    wallGrad.addColorStop(1, '#fafafa');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, groundY);

    // 2. Floor band (matching Front View)
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, groundY, width, height - groundY);

    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // 3. Modern wooden table seen from the side (muted slightly behind falling ball)
    const tableWidth = Math.min(width * 0.48, 108);
    const tableLeft = centerX - tableWidth / 2;
    const tabletopThickness = 12;

    // Legs
    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    ctx.roundRect(
      tableLeft + 10,
      tableTopY + tabletopThickness - 1,
      7,
      groundY - (tableTopY + tabletopThickness) + 1,
      [0, 0, 3, 3]
    );
    ctx.roundRect(
      tableLeft + tableWidth - 17,
      tableTopY + tabletopThickness - 1,
      7,
      groundY - (tableTopY + tabletopThickness) + 1,
      [0, 0, 3, 3]
    );
    ctx.fill();

    // Subtle shadow under tabletop lip
    ctx.fillStyle = 'rgba(24, 24, 27, 0.06)';
    ctx.fillRect(tableLeft + 4, tableTopY + tabletopThickness, tableWidth - 8, 4);

    // Tabletop
    const woodGrad = ctx.createLinearGradient(tableLeft, tableTopY, tableLeft, tableTopY + tabletopThickness);
    woodGrad.addColorStop(0, '#f5dec4');
    woodGrad.addColorStop(1, '#e8c49e');
    ctx.fillStyle = woodGrad;
    ctx.strokeStyle = '#d4a676';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(tableLeft, tableTopY, tableWidth, tabletopThickness, 4);
    ctx.fill();
    ctx.stroke();

    const startCenterY = tableTopY - ballRadius;
    const dropSpanPx = groundY - tableTopY;
    const ballY = startCenterY + dropSpanPx * motion.yRatio;

    // 4. Floor shadow underneath ball
    if (motion.progress > 0.02) {
      drawFloorShadow(ctx, centerX, groundY, ballRadius, motion.yRatio);
    }

    // 5. Horizontal alignment guide from Front View
    if (showGuides) {
      ctx.save();
      ctx.strokeStyle = 'rgba(221, 42, 123, 0.46)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(0, ballY);
      ctx.lineTo(centerX, ballY);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Straight vertical free-fall trail
    if (motion.progress > 0) {
      ctx.save();
      const fallGrad = ctx.createLinearGradient(centerX, startCenterY, centerX, ballY);
      fallGrad.addColorStop(0, 'rgba(245, 133, 41, 0.45)');
      fallGrad.addColorStop(1, 'rgba(221, 42, 123, 0.55)');
      ctx.strokeStyle = fallGrad;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX, startCenterY);
      ctx.lineTo(centerX, ballY);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Strobe ghost balls falling vertically
    if (showStrobes) {
      for (const sample of strobes) {
        const sy = startCenterY + dropSpanPx * sample.yRatio;
        drawGhostBall(ctx, centerX, sy, ballRadius * 0.72);
      }
    }

    // 8. Main ball
    drawSportsBall(ctx, centerX, ballY, ballRadius);

    ctx.restore();
  }, [
    width,
    height,
    tableTopY,
    groundY,
    ballRadius,
    motion.progress,
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
      aria-label="옆에서 본 모습 (자유낙하 운동)"
    />
  );
}
