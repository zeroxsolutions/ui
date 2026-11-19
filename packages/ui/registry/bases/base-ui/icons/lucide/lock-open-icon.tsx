'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface LockOpenIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LockOpenIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const LockOpenIcon = forwardRef<LockOpenIconHandle, LockOpenIconProps>(
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
        data-slot="lock-open-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          initial="normal"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transition={{
            duration: 1,
            ease: [0.4, 0, 0.2, 1],
          }}
          variants={{
            normal: {
              rotate: 0,
              scale: 1,
            },
            animate: {
              rotate: [2, 4, -2, 0],
              scale: [1.05, 0.95, 1.02, 1],
            },
          }}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
          {/* Lucide draws the shackle open; it swings shut, and its right leg, not part of the glyph, comes down after it. */}
          <motion.path
            animate={controls}
            d="M7 11V7a5 5 0 0 1 9.9-1"
            initial="normal"
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            variants={{
              normal: { d: 'M7 11V7a5 5 0 0 1 9.9-1' },
              animate: { d: 'M7 11V7a5 5 0 0 1 10 0' },
            }}
          />
          <motion.path
            animate={controls}
            d="M17 7v4"
            initial="normal"
            variants={{
              normal: { opacity: 0, pathLength: 0, transition: { duration: 0.1 } },
              animate: {
                opacity: 1,
                pathLength: 1,
                transition: { delay: 0.25, duration: 0.2, ease: [0.4, 0, 0.2, 1] },
              },
            }}
          />
        </motion.svg>
      </span>
    );
  },
);

LockOpenIcon.displayName = 'LockOpenIcon';

export { LockOpenIcon };
