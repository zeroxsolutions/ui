'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface StampIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface StampIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const STAMP_VARIANTS: Variants = {
  normal: {
    translateY: 0,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
  animate: {
    translateY: [0, 4, 4, -1, 0],
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
      times: [0, 0.35, 0.65, 0.82, 1],
    },
  },
};

const INK_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.4 },
  },
  animate: {
    opacity: [1, 0.4, 1.4, 1],
    scaleX: [1, 0.85, 0.85, 1],
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
      times: [0, 0.35, 0.65, 1],
    },
  },
};

const StampIcon = forwardRef<StampIconHandle, StampIconProps>(
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
        data-slot="stamp-icon"
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
            d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13"
            initial="normal"
            variants={STAMP_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z"
            initial="normal"
            variants={STAMP_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="M5 22h14"
            initial="normal"
            style={{ transformBox: 'view-box', originX: '12px', originY: '22px' }}
            variants={INK_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

StampIcon.displayName = 'StampIcon';

export { StampIcon };
