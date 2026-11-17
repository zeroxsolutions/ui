'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion, type Variants } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface UsersRoundIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface UsersRoundIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const PATH_VARIANTS: Variants = {
  normal: {
    translateX: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 13,
    },
  },
  animate: {
    translateX: [-4, 0],
    opacity: [0, 1],
    transition: {
      delay: 0.1,
      type: 'spring',
      stiffness: 200,
      damping: 13,
    },
  },
};

const UsersRoundIcon = forwardRef<UsersRoundIconHandle, UsersRoundIconProps>(
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
        data-slot="users-round-icon"
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
          <path d="M18 21a8 8 0 0 0-16 0" />
          <circle cx="10" cy="8" r="5" />
          <motion.path
            animate={controls}
            d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"
            initial="normal"
            variants={PATH_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

UsersRoundIcon.displayName = 'UsersRoundIcon';

export { UsersRoundIcon };
