'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface MessageCircleDashedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface MessageCircleDashedIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const PATH_VARIANTS: Variants = {
  normal: { opacity: 1 },
  animate: (i: number) => ({
    opacity: [0, 1],
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

const MessageCircleDashedIcon = forwardRef<MessageCircleDashedIconHandle, MessageCircleDashedIconProps>(
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
        data-slot="message-circle-dashed-icon"
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
          {[
            'M10.1 2.182a10 10 0 0 1 3.8 0',
            'M17.609 3.72a10 10 0 0 1 2.69 2.7',
            'M21.818 10.1a10 10 0 0 1 0 3.8',
            'M20.28 17.61a10 10 0 0 1-2.7 2.69',
            'M13.9 21.818a10 10 0 0 1-3.8 0',
            'm6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98',
            'M2.182 13.9a10 10 0 0 1 0-3.8',
            'M3.721 6.391a10 10 0 0 1 2.7-2.69',
          ].map((d, index) => (
            <motion.path animate={controls} custom={index + 1} d={d} key={d} variants={PATH_VARIANTS} />
          ))}
        </svg>
      </span>
    );
  },
);

MessageCircleDashedIcon.displayName = 'MessageCircleDashedIcon';

export { MessageCircleDashedIcon };
