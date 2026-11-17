'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface MailboxIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface MailboxIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const FLAG_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 18,
    },
  },
  animate: {
    rotate: -90,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 12,
      mass: 1,
    },
  },
};

const MailboxIcon = forwardRef<MailboxIconHandle, MailboxIconProps>(
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
        data-slot="mailbox-icon"
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
          <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
          <motion.polyline
            animate={controls}
            initial="normal"
            points="15,9 18,9 18,11"
            style={{ transformBox: 'view-box', originX: '18px', originY: '11px' }}
            variants={FLAG_VARIANTS}
          />
          <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2" />
          <line x1="6" x2="7" y1="10" y2="10" />
        </svg>
      </span>
    );
  },
);

MailboxIcon.displayName = 'MailboxIcon';

export { MailboxIcon };
