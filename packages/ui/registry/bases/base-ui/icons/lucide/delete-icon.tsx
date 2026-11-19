'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition, Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface DeleteIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface DeleteIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

// lucide-animated draws a trash can here, which Lucide's delete is not, so its lid lift has nothing to
// move: the key slides left as a backspace does, and its cross turns a quarter.
const KEY_VARIANTS: Variants = {
  normal: { x: 0 },
  animate: { x: -1.5 },
};

const CROSS_VARIANTS: Variants = {
  normal: { x: 0, rotate: 0 },
  animate: { x: -1.5, rotate: 90 },
};

const SPRING_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

const DeleteIcon = forwardRef<DeleteIconHandle, DeleteIconProps>(
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
        data-slot="delete-icon"
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
          <motion.path
            animate={controls}
            d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
            transition={SPRING_TRANSITION}
            variants={KEY_VARIANTS}
          />
          <motion.g animate={controls} transition={SPRING_TRANSITION} variants={CROSS_VARIANTS}>
            <path d="m12 9 6 6" />
            <path d="m18 9-6 6" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

DeleteIcon.displayName = 'DeleteIcon';

export { DeleteIcon };
