'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition, Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ArrowDown10IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ArrowDown10IconProps extends HTMLAttributes<HTMLSpanElement> {
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

const ArrowDown10Icon = forwardRef<ArrowDown10IconHandle, ArrowDown10IconProps>(
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
        data-slot="arrow-down-1-0-icon"
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
          <path d="M7 20V4" />
          <motion.g
            animate={controls}
            custom={1}
            initial="normal"
            transition={SWAP_TRANSITION}
            variants={SWAP_VARIANTS}
          >
            <path d="M17 10V4h-2" />
            <path d="M15 10h4" />
          </motion.g>
          <motion.rect
            animate={controls}
            custom={-1}
            height="6"
            initial="normal"
            ry="2"
            transition={SWAP_TRANSITION}
            variants={SWAP_VARIANTS}
            width="4"
            x="15"
            y="14"
          />
        </svg>
      </span>
    );
  },
);

ArrowDown10Icon.displayName = 'ArrowDown10Icon';

export { ArrowDown10Icon };
