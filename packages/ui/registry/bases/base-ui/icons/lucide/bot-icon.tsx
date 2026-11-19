'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface BotIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BotIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const BotIcon = forwardRef<BotIconHandle, BotIconProps>(
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
        data-slot="bot-icon"
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
          <path d="M12 8V4H8" />
          <rect height="12" rx="2" width="16" x="4" y="8" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />

          <motion.path
            animate={controls}
            initial="normal"
            variants={{
              normal: { d: 'M15 13v2' },
              animate: {
                d: ['M15 13v2', 'M15 14v0', 'M15 13v2'],
                transition: {
                  duration: 0.5,
                  ease: 'easeInOut',
                  delay: 0.2,
                },
              },
            }}
          />

          <motion.path
            animate={controls}
            initial="normal"
            variants={{
              normal: { d: 'M9 13v2' },
              animate: {
                d: ['M9 13v2', 'M9 14v0', 'M9 13v2'],
                transition: {
                  duration: 0.5,
                  ease: 'easeInOut',
                  delay: 0.2,
                },
              },
            }}
          />
        </svg>
      </span>
    );
  },
);

BotIcon.displayName = 'BotIcon';

export { BotIcon };
