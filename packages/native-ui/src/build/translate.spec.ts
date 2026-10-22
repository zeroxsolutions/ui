import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSlotMap } from './slot-map';
import { parseSpacingVariables, translateClasses, type Engine, type Translation } from './translate';

const SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/style-vega.css');
const NOVA_SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/style-nova.css');
const SNAPSHOT_PATHS = { vega: SNAPSHOT_PATH, nova: NOVA_SNAPSHOT_PATH } as const;
const STYLE_ENGINES = (['vega', 'nova'] as const).flatMap((style) =>
  (['nativewind', 'uniwind'] as const).map((engine): [Engine, keyof typeof SNAPSHOT_PATHS] => [engine, style]),
);
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

  it.each(['nativewind', 'uniwind'] as const)(
    "keeps a utility named like an Object prototype member as it is for %s, since the rename table's own keys are its only renames",
    (engine) => {
      expect(translateClasses(['constructor', 'toString'], engine, 'view').classes).toEqual([
        'constructor',
        'toString',
      ]);
    },
  );

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

  it.each(['data-open:animate-in', 'data-open:fade-in-0', 'data-open:zoom-in-95', 'data-closed:animate-out'])(
    'drops %s, an animation neither engine runs, in the base and the open state',
    (cls) => {
      for (const state of [undefined, 'open']) {
        expect(translateClasses([cls, 'p-2'], 'uniwind', 'view', state)).toEqual({
          classes: state ? [] : ['p-2'],
          unknown: [],
        });
      }
    },
  );

  it('puts a colour behind data-open in the open state and leaves it out of the base', () => {
    const slot = ['p-2', 'data-open:bg-accent', 'data-open:text-accent-foreground'];

    expect(translateClasses(slot, 'nativewind', 'view')).toEqual({ classes: ['p-2'], unknown: [] });
    expect(translateClasses(slot, 'nativewind', 'view', 'open')).toEqual({ classes: ['bg-accent'], unknown: [] });
    expect(translateClasses(slot, 'nativewind', 'text', 'open')).toEqual({
      classes: ['text-accent-foreground'],
      unknown: [],
    });
  });

  it("puts a colour behind base-ui's data-popup-open in the open state", () => {
    const slot = ['px-4', 'data-popup-open:bg-muted/50'];

    expect(translateClasses(slot, 'nativewind', 'view')).toEqual({ classes: ['px-4'], unknown: [] });
    expect(translateClasses(slot, 'nativewind', 'view', 'open')).toEqual({ classes: ['bg-muted/50'], unknown: [] });
  });

  it.each([
    'data-starting-style:scale-90',
    'data-ending-style:opacity-0',
    'data-[motion=from-end]:slide-in-from-right-52',
    'data-[motion^=from-]:animate-in',
  ])("drops %s, a frame of base-ui's motion a component draws itself", (cls) => {
    expect(translateClasses([cls, 'p-2'], 'uniwind', 'view')).toEqual({ classes: ['p-2'], unknown: [] });
  });

  it('drops a peer-hover, a pointer over a sibling no touch screen has', () => {
    expect(translateClasses(['peer-hover/menu-button:text-accent', 'p-2'], 'nativewind', 'view')).toEqual({
      classes: ['p-2'],
      unknown: [],
    });
  });

  it.each(['cn-sidebar-menu-action', 'cn-sidebar-menu-badge'])(
    "puts %s's colour behind the hovered state of the button beside it",
    (name) => {
      const slot = ['text-sidebar-foreground', 'peer-hover/menu-button:text-sidebar-accent-foreground'];

      expect(translateClasses(slot, 'nativewind', 'text', undefined, { name })).toEqual({
        classes: ['text-sidebar-foreground'],
        unknown: [],
      });
      expect(translateClasses(slot, 'nativewind', 'text', 'hovered', { name })).toEqual({
        classes: ['text-sidebar-accent-foreground'],
        unknown: [],
      });
    },
  );

  it("draws a sidebar menu button's rail size without the important neither engine has", () => {
    const slot = ['p-2', 'group-data-[collapsible=icon]:size-8!', 'group-data-[collapsible=icon]:p-2!'];

    expect(translateClasses(slot, 'uniwind', 'view', 'collapsible=icon', { name: 'cn-sidebar-menu-button' })).toEqual({
      classes: ['size-8', 'p-2'],
      unknown: [],
    });
  });

  it.each(['sm', 'md'])(
    'keeps the base class a style widens at %s, which a phone held upright is below',
    (breakpoint) => {
      expect(translateClasses(['gap-1.5', `${breakpoint}:gap-2.5`], 'uniwind', 'view')).toEqual({
        classes: ['gap-1.5'],
        unknown: [],
      });
    },
  );

  it('drops the classes no touch screen uses', () => {
    const result = translateClasses(
      ['outline-hidden', 'ring-2', 'transition-all', 'select-none', 'cursor-pointer', 'p-2'],
      'nativewind',
      'view',
    );

    expect(result).toEqual({ classes: ['p-2'], unknown: [] });
  });

  it.each(['nativewind', 'uniwind'] as const)(
    'drops w-fit, a width neither engine draws, for the self-start the component sets, for %s',
    (engine) => {
      expect(translateClasses(['w-fit', 'h-5'], engine, 'view')).toEqual({ classes: ['h-5'], unknown: [] });
    },
  );

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

  it("draws a radius clamped at 8px or more as the theme's 8px rounded-md, which the clamp never cuts", () => {
    const result = translateClasses(
      ['rounded-[min(var(--radius-md),12px)]', 'rounded-l-[min(var(--radius-md),8px)]'],
      'uniwind',
      'view',
    );

    expect(result).toEqual({ classes: ['rounded-md', 'rounded-l-md'], unknown: [] });
  });

  it('reports a radius clamped below the theme rounded-md', () => {
    const result = translateClasses(['rounded-[min(var(--radius-md),6px)]'], 'uniwind', 'view');

    expect(result).toEqual({ classes: [], unknown: ['rounded-[min(var(--radius-md),6px)]'] });
  });

  it('reports a state modifier the state table has no row for, rather than dropping it', () => {
    const result = translateClasses(['data-swiping:bg-accent', 'p-2'], 'uniwind', 'view');

    expect(result).toEqual({ classes: ['p-2'], unknown: ['data-swiping:bg-accent'] });
  });

  it.each(['nativewind', 'uniwind'] as const)(
    'reports for %s a calc of a percentage no own size of the slot resolves',
    (engine) => {
      const slot = ['translate-y-[calc(-50%-2px)]', 'max-w-[calc(100%-2rem)]'];

      expect(translateClasses(slot, engine, 'view').unknown).toEqual(slot);
    },
  );

  it.each(STYLE_ENGINES)(
    'translates every Button slot of the pinned snapshot for %s in %s with nothing unknown',
    (engine, style) => {
      const slots = parseSlotMap(readFileSync(SNAPSHOT_PATHS[style], 'utf8'));
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

  describe("with Vega's hairline ring", () => {
    it.each(['nativewind', 'uniwind'] as const)('draws the ring of Card as a border for %s', (engine) => {
      const classes = translateClasses(slot('cn-card'), engine, 'view').classes;

      expect(classes).toEqual(expect.arrayContaining(['border', 'border-foreground/10']));
      expect(classes.some((cls) => cls.startsWith('ring'))).toBe(false);
    });

    it('keeps the border a slot has and adds nothing from its ring', () => {
      const result = translateClasses(['border', 'border-border', 'ring-1', 'ring-foreground/10'], 'uniwind', 'view');

      expect(result).toEqual({ classes: ['border', 'border-border'], unknown: [] });
      expect(translateClasses(['border-2', 'ring-1', 'ring-ring'], 'uniwind', 'view').classes).toEqual([
        'border-2',
        'border-border',
      ]);
    });

    it('leaves Badge outline with its one border', () => {
      const classes = [...slot('cn-badge'), ...slot('cn-badge-variant-outline')];

      expect(translateClasses(classes, 'uniwind', 'view').classes.filter((cls) => cls === 'border')).toHaveLength(1);
    });

    it.each([
      ['focus-visible:ring-3'],
      ['focus-visible:ring-1'],
      ['aria-invalid:ring-destructive/20'],
      ['ring-0'],
      ['ring-3'],
    ])('keeps %s dropped next to a ring-1', (cls) => {
      const result = translateClasses(['ring-1', 'ring-foreground/10', cls], 'uniwind', 'view');

      expect(result.classes).toEqual(['border', 'border-foreground/10']);
      expect(translateClasses([cls], 'uniwind', 'view').classes).toEqual([]);
    });

    it('draws no border for a ring colour with no ring-1 beside it', () => {
      expect(translateClasses(['ring-background', 'ring-3'], 'uniwind', 'view').classes).toEqual([]);
    });
  });

  it('lists a class once when the slot repeats it', () => {
    expect(translateClasses(['opacity-50', 'peer-disabled:opacity-50'], 'uniwind', 'view', 'disabled').classes).toEqual(
      ['opacity-50'],
    );
    expect(translateClasses(['p-2', 'p-2'], 'uniwind', 'view').classes).toEqual(['p-2']);
  });

  describe("with Card's spacing variable", () => {
    const spacingVariables = parseSpacingVariables(slots);

    it.each(['nativewind', 'uniwind'] as const)(
      "resolves Card's spacing variable to spacing steps, which Tailwind 3 cannot compile, for %s",
      (engine) => {
        const shadow = engine === 'nativewind' ? 'shadow-sm' : 'shadow-xs';

        expect(translateClasses(slot('cn-card'), engine, 'view', '', { spacingVariables })).toEqual({
          classes: [
            'border-foreground/10',
            'bg-card',
            'gap-6',
            'overflow-hidden',
            'rounded-xl',
            'py-6',
            shadow,
            'border',
          ],
          unknown: [],
        });
        expect(translateClasses(slot('cn-card'), engine, 'view', 'size=sm', { spacingVariables })).toEqual({
          classes: ['gap-4', 'py-4'],
          unknown: [],
        });
        expect(
          translateClasses(slot('cn-card-header'), engine, 'view', 'size=sm', { spacingVariables }).classes,
        ).toEqual(['px-4']);
        expect(translateClasses(slot('cn-card-footer'), engine, 'view', '', { spacingVariables }).classes).toEqual([
          'rounded-b-xl',
          'px-6',
        ]);
      },
    );

    it("reads each size's step from the values the style's Card slot gives the variable", () => {
      const nova = parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8'));

      expect(spacingVariables.get('--card-spacing')).toEqual({ '': 6, 'size=sm': 4 });
      expect(parseSpacingVariables(nova).get('--card-spacing')).toEqual({ '': 4, 'size=sm': 3 });
    });

    it("spaces Nova's Card by Nova's steps, not Vega's", () => {
      const nova = parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8'));
      const context = { spacingVariables: parseSpacingVariables(nova) };
      const novaSlot = (name: string): readonly string[] => nova.get(name) ?? [];

      expect(translateClasses(novaSlot('cn-card'), 'uniwind', 'view', '', context).classes).toEqual(
        expect.arrayContaining(['gap-4', 'py-4']),
      );
      expect(translateClasses(novaSlot('cn-card'), 'uniwind', 'view', 'size=sm', context).classes).toEqual([
        'gap-3',
        'py-3',
      ]);
      expect(translateClasses(novaSlot('cn-card-footer'), 'uniwind', 'view', '', context).classes).toContain('p-4');
    });

    it('throws on a variable one slot defines twice for the same state with different steps', () => {
      const twice = new Map([
        ['cn-a', ['[--gap:--spacing(2)]']],
        ['cn-b', ['[--gap:--spacing(3)]']],
      ]);

      expect(() => parseSpacingVariables(twice)).toThrow('--gap is defined as both 2 and 3');
    });

    it('reports a variable it has no value for rather than passing it through', () => {
      expect(translateClasses(['px-(--gutter)'], 'uniwind', 'view', '', { spacingVariables }).unknown).toEqual([
        'px-(--gutter)',
      ]);
      expect(translateClasses(['[--gutter:--spacing(3)]'], 'uniwind', 'view').unknown).toEqual([
        '[--gutter:--spacing(3)]',
      ]);
    });
  });

  it.each(STYLE_ENGINES)(
    "translates every Base UI slot of the batch's components for %s in %s with nothing unknown",
    (engine, style) => {
      const styleSlots = parseSlotMap(readFileSync(SNAPSHOT_PATHS[style], 'utf8'));
      const spacingVariables = parseSpacingVariables(styleSlots);
      const batchSlots = [...styleSlots].filter(([name]) => BATCH_SLOT.test(name) && !RADIX_SLOT.test(name));

      expect(batchSlots.length).toBeGreaterThan(30);
      for (const [name, classes] of batchSlots) {
        for (const part of ['view', 'text', 'icon'] as const) {
          expect({
            name,
            part,
            unknown: translateClasses(classes, engine, part, '', { name, spacingVariables }).unknown,
          }).toEqual({ name, part, unknown: [] });
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

describe('translateClasses for a named slot', () => {
  const slots = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));
  const slot = (name: string): readonly string[] => slots.get(name) ?? [];

  it.each(['nativewind', 'uniwind'] as const)(
    "draws the radio dot at its size and colour, leaving its centring to the indicator's flex, for %s",
    (engine) => {
      const { classes } = translateClasses(slot('cn-radio-group-indicator-icon'), engine, 'view', '', {
        name: 'cn-radio-group-indicator-icon',
      });

      expect(classes).toEqual(['bg-primary-foreground', 'size-2', 'rounded-full']);
    },
  );

  it.each(['nativewind', 'uniwind'] as const)('lays the radio group out with its gap and no grid for %s', (engine) => {
    expect(translateClasses(slot('cn-radio-group'), engine, 'view', '', { name: 'cn-radio-group' }).classes).toEqual([
      'gap-3',
    ]);
  });

  it("lays Nova's radio group out with Nova's gap and no grid", () => {
    const nova = parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8'));

    expect(
      translateClasses(nova.get('cn-radio-group') ?? [], 'uniwind', 'view', '', { name: 'cn-radio-group' }).classes,
    ).toEqual(['gap-2']);
  });

  it("keeps the radio dot's classes for a slot of another name", () => {
    expect(translateClasses(slot('cn-radio-group-indicator-icon'), 'uniwind', 'view').classes).toContain(
      '-translate-x-1/2',
    );
  });
});

describe('translateClasses for an input group', () => {
  const vega = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));
  const nova = parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8'));
  const group = vega.get('cn-input-group') ?? [];

  it.each(['nativewind', 'uniwind'] as const)(
    "puts the group's border colour behind its control's focus and invalid states for %s",
    (engine) => {
      expect(translateClasses(group, engine, 'view', 'focused').classes).toEqual(['border-ring']);
      expect(translateClasses(group, engine, 'view', 'invalid').classes).toEqual(['border-destructive']);
      expect(translateClasses(group, engine, 'view').classes).not.toContain('border-ring');
    },
  );

  it('stacks the group in a column while it holds a block addon', () => {
    expect(translateClasses(group, 'uniwind', 'view', 'align=block-start').classes).toEqual(['h-auto', 'flex-col']);
    expect(translateClasses(group, 'uniwind', 'view', 'align=block-end').classes).toEqual(['h-auto', 'flex-col']);
  });

  it("dims Nova's group while its control is disabled, which Vega's leaves to the control", () => {
    expect(translateClasses(nova.get('cn-input-group') ?? [], 'uniwind', 'view', 'disabled').classes).toEqual(
      expect.arrayContaining(['bg-input/50', 'opacity-50']),
    );
    expect(translateClasses(group, 'uniwind', 'view', 'disabled').classes).toEqual([]);
  });

  it('gives an icon directly inside an addon its size on the icon part', () => {
    expect(translateClasses(vega.get('cn-input-group-addon') ?? [], 'uniwind', 'icon').classes).toEqual(['size-4']);
  });
});

describe('translateClasses for a text field', () => {
  const vega = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));
  const nova = parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8'));
  const FIELD_SLOTS = ['cn-input', 'cn-textarea'] as const;
  const cases = FIELD_SLOTS.flatMap((name) =>
    (['nativewind', 'uniwind'] as const).map((engine) => [name, engine] as const),
  );

  it.each(cases)(
    "puts Nova's disabled tint on %s behind the disabled state, which a read-only TextInput applies, for %s",
    (name, engine) => {
      const classes = nova.get(name) ?? [];

      expect(translateClasses(classes, engine, 'view', 'disabled', { name }).classes).toEqual([
        'bg-input/50',
        'dark:bg-input/80',
      ]);
      expect(
        translateClasses(classes, engine, 'view', '', { name }).classes.filter((cls) => cls.includes('disabled:')),
      ).toEqual([]);
    },
  );

  it.each(FIELD_SLOTS)("draws nothing behind the disabled state of Vega's %s", (name) => {
    expect(translateClasses(vega.get(name) ?? [], 'nativewind', 'view', 'disabled', { name }).classes).toEqual([]);
  });

  it("keeps a disabled: class as the Pressable's own when the slot is not named", () => {
    expect(translateClasses(nova.get('cn-input') ?? [], 'uniwind', 'view').classes).toContain('disabled:bg-input/50');
  });
});

