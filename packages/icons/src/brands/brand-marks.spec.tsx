import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { GithubMark } from './github-mark';
import { DeepgramMark } from './deepgram';
import { InworldMark } from './inworld';
import { LeonardoMark } from './leonardo';
import { PipecatMark } from './pipecat';

afterEach(cleanup);

describe('GithubMark', () => {
  it('renders a currentColor svg and forwards arbitrary props', () => {
    const { container } = render(
      <GithubMark className="size-4" data-testid="gh" aria-label="GitHub" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.classList.contains('size-4')).toBe(true);
    // ...props passthrough reaches the svg.
    expect(svg?.getAttribute('data-testid')).toBe('gh');
    expect(svg?.getAttribute('aria-label')).toBe('GitHub');
  });
});

describe('brand marks (lobehub size API)', () => {
  // Each vendored mark mirrors the @lobehub/icons color-mark signature so it can
  // sit in a provider→mark registry rendered via `<Icon size="1em" />`.
  const marks = [
    ['DeepgramMark', DeepgramMark],
    ['InworldMark', InworldMark],
    ['LeonardoMark', LeonardoMark],
    ['PipecatMark', PipecatMark],
  ] as const;

  it.each(marks)('%s renders an svg sized via the size prop', (_name, Mark) => {
    const { container } = render(<Mark size="1em" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('LeonardoMark applies the size prop to width/height', () => {
    const { container } = render(<LeonardoMark size={24} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });
});
