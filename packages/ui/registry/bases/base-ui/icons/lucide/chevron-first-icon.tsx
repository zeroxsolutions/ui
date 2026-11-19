'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ChevronFirstIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChevronFirstIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const ChevronFirstIcon = forwardRef<ChevronFirstIconHandle, ChevronFirstIconProps>(
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
        data-slot="chevron-first-icon"
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
            d="m17 18-6-6 6-6"
            initial="normal"
            variants={{
              normal: {
                translateX: 0,
                transition: { duration: 0.3, ease: 'easeOut' },
              },
              animate: {
                translateX: [-2, 1, -1, 0],
                transition: {
                  duration: 0.6,
                  ease: 'easeInOut',
                  times: [0, 0.3, 0.7, 1],
                },
              },
            }}
          />

          <path d="M7 6v12" />
        </svg>
      </span>
    );
  },
);

ChevronFirstIcon.displayName = 'ChevronFirstIcon';

export { ChevronFirstIcon };