describe('translateClasses for an input otp caret', () => {
  it.each(['nativewind', 'uniwind'] as const)(
    'drops the caret-blink animation neither engine defines and keeps the line for %s',
    (engine) => {
      const caret = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')).get('cn-input-otp-caret-line') ?? [];

      expect(translateClasses(caret, engine, 'view', '', { name: 'cn-input-otp-caret-line' })).toEqual({
        classes: ['bg-foreground', 'h-4', 'w-px'],
        unknown: [],
      });
    },
  );
});

describe('translateClasses for a radius less a length', () => {
  const radiusSlot = (style: 'vega' | 'nova'): readonly string[] =>
    parseSlotMap(readFileSync(SNAPSHOT_PATHS[style], 'utf8')).get('cn-input-group-button-size-xs') ?? [];
  const radius = '0.625rem';

  it.each(['nativewind', 'uniwind'] as const)(
    "draws Vega's xs input group button at the theme radius less 5px for %s",
    (engine) => {
      expect(translateClasses(radiusSlot('vega'), engine, 'view', '', { radius }).classes).toContain('rounded-[5px]');
    },
  );

  it.each(['nativewind', 'uniwind'] as const)(
    "draws Nova's xs input group button at the theme radius less 3px for %s",
    (engine) => {
      expect(translateClasses(radiusSlot('nova'), engine, 'view', '', { radius }).classes).toContain('rounded-[7px]');
    },
  );

  it('follows the theme radius it is given', () => {
    expect(
      translateClasses(['rounded-[calc(var(--radius)-5px)]'], 'uniwind', 'view', '', { radius: '0.75rem' }).classes,
    ).toEqual(['rounded-[7px]']);
  });

  it('rounds the px it comes to at 2 decimals', () => {
    expect(
      translateClasses(['rounded-[calc(var(--radius)-2px)]'], 'uniwind', 'view', '', { radius: '0.33rem' }).classes,
    ).toEqual(['rounded-[3.28px]']);
  });

  it('draws a length past the theme radius as no radius', () => {
    expect(
      translateClasses(['rounded-[calc(var(--radius)-6px)]'], 'uniwind', 'view', '', { radius: '0.3rem' }).classes,
    ).toEqual(['rounded-[0px]']);
  });

  it('reports the radius when it is given no theme radius', () => {
    expect(translateClasses(['rounded-[calc(var(--radius)-5px)]'], 'uniwind', 'view')).toEqual({
      classes: [],
      unknown: ['rounded-[calc(var(--radius)-5px)]'],
    });
  });
});

