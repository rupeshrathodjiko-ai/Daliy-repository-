import { useEffect, useRef } from 'react';

interface CelebrationConfettiProps {
  burstId: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  tiltAngle: number;
  tiltSpeed: number;
  opacity: number;
}

const PALETTE = ['#EF4444', '#10B981', '#F4F4F5', '#F59E0B', '#D4D4D8'];

export function CelebrationConfetti({ burstId }: CelebrationConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (burstId <= 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particles: ConfettiParticle[] = [];
    const totalCount = 110;

    // Spawn twin directional bursts from upper-center and side cannons
    for (let i = 0; i < totalCount; i++) {
      const fromLeft = i % 3 === 0;
      const fromRight = i % 3 === 1;
      const originX = fromLeft
        ? width * 0.22
        : fromRight
          ? width * 0.78
          : width * 0.5;
      const originY = fromLeft || fromRight ? height * 0.62 : height * 0.38;

      const baseAngle = fromLeft
        ? -Math.PI / 3
        : fromRight
          ? (-2 * Math.PI) / 3
          : -Math.PI / 2;
      const spread = (Math.random() - 0.5) * 1.15;
      const angle = baseAngle + spread;
      const speed = 6 + Math.random() * 10;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        width: 6 + Math.random() * 6,
        height: 4 + Math.random() * 5,
        color: PALETTE[i % PALETTE.length],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.22,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: 0.08 + Math.random() * 0.12,
        opacity: 1,
      });
    }

    let rafId = 0;
    const startTime = performance.now();
    const maxDurationMs = 2800;

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;
      for (const p of particles) {
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.28; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.tiltAngle += p.tiltSpeed;

        if (elapsed > 1700) {
          p.opacity = Math.max(0, 1 - (elapsed - 1700) / 1000);
        }

        if (p.opacity > 0.02 && p.y < height + 40) {
          aliveCount++;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          const flutterScale = Math.cos(p.tiltAngle);
          ctx.fillStyle = p.color;
          ctx.fillRect(
            -p.width / 2,
            (-p.height * flutterScale) / 2,
            p.width,
            p.height * flutterScale
          );
          ctx.restore();
        }
      }

      if (aliveCount > 0 && elapsed < maxDurationMs) {
        rafId = requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, width, height);
    };
  }, [burstId]);

  if (burstId <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full"
    />
  );
}
