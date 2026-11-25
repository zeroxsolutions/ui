'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface BluetoothSearchingIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BluetoothSearchingIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const PATH_VARIANTS: Variants = {
  normal: {
    scale: 1,
    transition: {
      repeat: 0,
    },
  },
  animate: {
    scale: [0, 1, 0.8],
  },
};

const SECOND_VARIANTS: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: [1, 0.8, 1],
    transition: { repeat: Number.POSITIVE_INFINITY },
  },
};

const BluetoothSearchingIcon = forwardRef<BluetoothSearchingIconHandle, BluetoothSearchingIconProps>(
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
        data-slot="bluetooth-searching-icon"
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
          <motion.path animate={controls} initial="normal" d="m7 7 10 10-5 5V2l5 5L7 17" variants={SECOND_VARIANTS} />
          <motion.path
            animate={controls}
            initial="normal"
            d="M20.83 14.83a4 4 0 0 0 0-5.66"
            transition={{
              duration: 0.6,
              delay: 0.2,
              repeat: Number.POSITIVE_INFINITY,
            }}
            variants={PATH_VARIANTS}
          />
          <motion.path
            animate={controls}
            initial="normal"
            d="M18 12h.01"
            transition={{
              duration: 0.6,
              repeat: Number.POSITIVE_INFINITY,
            }}
            variants={PATH_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

BluetoothSearchingIcon.displayName = 'BluetoothSearchingIcon';

export { BluetoothSearchingIcon };
