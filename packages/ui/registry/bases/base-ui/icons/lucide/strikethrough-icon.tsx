'use client';

// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface StrikethroughIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface StrikethroughIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const StrikethroughIcon = forwardRef<StrikethroughIconHandle, StrikethroughIconProps>(
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
        data-slot="strikethrough-icon"
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
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { y: 0 }, animate: { y: [0, -1.5, 0] } }}
            d="M16 4H9a3 3 0 0 0-2.83 4"
          />
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { y: 0 }, animate: { y: [0, 1.5, 0] } }}
            d="M14 12a4 4 0 0 1 0 8H6"
          />
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { pathLength: 1 }, animate: { pathLength: [1, 0, 1] } }}
            x1="4"
            x2="20"
            y1="12"
            y2="12"
          />
        </svg>
      </span>
    );
  },
);

StrikethroughIcon.displayName = 'StrikethroughIcon';

export { StrikethroughIcon };
