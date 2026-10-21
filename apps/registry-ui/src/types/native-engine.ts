import type { NATIVE_ENGINES } from '@/constants/native-engines';

/** A styling engine a native item is published for, as its path segment. */
export type NativeEngine = (typeof NATIVE_ENGINES)[number];
