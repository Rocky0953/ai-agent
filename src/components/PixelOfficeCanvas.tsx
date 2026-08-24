import React, { useEffect, useRef } from 'react';
import { WorkerCharacter } from '../types';

interface CanvasProps {
  workers: WorkerCharacter[];
  onSelectWorker?: (worker: WorkerCharacter) => void;
  isProjectRunning: boolean;
}

export default function PixelOfficeCanvas({ workers, onSelectWorker, isProjectRunning }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.imageSmoothingEnabled = false;

      // Background Office Floor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor Grid (Retro Tile Effect)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Desks & Furniture
      workers.forEach(w => {
        // Desk shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(w.deskPosition.x - 28, w.deskPosition.y + 12, 56, 16);

        // Desk
        ctx.fillStyle = '#334155';
        ctx.fillRect(w.deskPosition.x - 24, w.deskPosition.y - 4, 48, 24);
        ctx.fillStyle = '#475569';
        ctx.fillRect(w.deskPosition.x - 22, w.deskPosition.y - 2, 44, 4);

        // Computer Monitor
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(w.deskPosition.x - 10, w.deskPosition.y - 18, 20, 14);
        ctx.fillStyle = isProjectRunning && w.status === 'working' ? '#38bdf8' : '#0f172a';
        ctx.fillRect(w.deskPosition.x - 8, w.deskPosition.y - 16, 16, 10);
      });

      // Coffee Machine Area
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, 20, 48, 64);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(26, 26, 36, 18);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '10px monospace';
      ctx.fillText('COFFEE', 24, 60);

      // Render Workers
      workers.forEach(w => {
        const bounce = (w.status === 'working' || isProjectRunning) ? Math.sin(tick * 0.15) * 3 : 0;
        const posX = w.deskPosition.x;
        const posY = w.deskPosition.y - 24 + bounce;

        // Character Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(posX, w.deskPosition.y + 6, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Character Body (Pixel Box)
        ctx.fillStyle = w.spriteColor;
        ctx.fillRect(posX - 8, posY, 16, 18);

        // Head
        ctx.fillStyle = '#fde047';
        ctx.fillRect(posX - 6, posY - 12, 12, 12);

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(posX - 4, posY - 8, 2, 3);
        ctx.fillRect(posX + 2, posY - 8, 2, 3);

        // Top Performer Crown / Badge
        if (w.isTopPerformer) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(posX - 6, posY - 18, 12, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(posX - 2, posY - 16, 4, 2);
        }

        // Name Tag
        ctx.fillStyle = '#f8fafc';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(w.name.split(' ')[0], posX, posY + 28);

        // Status Badge
        ctx.fillStyle = w.status === 'working' ? '#eab308' : '#22c55e';
        ctx.beginPath();
        ctx.arc(posX + 10, posY - 10, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [workers, isProjectRunning]);

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-800 text-xs font-mono text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Retro Office Simulation Floor (Live Canvas)
      </div>
      <canvas
        ref={canvasRef}
        width={680}
        height={260}
        className="w-full h-[260px] cursor-pointer object-cover"
      />
    </div>
  );
}