describe('translateClasses for a direct child in a variant', () => {
  it('drops a direct child selector on any attribute but data-align', () => {
    const slot = ['has-[>[data-slot=field]]:border'];

    expect(translateClasses(slot, 'uniwind', 'view')).toEqual({ classes: [], unknown: [] });
    expect(translateClasses(slot, 'uniwind', 'view', 'slot=field')).toEqual({ classes: [], unknown: [] });
  });
});

describe('translateClasses for a direct child', () => {
  it("gives a direct child svg's size to the icon part", () => {
    expect(translateClasses(["*:[svg:not([class*='size-'])]:size-4", 'p-2'], 'uniwind', 'icon').classes).toEqual([
      'size-4',
    ]);
  });

  it('puts a class for the direct child of a slot behind the state part=<slot>, for the child to apply', () => {
    const slot = ['text-destructive', '*:data-[slot=alert-description]:text-destructive/90'];

    expect(translateClasses(slot, 'uniwind', 'text').classes).toEqual(['text-destructive']);
    expect(translateClasses(slot, 'uniwind', 'text', 'part=alert-description').classes).toEqual([
      'text-destructive/90',
    ]);
  });
});

describe('translateClasses for an alert', () => {
  const styles = {
    vega: parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')),
    nova: parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8')),
  };
  const alert = (style: keyof typeof styles, engine: Engine, state = ''): string[] =>
    translateClasses(styles[style].get('cn-alert') ?? [], engine, 'view', state, { name: 'cn-alert' }).classes;

  it.each(STYLE_ENGINES)('lays the alert out with no grid for %s in %s', (engine, style) => {
    expect(alert(style, engine)).not.toContain('grid');
    expect(alert(style, engine, 'slot=icon')).not.toContain('grid-cols-[auto_1fr]');
  });

  it.each([
    ['vega', 'gap-x-2.5'],
    ['nova', 'gap-x-2'],
  ] as const)('spaces %s alert icon from its text by %s while it holds an icon', (style, gap) => {
    expect(alert(style, 'uniwind', 'slot=icon')).toEqual([gap]);
  });

  it('makes room for an action by a Tailwind 4 step Tailwind 3 lacks, as its px for nativewind', () => {
    expect(alert('vega', 'uniwind', 'slot=alert-action')).toEqual(['relative', 'pr-18']);
    expect(alert('vega', 'nativewind', 'slot=alert-action')).toEqual(['relative', 'pr-[72px]']);
  });

  it.each(['nativewind', 'uniwind'] as const)(
    'drops text-balance, a text wrap neither engine draws, from the description for %s',
    (engine) => {
      expect(
        translateClasses(styles.vega.get('cn-alert-description') ?? [], engine, 'text', '', {
          name: 'cn-alert-description',
        }).classes,
      ).toEqual(['text-muted-foreground', 'text-sm']);
    },
  );
});

