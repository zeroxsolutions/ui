'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface MaximizeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface MaximizeIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const MaximizeIcon = forwardRef<MaximizeIconHandle, MaximizeIconProps>(
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
        data-slot="maximize-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { x: 0, y: 0 }, animate: { x: [0, -2, 0], y: [0, -2, 0] } }}
            d="M8 3H5a2 2 0 0 0-2 2v3"
          />
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { x: 0, y: 0 }, animate: { x: [0, 2, 0], y: [0, -2, 0] } }}
            d="M21 8V5a2 2 0 0 0-2-2h-3"
          />
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { x: 0, y: 0 }, animate: { x: [0, -2, 0], y: [0, 2, 0] } }}
            d="M3 16v3a2 2 0 0 0 2 2h3"
          />
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { x: 0, y: 0 }, animate: { x: [0, 2, 0], y: [0, 2, 0] } }}
            d="M16 21h3a2 2 0 0 0 2-2v-3"
          />
        </svg>
      </span>
    );
  },
);

MaximizeIcon.displayName = 'MaximizeIcon';

export { MaximizeIcon };
