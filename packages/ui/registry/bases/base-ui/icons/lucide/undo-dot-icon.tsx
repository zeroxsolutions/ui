'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { cubicBezier, motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface UndoDotIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface UndoDotIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const CUSTOM_EASING = cubicBezier(0.25, 0.1, 0.25, 1);

const UndoDotIcon = forwardRef<UndoDotIconHandle, UndoDotIconProps>(
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
        data-slot="undo-dot-icon"
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
            d="M3 7v6h6"
            transition={{ duration: 0.6, ease: CUSTOM_EASING }}
            variants={{
              normal: { translateX: 0, translateY: 0, rotate: 0 },
              animate: {
                translateX: [0, 2.1, 0],
                translateY: [0, -1.4, 0],
                rotate: [0, 12, 0],
              },
            }}
          />
          <motion.path
            animate={controls}
            d="M21 17a9 9 0 0 0-15-6.7L3 13"
            transition={{ duration: 0.6, ease: CUSTOM_EASING }}
            variants={{
              normal: { pathLength: 1 },
              animate: { pathLength: [1, 0.8, 1] },
            }}
          />
          <motion.circle
            animate={controls}
            cx="12"
            cy="17"
            r="1"
            transition={{ duration: 0.6, ease: CUSTOM_EASING }}
            variants={{
              normal: { scale: 1 },
              animate: { scale: [1, 1.2, 1] },
            }}
          />
        </svg>
      </span>
    );
  },
);

UndoDotIcon.displayName = 'UndoDotIcon';

export { UndoDotIcon };
