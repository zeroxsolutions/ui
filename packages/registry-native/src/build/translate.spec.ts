import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSlotMap } from './slot-map';
import { translateClasses } from './translate';

const SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/style-vega.css');
const BUTTON_SLOT = /^cn-button(-variant-[\w-]+|-size-[\w-]+)?$/;

describe('translateClasses', () => {
  it('drops hover and focus-visible with their modifier and keeps the base', () => {
    const result = translateClasses(['bg-primary', 'hover:bg-primary/80', 'focus-visible:ring-3'], 'uniwind', 'view');

    expect(result).toEqual({ classes: ['bg-primary'], unknown: [] });
  });

  it('drops a class behind a modifier chain when any modifier is dropped', () => {
    const slot = ['dark:hover:aria-invalid:border-destructive/50'];

    expect(translateClasses(slot, 'nativewind', 'view')).toEqual({ classes: [], unknown: [] });
    expect(translateClasses(slot, 'nativewind', 'view', 'invalid')).toEqual({ classes: [], unknown: [] });
  });

  it.each(['nativewind', 'uniwind'] as const)(
    'keeps the pressed nudge behind not-aria-[haspopup], which always holds on a Pressable, for %s',
    (engine) => {
      const result = translateClasses(['active:not-aria-[haspopup]:translate-y-px'], engine, 'view');

      expect(result).toEqual({ classes: ['active:translate-y-px'], unknown: [] });
    },
  );

  it('keeps active, disabled and dark', () => {
    const result = translateClasses(['active:bg-muted', 'disabled:opacity-50', 'dark:bg-input/30'], 'uniwind', 'view');

    expect(result.classes).toEqual(['active:bg-muted', 'disabled:opacity-50', 'dark:bg-input/30']);
  });

  it('renames shadow-xs to shadow-sm for nativewind and keeps it for uniwind', () => {
    expect(translateClasses(['shadow-xs'], 'nativewind', 'view').classes).toEqual(['shadow-sm']);
    expect(translateClasses(['shadow-xs'], 'uniwind', 'view').classes).toEqual(['shadow-xs']);
  });

  it.each([
    ['rounded-xs', 'rounded-[0.125rem]'],
    ['drop-shadow-xs', 'drop-shadow-sm'],
  ])('renames %s to its exact Tailwind 3 equal %s for nativewind and keeps it for uniwind', (cls, renamed) => {
    expect(translateClasses([cls], 'nativewind', 'view')).toEqual({ classes: [renamed], unknown: [] });
    expect(translateClasses([cls], 'uniwind', 'view')).toEqual({ classes: [cls], unknown: [] });
  });

  it.each([
    'shadow-2xs',
    'inset-shadow-sm',
    'inset-ring-2',
    'bg-linear-to-r',
    'field-sizing-content',
    'text-shadow-sm',
  ])('reports %s, which Tailwind 3 has no equal of, as unknown for nativewind and keeps it for uniwind', (cls) => {
    for (const part of ['view', 'text'] as const) {
      expect(translateClasses([cls], 'nativewind', part).unknown).toEqual([cls]);
    }
    expect(translateClasses([cls], 'uniwind', 'view').unknown).toEqual([]);
    expect(translateClasses([cls], 'uniwind', 'text').unknown).toEqual([]);
    expect([
      ...translateClasses([cls], 'uniwind', 'view').classes,
      ...translateClasses([cls], 'uniwind', 'text').classes,
    ]).toEqual([cls]);
  });

  it.each(['nativewind', 'uniwind'] as const)(
    'reports the important suffix of rounded-r-md! as unknown for %s',
    (engine) => {
      expect(translateClasses(['rounded-r-md!'], engine, 'view')).toEqual({ classes: [], unknown: ['rounded-r-md!'] });
    },
  );

  it('renames a Tailwind 4 scale step under a kept modifier for nativewind', () => {
    const result = translateClasses(['dark:shadow-xs'], 'nativewind', 'view');

    expect(result.classes).toEqual(['dark:shadow-sm']);
  });

  it.each(['rounded-sm', 'rounded-md', 'rounded-4xl', 'dark:rounded-sm'])(
    "keeps %s for nativewind, whose step the theme's radius scale defines as Vega's",
    (cls) => {
      expect(translateClasses([cls], 'nativewind', 'view')).toEqual({ classes: [cls], unknown: [] });
    },
  );

  it.each(['nativewind', 'uniwind'] as const)(
    'sends the size Vega gives an svg with no size class to the icon part only, for %s',
    (engine) => {
      const slot = ["[&_svg:not([class*='size-'])]:size-4", 'text-sm', 'p-2'];

      expect(translateClasses(slot, engine, 'icon')).toEqual({ classes: ['size-4'], unknown: [] });
      expect(translateClasses(slot, engine, 'text').classes).toEqual(['text-sm']);
      expect(translateClasses(slot, engine, 'view').classes).toEqual(['p-2']);
    },
  );

  it('drops data-open:animate-in with its modifier', () => {
    const result = translateClasses(['data-open:animate-in', 'p-2'], 'uniwind', 'view');

    expect(result).toEqual({ classes: ['p-2'], unknown: [] });
  });

  it('drops the classes no touch screen uses', () => {
    const result = translateClasses(
      ['outline-hidden', 'ring-2', 'transition-all', 'select-none', 'cursor-pointer', 'p-2'],
      'nativewind',
      'view',
    );

    expect(result).toEqual({ classes: ['p-2'], unknown: [] });
  });

  it('reports starting:opacity-0 as unknown', () => {
    const result = translateClasses(['starting:opacity-0', 'p-2'], 'uniwind', 'view');

    expect(result).toEqual({ classes: ['p-2'], unknown: ['starting:opacity-0'] });
  });

  it('splits typography onto the text part and the rest onto the view part', () => {
    const slot = ['bg-primary', 'text-primary-foreground'];

    expect(translateClasses(slot, 'uniwind', 'view').classes).toEqual(['bg-primary']);
    expect(translateClasses(slot, 'uniwind', 'text').classes).toEqual(['text-primary-foreground']);
  });

  it('sends typography under a kept modifier to the text part', () => {
    const slot = ['active:text-foreground', 'font-sans-medium', 'underline-offset-4', 'p-2'];

    expect(translateClasses(slot, 'uniwind', 'text').classes).toEqual([
      'active:text-foreground',
      'font-sans-medium',
      'underline-offset-4',
    ]);
    expect(translateClasses(slot, 'uniwind', 'view').classes).toEqual(['p-2']);
  });

  it.each(['nativewind', 'uniwind'] as const)('draws a font weight as a Geist family for %s', (engine) => {
    const weights = ['font-normal', 'font-medium', 'font-semibold', 'font-bold'];

    expect(translateClasses(weights, engine, 'text')).toEqual({
      classes: ['font-sans', 'font-sans-medium', 'font-sans-semibold', 'font-sans-bold'],
      unknown: [],
    });
  });

  it.each(['nativewind', 'uniwind'] as const)('reports a weight Geist has no family for in %s', (engine) => {
    expect(translateClasses(['font-light'], engine, 'text').unknown).toEqual(['font-light']);
  });

  it('keeps a family class as it is', () => {
    expect(translateClasses(['font-sans-medium', 'font-mono'], 'uniwind', 'text').classes).toEqual([
      'font-sans-medium',
      'font-mono',
    ]);
  });

  it('drops a radius clamped by a theme variable', () => {
    const result = translateClasses(['rounded-[min(var(--radius-md),8px)]'], 'uniwind', 'view');

    expect(result).toEqual({ classes: [], unknown: [] });
  });

  it('reports a state modifier the state table has no row for, rather than dropping it', () => {
    const result = translateClasses(['data-highlighted:bg-accent', 'p-2'], 'uniwind', 'view');

    expect(result).toEqual({ classes: ['p-2'], unknown: ['data-highlighted:bg-accent'] });
  });

  it.each(['nativewind', 'uniwind'] as const)(
    'reports for %s a calc of a percentage no own size of the slot resolves',
    (engine) => {
      const slot = ['translate-y-[calc(-50%-2px)]', 'max-w-[calc(100%-2rem)]'];

      expect(translateClasses(slot, engine, 'view').unknown).toEqual(slot);
    },
  );

  it.each(['nativewind', 'uniwind'] as const)(
    'translates every Button slot of the pinned snapshot for %s with nothing unknown',
    (engine) => {
      const slots = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));
      const buttonSlots = [...slots].filter(([name]) => BUTTON_SLOT.test(name));

      expect(buttonSlots.length).toBeGreaterThan(10);
      for (const [name, classes] of buttonSlots) {
        for (const part of ['view', 'text', 'icon'] as const) {
          expect({ name, part, unknown: translateClasses(classes, engine, part).unknown }).toEqual({
            name,
            part,
            unknown: [],
          });
        }
      }
    },
  );
});

