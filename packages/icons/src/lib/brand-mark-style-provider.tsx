import * as React from 'react';

import { setBrandMarkStyle, type BrandMarkVariant } from './brand-mark-url';

interface BrandMarkStyleContextValue {
  /** The variant every `<BrandMark>` without its own resolves to. */
  style: BrandMarkVariant;
  /** Switch the ambient variant; every subscribed `<BrandMark>` re-renders. */
  setStyle: (style: BrandMarkVariant) => void;
}

const BrandMarkStyleContext = React.createContext<BrandMarkStyleContextValue | null>(null);

export interface BrandMarkStyleProviderProps {
  /** Uncontrolled initial variant, `'color'` when omitted. */
  defaultStyle?: BrandMarkVariant;
  /** Controlled variant. */
  style?: BrandMarkVariant;
  /** Told the newly chosen variant; the caller persists it. */
  onStyleChange?: (style: BrandMarkVariant) => void;
  children?: React.ReactNode;
}

/** Makes the brand-mark variant ambient for every `<BrandMark>` below that passes none. */
export function BrandMarkStyleProvider({
  defaultStyle = 'color',
  style: controlled,
  onStyleChange,
  children,
}: BrandMarkStyleProviderProps) {
  const [uncontrolled, setUncontrolled] = React.useState<BrandMarkVariant>(defaultStyle);
  const isControlled = controlled !== undefined;
  const style = isControlled ? controlled : uncontrolled;
  const setStyle = React.useCallback(
    (next: BrandMarkVariant) => {
      if (!isControlled) setUncontrolled(next);
      onStyleChange?.(next);
    },
    [isControlled, onStyleChange],
  );
  // Keeps brandMarkUrl() calls outside React resolving the same variant.
  React.useEffect(() => setBrandMarkStyle(style), [style]);
  const value = React.useMemo(() => ({ style, setStyle }), [style, setStyle]);
  return <BrandMarkStyleContext.Provider value={value}>{children}</BrandMarkStyleContext.Provider>;
}

/** Read and set the ambient variant. Throws outside a {@link BrandMarkStyleProvider}. */
export function useBrandMarkStyle(): BrandMarkStyleContextValue {
  const ctx = React.useContext(BrandMarkStyleContext);
  if (!ctx) throw new Error('useBrandMarkStyle must be used within <BrandMarkStyleProvider>');
  return ctx;
}

/** The ambient variant, or `undefined` with no provider mounted. */
export function useAmbientBrandMarkStyle(): BrandMarkVariant | undefined {
  return React.useContext(BrandMarkStyleContext)?.style;
}
