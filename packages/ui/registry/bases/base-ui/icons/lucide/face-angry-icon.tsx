'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface FaceAngryIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FaceAngryIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const EYEBROW_ROTATION = 20;
const DURATION = 0.6;

const PATH_VARIANTS_FACE: Variants = {
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.2, 1.2, 1.2, 1],
    rotate: [0, -3, 3, -1, 1, 0],
    transition: {
      duration: DURATION,
      times: [0, 0.2, 0.4, 0.6, 1],
      ease: 'easeInOut',
    },
  },
};

const PATH_VARIANTS_LEFT_EYEBROW: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, EYEBROW_ROTATION, 0],
    transition: {
      duration: DURATION + 0.2,
    },
  },
};

const PATH_VARIANTS_RIGHT_EYEBROW: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -EYEBROW_ROTATION, 0],
    transition: {
      duration: DURATION + 0.2,
    },
  },
};

const PATH_VARIANTS_EYE: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: DURATION,
    },
  },
};

const PATH_VARIANTS_MOUTH: Variants = {
  normal: { translateY: 0 },
  animate: {
    translateY: [0, -0.5, 0],
    transition: {
      duration: DURATION,
    },
  },
};

const FaceAngryIcon = forwardRef<FaceAngryIconHandle, FaceAngryIconProps>(
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
        data-slot="face-angry-icon"
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
          variants={PATH_VARIANTS_FACE}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" />
          <motion.path animate={controls} d="M9 17a5 5 0 016.001 0" variants={PATH_VARIANTS_MOUTH} />
          <motion.path animate={controls} d="M7 10a5 5 0 013 1" variants={PATH_VARIANTS_LEFT_EYEBROW} />
          <motion.path animate={controls} d="M17 10a5 5 0 00-3 1" variants={PATH_VARIANTS_RIGHT_EYEBROW} />
          <motion.path animate={controls} d="M9 12v-1.584" variants={PATH_VARIANTS_EYE} />
          <motion.path animate={controls} d="M15 12v-1.584" variants={PATH_VARIANTS_EYE} />
        </motion.svg>
      </span>
    );
  },
);

FaceAngryIcon.displayName = 'FaceAngryIcon';

export { FaceAngryIcon };