describe('translateClasses for a button group', () => {
  it.each(STYLE_ENGINES)('spaces a group of groups apart for %s in %s', (engine, style) => {
    const slots = parseSlotMap(readFileSync(SNAPSHOT_PATHS[style], 'utf8'));

    expect(
      translateClasses(slots.get('cn-button-group') ?? [], engine, 'view', 'slot=button-group', {
        name: 'cn-button-group',
      }),
    ).toEqual({ classes: ['gap-2'], unknown: [] });
  });
});

describe('translateClasses for a pagination link', () => {
  it.each([
    ['vega', 'cn-pagination-previous', 'pl-2'],
    ['vega', 'cn-pagination-next', 'pr-2'],
    ['nova', 'cn-pagination-previous', 'pl-1.5'],
  ] as const)("draws %s %s's important side padding as %s, which its component merges last", (style, name, padding) => {
    const slots = parseSlotMap(readFileSync(SNAPSHOT_PATHS[style], 'utf8'));

    for (const engine of ['nativewind', 'uniwind'] as const) {
      expect(translateClasses(slots.get(name) ?? [], engine, 'view', '', { name })).toEqual({
        classes: [padding],
        unknown: [],
      });
    }
  });

  it('still reports an important suffix on a slot of another name', () => {
    expect(translateClasses(['pl-2!'], 'uniwind', 'view', '', { name: 'cn-other' }).unknown).toEqual(['pl-2!']);
  });
});

