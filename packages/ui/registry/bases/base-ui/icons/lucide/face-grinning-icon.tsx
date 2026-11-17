'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FaceGrinningIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FaceGrinningIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const FaceGrinningIcon = forwardRef<FaceGrinningIconHandle, FaceGrinningIconProps>(
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
        scale: [1, 1.15, 1, 1.1, 1.05],
        rotate: [0, 3, -2, 3, 0],
        strokeWidth: [2, 2.5, 2.5, 2.5, 2],
        transition: {
          duration: 1.2,
          times: [0, 0.2, 0.4, 0.6, 1],
          ease: 'easeInOut',
          repeat: 0,
          repeatType: 'reverse',
        },
      },
    };

    const mouthVariants: Variants = {
      normal: {
        d: 'M7.084 14.302a5.12 5.12 0 0 0 9.833 0 .24 .24 0 0 0-.235-.302H7.32a.24 .24 0 0 0-.235.302',
        pathLength: 1,
        strokeWidth: 2,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      animate: {
        d: 'M7.084 14.302a5.12 5.12 0 0 0 9.833 0 .24 .24 0 0 0-.235-.302H7.32a.24 .24 0 0 0-.235.302',
        pathLength: [0.7, 1, 1],
        strokeWidth: 2.5,
        scaleY: [1, 1.2, 1.1],
        y: [0, 0.5, 0.3],
        transition: {
          duration: 0.6,
          times: [0, 0.5, 1],
          ease: 'easeInOut',
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
        scale: [1, 1.3, 1, 1.7],
        opacity: [1, 1, 1, 1],
        transition: {
          duration: 0.6,
          times: [0, 0.3, 0.6, 1],
          ease: 'easeInOut',
        },
      },
    };

    return (
      <span
        data-slot="face-grinning-icon"
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
          <motion.path animate={controls} initial="normal" variants={mouthVariants} />
          <motion.path animate={controls} initial="normal" variants={eyeVariants} d="M9 10V9" />
          <motion.path animate={controls} initial="normal" variants={eyeVariants} d="M15 10V9" />
        </motion.svg>
      </span>
    );
  },
);

FaceGrinningIcon.displayName = 'FaceGrinningIcon';

export { FaceGrinningIcon };
