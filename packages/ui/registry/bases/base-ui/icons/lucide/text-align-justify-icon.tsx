'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface TextAlignJustifyIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface TextAlignJustifyIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 150,
  damping: 15,
  mass: 0.3,
};

const TextAlignJustifyIcon = forwardRef<TextAlignJustifyIconHandle, TextAlignJustifyIconProps>(
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
        data-slot="text-align-justify-icon"
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
          <path d="M3 5h18" />
          <motion.path
            animate={controls}
            initial="normal"
            d="M3 12h18"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { d: 'M3 12h18' },
              animate: { d: 'M3 12h12' },
            }}
          />
          <motion.path
            animate={controls}
            initial="normal"
            d="M3 19h18"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { d: 'M3 19h18' },
              animate: { d: 'M3 19h15' },
            }}
          />
        </svg>
      </span>
    );
  },
);

TextAlignJustifyIcon.displayName = 'TextAlignJustifyIcon';

export { TextAlignJustifyIcon };
