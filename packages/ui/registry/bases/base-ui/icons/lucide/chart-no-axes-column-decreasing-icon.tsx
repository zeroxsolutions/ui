'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ChartNoAxesColumnDecreasingIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChartNoAxesColumnDecreasingIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const LINE_VARIANTS: Variants = {
  visible: { pathLength: 1, opacity: 1 },
  hidden: { pathLength: 0, opacity: 0 },
};

const ChartNoAxesColumnDecreasingIcon = forwardRef<
  ChartNoAxesColumnDecreasingIconHandle,
  ChartNoAxesColumnDecreasingIconProps
>(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
  const controls = useAnimation();
  const isMotionReduced = useReducedMotion();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;

    return {
      startAnimation: async () => {
        if (isMotionReduced) return;
        await controls.start((i) => ({
          pathLength: 0,
          opacity: 0,
          transition: { delay: i * 0.1, duration: 0.3 },
        }));
        await controls.start((i) => ({
          pathLength: 1,
          opacity: 1,
          transition: { delay: i * 0.1, duration: 0.3 },
        }));
      },
      stopAnimation: () => controls.start('visible'),
    };
  });

  const handleMouseEnter = useCallback(
    async (e: React.MouseEvent<HTMLSpanElement>) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else if (!isMotionReduced) {
        await controls.start((i) => ({
          pathLength: 0,
          opacity: 0,
          transition: { delay: i * 0.1, duration: 0.3 },
        }));
        await controls.start((i) => ({
          pathLength: 1,
          opacity: 1,
          transition: { delay: i * 0.1, duration: 0.3 },
        }));
      }
    },
    [controls, isMotionReduced, onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (isControlledRef.current) {
        onMouseLeave?.(e);
      } else {
        controls.start('visible');
      }
    },
    [controls, onMouseLeave],
  );

  return (
    <span
      data-slot="chart-no-axes-column-decreasing-icon"
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
        <motion.path animate={controls} custom={0} d="M5 21V3" initial="visible" variants={LINE_VARIANTS} />
        <motion.path animate={controls} custom={1} d="M12 21V9" initial="visible" variants={LINE_VARIANTS} />
        <motion.path animate={controls} custom={2} d="M19 21v-6" initial="visible" variants={LINE_VARIANTS} />
      </svg>
    </span>
  );
});

ChartNoAxesColumnDecreasingIcon.displayName = 'ChartNoAxesColumnDecreasingIcon';

export { ChartNoAxesColumnDecreasingIcon };