describe('translateClasses for a table', () => {
  const slots = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));
  const view = (name: string, engine: Engine): string[] =>
    translateClasses(slots.get(name) ?? [], engine, 'view', '', { name }).classes;

  it.each(['nativewind', 'uniwind'] as const)(
    'drops the table layout React Native has no counterpart of, a caption side, a vertical align and an axis overflow, for %s',
    (engine) => {
      expect(view('cn-table-container', engine)).toEqual(['relative', 'w-full']);
      expect(view('cn-table', engine)).toEqual(['w-full']);
      expect(view('cn-table-cell', engine)).toEqual(['p-2']);
      expect(view('cn-table-head', engine)).toEqual(['h-10', 'px-2']);
    },
  );

  it('puts the selected row colour behind the state state=selected', () => {
    expect(
      translateClasses(slots.get('cn-table-row') ?? [], 'uniwind', 'view', 'state=selected', { name: 'cn-table-row' })
        .classes,
    ).toEqual(['bg-muted']);
  });
});

describe('translateClasses for a field', () => {
  it.each(STYLE_ENGINES)('pulls a description up under a legend for %s in %s', (engine, style) => {
    const slots = parseSlotMap(readFileSync(SNAPSHOT_PATHS[style], 'utf8'));
    const description = slots.get('cn-field-description') ?? [];
    const slot = { name: 'cn-field-description' };

    expect(translateClasses(description, engine, 'view', '', slot)).toEqual({ classes: [], unknown: [] });
    expect(translateClasses(description, engine, 'view', 'after=legend', slot).classes).toEqual(['-mt-1.5']);
  });
});

describe("translateClasses for a border upstream's base layer colours", () => {
  it.each(['nativewind', 'uniwind'] as const)(
    'gives a border width with no colour of its own the border colour for %s',
    (engine) => {
      expect(translateClasses(['rounded-lg', 'border', 'px-4'], engine, 'view').classes).toEqual([
        'rounded-lg',
        'border',
        'border-border',
        'px-4',
      ]);
      expect(translateClasses(['border-b'], engine, 'view').classes).toEqual(['border-b', 'border-border']);
    },
  );

  it('keeps a colour the slot names, and adds none to a slot with no border width', () => {
    expect(translateClasses(['border', 'border-input'], 'uniwind', 'view').classes).toEqual(['border', 'border-input']);
    expect(translateClasses(['border-dashed', 'p-6'], 'uniwind', 'view').classes).toEqual(['border-dashed', 'p-6']);
    expect(translateClasses(['border-0', 'p-6'], 'uniwind', 'view').classes).toEqual(['border-0', 'p-6']);
    expect(translateClasses(['border', 'border-dashed'], 'uniwind', 'view').classes).toEqual([
      'border',
      'border-border',
      'border-dashed',
    ]);
  });

  it('adds no colour to the classes behind a state that draw no border', () => {
    expect(translateClasses(['border', 'data-checked:bg-primary'], 'uniwind', 'view', 'checked').classes).toEqual([
      'bg-primary',
    ]);
  });

  it.each(STYLE_ENGINES)(
    "gives a border width behind a state the border colour when the slot names none, as Sheet's side does, for %s in %s",
    (engine, style) => {
      const slots = parseSlotMap(readFileSync(SNAPSHOT_PATHS[style], 'utf8'));
      const name = 'cn-sheet-content';

      expect(translateClasses(slots.get(name) ?? [], engine, 'view', 'side=bottom', { name }).classes).toEqual(
        expect.arrayContaining(['border-t', 'border-border']),
      );
    },
  );

  it('leaves a border width behind a state to the colour the slot names with no state', () => {
    expect(
      translateClasses(['border-y', 'border-input', 'data-[side=left]:border-l'], 'uniwind', 'view', 'side=left')
        .classes,
    ).toEqual(['border-l']);
  });
});

describe('translateClasses for an accordion', () => {
  const slotOf = (style: keyof typeof SNAPSHOT_PATHS, name: string): readonly string[] =>
    parseSlotMap(readFileSync(SNAPSHOT_PATHS[style], 'utf8')).get(name) ?? [];

  it.each(STYLE_ENGINES)(
    'draws the border under every item but the last, in the border colour, for %s in %s',
    (engine, style) => {
      const name = 'cn-accordion-item';
      const item = slotOf(style, name);

      expect(translateClasses(item, engine, 'view', '', { name })).toEqual({ classes: [], unknown: [] });
      expect(translateClasses(item, engine, 'view', 'position=not-last', { name }).classes).toEqual([
        'border-b',
        'border-border',
      ]);
    },
  );

  it.each(STYLE_ENGINES)(
    "gives the trigger's chevron its size and colour on the icon part for %s in %s",
    (engine, style) => {
      const name = 'cn-accordion-trigger';

      expect(translateClasses(slotOf(style, name), engine, 'icon', '', { name }).classes).toEqual([
        'text-muted-foreground',
        'ml-auto',
        'size-4',
      ]);
    },
  );

  it('keeps dropping a class for any other slot inside a part, such as a kbd', () => {
    expect(translateClasses(['**:data-[slot=kbd]:rounded-sm', 'p-2'], 'uniwind', 'view').classes).toEqual(['p-2']);
    expect(translateClasses(['**:data-[slot=kbd]:rounded-sm'], 'uniwind', 'icon').classes).toEqual([]);
  });
});

describe('translateClasses for a grid', () => {
  it.each(['nativewind', 'uniwind'] as const)(
    'drops a grid and its tracks, a layout neither engine draws, for %s',
    (engine) => {
      const slot = ['grid', 'grid-rows-[auto_1fr]', 'grid-cols-2', 'row-span-2', 'col-start-2', 'gap-1.5'];

      expect(translateClasses(slot, engine, 'view')).toEqual({ classes: ['gap-1.5'], unknown: [] });
    },
  );

  it.each(['nativewind', 'uniwind'] as const)(
    "centres a grid's items across a View's column with items-center for %s",
    (engine) => {
      expect(translateClasses(['place-items-center'], engine, 'view').classes).toEqual(['items-center']);
    },
  );

  it.each(['nativewind', 'uniwind'] as const)(
    "lays an inline-flex box's children in a row, as the web's inline-flex does, with flex-row for %s",
    (engine) => {
      expect(translateClasses(['inline-flex', 'items-center'], engine, 'view')).toEqual({
        classes: ['flex-row', 'items-center'],
        unknown: [],
      });
    },
  );
});

