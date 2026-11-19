'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FaceNeutralIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FaceNeutralIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const FaceNeutralIcon = forwardRef<FaceNeutralIconHandle, FaceNeutralIconProps>(
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

    const faceVariants: Variants = {
      normal: {
        scale: 1,
        rotate: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      animate: {
        scale: [1, 1.05, 0.98, 1.02],
        rotate: [0, 1, -1, 0],
        transition: {
          duration: 0.7,
          times: [0, 0.4, 0.7, 1],
          ease: 'easeInOut',
        },
      },
    };

    const mouthVariants: Variants = {
      normal: {
        scaleX: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      animate: {
        scaleX: [1, 1.2, 0.9, 1.1],
        y: [0, 0.5, -0.5, 0],
        transition: {
          duration: 0.6,
          times: [0, 0.3, 0.6, 1],
          ease: 'easeInOut',
          delay: 0.1,
        },
      },
    };

    const leftEyeVariants: Variants = {
      normal: {
        scale: 1,
        x: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      animate: {
        scale: [1, 1.3, 1, 1.2],
        x: [0, -0.3, 0.3, 0],
        transition: {
          duration: 0.5,
          times: [0, 0.3, 0.6, 1],
          ease: 'easeInOut',
        },
      },
    };

    const rightEyeVariants: Variants = {
      normal: {
        scale: 1,
        x: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      animate: {
        scale: [1, 1.3, 1, 1.2],
        x: [0, 0.3, -0.3, 0],
        transition: {
          duration: 0.5,
          times: [0, 0.3, 0.6, 1],
          ease: 'easeInOut',
        },
      },
    };

    return (
      <span
        data-slot="face-neutral-icon"
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
          <motion.path animate={controls} initial="normal" variants={mouthVariants} d="M8 16h8" />
          <motion.path animate={controls} initial="normal" variants={leftEyeVariants} d="M9 10V9" />
          <motion.path animate={controls} initial="normal" variants={rightEyeVariants} d="M15 10V9" />
        </motion.svg>
      </span>
    );
  },
);

FaceNeutralIcon.displayName = 'FaceNeutralIcon';

export { FaceNeutralIcon };
