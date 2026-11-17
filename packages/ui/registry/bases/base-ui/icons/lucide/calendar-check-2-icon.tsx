'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface CalendarCheck2IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CalendarCheck2IconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const CHECK_VARIANTS: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      pathLength: { duration: 0.4, ease: 'easeInOut' },
      opacity: { duration: 0.4, ease: 'easeInOut' },
    },
  },
};

const CalendarCheck2Icon = forwardRef<CalendarCheck2IconHandle, CalendarCheck2IconProps>(
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
        data-slot="calendar-check-2-icon"
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
          <path d="M 19 3 L 5 3" />
          <path d="M 21 13 L 21 5" />
          <path d="M 21 5 A2 2 0 0 0 19 3" />
          <path d="M 3 19 A2 2 0 0 0 5 21" />
          <path d="M 3 5 L 3 19" />
          <path d="M 5 3 A2 2 0 0 0 3 5" />
          <path d="M16 2v3" />
          <path d="M3 9h18" />
          <path d="M5 21 L12.5 21" />
          <path d="M8 2v3" />
          <motion.path
            animate={controls}
            d="m16 19 2 2 4-4"
            initial="normal"
            style={{ transformOrigin: 'center' }}
            variants={CHECK_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

CalendarCheck2Icon.displayName = 'CalendarCheck2Icon';

export { CalendarCheck2Icon };
