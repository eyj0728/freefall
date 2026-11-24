export const FLIGHT_DURATION = 1.6; // seconds for clean visual pacing
export const STROBE_STEPS = 8; // 8 equal time intervals (every 0.2 s)

export type ThrowStrength = 'weak' | 'medium' | 'strong';

export const THROW_RANGE_RATIO: Record<ThrowStrength, number> = {
  weak: 0.38,
  medium: 0.64,
  strong: 0.88,
};

export interface MotionProgress {
  progress: number; // normalized time t / T in [0, 1]
  xRatio: number; // horizontal progress in [0, 1] (linear: constant velocity)
  yRatio: number; // vertical drop progress in [0, 1] (quadratic: free fall)
  finished: boolean;
}

export function getMotionAtTime(time: number): MotionProgress {
  const clamped = Math.max(0, Math.min(time, FLIGHT_DURATION));
  const progress = clamped / FLIGHT_DURATION;
  return {
    progress,
    xRatio: progress,
    yRatio: progress * progress,
    finished: time >= FLIGHT_DURATION - 1e-6,
  };
}

export function getStrobeMoments(currentTime: number): MotionProgress[] {
  const clamped = Math.max(0, Math.min(currentTime, FLIGHT_DURATION));
  const currentProgress = clamped / FLIGHT_DURATION;
  const samples: MotionProgress[] = [];

  for (let i = 0; i <= STROBE_STEPS; i++) {
    const p = i / STROBE_STEPS;
    if (p <= currentProgress + 1e-6) {
      samples.push({
        progress: p,
        xRatio: p,
        yRatio: p * p,
        finished: i === STROBE_STEPS,
      });
    }
  }

  return samples;
}
