'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes, MouseEvent } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FolderKeyIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FolderKeyIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const KEY_VARIANTS: Variants = {
  normal: { rotate: 0, x: 0 },
  animate: {
    rotate: [0, -15, 8, -5, 0],
    x: [0, 0.5, 0],
    transition: {
      duration: 0.9,
      ease: 'easeInOut',
      repeat: Number.POSITIVE_INFINITY,
    },
  },
};

const FolderKeyIcon = forwardRef<FolderKeyIconHandle, FolderKeyIconProps>(
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
      (event: MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(event);
        } else if (!isMotionReduced) {
          controls.start('animate');
        }
      },
      [controls, isMotionReduced, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (event: MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(event);
        } else {
          controls.start('normal');
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <span
        data-slot="folder-key-icon"
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
          <path d="M13 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v1.36" />
          <motion.g
            animate={controls}
            initial="normal"
            style={{ transformBox: 'view-box', originX: '19px', originY: '18px' }}
            variants={KEY_VARIANTS}
          >
            <path d="M19 12v6" />
            <path d="M19 14h2" />
            <circle cx="19" cy="20" r="2" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

FolderKeyIcon.displayName = 'FolderKeyIcon';

export { FolderKeyIcon };
