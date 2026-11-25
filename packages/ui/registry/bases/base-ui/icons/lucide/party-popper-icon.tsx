'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface PartyPopperIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface PartyPopperIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const LINES_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
  animate: {
    opacity: [0, 1],
    scale: [0.3, 0.8, 1, 1.1, 1],
    pathLength: [0, 0.5, 1],
    translateX: [-5, 0],
    translateY: [5, 0],
    transition: {
      duration: 0.7,
      velocity: 0.3,
    },
  },
};

const DOTS_VARIANTS: Variants = {
  normal: { opacity: 1, scale: 1, translateX: 0, translateY: 0 },
  animate: {
    opacity: [0, 1],
    translateX: [-5, 0],
    translateY: [5, 0],
    scale: [0.5, 0.8, 1, 1.1, 1],
    transition: {
      duration: 0.7,
    },
  },
};

const POPPER_VARIANTS: Variants = {
  normal: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [-1.5, 0],
    translateY: [1.5, 0],
    transition: {
      velocity: 0.3,
    },
  },
};

const PartyPopperIcon = forwardRef<PartyPopperIconHandle, PartyPopperIconProps>(
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
        data-slot="party-popper-icon"
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
          <motion.path animate={controls} initial="normal" d="M5.8 11.3 2 22l10.7-3.79" variants={POPPER_VARIANTS} />
          <motion.path
            animate={controls}
            initial="normal"
            d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"
            variants={POPPER_VARIANTS}
          />
          <motion.path animate={controls} initial="normal" d="M4 3h.01" variants={DOTS_VARIANTS} />
          <motion.path animate={controls} initial="normal" d="M22 8h.01" variants={DOTS_VARIANTS} />
          <motion.path animate={controls} initial="normal" d="M15 2h.01" variants={DOTS_VARIANTS} />
          <motion.path animate={controls} initial="normal" d="M22 20h.01" variants={DOTS_VARIANTS} />
          <motion.path
            animate={controls}
            initial="normal"
            d="M14 10l.21-1.06c.16-.84.9-1.44 1.76-1.44h.38c.88 0 1.55-.77 1.45-1.63a2.9 2.9 0 0 1 1.96-3.12L22 2"
            variants={LINES_VARIANTS}
          />
          <motion.path
            animate={controls}
            initial="normal"
            d="M17 15h.77c.71 0 1.32-.52 1.43-1.22.16-.91 1.12-1.45 1.98-1.11L22 13"
            variants={LINES_VARIANTS}
          />
          <motion.path
            animate={controls}
            initial="normal"
            d="M9 7v-.77c0-.71.52-1.33 1.22-1.43.91-.16 1.45-1.12 1.11-1.98L11 2"
            variants={LINES_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

PartyPopperIcon.displayName = 'PartyPopperIcon';

export { PartyPopperIcon };
