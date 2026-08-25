import React, { useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Initial Space',
  afterLabel = 'Finished Reveal',
  aspectRatio = 'aspect-[16/10]'
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className={`relative w-full ${aspectRatio} overflow-hidden select-none cursor-ew-resize border border-[#E5DFD7] shadow-lg`}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Background Image: AFTER / FINISHED */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Foreground Clipped Image: BEFORE / RAW */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
          />
        </div>

        {/* Slider Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-9 h-9 -ml-4.5 rounded-full bg-[#1A1816] border-2 border-white text-white flex items-center justify-center shadow-xl">
            <div className="flex space-x-0.5 text-[10px] font-bold">
              <span>‹</span>
              <span>›</span>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#1A1816]/80 text-[#FAF9F6] text-[11px] uppercase tracking-widest backdrop-blur-xs">
          {beforeLabel}
        </div>
        <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-[#C9A986]/90 text-[#1A1816] text-[11px] uppercase tracking-widest font-semibold backdrop-blur-xs">
          {afterLabel}
        </div>
      </div>

      <p className="text-center text-xs text-[#7A746E] italic">
        Drag the slider horizontally to view the before and after transformation.
      </p>
    </div>
  );
};
