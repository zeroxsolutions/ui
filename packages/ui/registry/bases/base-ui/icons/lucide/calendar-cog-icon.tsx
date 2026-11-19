'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface CalendarCogIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CalendarCogIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const G_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: 180 },
};

const CalendarCogIcon = forwardRef<CalendarCogIconHandle, CalendarCogIconProps>(
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
        data-slot="calendar-cog-icon"
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
          <path d="M21 10.5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h5.5" />
          <path d="M16 2v3" />
          <path d="M3 9h18" />
          <path d="M8 2v3" />
          <motion.g
            animate={controls}
            transition={{ type: 'spring', stiffness: 50, damping: 10 }}
            variants={G_VARIANTS}
          >
            <path d="m15.228 16.852-.923-.383" />
            <path d="m15.228 19.148-.923.383" />
            <path d="m16.47 14.305.382.923" />
            <path d="m16.852 20.772-.383.924" />
            <path d="m19.148 15.228.383-.923" />
            <path d="m19.53 21.696-.382-.924" />
            <path d="m20.773 16.852.924-.383" />
            <path d="m20.773 19.148.924.383" />
            <circle cx="18" cy="18" r="3" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

CalendarCogIcon.displayName = 'CalendarCogIcon';

export { CalendarCogIcon };
