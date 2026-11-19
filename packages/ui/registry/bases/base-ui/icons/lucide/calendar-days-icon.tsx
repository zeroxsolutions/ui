'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { AnimatePresence, motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface CalendarDaysIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CalendarDaysIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DOTS = ['M8 13h.01', 'M12 13h.01', 'M16 13h.01', 'M8 17h.01', 'M12 17h.01', 'M16 17h.01'];

const VARIANTS: Variants = {
  normal: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  animate: (i: number) => ({
    opacity: [1, 0.3, 1],
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      times: [0, 0.5, 1],
    },
  }),
};

const CalendarDaysIcon = forwardRef<CalendarDaysIconHandle, CalendarDaysIconProps>(
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
        data-slot="calendar-days-icon"
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
          <path d="M8 2v3" />
          <path d="M16 2v3" />
          <rect height="18" rx="2" width="18" x="3" y="3" />
          <path d="M3 9h18" />
          <AnimatePresence>
            {DOTS.map((d, index) => (
              <motion.path animate={controls} custom={index} d={d} initial="normal" key={d} variants={VARIANTS} />
            ))}
          </AnimatePresence>
        </svg>
      </span>
    );
  },
);

CalendarDaysIcon.displayName = 'CalendarDaysIcon';

export { CalendarDaysIcon };
