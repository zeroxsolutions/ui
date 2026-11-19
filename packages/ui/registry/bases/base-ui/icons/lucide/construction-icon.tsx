'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useId, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ConstructionIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ConstructionIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

// The barrier's stripes slide one period to the right on a loop; the stripe that slides in from the
// left stays hidden at rest, so the still icon is Lucide's.
const STRIPES_VARIANTS: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 6],
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'loop',
    },
  },
};

const ENTERING_STRIPE_VARIANTS: Variants = {
  normal: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0 } },
};

const ConstructionIcon = forwardRef<ConstructionIconHandle, ConstructionIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);
    const clipId = useId();

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
        data-slot="construction-icon"
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
          <defs>
            <clipPath id={clipId}>
              <rect height="10" width="22" x="1" y="5" />
            </clipPath>
          </defs>
          <rect height="8" rx="1" width="20" x="2" y="6" />
          <path d="M17 14v7" />
          <path d="M7 14v7" />
          <path d="M17 3v3" />
          <path d="M7 3v3" />
          <g clipPath={`url(#${clipId})`}>
            <motion.g animate={controls} initial="normal" variants={STRIPES_VARIANTS}>
              <motion.path d="M4 14-3.7 6.3" variants={ENTERING_STRIPE_VARIANTS} />
              <path d="M10 14 2.3 6.3" />
              <path d="m14 6 7.7 7.7" />
              <path d="m8 6 8 8" />
            </motion.g>
          </g>
        </svg>
      </span>
    );
  },
);

ConstructionIcon.displayName = 'ConstructionIcon';

export { ConstructionIcon };
