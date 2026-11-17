'use client';

// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ListTodoIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ListTodoIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const ListTodoIcon = forwardRef<ListTodoIconHandle, ListTodoIconProps>(
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
        data-slot="list-todo-icon"
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
            variants={{ normal: { x: 0 }, animate: { x: [0, 2, 0] } }}
            d="M13 5h8"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.04 }}
            variants={{ normal: { x: 0 }, animate: { x: [0, 2, 0] } }}
            d="M13 12h8"
          />
          <motion.path
            animate={controls}
            transition={{ ...DEFAULT_TRANSITION, delay: 0.08 }}
            variants={{ normal: { x: 0 }, animate: { x: [0, 2, 0] } }}
            d="M13 19h8"
          />
          <motion.path
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { pathLength: 1 }, animate: { pathLength: [1, 0, 1] } }}
            d="m3 17 2 2 4-4"
          />
          <motion.rect
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{ normal: { scale: 1 }, animate: { scale: [1, 0.85, 1] } }}
            x="3"
            y="4"
            width="6"
            height="6"
            rx="1"
          />
        </svg>
      </span>
    );
  },
);

ListTodoIcon.displayName = 'ListTodoIcon';

export { ListTodoIcon };
