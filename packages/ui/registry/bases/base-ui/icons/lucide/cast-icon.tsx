'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface CastIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CastIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const VARIANTS: Variants = {
  normal: { opacity: 1 },
  animate: (custom: number) => ({
    opacity: [0, 1],
    transition: {
      delay: custom,
      duration: 0.5,
    },
  }),
};

const CastIcon = forwardRef<CastIconHandle, CastIconProps>(
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
        data-slot="cast-icon"
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
          <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
          <motion.path animate={controls} custom={0.2} d="M2 12a9 9 0 0 1 8 8" variants={VARIANTS} />
          <motion.path animate={controls} custom={0.1} d="M2 16a5 5 0 0 1 4 4" variants={VARIANTS} />
          <motion.line animate={controls} custom={0} variants={VARIANTS} x1="2" x2="2.01" y1="20" y2="20" />
        </svg>
      </span>
    );
  },
);

CastIcon.displayName = 'CastIcon';

export { CastIcon };
