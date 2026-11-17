'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion, type Variants } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ChessBishopIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChessBishopIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const BISHOP_VARIANTS: Variants = {
  normal: {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 220, damping: 18 },
  },
  animate: {
    x: [0, -6, -6, -6, 6, 6, 6, 0],
    y: [0, -6, -6, -6, 6, 6, 6, 0],
    rotate: [0, -16, -16, -16, 16, 16, 4, 0],
    opacity: [1, 1, 0, 0, 0, 0, 1, 1],
    transition: {
      duration: 1.4,
      times: [0, 0.28, 0.38, 0.45, 0.5, 0.58, 0.72, 1],
      ease: 'easeInOut',
    },
  },
};

const ChessBishopIcon = forwardRef<ChessBishopIconHandle, ChessBishopIconProps>(
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
        data-slot="chess-bishop-icon"
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
          style={{ overflow: 'visible' }}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.g
            animate={controls}
            initial="normal"
            style={{ transformBox: 'view-box', originX: '12px', originY: '12px' }}
            variants={BISHOP_VARIANTS}
          >
            <path d="M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
            <path d="M15 18c1.5-.615 3-2.461 3-4.923C18 8.769 14.5 4.462 12 2 9.5 4.462 6 8.77 6 13.077 6 15.539 7.5 17.385 9 18" />
            <path d="m16 7-2.5 2.5" />
            <path d="M9 2h6" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

ChessBishopIcon.displayName = 'ChessBishopIcon';

export { ChessBishopIcon };
