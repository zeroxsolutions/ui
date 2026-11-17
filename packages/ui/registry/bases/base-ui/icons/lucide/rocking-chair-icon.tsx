'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface RockingChairIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface RockingChairIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const ROCKING_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [-5, 5, -5],
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'mirror' as const,
      duration: 1.2,
      ease: 'easeInOut',
    },
  },
};

const RockingChairIcon = forwardRef<RockingChairIconHandle, RockingChairIconProps>(
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
        data-slot="rocking-chair-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          style={{ originX: '10%', originY: '90%' }}
          variants={ROCKING_VARIANTS}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m3 2 3.21 9.633A2 2 0 0 0 8.109 13H18" />
          <path d="m9 13-3.708 7.416" />
          <path d="m15 13 3.708 7.416" />
          <path d="M3 19a15 15 0 0 0 18 0" />
        </motion.svg>
      </span>
    );
  },
);

RockingChairIcon.displayName = 'RockingChairIcon';

export { RockingChairIcon };
