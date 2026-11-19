'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ScanFaceIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ScanFaceIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const ScanFaceIcon = forwardRef<ScanFaceIconHandle, ScanFaceIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isMotionReduced = useReducedMotion();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          if (isMotionReduced) return;
          await controls.start('hidden');
          await controls.start('visible');
        },
        stopAnimation: () => controls.start('visible'),
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          await controls.start('hidden');
          await controls.start('visible');
        }
      },
      [controls, isMotionReduced, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start('visible');
        }
      },
      [controls, onMouseLeave],
    );

    const faceVariants: Variants = {
      visible: { scale: 1 },
      hidden: {
        scale: 0.9,
        transition: { type: 'spring', stiffness: 200, damping: 20 },
      },
    };

    const cornerVariants: Variants = {
      visible: { scale: 1, rotate: 0, opacity: 1 },
      hidden: {
        scale: 1.2,
        rotate: 45,
        opacity: 0,
        transition: { type: 'spring', stiffness: 200, damping: 20 },
      },
    };

    const mouthVariants: Variants = {
      visible: { scale: 1, opacity: 1 },
      hidden: {
        scale: 0.8,
        opacity: 0,
        transition: { duration: 0.3, delay: 0.1 },
      },
    };

    return (
      <span
        data-slot="scan-face-icon"
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
          <motion.path animate={controls} d="M3 7V5a2 2 0 0 1 2-2h2" initial="visible" variants={cornerVariants} />
          <motion.path animate={controls} d="M17 3h2a2 2 0 0 1 2 2v2" initial="visible" variants={cornerVariants} />
          <motion.path animate={controls} d="M21 17v2a2 2 0 0 1-2 2h-2" initial="visible" variants={cornerVariants} />
          <motion.path animate={controls} d="M7 21H5a2 2 0 0 1-2-2v-2" initial="visible" variants={cornerVariants} />
          <motion.path animate={controls} d="M8 14s1.5 2 4 2 4-2 4-2" initial="visible" variants={mouthVariants} />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
        </motion.svg>
      </span>
    );
  },
);

ScanFaceIcon.displayName = 'ScanFaceIcon';

export { ScanFaceIcon };
