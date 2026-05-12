import React from 'react';
import ribbonBase from '../assets/images/ribbon-g.png';
import ribbonFill from '../assets/images/ribbon-c.png';

interface RibbonProgressProps {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Optional className for the container */
  className?: string;
  /** Transition duration in milliseconds (default: 100) */
  transitionDuration?: number;
}

/**
 * RibbonProgress Component
 * 
 * Displays a ribbon progress bar where ribbon-g.png is the base/background
 * and ribbon-c.png gradually reveals from bottom to top based on percentage.
 */
const RibbonProgress: React.FC<RibbonProgressProps> = ({
  percentage,
  className = '',
  transitionDuration = 100,
}) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Base image (gray ribbon) - always fully visible */}
      <img
        src={ribbonBase}
        alt="Awareness Ribbon Background"
         className="w-[40%] m-[30%] mt-0 mb-0 md:w-full md:m-auto h-auto block"
        draggable={false}
      />

      {/* Overlay container - absolutely positioned over base */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          // Clip from top: show only the bottom portion based on percentage
          // At 0% - clipPath shows nothing, at 100% - shows everything
          clipPath: `inset(${100 - clampedPercentage}% 0 0 0)`,
          // Use cubic-bezier for ultra-smooth easing
          transition: `clip-path ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          // GPU acceleration for smoother rendering
          willChange: 'clip-path',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Fill image (colored ribbon) - revealed from bottom to top */}
        <img
          src={ribbonFill}
          alt="Awareness Ribbon Progress"
          className="w-[40%] m-[30%] mt-0 mb-0 md:w-full md:m-auto h-auto block"
          style={{
            // Prevent any jitter during animation
            transform: 'translateZ(0)',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default RibbonProgress;
