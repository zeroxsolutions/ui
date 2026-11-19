'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface VolumeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface VolumeIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const WAVE_VARIANTS: Variants = {
  normal: { opacity: 0, transition: { duration: 0.2 } },
  animate: (index: number) => ({ opacity: 1, transition: { delay: 0.1 * (index + 1) } }),
};

const VolumeIcon = forwardRef<VolumeIconHandle, VolumeIconProps>(
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
        data-slot="volume-icon"
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
          <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
          {/* The waves are not part of Lucide's volume glyph, so they rest hidden and come in on the play. */}
          <motion.path
            animate={controls}
            custom={0}
            d="M16 9a5 5 0 0 1 0 6"
            initial="normal"
            variants={WAVE_VARIANTS}
          />
          <motion.path
            animate={controls}
            custom={1}
            d="M19.364 18.364a9 9 0 0 0 0-12.728"
            initial="normal"
            variants={WAVE_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

VolumeIcon.displayName = 'VolumeIcon';

export { VolumeIcon };
