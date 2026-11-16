'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FrameIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FrameIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const FrameIcon = forwardRef<FrameIconHandle, FrameIconProps>(
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
        data-slot="frame-icon"
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
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { y: 0 }, animate: { y: [0, -4, 0] } }}
            x1="22"
            x2="2"
            y1="6"
            y2="6"
          />
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { y: 0 }, animate: { y: [0, 4, 0] } }}
            x1="22"
            x2="2"
            y1="18"
            y2="18"
          />
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { x: 0 }, animate: { x: [0, -4, 0] } }}
            x1="6"
            x2="6"
            y1="2"
            y2="22"
          />
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { x: 0 }, animate: { x: [0, 4, 0] } }}
            x1="18"
            x2="18"
            y1="2"
            y2="22"
          />
        </svg>
      </span>
    );
  },
);

FrameIcon.displayName = 'FrameIcon';

export { FrameIcon };
