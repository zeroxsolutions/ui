'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion, type Variants } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ReceiptTextIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ReceiptTextIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const LINES_CONTAINER_VARIANTS: Variants = {
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0 },
  },
  hidden: {
    transition: { staggerChildren: 0.06, staggerDirection: -1 },
  },
};

const LINE_VARIANTS: Variants = {
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.35, ease: 'linear' },
  },
  hidden: {
    pathLength: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: 'linear' },
  },
};

const ReceiptTextIcon = forwardRef<ReceiptTextIconHandle, ReceiptTextIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    const replayLines = useCallback(async () => {
      await controls.start('hidden');
      await controls.start('visible');
    }, [controls]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => {
          if (!isMotionReduced) replayLines();
        },
        stopAnimation: () => controls.start('visible'),
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await replayLines();
        }
      },
      [onMouseEnter, isMotionReduced, replayLines],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start('visible');
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <span
        data-slot="receipt-text-icon"
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
          <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
          <motion.g animate={controls} initial="visible" variants={LINES_CONTAINER_VARIANTS}>
            <motion.path d="M8 8H14" variants={LINE_VARIANTS} />
            <motion.path d="M8 12H16" variants={LINE_VARIANTS} />
            <motion.path d="M8 16H13" variants={LINE_VARIANTS} />
          </motion.g>
        </motion.svg>
      </span>
    );
  },
);

ReceiptTextIcon.displayName = 'ReceiptTextIcon';

export { ReceiptTextIcon };
