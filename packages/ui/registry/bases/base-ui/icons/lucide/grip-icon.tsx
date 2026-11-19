'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface GripIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface GripIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const CIRCLES = [
  { cx: 19, cy: 5 },
  { cx: 19, cy: 12 },
  { cx: 12, cy: 5 },
  { cx: 19, cy: 19 },
  { cx: 12, cy: 12 },
  { cx: 5, cy: 5 },
  { cx: 12, cy: 19 },
  { cx: 5, cy: 12 },
  { cx: 5, cy: 19 },
];

const VARIANTS: Variants = {
  normal: {
    opacity: 1,
    transition: { duration: 0.25 },
  },
  animate: (index: number) => ({
    opacity: [1, 0.3, 0.3, 1],
    transition: {
      delay: index * 0.07,
      duration: 1.1,
      times: [0, 0.2, 0.8, 1],
    },
  }),
};

const GripIcon = forwardRef<GripIconHandle, GripIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);
    const isAnimatingRef = useRef(false);

    const startAnimation = useCallback(async () => {
      if (isMotionReduced || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      await controls.start('animate');
      await controls.start('normal');
      isAnimatingRef.current = false;
    }, [controls, isMotionReduced]);

    const stopAnimation = useCallback(async () => {
      if (!isAnimatingRef.current) return;
      await controls.start('normal');
      isAnimatingRef.current = false;
    }, [controls]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return { startAnimation, stopAnimation };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          startAnimation();
        }
      },
      [startAnimation, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          stopAnimation();
        }
      },
      [stopAnimation, onMouseLeave],
    );

    return (
      <span
        data-slot="grip-icon"
        className={cn('inline-flex items-center justify-center', className)}
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
          {CIRCLES.map((circle, index) => (
            <motion.circle
              animate={controls}
              custom={index}
              cx={circle.cx}
              cy={circle.cy}
              initial="normal"
              key={`${circle.cx}-${circle.cy}`}
              r="1"
              variants={VARIANTS}
            />
          ))}
        </svg>
      </span>
    );
  },
);

GripIcon.displayName = 'GripIcon';

export { GripIcon };
