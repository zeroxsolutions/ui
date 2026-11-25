'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface WorkflowIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WorkflowIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const WorkflowIcon = forwardRef<WorkflowIconHandle, WorkflowIconProps>(
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
        data-slot="workflow-icon"
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
          <motion.rect
            animate={controls}
            initial="normal"
            transition={{ duration: 0.3, delay: 0, opacity: { duration: 0.3, delay: 0.05 } }}
            variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1] } }}
            width="8"
            height="8"
            x="3"
            y="3"
            rx="2"
          />
          <motion.path
            animate={controls}
            initial="normal"
            transition={{ duration: 0.3, delay: 0.18, opacity: { duration: 0.3, delay: 0.23 } }}
            variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1] } }}
            d="M7 11v4a2 2 0 0 0 2 2h4"
          />
          <motion.rect
            animate={controls}
            initial="normal"
            transition={{ duration: 0.3, delay: 0.06, opacity: { duration: 0.3, delay: 0.11 } }}
            variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1] } }}
            width="8"
            height="8"
            x="13"
            y="13"
            rx="2"
          />
        </svg>
      </span>
    );
  },
);

WorkflowIcon.displayName = 'WorkflowIcon';

export { WorkflowIcon };
