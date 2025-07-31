"use client"

import { useRef, useEffect } from 'react';

interface WaterDropsProps {
  direction?: 'right' | 'left' | 'up' | 'down' | 'diagonal' | 'random';
  speed?: number;
  dropColor?: string;
  dropSize?: number;
  hoverRippleColor?: string;
  className?: string;
  numDrops?: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  ripples: Ripple[];
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

const WaterDrops = ({
  direction = 'down',
  speed = 1,
  dropColor = 'rgba(77, 162, 255, 0.3)',
  dropSize = 8,
  hoverRippleColor = 'rgba(77, 162, 255, 0.5)',
  className = '',
  numDrops = 50
}: WaterDropsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const dropsRef = useRef<Drop[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const isMouseOver = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      // Set canvas to full viewport size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeDrops();
    };

    const initializeDrops = () => {
      dropsRef.current = [];
      for (let i = 0; i < numDrops; i++) {
        dropsRef.current.push(createDrop());
      }
    };

    const createDrop = (): Drop => {
      const baseSpeed = speed * 0.5;
      let vx = 0, vy = 0;

      switch (direction) {
        case 'right':
          vx = baseSpeed + Math.random() * baseSpeed;
          vy = (Math.random() - 0.5) * baseSpeed * 0.5;
          break;
        case 'left':
          vx = -(baseSpeed + Math.random() * baseSpeed);
          vy = (Math.random() - 0.5) * baseSpeed * 0.5;
          break;
        case 'up':
          vx = (Math.random() - 0.5) * baseSpeed * 0.5;
          vy = -(baseSpeed + Math.random() * baseSpeed);
          break;
        case 'down':
          vx = (Math.random() - 0.5) * baseSpeed * 0.5;
          vy = baseSpeed + Math.random() * baseSpeed;
          break;
        case 'diagonal':
          vx = baseSpeed + Math.random() * baseSpeed;
          vy = baseSpeed + Math.random() * baseSpeed;
          break;
        case 'random':
          const angle = Math.random() * Math.PI * 2;
          const velocity = baseSpeed + Math.random() * baseSpeed;
          vx = Math.cos(angle) * velocity;
          vy = Math.sin(angle) * velocity;
          break;
      }

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx,
        vy,
        size: dropSize * (0.5 + Math.random() * 0.5),
        opacity: 0.3 + Math.random() * 0.7,
        ripples: []
      };
    };

    const updateDrop = (drop: Drop) => {
      // Add some organic movement
      drop.vx += (Math.random() - 0.5) * 0.02;
      drop.vy += (Math.random() - 0.5) * 0.02;

      // Apply gravity for down movement
      if (direction === 'down' || direction === 'diagonal') {
        drop.vy += 0.01;
      }

      drop.x += drop.vx;
      drop.y += drop.vy;

      // Wrap around screen
      if (drop.x < -drop.size) drop.x = canvas.width + drop.size;
      if (drop.x > canvas.width + drop.size) drop.x = -drop.size;
      if (drop.y < -drop.size) drop.y = canvas.height + drop.size;
      if (drop.y > canvas.height + drop.size) drop.y = -drop.size;

      // Update ripples
      drop.ripples = drop.ripples.filter(ripple => {
        ripple.radius += 2;
        ripple.opacity -= 0.02;
        return ripple.opacity > 0 && ripple.radius < ripple.maxRadius;
      });
    };

    const drawDrop = (drop: Drop) => {
      // Draw the main drop with gradient
      const gradient = ctx.createRadialGradient(
        drop.x, drop.y, 0,
        drop.x, drop.y, drop.size
      );
      gradient.addColorStop(0, dropColor.replace(/[\d\.]+\)$/g, `${drop.opacity})`));
      gradient.addColorStop(0.7, dropColor.replace(/[\d\.]+\)$/g, `${drop.opacity * 0.5})`));
      gradient.addColorStop(1, dropColor.replace(/[\d\.]+\)$/g, '0)'));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw ripples
      drop.ripples.forEach(ripple => {
        ctx.strokeStyle = hoverRippleColor.replace(/[\d\.]+\)$/g, `${ripple.opacity})`);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dropsRef.current.forEach(drop => {
        updateDrop(drop);
        drawDrop(drop);
      });

      // Add subtle background gradient
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
      );
      bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bgGradient.addColorStop(1, 'rgba(6, 6, 6, 0.1)');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current.x = event.clientX - rect.left;
      mousePos.current.y = event.clientY - rect.top;

      // Create ripples near mouse
      if (isMouseOver.current && Math.random() < 0.1) {
        dropsRef.current.forEach(drop => {
          const distance = Math.sqrt(
            Math.pow(drop.x - mousePos.current.x, 2) +
            Math.pow(drop.y - mousePos.current.y, 2)
          );

          if (distance < 50) {
            drop.ripples.push({
              x: drop.x,
              y: drop.y,
              radius: 0,
              maxRadius: 30 + Math.random() * 20,
              opacity: 0.8
            });
          }
        });
      }
    };

    const handleMouseEnter = () => {
      isMouseOver.current = true;
    };

    const handleMouseLeave = () => {
      isMouseOver.current = false;
    };

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    resizeCanvas();
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [direction, speed, dropColor, hoverRippleColor, dropSize, numDrops]);

  return <canvas ref={canvasRef} className={`water-drops-canvas ${className}`} />;
};

export default WaterDrops;
