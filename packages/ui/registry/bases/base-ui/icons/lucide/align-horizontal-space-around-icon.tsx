'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface AlignHorizontalSpaceAroundIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AlignHorizontalSpaceAroundIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 160,
  damping: 17,
  mass: 1,
};

const AlignHorizontalSpaceAroundIcon = forwardRef<
  AlignHorizontalSpaceAroundIconHandle,
  AlignHorizontalSpaceAroundIconProps
>(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
      data-slot="align-horizontal-space-around-icon"
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
          height="10"
          rx="2"
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { scaleX: 1 },
            animate: { scaleX: 0.85 },
          }}
          width="6"
          x="9"
          y="7"
        />
        <motion.path
          animate={controls}
          d="M4 22V2"
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { translateX: 0, scaleY: 1 },
            animate: {
              translateX: 2,
              scaleY: 0.9,
            },
          }}
        />
        <motion.path
          animate={controls}
          d="M20 22V2"
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { translateX: 0, scaleY: 1 },
            animate: {
              translateX: -2,
              scaleY: 0.9,
            },
          }}
        />
      </svg>
    </span>
  );
});

AlignHorizontalSpaceAroundIcon.displayName = 'AlignHorizontalSpaceAroundIcon';

export { AlignHorizontalSpaceAroundIcon };
