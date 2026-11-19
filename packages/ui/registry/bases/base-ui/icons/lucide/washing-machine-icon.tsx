'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface WashingMachineIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WashingMachineIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const WashingMachineIcon = forwardRef<WashingMachineIconHandle, WashingMachineIconProps>(
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
        data-slot="washing-machine-icon"
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
          <motion.g
            animate={controls}
            variants={{
              normal: {
                x: 0,
              },
              animate: {
                x: [0, 0.5, -0.5, 0.3, -0.3, 0],
                transition: {
                  duration: 0.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                },
              },
            }}
          >
            <path d="M3 6h3" />
            <path d="M17 6h.01" />
            <rect height="20" rx="2" width="18" x="3" y="2" />
          </motion.g>
          <motion.g
            animate={controls}
            variants={{
              normal: {
                rotate: 0,
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: 'linear',
                },
              },
              animate: {
                rotate: 360,
                y: [0, -0.3, 0, 0.3, 0],
                transition: {
                  rotate: {
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  },
                  y: {
                    duration: 0.3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  },
                },
              },
            }}
          >
            <circle cx="12" cy="13" r="5" />
            <path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

WashingMachineIcon.displayName = 'WashingMachineIcon';

export { WashingMachineIcon };
