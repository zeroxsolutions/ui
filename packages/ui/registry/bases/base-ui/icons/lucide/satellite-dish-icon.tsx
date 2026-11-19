'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion, type Variants } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface SatelliteDishIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SatelliteDishIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const SATELLITE_DISH_VARIANTS: Variants = {
  normal: {
    y: 0,
    rotate: 0,
  },
  animate: {
    y: [0, 1, 2, 0],
    rotate: [0, -15, 0],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
};

const PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    transition: {
      duration: 1.1,
    },
  },
  fadeOut: {
    opacity: 0,
    transition: { duration: 1.1 },
  },
  fadeIn: (i: number) => ({
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: i * 0.1,
    },
  }),
};

const SatelliteDishIcon = forwardRef<SatelliteDishIconHandle, SatelliteDishIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const svgControls = useAnimation();
    const pathControls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    const runPathIntro = useCallback(async () => {
      await pathControls.start('fadeOut');
      pathControls.start('fadeIn');
    }, [pathControls]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          if (isMotionReduced) return;
          await Promise.all([svgControls.start('animate'), runPathIntro()]);
        },
        stopAnimation: () => {
          svgControls.start('normal');
          pathControls.start('normal');
        },
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await Promise.all([svgControls.start('animate'), runPathIntro()]);
        }
      },
      [onMouseEnter, isMotionReduced, runPathIntro, svgControls],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          svgControls.start('normal');
          pathControls.start('normal');
        }
      },
      [onMouseLeave, pathControls, svgControls],
    );

    return (
      <span
        data-slot="satellite-dish-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={svgControls}
          fill="none"
          height={size}
          initial="normal"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          variants={SATELLITE_DISH_VARIANTS}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2.824 10.459a8 8 0 0010.717 10.717c.558-.276.623-1.012.183-1.452l-9.448-9.448c-.44-.44-1.176-.375-1.452.183" />
          <path d="m9 15 4-4" />
          <motion.path
            animate={pathControls}
            custom={1}
            d="M18 12a6 6 0 00-6-6"
            initial={{ opacity: 1 }}
            variants={PATH_VARIANTS}
          />
          <motion.path
            animate={pathControls}
            custom={2}
            d="M22 12A10 10 0 0012 2"
            initial={{ opacity: 1 }}
            variants={PATH_VARIANTS}
          />
        </motion.svg>
      </span>
    );
  },
);

SatelliteDishIcon.displayName = 'SatelliteDishIcon';

export { SatelliteDishIcon };
