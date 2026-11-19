'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition, Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FolderSyncIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FolderSyncIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const SYNC_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: -360 },
};

const SYNC_TRANSITION: Transition = {
  duration: 1.2,
  ease: 'easeInOut',
};

const FolderSyncIcon = forwardRef<FolderSyncIconHandle, FolderSyncIconProps>(
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
        data-slot="folder-sync-icon"
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
          <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5" />
          <motion.g animate={controls} initial="normal" transition={SYNC_TRANSITION} variants={SYNC_VARIANTS}>
            <path d="M12 10v4h4" />
            <path d="m12 14 1.535-1.605a5 5 0 0 1 8 1.5" />
            <path d="M22 22v-4h-4" />
            <path d="m22 18-1.535 1.605a5 5 0 0 1-8-1.5" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

FolderSyncIcon.displayName = 'FolderSyncIcon';

export { FolderSyncIcon };
