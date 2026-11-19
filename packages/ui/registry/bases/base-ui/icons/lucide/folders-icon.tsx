'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FoldersIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FoldersIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const FoldersIcon = forwardRef<FoldersIconHandle, FoldersIconProps>(
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
        data-slot="folders-icon"
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
          <motion.path
            animate={controls}
            d="M20 5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2.5a1.5 1.5 0 0 1 1.2.6l.6.8a1.5 1.5 0 0 0 1.2.6z"
            transition={{
              type: 'spring',
              stiffness: 250,
              damping: 25,
            }}
            variants={{
              normal: {
                translateX: 0,
                translateY: 0,
              },
              animate: {
                translateX: -2,
                translateY: 2,
              },
            }}
          />
          <motion.path
            animate={controls}
            d="M3 8.268a2 2 0 0 0-1 1.738V19a2 2 0 0 0 2 2h11a2 2 0 0 0 1.732-1"
            transition={{
              type: 'spring',
              stiffness: 250,
              damping: 25,
            }}
            variants={{
              normal: {
                translateX: 0,
                translateY: 0,
                opacity: 1,
                scale: 1,
              },
              animate: {
                translateX: 2,
                translateY: -2,
                opacity: 0,
                scale: 0.9,
              },
            }}
          />
        </svg>
      </span>
    );
  },
);

FoldersIcon.displayName = 'FoldersIcon';

export { FoldersIcon };
