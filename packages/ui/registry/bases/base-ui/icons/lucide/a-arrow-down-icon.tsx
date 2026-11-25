'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface AArrowDownIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AArrowDownIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const LETTER_VARIANTS: Variants = {
  normal: { opacity: 1, scale: 1 },
  animate: {
    opacity: [0, 1],
    scale: [0.8, 1],
    transition: { duration: 0.3 },
  },
};

const ARROW_VARIANTS: Variants = {
  normal: { opacity: 1, y: 0 },
  animate: {
    opacity: [0, 1],
    y: [-10, 0],
    transition: { duration: 0.3, delay: 0.2 },
  },
};

const AArrowDownIcon = forwardRef<AArrowDownIconHandle, AArrowDownIconProps>(
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
        data-slot="a-arrow-down-icon"
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
          <motion.path animate={controls} initial="normal" d="M3.304 13h6.392" variants={LETTER_VARIANTS} />
          <motion.path
            animate={controls}
            initial="normal"
            d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16"
            variants={LETTER_VARIANTS}
          />
          <motion.path animate={controls} initial="normal" d="M18 16V7" variants={ARROW_VARIANTS} />
          <motion.path animate={controls} initial="normal" d="m14 12 4 4 4-4" variants={ARROW_VARIANTS} />
        </svg>
      </span>
    );
  },
);

AArrowDownIcon.displayName = 'AArrowDownIcon';

export { AArrowDownIcon };
