'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface Disc3IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface Disc3IconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const Disc3Icon = forwardRef<Disc3IconHandle, Disc3IconProps>(
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
        data-slot="disc-3-icon"
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
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="2" />

          <motion.g
            animate={controls}
            style={{ transformBox: 'view-box', originX: '12px', originY: '12px' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            variants={{
              normal: { rotate: 0 },
              animate: { rotate: 90 },
            }}
          >
            <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
            <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

Disc3Icon.displayName = 'Disc3Icon';

export { Disc3Icon };
