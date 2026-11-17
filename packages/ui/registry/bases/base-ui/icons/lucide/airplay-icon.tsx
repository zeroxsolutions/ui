'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { easeInOut, easeOut, motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface AirplayIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AirplayIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DURATION = 0.3;

const SCREEN_VARIANTS = {
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: { duration: DURATION },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: DURATION * 2,
      ease: easeInOut,
    },
  },
};

const TRIANGLE_VARIANTS = {
  normal: {
    scale: 1,
    opacity: 1,
    transition: { duration: DURATION },
  },
  animate: {
    scale: [0.6, 1.1, 1],
    opacity: [0, 1],
    transition: {
      duration: DURATION * 2,
      ease: easeOut,
    },
  },
};

const AirplayIcon = forwardRef<AirplayIconHandle, AirplayIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          if (isMotionReduced) return;
          await controls.start('animate');
          controls.start('normal');
        },
        stopAnimation: () => controls.start('normal'),
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await controls.start('animate');
          controls.start('normal');
        }
      },
      [controls, isMotionReduced, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start('normal');
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <span
        data-slot="airplay-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
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
          <motion.path
            animate={controls}
            d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"
            variants={SCREEN_VARIANTS}
          />
          <motion.path animate={controls} d="m12 15 5 6H7Z" variants={TRIANGLE_VARIANTS} />
        </svg>
      </span>
    );
  },
);

AirplayIcon.displayName = 'AirplayIcon';

export { AirplayIcon };
