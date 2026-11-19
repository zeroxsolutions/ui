'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface RadioIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface RadioIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const VARIANTS: Variants = {
  normal: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
  fadeOut: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
  fadeIn: (i: number) => ({
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: i * 0.1,
    },
  }),
};

const RadioIcon = forwardRef<RadioIconHandle, RadioIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          if (isMotionReduced) return;
          await controls.start('fadeOut');
          controls.start('fadeIn');
        },
        stopAnimation: () => controls.start('normal'),
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await controls.start('fadeOut');
          controls.start('fadeIn');
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
        data-slot="radio-icon"
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
            custom={1}
            d="M4.925 19.067a10 10 0 0 1 0-14.134"
            initial={{ opacity: 1 }}
            variants={VARIANTS}
          />
          <motion.path
            animate={controls}
            custom={0}
            d="M7.753 16.239a6 6 0 0 1 0-8.478"
            initial={{ opacity: 1 }}
            variants={VARIANTS}
          />
          <circle cx="12" cy="12" r="2" />
          <motion.path
            animate={controls}
            custom={0}
            d="M16.247 7.761a6 6 0 0 1 0 8.478"
            initial={{ opacity: 1 }}
            variants={VARIANTS}
          />
          <motion.path
            animate={controls}
            custom={1}
            d="M19.075 4.933a10 10 0 0 1 0 14.134"
            initial={{ opacity: 1 }}
            variants={VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

RadioIcon.displayName = 'RadioIcon';

export { RadioIcon };
