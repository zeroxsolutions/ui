import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSlotMap } from './slot-map';
import { parseSpacingVariables, translateClasses, type Engine } from './translate';

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
      expect(translateClasses(['border-2', 'ring-1', 'ring-ring'], 'uniwind', 'view').classes).toEqual(['border-2']);
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