describe('translateClasses for a dialog', () => {
  const styles = {
    vega: parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')),
    nova: parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8')),
  };

  it.each(STYLE_ENGINES)(
    "draws the dialog's content with no width less a length, which the component's margin gives, for %s in %s",
    (engine, style) => {
      const { classes, unknown } = translateClasses(styles[style].get('cn-dialog-content') ?? [], engine, 'view', '', {
        name: 'cn-dialog-content',
      });

      expect(unknown).toEqual([]);
      expect(classes.filter((cls) => cls.startsWith('max-w-'))).toEqual([]);
    },
  );
});

describe('translateClasses for a fixed position', () => {
  it.each(['nativewind', 'uniwind'] as const)(
    'places a fixed part absolutely for %s, inside the portal host that fills the screen',
    (engine) => {
      expect(translateClasses(['fixed', 'inset-x-0'], engine, 'view').classes).toEqual(['absolute', 'inset-x-0']);
    },
  );
});

describe('translateClasses for a drawer swipe handle', () => {
  const styles = {
    vega: parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')),
    nova: parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8')),
  };
  const handle = (style: keyof typeof styles, engine: Engine, state: string): string[] =>
    translateClasses(styles[style].get('cn-drawer-swipe-handle') ?? [], engine, 'view', state, {
      name: 'cn-drawer-swipe-handle',
    }).classes;

  it.each(STYLE_ENGINES)(
    'gives the bar its ::after draws to the part=after child, with no display block, for %s in %s',
    (engine, style) => {
      expect([...handle(style, engine, 'part=after')].sort()).toEqual(['bg-muted', 'rounded-full', 'shrink-0']);
    },
  );

  it.each([
    ['vega', ['h-1.5', 'w-[100px]'], ['h-[100px]', 'w-1.5']],
    ['nova', ['h-1', 'w-24'], ['h-24', 'w-1']],
  ] as const)('sizes the %s bar across the axis it is swiped along', (style, across, along) => {
    expect(handle(style, 'uniwind', 'part=after+swipe-axis=y')).toEqual(across);
    expect(handle(style, 'uniwind', 'part=after+swipe-axis=x')).toEqual(along);
  });

  it('keeps dropping ::after classes for any other slot', () => {
    expect(translateClasses(['after:bg-muted'], 'uniwind', 'view', 'part=after', { name: 'cn-field-label' })).toEqual({
      classes: [],
      unknown: [],
    });
  });
});

describe('translateClasses for a code block', () => {
  const styles = {
    vega: parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')),
    nova: parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8')),
  };
  const slot = (
    style: keyof typeof styles,
    name: string,
    engine: Engine,
    part: 'view' | 'text',
    state = '',
  ): Translation => translateClasses(styles[style].get(name) ?? [], engine, part, state, { name });

  it.each(STYLE_ENGINES)('translates every class of every code-block slot for %s in %s', (engine, style) => {
    const names = [...styles[style].keys()].filter((name) => name.startsWith('cn-code-block'));

    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect({ name, unknown: slot(style, name, engine, 'view').unknown }).toEqual({ name, unknown: [] });
    }
  });

  it.each([
    ['vega', ['top-3', 'end-3', 'm-0']],
    ['nova', ['top-2', 'end-2', 'm-0']],
  ] as const)(
    'places %s actions straight inside the block at its top end, as the state parent=code-block',
    (style, placed) => {
      expect([...slot(style, 'cn-code-block-actions', 'uniwind', 'view', 'parent=code-block').classes].sort()).toEqual(
        [...placed].sort(),
      );
    },
  );

  it.each(STYLE_ENGINES)(
    'gives each button of floating actions the background and its ring as a hairline border, for %s in %s',
    (engine, style) => {
      expect(
        [...slot(style, 'cn-code-block-actions', engine, 'view', 'parent=code-block+part=button').classes].sort(),
      ).toEqual(['bg-background', 'border', 'border-foreground/10']);
    },
  );

  it('spaces a numbered line from its number, as the state numbered', () => {
    expect(slot('vega', 'cn-code-block-line', 'uniwind', 'view', 'numbered').classes).toEqual(['gap-x-3']);
  });

  it('gives the number its ::before draws to the part=before child', () => {
    expect(slot('vega', 'cn-code-block-line', 'uniwind', 'view', 'part=before').classes).toEqual(['min-w-6']);
    expect(slot('vega', 'cn-code-block-line', 'uniwind', 'text', 'part=before').classes).toEqual([
      'text-end',
      'text-muted-foreground',
    ]);
  });

  it('gives the diff marker its ::after draws to the part=after child, leaving the sign to the component', () => {
    expect(slot('vega', 'cn-code-block-line', 'uniwind', 'view', 'part=after').classes).toEqual(['start-1']);
    expect(slot('vega', 'cn-code-block-line', 'uniwind', 'text', 'part=after').classes).toEqual([
      'text-muted-foreground',
    ]);
    expect(slot('vega', 'cn-code-block-line-variant-removed', 'uniwind', 'text', 'part=after').classes).toEqual([
      'text-destructive',
    ]);
    expect(slot('vega', 'cn-code-block-line-variant-added', 'uniwind', 'view', 'part=after')).toEqual({
      classes: [],
      unknown: [],
    });
  });
});

