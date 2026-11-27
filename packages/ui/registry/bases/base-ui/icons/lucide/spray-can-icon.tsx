'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface SprayCanIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SprayCanIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const SPRAY_DOT_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  animate: (index: number) => ({
    opacity: [0, 1, 0],
    transition: {
      delay: index * 0.07,
      duration: 1.05 + index * 0.06,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'easeInOut',
      times: [0, 0.45, 1],
    },
  }),
};

const DOT_PATHS_RTL = [
  { d: 'M8 4h.01', key: 'dot-1' },
  { d: 'M8 8h.01', key: 'dot-2' },
  { d: 'M4 2h.01', key: 'dot-3' },
  { d: 'M4 6h.01', key: 'dot-4' },
  { d: 'M4 10h.01', key: 'dot-5' },
] as const;

const SprayCanIcon = forwardRef<SprayCanIconHandle, SprayCanIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isAnimatingRef = useRef(false);
    const isControlledRef = useRef(false);

    const startAnimation = useCallback(() => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      controls.start('animate');
    }, [controls]);

    const stopAnimation = useCallback(async () => {
      isAnimatingRef.current = false;
      await controls.start('normal');
    }, [controls]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => {
          if (!isMotionReduced) startAnimation();
        },
        stopAnimation,
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          startAnimation();
        }
      },
      [isMotionReduced, startAnimation, onMouseEnter],
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
        data-slot="spray-can-icon"
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
          <path d="M18 8.172V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v3.172" />
          <path d="M14 6h-2" />
          <path d="M20 20a2 2 0 01-2 2h-4a2 2 0 01-2-2v-9a3 3 0 013-3h2a3 3 0 013 3z" />
          <path d="m20 11-8 3" />
          <path d="m12 19 8-3" />
          <g>
            {DOT_PATHS_RTL.map((item, index) => (
              <motion.path
                animate={controls}
                custom={index}
                d={item.d}
                initial="normal"
                key={item.key}
                variants={SPRAY_DOT_VARIANTS}
              />
            ))}
          </g>
        </svg>
      </span>
    );
  },
);

SprayCanIcon.displayName = 'SprayCanIcon';

export { SprayCanIcon };
