'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Transition, Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface TicketIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface TicketIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const TRANSITION: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
};

// Left half + perforation dashes slide left together (the tear line follows).
const LEFT_VARIANTS: Variants = {
  normal: { x: 0 },
  animate: { x: -3 },
};

// Right half slides right and tilts clockwise, as if coming away.
const RIGHT_VARIANTS: Variants = {
  normal: { x: 0, rotate: 0 },
  animate: { x: 3, rotate: 4 },
};

const TicketIcon = forwardRef<TicketIconHandle, TicketIconProps>(
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
        data-slot="ticket-icon"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          className="overflow-visible"
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
          <motion.g animate={controls} initial="normal" transition={TRANSITION} variants={LEFT_VARIANTS}>
            <path d="M13 5H4a2 2 0 0 0-2 2v2a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h9" />
            <path d="M13 5v2" />
            <path d="M13 11v2" />
            <path d="M13 17v2" />
          </motion.g>
          <motion.path
            animate={controls}
            d="M13 5h7a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2h-7"
            initial="normal"
            style={{ transformBox: 'view-box', originX: '13px', originY: '12px' }}
            transition={TRANSITION}
            variants={RIGHT_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

TicketIcon.displayName = 'TicketIcon';

export { TicketIcon };
