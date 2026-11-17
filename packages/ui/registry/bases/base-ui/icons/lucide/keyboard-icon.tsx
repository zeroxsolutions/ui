'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface KeyboardIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface KeyboardIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const KEYBOARD_PATHS = [
  { id: 'key1', d: 'M10 8h.01' },
  { id: 'key2', d: 'M12 12h.01' },
  { id: 'key3', d: 'M14 8h.01' },
  { id: 'key4', d: 'M16 12h.01' },
  { id: 'key5', d: 'M18 8h.01' },
  { id: 'key6', d: 'M6 8h.01' },
  { id: 'key7', d: 'M7 16h10' },
  { id: 'key8', d: 'M8 12h.01' },
];

const KEY_VARIANTS: Variants = {
  normal: { opacity: 1 },
  animate: (index: number) => ({
    opacity: [1, 0.2, 1],
    transition: {
      duration: 1.5,
      times: [0, 0.5, 1],
      delay: index * 0.2 * Math.random(),
      repeat: 1,
      repeatType: 'reverse',
    },
  }),
};

const KeyboardIcon = forwardRef<KeyboardIconHandle, KeyboardIconProps>(
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
        data-slot="keyboard-icon"
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
          <rect height="16" rx="2" width="20" x="2" y="4" />
          {KEYBOARD_PATHS.map((path, index) => (
            <motion.path animate={controls} custom={index} d={path.d} key={path.id} variants={KEY_VARIANTS} />
          ))}
        </svg>
      </span>
    );
  },
);

KeyboardIcon.displayName = 'KeyboardIcon';

export { KeyboardIcon };
