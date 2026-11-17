'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface HardDriveDownloadIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HardDriveDownloadIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const ARROW_VARIANTS: Variants = {
  normal: { y: 0 },
  animate: {
    y: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 10,
      mass: 1,
    },
  },
};

const HardDriveDownloadIcon = forwardRef<HardDriveDownloadIconHandle, HardDriveDownloadIconProps>(
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
        data-slot="hard-drive-download-icon"
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
          <rect height="8" rx="2" width="20" x="2" y="14" />
          <path d="M6 18h.01" />
          <path d="M10 18h.01" />
          <motion.g animate={controls} variants={ARROW_VARIANTS}>
            <path d="M12 2v8" />
            <path d="m16 6-4 4-4-4" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

HardDriveDownloadIcon.displayName = 'HardDriveDownloadIcon';

export { HardDriveDownloadIcon };
