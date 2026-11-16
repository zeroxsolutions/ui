'use client';

// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ListOrderedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ListOrderedIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const ListOrderedIcon = forwardRef<ListOrderedIconHandle, ListOrderedIconProps>(
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
        data-slot="list-ordered-icon"
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
            variants={{ normal: { x: 0 }, animate: { x: [0, 2.5, 0] } }}
            d="M11 5h10"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.04 }}
            variants={{ normal: { x: 0 }, animate: { x: [0, 2.5, 0] } }}
            d="M11 12h10"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.08 }}
            variants={{ normal: { x: 0 }, animate: { x: [0, 2.5, 0] } }}
            d="M11 19h10"
          />
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { y: 0 }, animate: { y: [0, -1.5, 0] } }}
            d="M4 4h1v5"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.04 }}
            variants={{ normal: { y: 0 }, animate: { y: [0, -1.5, 0] } }}
            d="M4 9h2"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.08 }}
            variants={{ normal: { y: 0 }, animate: { y: [0, -1.5, 0] } }}
            d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"
          />
        </svg>
      </span>
    );
  },
);

ListOrderedIcon.displayName = 'ListOrderedIcon';

export { ListOrderedIcon };
