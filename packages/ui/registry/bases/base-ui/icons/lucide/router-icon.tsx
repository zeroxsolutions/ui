'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion, type Variants } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface RouterIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface RouterIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
  fadeOut: {
    opacity: 0,
    transition: { duration: 0.3 },
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

const RouterIcon = forwardRef<RouterIconHandle, RouterIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
          await runPathIntro();
        },
        stopAnimation: () => {
          pathControls.start('normal');
        },
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await runPathIntro();
        }
      },
      [onMouseEnter, isMotionReduced, runPathIntro],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          pathControls.start('normal');
        }
      },
      [onMouseLeave, pathControls],
    );

    return (
      <span
        data-slot="router-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect height="8" rx="2" width="20" x="2" y="14" />
          <path d="M6.01 18H6" />
          <path d="M10.01 18H10" />
          <path d="M15 10v4" />
          <motion.path
            animate={pathControls}
            custom={1}
            d="M17.84 7.17a4 4 0 0 0-5.66 0"
            initial={{ opacity: 1 }}
            variants={PATH_VARIANTS}
          />
          <motion.path
            animate={pathControls}
            custom={2}
            d="M20.66 4.34a8 8 0 0 0-11.31 0"
            initial={{ opacity: 1 }}
            variants={PATH_VARIANTS}
          />
        </motion.svg>
      </span>
    );
  },
);

RouterIcon.displayName = 'RouterIcon';

export { RouterIcon };
