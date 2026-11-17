'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition, Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ArrowDownZAIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ArrowDownZAIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const SWAP_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 24,
};

const SWAP_VARIANTS: Variants = {
  normal: {
    translateY: 0,
  },
  animate: (custom: number) => ({
    translateY: custom * 10,
  }),
};

const ArrowDownZAIcon = forwardRef<ArrowDownZAIconHandle, ArrowDownZAIconProps>(
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
        data-slot="arrow-down-z-a-icon"
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
          <path d="m3 16 4 4 4-4" />
          <path d="M7 4v16" />
          <motion.path
            animate={controls}
            custom={1}
            d="M15 4h5l-5 6h5"
            initial="normal"
            transition={SWAP_TRANSITION}
            variants={SWAP_VARIANTS}
          />
          <motion.g
            animate={controls}
            custom={-1}
            initial="normal"
            transition={SWAP_TRANSITION}
            variants={SWAP_VARIANTS}
          >
            <path d="M20 18h-5" />
            <path d="M15 20v-3.5a2.5 2.5 0 0 1 5 0V20" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

ArrowDownZAIcon.displayName = 'ArrowDownZAIcon';

export { ArrowDownZAIcon };
