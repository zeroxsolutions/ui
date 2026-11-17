'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface SquareArrowDownIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SquareArrowDownIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const SQUARE_VARIANTS: Variants = {
  normal: { transition: { duration: 0.4 } },
  animate: { transition: { duration: 0.6, ease: 'easeInOut' } },
};

const PATH_VARIANTS: Variants = {
  normal: { d: 'm8 12 4 4 4-4', translateY: 0, opacity: 1 },
  animate: {
    d: 'm8 12 4 4 4-4',
    translateY: [0, -3, 0],
    transition: { duration: 0.4 },
  },
};

const SECOND_PATH_VARIANTS: Variants = {
  normal: { d: 'M12 8v8', opacity: 1 },
  animate: {
    d: ['M12 8v8', 'M12 8v5', 'M12 8v8'],
    transition: { duration: 0.4 },
  },
};

const SquareArrowDownIcon = forwardRef<SquareArrowDownIconHandle, SquareArrowDownIconProps>(
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
        data-slot="square-arrow-down-icon"
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
          <motion.rect
            animate={controls}
            height="18"
            initial="normal"
            rx="2"
            variants={SQUARE_VARIANTS}
            width="18"
            x="3"
            y="3"
          />
          <motion.path animate={controls} d="m8 12 4 4 4-4" initial="normal" variants={PATH_VARIANTS} />
          <motion.path animate={controls} d="M12 8v8" initial="normal" variants={SECOND_PATH_VARIANTS} />
        </svg>
      </span>
    );
  },
);

SquareArrowDownIcon.displayName = 'SquareArrowDownIcon';

export { SquareArrowDownIcon };
