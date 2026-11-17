'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FaceSlightlySmilingPlusIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FaceSlightlySmilingPlusIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const FaceSlightlySmilingPlusIcon = forwardRef<FaceSlightlySmilingPlusIconHandle, FaceSlightlySmilingPlusIconProps>(
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
        if (isControlledRef.current) onMouseEnter?.(e);
        else if (!isMotionReduced) controls.start('animate');
      },
      [controls, isMotionReduced, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) onMouseLeave?.(e);
        else controls.start('normal');
      },
      [controls, onMouseLeave],
    );

    const faceVariants: Variants = {
      normal: { scale: 1 },
      animate: {
        scale: 1.1,
        transition: { type: 'spring', stiffness: 200, damping: 20 },
      },
    };

    const plusVariants: Variants = {
      normal: { rotate: 0, scale: 1 },
      animate: {
        rotate: 90,
        scale: 1.2,
        transition: { type: 'spring', stiffness: 200, damping: 20, delay: 0.1 },
      },
    };

    return (
      <span
        data-slot="face-slightly-smiling-plus-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          variants={faceVariants}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13.267 2.08a10 10 0 108.653 8.653" />
          <path d="M16.472 15a6 6 0 01-8.943 0" />
          <path d="M9 10V9" />
          <path d="M15 10V9" />
          <motion.path animate={controls} d="M16 5h6" variants={plusVariants} />
          <motion.path animate={controls} d="M19 2v6" variants={plusVariants} />
        </motion.svg>
      </span>
    );
  },
);

FaceSlightlySmilingPlusIcon.displayName = 'FaceSlightlySmilingPlusIcon';

export { FaceSlightlySmilingPlusIcon };
