'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface CloudCogIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CloudCogIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const G_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: 180 },
};

const CloudCogIcon = forwardRef<CloudCogIconHandle, CloudCogIconProps>(
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
        data-slot="cloud-cog-icon"
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
          <path d="M4.2 15.1a7 7 0 1 1 9.93-9.858A7 7 0 0 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.2" />
          <motion.g
            animate={controls}
            transition={{ type: 'spring', stiffness: 50, damping: 10 }}
            variants={G_VARIANTS}
          >
            <path d="m10.852 19.772-.383.924" />
            <path d="m13.148 14.228.383-.923" />
            <path d="M13.148 19.772a3 3 0 1 0-2.296-5.544l-.383-.923" />
            <path d="m13.53 20.696-.382-.924a3 3 0 1 1-2.296-5.544" />
            <path d="m14.772 15.852.923-.383" />
            <path d="m14.772 18.148.923.383" />
            <path d="m9.228 15.852-.923-.383" />
            <path d="m9.228 18.148-.923.383" />
          </motion.g>
        </svg>
      </span>
    );
  },
);

CloudCogIcon.displayName = 'CloudCogIcon';

export { CloudCogIcon };
