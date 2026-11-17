'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ChartScatterIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChartScatterIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DOT_VARIANTS: Variants = {
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.3,
    },
  }),
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
  default: { opacity: 1 },
};

const ChartScatterIcon = forwardRef<ChartScatterIconHandle, ChartScatterIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          if (isMotionReduced) return;
          await controls.start('hidden');
          await controls.start('visible');
        },
        stopAnimation: async () => controls.start('default'),
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await controls.start('hidden');
          await controls.start('visible');
        }
      },
      [controls, isMotionReduced, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          await controls.start('default');
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <span
        data-slot="chart-scatter-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          initial="default"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle custom={0} cx="7.5" cy="7.5" fill="currentColor" r=".5" variants={DOT_VARIANTS} />
          <motion.circle custom={1} cx="18.5" cy="5.5" fill="currentColor" r=".5" variants={DOT_VARIANTS} />
          <motion.circle custom={2} cx="11.5" cy="11.5" fill="currentColor" r=".5" variants={DOT_VARIANTS} />
          <motion.circle custom={3} cx="7.5" cy="16.5" fill="currentColor" r=".5" variants={DOT_VARIANTS} />
          <motion.circle custom={4} cx="17.5" cy="14.5" fill="currentColor" r=".5" variants={DOT_VARIANTS} />
          <path d="M3 3v16a2 2 0 0 0 2 2h16" strokeWidth="2" />
        </motion.svg>
      </span>
    );
  },
);

ChartScatterIcon.displayName = 'ChartScatterIcon';

export { ChartScatterIcon };
