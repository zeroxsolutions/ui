'use client';

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface WifiLowIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WifiLowIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

const WIFI_LEVELS = [{ d: 'M8.5 16.429a5 5 0 0 1 7 0', initialOpacity: 1, delay: 0.1 }];

const WifiLowIcon = forwardRef<WifiLowIconHandle, WifiLowIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const questionControls = useAnimation();
    const isMotionReduced = useReducedMotion();

    const isControlledRef = useRef(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleHide = useCallback(() => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        questionControls.start('hide');
      }, 1500);
    }, [questionControls]);

    const cancelHide = useCallback(() => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    }, []);

    useEffect(() => () => cancelHide(), [cancelHide]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          if (isMotionReduced) return;
          await controls.start('fadeOut');
          controls.start('fadeIn');
          questionControls.start('show');
          scheduleHide();
        },
        stopAnimation: () => {
          cancelHide();
          controls.start('fadeIn');
          questionControls.start('hide');
        },
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!isMotionReduced) {
          cancelHide();
          await controls.start('fadeOut');
          controls.start('fadeIn');
          questionControls.start('show');
          scheduleHide();
        }
      },
      [controls, isMotionReduced, questionControls, onMouseEnter, scheduleHide, cancelHide],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          cancelHide();
          controls.start('fadeIn');
          questionControls.start('hide');
        }
      },
      [controls, questionControls, onMouseLeave, cancelHide],
    );

    return (
      <span
        data-slot="wifi-low-icon"
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
          <path d="M12 20h.01" />
          {WIFI_LEVELS.map((level) => (
            <motion.path
              animate={controls}
              d={level.d}
              initial={{ opacity: level.initialOpacity }}
              key={level.d}
              variants={{
                fadeOut: {
                  opacity: 0,
                  transition: { duration: 0.2 },
                },
                fadeIn: {
                  opacity: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: level.delay,
                  },
                },
              }}
            />
          ))}
          <motion.text
            animate={questionControls}
            dominantBaseline="central"
            fill="currentColor"
            fontSize="8"
            fontWeight="bold"
            initial={{ opacity: 0, scale: 0 }}
            stroke="none"
            style={{ transformBox: 'view-box', originX: '12px', originY: '8px' }}
            textAnchor="middle"
            variants={{
              hide: {
                opacity: 0,
                scale: 0,
                transition: { duration: 0.15 },
              },
              show: {
                opacity: 1,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 400,
                  damping: 18,
                  delay: 0.1,
                },
              },
            }}
            x="12"
            y="8"
          >
            ?
          </motion.text>
        </svg>
      </span>
    );
  },
);

WifiLowIcon.displayName = 'WifiLowIcon';

export { WifiLowIcon };
