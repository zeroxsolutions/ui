'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, type Transition, useAnimation, useReducedMotion, type Variants } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface WifiSyncIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WifiSyncIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const SYNC_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: -360 },
};

const SYNC_TRANSITION: Transition = {
  duration: 0.6,
  ease: 'easeInOut',
};

const WifiSyncIcon = forwardRef<WifiSyncIconHandle, WifiSyncIconProps>(
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
        data-slot="wifi-sync-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
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
          <path d="M2 8.82a15 15 0 0 1 20 0" />
          <path d="M5 12.86a10 10 0 0 1 3-2.032" />
          <path d="M8.5 16.429h.01" />
          <motion.g animate={controls} initial="normal" transition={SYNC_TRANSITION} variants={SYNC_VARIANTS}>
            <path d="M11.965 10.105v4L13.5 12.5a5 5 0 0 1 8 1.5" />
            <path d="M11.965 14.105h4" />
            <path d="M17.965 18.105h4L20.43 19.71a5 5 0 0 1-8-1.5" />
            <path d="M21.965 22.105v-4" />
          </motion.g>
        </motion.svg>
      </span>
    );
  },
);

WifiSyncIcon.displayName = 'WifiSyncIcon';

export { WifiSyncIcon };