describe('translateClasses for a menu', () => {
  const styles = {
    vega: parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')),
    nova: parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8')),
  };
  const MENU_SLOT =
    /^cn-(dropdown-menu|context-menu|menubar|select|command|combobox)(-(?!chip|.*-(aria|logical)$)[\w-]+)?$/;
  const menu = (style: keyof typeof styles, engine: Engine, name: string, part: 'view' | 'text', state = '') =>
    translateClasses(styles[style].get(name) ?? [], engine, part, state, { name });

  it.each(STYLE_ENGINES)('translates every slot of a menu for %s in %s with nothing unknown', (engine, style) => {
    const menuSlots = [...styles[style]].filter(([name]) => MENU_SLOT.test(name));

    expect(menuSlots.length).toBeGreaterThan(30);
    for (const [name, classes] of menuSlots) {
      for (const part of ['view', 'text', 'icon'] as const) {
        expect({ name, part, unknown: translateClasses(classes, engine, part, '', { name }).unknown }).toEqual({
          name,
          part,
          unknown: [],
        });
      }
    }
  });

  it.each(STYLE_ENGINES)(
    'puts the colours an item takes under the pointer, keyboard or finger behind highlighted for %s in %s',
    (engine, style) => {
      expect(menu(style, engine, 'cn-dropdown-menu-item', 'view', 'highlighted').classes).toEqual(['bg-accent']);
      expect(menu(style, engine, 'cn-dropdown-menu-item', 'text', 'highlighted').classes).toEqual([
        'text-accent-foreground',
      ]);
      expect(menu(style, engine, 'cn-dropdown-menu-shortcut', 'text', 'highlighted').classes).toEqual([
        'text-accent-foreground',
      ]);
    },
  );

  it.each(STYLE_ENGINES)('tints a highlighted destructive item for %s in %s', (engine, style) => {
    expect(menu(style, engine, 'cn-dropdown-menu-item', 'view', 'highlighted+variant=destructive').classes).toEqual([
      'bg-destructive/10',
      'dark:bg-destructive/20',
    ]);
  });

  it.each([
    ['vega', 'pl-8'],
    ['nova', 'pl-7'],
  ] as const)('indents an inset %s item to line up with a checked one', (style, indent) => {
    expect(menu(style, 'uniwind', 'cn-dropdown-menu-item', 'view', 'inset').classes).toEqual([indent]);
  });

  it.each(STYLE_ENGINES)("mutes a select trigger's placeholder for %s in %s", (engine, style) => {
    expect(menu(style, engine, 'cn-select-trigger', 'text', 'placeholder').classes).toEqual(['text-muted-foreground']);
  });

  it.each(STYLE_ENGINES)(
    "draws a command's group heading through the state part=group-heading for %s in %s",
    (engine, style) => {
      expect(menu(style, engine, 'cn-command-group', 'view', 'part=group-heading').classes).toEqual(['px-2', 'py-1.5']);
      expect(menu(style, engine, 'cn-command-group', 'text', 'part=group-heading').classes).toEqual([
        'text-muted-foreground',
        'text-xs',
        'font-sans-medium',
      ]);
    },
  );

  it.each(STYLE_ENGINES)(
    'keeps the rounding and height a command marks important, which its merge order already lets win, for %s in %s',
    (engine, style) => {
      expect(menu(style, engine, 'cn-command', 'view').classes).toContain('rounded-xl');
      expect(menu(style, engine, 'cn-command-input-group', 'view').classes).toEqual(
        expect.arrayContaining(['h-8', 'rounded-lg', 'shadow-none']),
      );
    },
  );

  it.each(STYLE_ENGINES)(
    "drops a list's scrollbar rule, which a ScrollView draws by a prop, for %s in %s",
    (engine, style) => {
      expect(menu(style, engine, 'cn-command-list', 'view').classes).toEqual(['max-h-72']);
    },
  );

  it.each(STYLE_ENGINES)("shows a combobox's empty message only in the empty state for %s in %s", (engine, style) => {
    expect(menu(style, engine, 'cn-combobox-empty', 'view')).toEqual(
      expect.objectContaining({ classes: expect.arrayContaining(['hidden']) }),
    );
    expect(menu(style, engine, 'cn-combobox-empty', 'view', 'empty').classes).toEqual(['flex']);
  });

  it.each(STYLE_ENGINES)(
    "holds a combobox's list to the popup's height less its input, which the web clamps to the screen, for %s in %s",
    (engine, style) => {
      expect(menu(style, engine, 'cn-combobox-list', 'view').classes).toEqual(['max-h-[252px]', 'p-1']);
      expect(menu(style, engine, 'cn-combobox-list', 'view', 'empty').classes).toEqual(['p-0']);
    },
  );
});

describe('translateClasses for a calendar', () => {
  const styles = {
    vega: parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')),
    nova: parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8')),
  };
  const calendar = (style: keyof typeof styles, engine: Engine, state: string): Translation =>
    translateClasses(styles[style].get('cn-calendar') ?? [], engine, 'view', state, {
      name: 'cn-calendar',
      spacingVariables: parseSpacingVariables(styles[style]),
    });

  it.each(STYLE_ENGINES)('pads the calendar, with no cell variables left, for %s in %s', (engine, style) => {
    expect(calendar(style, engine, '')).toEqual({ classes: [style === 'vega' ? 'p-3' : 'p-2'], unknown: [] });
  });

  it.each([
    ['vega', 'size-8', 'w-8', 'h-8'],
    ['nova', 'size-7', 'w-7', 'h-7'],
  ] as const)(
    "sizes %s's day cells, weekday columns and caption from the style's cell size",
    (style, cell, column, caption) => {
      for (const engine of ['nativewind', 'uniwind'] as const) {
        expect(calendar(style, engine, 'part=cell').classes).toEqual([cell]);
        expect(calendar(style, engine, 'part=column').classes).toEqual([column]);
        expect(calendar(style, engine, 'part=caption').classes).toEqual([caption, caption.replace('h-', 'px-')]);
      }
    },
  );
});

