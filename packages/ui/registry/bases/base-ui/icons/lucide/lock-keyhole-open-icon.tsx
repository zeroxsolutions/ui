'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface LockKeyholeOpenIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LockKeyholeOpenIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const LockKeyholeOpenIcon = forwardRef<LockKeyholeOpenIconHandle, LockKeyholeOpenIconProps>(
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
        data-slot="lock-keyhole-open-icon"
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
          <circle cx="12" cy="16" r="1" />
          <rect height="12" rx="2" width="18" x="3" y="10" />
          {/* Lucide draws the shackle open; it swings shut, and its right leg, not part of the glyph, comes down after it. */}
          <motion.path
            animate={controls}
            d="M7 10V7a5 5 0 0 1 9.33-2.5"
            initial="normal"
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            variants={{
              normal: { d: 'M7 10V7a5 5 0 0 1 9.33-2.5' },
              animate: { d: 'M7 10V7a5 5 0 0 1 10 0' },
            }}
          />
          <motion.path
            animate={controls}
            d="M17 7v3"
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

LockKeyholeOpenIcon.displayName = 'LockKeyholeOpenIcon';

export { LockKeyholeOpenIcon };
