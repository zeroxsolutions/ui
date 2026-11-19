'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FileCogIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FileCogIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const G_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: 180 },
};

const FileCogIcon = forwardRef<FileCogIconHandle, FileCogIconProps>(
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
        data-slot="file-cog-icon"
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
          <path d="M15 8a1 1 0 0 1-1-1V2a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8z" />
          <path d="M20 8v12a2 2 0 0 1-2 2h-4.182" />
          <path d="M4 10.592V4a2 2 0 0 1 2-2h8" />
          <motion.g
            animate={controls}
            transition={{ type: 'spring', stiffness: 50, damping: 10 }}
            variants={G_VARIANTS}
          >
            <path d="m3.305 19.53.923-.382" />
            <path d="m4.228 16.852-.924-.383" />
            <path d="m5.852 15.228-.383-.923" />
            <path d="m5.852 20.772-.383.924" />
            <path d="m8.148 15.228.383-.923" />
            <path d="m8.53 21.696-.382-.924" />
            <path d="m9.773 16.852.922-.383" />
            <path d="m9.773 19.148.922.383" />
            <circle cx="7" cy="18" r="3" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

FileCogIcon.displayName = 'FileCogIcon';

export { FileCogIcon };
