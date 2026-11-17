'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ShrinkIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ShrinkIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 25,
};

const ShrinkIcon = forwardRef<ShrinkIconHandle, ShrinkIconProps>(
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
        data-slot="shrink-icon"
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
            d="M9 4.2V9m0 0H4.2M9 9 3 3"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { translateX: '0%', translateY: '0%' },
              animate: { translateX: '1px', translateY: '1px' },
            }}
          />
          <motion.path
            animate={controls}
            d="M15 4.2V9m0 0h4.8M15 9l6-6"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { translateX: '0%', translateY: '0%' },
              animate: { translateX: '-1px', translateY: '1px' },
            }}
          />
          <motion.path
            animate={controls}
            d="M9 19.8V15m0 0H4.2M9 15l-6 6"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { translateX: '0%', translateY: '0%' },
              animate: { translateX: '1px', translateY: '-1px' },
            }}
          />
          <motion.path
            animate={controls}
            d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { translateX: '0%', translateY: '0%' },
              animate: { translateX: '-1px', translateY: '-1px' },
            }}
          />
        </svg>
      </span>
    );
  },
);

ShrinkIcon.displayName = 'ShrinkIcon';

export { ShrinkIcon };
