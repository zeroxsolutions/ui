'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition, Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface CpuIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CpuIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const TRANSITION: Transition = {
  duration: 0.5,
  ease: 'easeInOut',
  repeat: 1,
};

const Y_VARIANTS: Variants = {
  normal: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  animate: {
    scaleY: [1, 1.5, 1],
    opacity: [1, 0.8, 1],
  },
};
const X_VARIANTS: Variants = {
  normal: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  animate: {
    scaleX: [1, 1.5, 1],
    opacity: [1, 0.8, 1],
  },
};

const CpuIcon = forwardRef<CpuIconHandle, CpuIconProps>(
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
        data-slot="cpu-icon"
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
          <rect height="16" rx="2" width="16" x="4" y="4" />
          <rect height="8" rx="1" width="8" x="8" y="8" />
          <motion.path animate={controls} d="M12 2v2" transition={TRANSITION} variants={Y_VARIANTS} />
          <motion.path animate={controls} d="M12 20v2" transition={TRANSITION} variants={Y_VARIANTS} />
          <motion.path animate={controls} d="M2 12h2" transition={TRANSITION} variants={X_VARIANTS} />
          <motion.path animate={controls} d="M20 12h2" transition={TRANSITION} variants={X_VARIANTS} />
          <motion.path animate={controls} d="M17 2v2" transition={TRANSITION} variants={Y_VARIANTS} />
          <motion.path animate={controls} d="M17 20v2" transition={TRANSITION} variants={Y_VARIANTS} />
          <motion.path animate={controls} d="M2 17h2" transition={TRANSITION} variants={X_VARIANTS} />
          <motion.path animate={controls} d="M2 7h2" transition={TRANSITION} variants={X_VARIANTS} />
          <motion.path animate={controls} d="M20 17h2" transition={TRANSITION} variants={X_VARIANTS} />
          <motion.path animate={controls} d="M20 7h2" transition={TRANSITION} variants={X_VARIANTS} />
          <motion.path animate={controls} d="M7 2v2" transition={TRANSITION} variants={Y_VARIANTS} />
          <motion.path animate={controls} d="M7 20v2" transition={TRANSITION} variants={Y_VARIANTS} />
        </svg>
      </span>
    );
  },
);

CpuIcon.displayName = 'CpuIcon';

export { CpuIcon };
