'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface LanguagesIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LanguagesIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const PATH_VARIANTS: Variants = {
  normal: { opacity: 1, pathLength: 1, pathOffset: 0 },
  animate: (custom: number) => ({
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      opacity: { duration: 0.01, delay: custom * 0.1 },
      pathLength: {
        type: 'spring',
        duration: 0.5,
        bounce: 0,
        delay: custom * 0.1,
      },
    },
  }),
};

const LanguagesIcon = forwardRef<LanguagesIconHandle, LanguagesIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const pathControls = useAnimation();
    const isMotionReduced = useReducedMotion();

    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => {
          if (isMotionReduced) return;
          pathControls.start('animate');
        },
        stopAnimation: () => {
          pathControls.start('normal');
        },
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          pathControls.start('animate');
        }
      },
      [onMouseEnter, isMotionReduced, pathControls],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          pathControls.start('normal');
        }
      },
      [pathControls, onMouseLeave],
    );

    return (
      <span
        data-slot="languages-icon"
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
          <motion.path animate={pathControls} initial="normal" custom={3} d="m5 8 6 6" variants={PATH_VARIANTS} />
          <motion.path animate={pathControls} initial="normal" custom={2} d="m4 14 6-6 2-3" variants={PATH_VARIANTS} />
          <motion.path animate={pathControls} initial="normal" custom={1} d="M2 5h12" variants={PATH_VARIANTS} />
          <motion.path animate={pathControls} initial="normal" custom={0} d="M7 2h1" variants={PATH_VARIANTS} />
          <motion.path
            animate={pathControls}
            initial="normal"
            custom={3}
            d="m22 22-5-10-5 10"
            variants={PATH_VARIANTS}
          />
          <motion.path animate={pathControls} initial="normal" custom={3} d="M14 18h6" variants={PATH_VARIANTS} />
        </svg>
      </span>
    );
  },
);

LanguagesIcon.displayName = 'LanguagesIcon';

export { LanguagesIcon };
