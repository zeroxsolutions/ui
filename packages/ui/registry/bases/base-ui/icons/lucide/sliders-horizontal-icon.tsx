'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface SlidersHorizontalIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SlidersHorizontalIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 12,
  mass: 0.4,
};

const SlidersHorizontalIcon = forwardRef<SlidersHorizontalIconHandle, SlidersHorizontalIconProps>(
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
        data-slot="sliders-horizontal-icon"
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
            d="M21 5h-7"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M21 5h-7' }, animate: { d: 'M21 5h-11' } }}
          />
          <motion.path
            animate={controls}
            d="M10 5H3"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M10 5H3' }, animate: { d: 'M5 5H3' } }}
          />
          <motion.path
            animate={controls}
            d="M21 12h-9"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M21 12h-9' }, animate: { d: 'M21 12h-3' } }}
          />
          <motion.path
            animate={controls}
            d="M8 12H3"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M8 12H3' }, animate: { d: 'M13 12H3' } }}
          />
          <motion.path
            animate={controls}
            d="M12 19H3"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M12 19H3' }, animate: { d: 'M4 19H3' } }}
          />
          <motion.path
            animate={controls}
            d="M21 19h-5"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M21 19h-5' }, animate: { d: 'M21 19h-13' } }}
          />
          <motion.path
            animate={controls}
            d="M14 3v4"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M14 3v4' }, animate: { d: 'M9 3v4' } }}
          />
          <motion.path
            animate={controls}
            d="M8 10v4"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M8 10v4' }, animate: { d: 'M14 10v4' } }}
          />
          <motion.path
            animate={controls}
            d="M16 17v4"
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { d: 'M16 17v4' }, animate: { d: 'M8 17v4' } }}
          />
        </svg>
      </span>
    );
  },
);

SlidersHorizontalIcon.displayName = 'SlidersHorizontalIcon';

export { SlidersHorizontalIcon };
