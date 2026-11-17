'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface WifiIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WifiIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const WIFI_LEVELS = [
  { d: 'M8.5 16.429a5 5 0 0 1 7 0', initialOpacity: 1, delay: 0.1 },
  { d: 'M5 12.859a10 10 0 0 1 14 0', initialOpacity: 1, delay: 0.2 },
  { d: 'M2 8.82a15 15 0 0 1 20 0', initialOpacity: 1, delay: 0.3 },
];

const WifiIcon = forwardRef<WifiIconHandle, WifiIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();

    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          if (isMotionReduced) return;
          await controls.start('fadeOut');
          controls.start('fadeIn');
        },
        stopAnimation: () => controls.start('fadeIn'),
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await controls.start('fadeOut');
          controls.start('fadeIn');
        }
      },
      [controls, isMotionReduced, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start('fadeIn');
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <span
        data-slot="wifi-icon"
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
          <path d="M12 20h.01" />
          {WIFI_LEVELS.map((level) => (
            <motion.path
              animate={controls}
              d={level.d}
              initial={{ opacity: level.initialOpacity }}
              key={level.d}
              variants={{
                fadeOut: {
                  opacity: 0,
                  transition: { duration: 0.2 },
                },
                fadeIn: {
                  opacity: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: level.delay,
                  },
                },
              }}
            />
          ))}
        </svg>
      </span>
    );
  },
);

WifiIcon.displayName = 'WifiIcon';

export { WifiIcon };
