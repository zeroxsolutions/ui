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
    const result = translateClasses(['dark:aria-invalid:border-destructive/50'], 'nativewind', 'view');

    expect(result).toEqual({ classes: [], unknown: [] });
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
    ['rounded-4xl', 'rounded-[2rem]'],
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
    const result = translateClasses(['dark:rounded-sm'], 'nativewind', 'view');

    expect(result.classes).toEqual(['dark:rounded']);
  });

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
    const slot = ['active:text-foreground', 'font-medium', 'underline-offset-4', 'p-2'];

    expect(translateClasses(slot, 'uniwind', 'text').classes).toEqual([
      'active:text-foreground',
      'font-medium',
      'underline-offset-4',
    ]);
    expect(translateClasses(slot, 'uniwind', 'view').classes).toEqual(['p-2']);
  });

  it('drops a radius clamped by a theme variable', () => {
    const result = translateClasses(['rounded-[min(var(--radius-md),8px)]'], 'uniwind', 'view');

    expect(result).toEqual({ classes: [], unknown: [] });
  });

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
