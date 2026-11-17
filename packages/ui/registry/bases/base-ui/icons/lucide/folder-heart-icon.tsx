'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes, MouseEvent } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FolderHeartIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FolderHeartIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const HEART_VARIANTS: Variants = {
  normal: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.12, 1.04, 1.12, 1],
    opacity: [1, 1, 0.85, 1, 1],
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
      repeat: Number.POSITIVE_INFINITY,
    },
  },
};

const FolderHeartIcon = forwardRef<FolderHeartIconHandle, FolderHeartIconProps>(
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
        data-slot="folder-heart-icon"
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
          <path d="M10.638 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v3.417" />
          <motion.path
            animate={controls}
            d="M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"
            initial="normal"
            style={{ transformBox: 'view-box', originX: '18px', originY: '18px' }}
            variants={HEART_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

FolderHeartIcon.displayName = 'FolderHeartIcon';

export { FolderHeartIcon };
