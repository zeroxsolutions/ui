'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface DrumIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface DrumIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const VARIANTS: Variants = {
  normal: {
    rotate: 0,
  },
  animate: (custom: number) => ({
    rotate: custom === 1 ? [-10, 10, 0] : [10, -10, 0],
    transition: {
      delay: 0.1 * custom,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'reverse',
      duration: 0.5,
    },
  }),
};

const DrumIcon = forwardRef<DrumIconHandle, DrumIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => {
          if (!isMotionReduced) controls.start('animate');
        },
        stopAnimation: () => controls.start('normal'),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          controls.start('animate');
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
        data-slot="drum-icon"
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
          <motion.path animate={controls} custom={1} d="m2 2 8 8" variants={VARIANTS} />
          <motion.path animate={controls} custom={2} d="m22 2-8 8" variants={VARIANTS} />
          <ellipse cx="12" cy="9" rx="10" ry="5" />
          <path d="M7 13.4v7.9" />
          <path d="M12 14v8" />
          <path d="M17 13.4v7.9" />
          <path d="M2 9v8a10 5 0 0 0 20 0V9" />
        </svg>
      </span>
    );
  },
);

DrumIcon.displayName = 'DrumIcon';

export { DrumIcon };
