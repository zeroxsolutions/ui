'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ConciergeBellIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ConciergeBellIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const STEM_VARIANTS: Variants = {
  normal: { y: 0 },
  animate: {
    y: 2,
    transition: { duration: 0.1 },
  },
};

const BELL_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -2, 2, -2, 2, -1, 1, 0],
    transition: {
      delay: 0.1,
      duration: 0.28,
      ease: 'easeInOut',
    },
  },
};

const SOUND_WAVES_VARIANTS: Variants = {
  normal: { opacity: 0, scale: 1 },
  animate: {
    opacity: [0, 1, 0],
    scale: [0.8, 1, 1.3],
    transition: {
      delay: 0.13,
      duration: 0.7,
      ease: 'easeOut',
      times: [0, 0.2, 1],
    },
  },
};

const ConciergeBellIcon = forwardRef<ConciergeBellIconHandle, ConciergeBellIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    const triggerEffect = useCallback(() => {
      if (isMotionReduced) return;
      controls.start('animate').then(() => {
        controls.start('normal');
      });
    }, [controls, isMotionReduced]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: triggerEffect,
        stopAnimation: () => controls.start('normal'),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          triggerEffect();
        }
      },
      [triggerEffect, onMouseEnter],
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
        data-slot="concierge-bell-icon"
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
          style={{ overflow: 'visible' }}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z" />

          <motion.g
            animate={controls}
            initial="normal"
            style={{ originX: '50%', originY: '100%' }}
            variants={BELL_VARIANTS}
          >
            <path d="M20 16a8 8 0 1 0-16 0" />

            <motion.g variants={STEM_VARIANTS}>
              <path d="M10 4h4" />
              <path d="M12 4v4" />
            </motion.g>
          </motion.g>

          <motion.g
            animate={controls}
            initial="normal"
            style={{ transformBox: 'view-box', originX: '14px', originY: '18px' }}
            variants={SOUND_WAVES_VARIANTS}
          >
            <path d="M2 13a7 7 0 0 1 1-3.5" opacity="0.7" strokeWidth="1.5" />
            <path d="M21 13a7 7 0 0 0-1-3.5" opacity="0.7" strokeWidth="1.5" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

ConciergeBellIcon.displayName = 'ConciergeBellIcon';

export { ConciergeBellIcon };
