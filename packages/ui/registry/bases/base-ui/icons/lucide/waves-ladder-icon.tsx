'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface WavesLadderIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WavesLadderIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const WavesLadderIcon = forwardRef<WavesLadderIconHandle, WavesLadderIconProps>(
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
        data-slot="waves-ladder-icon"
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
          <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <motion.g
            animate={controls}
            initial={{ y: 0, opacity: 1 }}
            variants={{
              normal: { y: 0, opacity: 1 },
              animate: {
                y: [13, 0],
                opacity: [0, 0, 1],
                transition: { duration: 1, times: [0, 0.5, 1], repeat: 0 },
              },
            }}
          >
            <path d="M19 5a2 2 0 0 0-2 2v11" />
            <path d="M7 13h10" />
            <path d="M7 9h10" />
            <path d="M9 5a2 2 0 0 0-2 2v11" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

WavesLadderIcon.displayName = 'WavesLadderIcon';

export { WavesLadderIcon };