describe('translateClasses for the conversation items', () => {
  const styles = {
    vega: parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')),
    nova: parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8')),
  };
  const slot = (
    style: keyof typeof styles,
    name: string,
    engine: Engine,
    part: 'view' | 'text' | 'icon',
    state = '',
  ): Translation => translateClasses(styles[style].get(name) ?? [], engine, part, state, { name });

  it.each(STYLE_ENGINES)(
    'translates every class of every bubble, attachment, marker and message slot for %s in %s',
    (engine, style) => {
      const names = [...styles[style].keys()].filter((name) =>
        /^cn-(bubble|attachment|marker|message)(-|$)/.test(name),
      );

      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        for (const part of ['view', 'text', 'icon'] as const) {
          expect({ name, part, unknown: slot(style, name, engine, part).unknown }).toEqual({ name, part, unknown: [] });
        }
      }
    },
  );

  it.each(STYLE_ENGINES)(
    "tints a tinted bubble's content with the primary colour over the background, for %s in %s",
    (engine, style) => {
      expect(slot(style, 'cn-bubble-variant-tinted', engine, 'view', 'part=bubble-content').classes).toEqual([
        'bg-primary/10',
        'dark:bg-primary/15',
      ]);
    },
  );

  it.each(STYLE_ENGINES)(
    "draws the card-coloured ring around a bubble's reactions as a border, for %s in %s",
    (engine, style) => {
      expect(slot(style, 'cn-bubble-reactions', engine, 'view').classes).toEqual(
        expect.arrayContaining(['border-[3px]', 'border-card']),
      );
    },
  );

  it('leaves the reactions offset by their own height to the component', () => {
    expect(slot('vega', 'cn-bubble-reactions-side-top', 'uniwind', 'view').classes).toEqual(['top-0']);
    expect(slot('vega', 'cn-bubble-reactions-side-bottom', 'uniwind', 'view').classes).toEqual(['bottom-0']);
  });

  it('rings bubble content that takes a press while it holds keyboard focus, as the state pressable+focused', () => {
    expect(slot('vega', 'cn-bubble-content', 'uniwind', 'view', 'focused+pressable').classes).toEqual(['border-ring']);
  });

  it.each(STYLE_ENGINES)(
    'rings an attachment as a border while its trigger holds keyboard focus, as the state focused, for %s in %s',
    (engine, style) => {
      expect(slot(style, 'cn-attachment', engine, 'view', 'focused').classes).toEqual(['border', 'border-ring/50']);
    },
  );

  it('keeps dropping focus-within on any other slot', () => {
    expect(translateClasses(['focus-within:ring-1'], 'uniwind', 'view', 'focused', { name: 'cn-card' })).toEqual({
      classes: [],
      unknown: [],
    });
  });

  it('sizes a spinner in vertical attachment media, as the state part=spinner', () => {
    expect(slot('vega', 'cn-attachment-media', 'uniwind', 'view', 'orientation=vertical+part=spinner').classes).toEqual(
      ['size-6'],
    );
  });

  it("gives the lines a separator marker's ::before and ::after draw to its part=before and part=after children", () => {
    expect(slot('vega', 'cn-marker-variant-separator', 'uniwind', 'view', 'part=before').classes).toEqual([
      'h-px',
      'min-w-0',
      'flex-1',
      'bg-border',
      'mr-1',
    ]);
    expect(slot('vega', 'cn-marker-variant-separator', 'uniwind', 'view', 'part=after').classes).toEqual([
      'h-px',
      'min-w-0',
      'flex-1',
      'bg-border',
      'ml-1',
    ]);
  });
});

describe('translateClasses for the questionnaire and trace', () => {
  const styles = {
    vega: parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')),
    nova: parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8')),
  };
  const slot = (
    style: keyof typeof styles,
    name: string,
    engine: Engine,
    part: 'view' | 'text' | 'icon',
    state = '',
  ): Translation => translateClasses(styles[style].get(name) ?? [], engine, part, state, { name });

  it.each(STYLE_ENGINES)(
    'translates every class of every questionnaire and trace slot for %s in %s',
    (engine, style) => {
      const names = [...styles[style].keys()].filter((name) => /^cn-(questionnaire|trace)(-|$)/.test(name));

      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        for (const part of ['view', 'text', 'icon'] as const) {
          expect({ name, part, unknown: slot(style, name, engine, part).unknown }).toEqual({ name, part, unknown: [] });
        }
      }
    },
  );

  it.each(STYLE_ENGINES)(
    'pulls an icon after a trace title back by a step, as the state after=trace-title, for %s in %s',
    (engine, style) => {
      expect(slot(style, 'cn-trace-icon', engine, 'view', 'after=trace-title').classes).toEqual(['-ml-1']);
      expect(slot(style, 'cn-trace-icon', engine, 'view').classes).toEqual(['size-4']);
    },
  );

  it.each(STYLE_ENGINES)(
    'indents trace content by two spacing steps less a pixel, in px, for %s in %s',
    (engine, style) => {
      expect(slot(style, 'cn-trace-collapsible-content-inner', engine, 'view').classes).toContain('ml-[7px]');
    },
  );

  it.each(STYLE_ENGINES)(
    'nudges a questionnaire indicator down by a fraction of a spacing step, in px, for %s in %s',
    (engine, style) => {
      expect(slot(style, 'cn-questionnaire-choice-indicator', engine, 'view').classes).toContain('translate-y-[1.8px]');
      expect(slot(style, 'cn-questionnaire-shortcut', engine, 'view').classes).toContain('translate-y-[1.8px]');
    },
  );

  it.each(STYLE_ENGINES)(
    'rings a trace trigger as a border while it holds keyboard focus, as the state focused, for %s in %s',
    (engine, style) => {
      expect(slot(style, 'cn-trace-collapsible-trigger', engine, 'view', 'focused').classes).toEqual([
        'border-ring/50',
      ]);
    },
  );

  it.each(STYLE_ENGINES)(
    'spaces a questionnaire title from the choices when no description follows it, as the state description=none, for %s in %s',
    (engine, style) => {
      expect(slot(style, 'cn-questionnaire-title', engine, 'view', 'description=none').classes).toEqual([
        style === 'vega' ? 'mb-5' : 'mb-4',
      ]);
    },
  );

  it.each(STYLE_ENGINES)(
    'rings a questionnaire choice while its control holds keyboard focus, as the state focused, for %s in %s',
    (engine, style) => {
      expect(slot(style, 'cn-questionnaire-choice', engine, 'view', 'focused').classes).toEqual(['border-ring']);
    },
  );
});
