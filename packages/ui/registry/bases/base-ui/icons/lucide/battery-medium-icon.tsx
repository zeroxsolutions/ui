'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface BatteryMediumIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BatteryMediumIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const LINE_VARIANTS: Variants = {
  initial: { opacity: 1 },
  fadeOut: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  fadeIn: (i: number) => ({
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.4,
      ease: 'easeInOut',
    },
  }),
};

const BatteryMediumIcon = forwardRef<BatteryMediumIconHandle, BatteryMediumIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          if (isMotionReduced) return;
          await controls.start('fadeOut');
          controls.start('fadeIn');
        },
        stopAnimation: () => controls.start('initial'),
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await controls.start('fadeOut');
          controls.start('fadeIn');
        }
      },
      [controls, isMotionReduced, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start('initial');
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <span
        data-slot="battery-medium-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
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
          <rect height="12" rx="2" width="16" x="2" y="6" />
          <path d="M22 14v-4" />
          <motion.path animate={controls} custom={0} initial="initial" variants={LINE_VARIANTS} d="M6 14v-4" />
          <motion.path animate={controls} custom={1} initial="initial" variants={LINE_VARIANTS} d="M10 14v-4" />
        </motion.svg>
      </span>
    );
  },
);

BatteryMediumIcon.displayName = 'BatteryMediumIcon';

export { BatteryMediumIcon };
