import React, { useEffect, useRef } from 'react';
import { LpcCharacterConfig } from '../../types';
import { DEFAULT_LPC_CHARACTER } from '../../data/lpcCatalog';
import { lpcRenderer, LpcDirection } from '../../services/lpcRenderer';

interface LpcAvatarViewProps {
  config?: LpcCharacterConfig | null;
  size?: number; // Canvas width/height in CSS px (e.g. 64, 96, 128, 192)
  direction?: LpcDirection;
  animate?: boolean;
  scale?: number;
  halfBody?: boolean; // 半身肖像視角
  className?: string;
  onClick?: () => void;
}

export const LpcAvatarView: React.FC<LpcAvatarViewProps> = ({
  config,
  size = 64,
  direction = 'down',
  animate = false,
  scale,
  halfBody = false,
  className = '',
  onClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const charConfig = config || DEFAULT_LPC_CHARACTER;

  // 自動依據尺寸計算最適清晰倍率 (例如 64px = 1x, 128px = 2x, 192px = 3x)
  const renderScale = scale || Math.max(1, Math.round(size / 64));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isMounted = true;
    let currentFrame = 0;
    let lastTime = performance.now();
    const frameInterval = 130; // 每個行走幀約 130ms (流暢自然)

    const renderLoop = (time: number) => {
      if (!isMounted) return;

      if (animate) {
        if (time - lastTime >= frameInterval) {
          lastTime = time;
          // 行走循環幀：1 到 8 幀巡迴
          currentFrame = (currentFrame % 8) + 1;
          lpcRenderer.renderCharacter(canvas, charConfig, {
            direction,
            frameIndex: currentFrame,
            scale: renderScale,
            halfBody
          });
        }
        animFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        // 靜態站立：第 0 幀
        lpcRenderer.renderCharacter(canvas, charConfig, {
          direction,
          frameIndex: 0,
          scale: renderScale,
          halfBody
        });
      }
    };

    if (animate) {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    } else {
      lpcRenderer.renderCharacter(canvas, charConfig, {
        direction,
        frameIndex: 0,
        scale: renderScale,
        halfBody
      });
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [charConfig, direction, animate, renderScale, size, halfBody]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={onClick}
      className={`select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated'
      }}
    />
  );
};
