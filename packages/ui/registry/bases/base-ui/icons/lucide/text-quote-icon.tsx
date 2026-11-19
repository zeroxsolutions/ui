'use client';

// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface TextQuoteIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface TextQuoteIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const TextQuoteIcon = forwardRef<TextQuoteIconHandle, TextQuoteIconProps>(
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
        data-slot="text-quote-icon"
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
            variants={{ normal: { scaleX: 1 }, animate: { scaleX: [1, 0.7, 1] } }}
            style={{ originX: 0, originY: 0.5 }}
            d="M17 5H3"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.04 }}
            variants={{ normal: { x: 0 }, animate: { x: [0, 2.5, 0] } }}
            d="M21 12H8"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.08 }}
            variants={{ normal: { x: 0 }, animate: { x: [0, 2.5, 0] } }}
            d="M21 19H8"
          />
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { scaleY: 1 }, animate: { scaleY: [1, 0.6, 1] } }}
            style={{ originX: 0.5, originY: 0 }}
            d="M3 12v7"
          />
        </svg>
      </span>
    );
  },
);

TextQuoteIcon.displayName = 'TextQuoteIcon';

export { TextQuoteIcon };