const BATCH_SLOT =
  /^cn-(separator|skeleton|label|badge|card|avatar|progress|input|textarea|switch|checkbox|radio-group|toggle|toggle-group|tabs)(-(?!group|otp)[\w-]+)?$/;
const RADIX_SLOT = /-aria$/;

describe('translateClasses with a state', () => {
  const slots = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));
  const slot = (name: string): readonly string[] => slots.get(name) ?? [];

  it.each([
    ['nativewind', 'shadow-sm'],
    ['uniwind', 'shadow-xs'],
  ] as const)("leaves Switch's states out of its base classes for %s", (engine, shadow) => {
    expect(translateClasses(slot('cn-switch'), engine, 'view')).toEqual({
      classes: ['shrink-0', 'rounded-full', 'border', 'border-transparent', shadow],
      unknown: [],
    });
  });

  it.each([
    ['checked', ['bg-primary']],
    ['unchecked', ['bg-input', 'dark:bg-input/80']],
    ['size=default', ['h-[18.4px]', 'w-[32px]']],
    ['size=sm', ['h-[14px]', 'w-[24px]']],
    ['invalid', ['border-destructive', 'dark:border-destructive/50']],
    ['focused', ['border-ring']],
  ])('gives Switch only the classes Vega puts behind %s, with dark: kept', (state, classes) => {
    expect(translateClasses(slot('cn-switch'), 'uniwind', 'view', state)).toEqual({ classes, unknown: [] });
  });

  it.each([
    ['size=sm+checked', 'translate-x-[10px]'],
    ['checked+size=sm', 'translate-x-[10px]'],
    ['size=default+checked', 'translate-x-[14px]'],
  ])(
    "moves Switch's thumb at %s by its track's inner width less its own, which neither engine computes from calc(100%%-2px)",
    (state, translate) => {
      for (const engine of ['nativewind', 'uniwind'] as const) {
        expect(translateClasses(slot('cn-switch-thumb'), engine, 'view', state)).toEqual({
          classes: [translate],
          unknown: [],
        });
      }
    },
  );

  it("gives Switch's thumb its size per Switch size and its colour per state", () => {
    const thumb = slot('cn-switch-thumb');

    expect(translateClasses(thumb, 'uniwind', 'view').classes).toEqual(['bg-background', 'rounded-full']);
    expect(translateClasses(thumb, 'uniwind', 'view', 'size=sm').classes).toEqual(['size-3']);
    expect(translateClasses(thumb, 'uniwind', 'view', 'checked').classes).toEqual(['dark:bg-primary-foreground']);
    expect(translateClasses(thumb, 'uniwind', 'view', 'size=sm+unchecked').classes).toEqual(['translate-x-0']);
  });

  it("splits a checked Checkbox's classes between the box and its check mark", () => {
    const checkbox = slot('cn-checkbox');

    expect(translateClasses(checkbox, 'uniwind', 'view', 'checked').classes).toEqual([
      'bg-primary',
      'dark:bg-primary',
      'border-primary',
    ]);
    expect(translateClasses(checkbox, 'uniwind', 'text', 'checked').classes).toEqual(['text-primary-foreground']);
    expect(translateClasses(checkbox, 'uniwind', 'view', 'checked+invalid').classes).toEqual(['border-primary']);
  });

  it.each([
    ['data-checked:bg-primary', 'checked'],
    ['aria-checked:bg-primary', 'checked'],
    ['data-unchecked:bg-primary', 'unchecked'],
    ['not-data-checked:bg-primary', 'unchecked'],
    ['not-data-selected:bg-primary', 'unselected'],
    ['aria-pressed:bg-primary', 'pressed'],
    ['data-pressed:bg-primary', 'pressed'],
    ['data-[state=on]:bg-primary', 'pressed'],
    ['data-active:bg-primary', 'selected'],
    ['data-selected:bg-primary', 'selected'],
    ['data-[active=true]:bg-primary', 'selected'],
    ['has-data-selected:bg-primary', 'selected'],
    ['aria-invalid:bg-primary', 'invalid'],
    ['data-invalid:bg-primary', 'invalid'],
    ['has-aria-invalid:bg-primary', 'invalid'],
    ['data-disabled:bg-primary', 'disabled'],
    ['group-data-[disabled=true]:bg-primary', 'disabled'],
    ['group-data-[disabled=true]/field:bg-primary', 'disabled'],
    ['group-has-disabled/field:bg-primary', 'disabled'],
    ['peer-disabled:bg-primary', 'disabled'],
    ['peer-data-disabled:bg-primary', 'disabled'],
    ['focus-visible:bg-primary', 'focused'],
    ['data-focus-visible:bg-primary', 'focused'],
    ['aria-expanded:bg-primary', 'expanded'],
    ['data-[size=sm]:bg-primary', 'size=sm'],
    ['group-data-[size=sm]/card:bg-primary', 'size=sm'],
    ['group-has-data-[size=lg]/avatar-group:bg-primary', 'size=lg'],
    ['data-[variant=line]:bg-primary', 'variant=line'],
    ['group-data-horizontal/toggle-group:bg-primary', 'orientation=horizontal'],
    ['data-vertical:bg-primary', 'orientation=vertical'],
    ['first:bg-primary', 'position=first'],
    ['last:bg-primary', 'position=last'],
    ['group-data-[variant=line]/tabs-list:data-active:bg-primary', 'selected+variant=line'],
  ])('puts %s behind the state %s only', (cls, state) => {
    expect(translateClasses([cls], 'uniwind', 'view')).toEqual({ classes: [], unknown: [] });
    expect(translateClasses([cls], 'uniwind', 'view', state)).toEqual({ classes: ['bg-primary'], unknown: [] });
  });

  it.each([
    'has-data-[icon=inline-start]:pl-2',
    'group-has-[:focus-visible]/field-label:border-primary',
    'has-[>img:first-child]:pt-0',
    'in-data-[slot=button-group]:rounded-md',
    '[.border-b]:pb-4',
    'file:h-7',
    'after:rounded-full',
    'md:text-sm',
    'data-open:animate-in',
    'focus-within:ring-0',
  ])('drops %s, which no state of a phone draws, in every state', (cls) => {
    for (const state of [undefined, 'focused', 'selected', 'icon=inline-start']) {
      expect(translateClasses([cls], 'uniwind', 'view', state)).toEqual({ classes: [], unknown: [] });
    }
  });

  it("keeps an input's base text-base where Vega narrows it at md, which a phone is below", () => {
    expect(translateClasses(slot('cn-input'), 'uniwind', 'text').classes).toEqual(['text-base']);
  });

  it.each(['nativewind', 'uniwind'] as const)(
    "translates every Base UI slot of the batch's components for %s with nothing unknown",
    (engine) => {
      const batchSlots = [...slots].filter(([name]) => BATCH_SLOT.test(name) && !RADIX_SLOT.test(name));

      expect(batchSlots.length).toBeGreaterThan(30);
      for (const [name, classes] of batchSlots) {
        for (const part of ['view', 'text', 'icon'] as const) {
          expect({ name, part, unknown: translateClasses(classes, engine, part).unknown }).toEqual({
            name,
            part,
            unknown: [],
          });
        }
      }
    },
  );

  it.each(['nativewind', 'uniwind'] as const)('translates every Radix slot for %s without throwing', (engine) => {
    const radixSlots = [...slots].filter(([name]) => RADIX_SLOT.test(name));

    expect(radixSlots.length).toBeGreaterThan(5);
    for (const [, classes] of radixSlots) {
      expect(() => translateClasses(classes, engine, 'view', 'checked')).not.toThrow();
    }
  });
});
