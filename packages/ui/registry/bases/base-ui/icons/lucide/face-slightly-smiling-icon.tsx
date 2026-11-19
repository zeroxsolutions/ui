'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FaceSlightlySmilingIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FaceSlightlySmilingIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const FaceSlightlySmilingIcon = forwardRef<FaceSlightlySmilingIconHandle, FaceSlightlySmilingIconProps>(
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
        if (!isControlledRef.current && !isMotionReduced) controls.start('animate');
        onMouseEnter?.(e);
      },
      [controls, isMotionReduced, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (!isControlledRef.current) controls.start('normal');
        onMouseLeave?.(e);
      },
      [controls, onMouseLeave],
    );

    const faceVariants: Variants = {
      normal: {
        scale: 1,
        rotate: 0,
        strokeWidth: 2,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      animate: {
        scale: [1, 1.15, 1.05, 1.1],
        rotate: [0, -3, 3, 0],
        strokeWidth: [2, 2.5, 2.5, 2.5],
        transition: {
          duration: 0.8,
          times: [0, 0.3, 0.6, 1],
          ease: 'easeInOut',
        },
      },
    };

    const mouthVariants: Variants = {
      normal: {
        d: 'M16.472 15a6 6 0 0 1-8.943 0',
        pathLength: 1,
        pathOffset: 0,
        strokeWidth: 2,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      animate: {
        d: 'M17.5 14.5a6 6 0 0 1-11 0',
        pathLength: [0.3, 1, 1],
        pathOffset: [0, 0, 0],
        strokeWidth: 2.5,
        transition: {
          d: { duration: 0.4, ease: 'easeOut' },
          pathLength: {
            duration: 0.5,
            times: [0, 0.5, 1],
            ease: 'easeInOut',
          },
          delay: 0.1,
        },
      },
    };

    const eyeVariants: Variants = {
      normal: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      animate: {
        scale: [1, 1.5, 0.8, 1.2],
        opacity: [1, 1, 1, 1],
        transition: {
          duration: 0.5,
          times: [0, 0.3, 0.6, 1],
          ease: 'easeInOut',
        },
      },
    };

    return (
      <span
        data-slot="face-slightly-smiling-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          initial="normal"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          variants={faceVariants}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" />
          <motion.path animate={controls} d="M16.472 15a6 6 0 01-8.943 0" initial="normal" variants={mouthVariants} />
          <motion.path animate={controls} d="M9 10V9" initial="normal" variants={eyeVariants} />
          <motion.path animate={controls} d="M15 10V9" initial="normal" variants={eyeVariants} />
        </motion.svg>
      </span>
    );
  },
);

FaceSlightlySmilingIcon.displayName = 'FaceSlightlySmilingIcon';

export { FaceSlightlySmilingIcon };
