'use client';

// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ListIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ListIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const ListIcon = forwardRef<ListIconHandle, ListIconProps>(
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
        data-slot="list-icon"
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
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { opacity: 1 }, animate: { opacity: [1, 0, 1] } }}
            d="M3 5h.01"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.04 }}
            variants={{ normal: { opacity: 1 }, animate: { opacity: [1, 0, 1] } }}
            d="M3 12h.01"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.08 }}
            variants={{ normal: { opacity: 1 }, animate: { opacity: [1, 0, 1] } }}
            d="M3 19h.01"
          />
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { scaleX: 1 }, animate: { scaleX: [1, 0.7, 1] } }}
            style={{ originX: 0, originY: 0.5 }}
            d="M8 5h13"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.04 }}
            variants={{ normal: { scaleX: 1 }, animate: { scaleX: [1, 0.7, 1] } }}
            style={{ originX: 0, originY: 0.5 }}
            d="M8 12h13"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.08 }}
            variants={{ normal: { scaleX: 1 }, animate: { scaleX: [1, 0.7, 1] } }}
            style={{ originX: 0, originY: 0.5 }}
            d="M8 19h13"
          />
        </svg>
      </span>
    );
  },
);

ListIcon.displayName = 'ListIcon';

export { ListIcon };
