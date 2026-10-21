import {
  HEIGHT_MESSAGE,
  OVERLAY_FRAME_HEIGHT,
  frameHeightOf,
  postHeightToHost,
  showsOverlay,
  type FramedWindow,
  type OverlayDocument,
} from './frame-height';

const ORIGIN = 'https://ui.zeroxsolutions.com';

describe('postHeightToHost', () => {
  it("posts the demo's height to the page framing it, on the preview's own origin only", () => {
    const posted: [unknown, string][] = [];
    const framed: FramedWindow = {
      location: { origin: ORIGIN },
      parent: { postMessage: (message, origin) => posted.push([message, origin]) },
    };

    postHeightToHost(framed, 148);

    expect(posted).toEqual([[{ type: HEIGHT_MESSAGE, height: 148 }, ORIGIN]]);
  });

  it('posts nothing when the preview is opened on its own, its parent being itself', () => {
    const posted: unknown[] = [];
    const alone: FramedWindow & FramedWindow['parent'] = {
      location: { origin: ORIGIN },
      postMessage: (message) => posted.push(message),
      parent: { postMessage: () => undefined },
    };
    alone.parent = alone;

    postHeightToHost(alone, 148);

    expect(posted).toEqual([]);
  });
});

describe('frameHeightOf', () => {
  it("is the demo's height while no overlay is open", () => {
    expect(frameHeightOf(148, false)).toBe(148);
  });

  it('is at least the overlay height while an overlay is open, so the overlay is not clipped', () => {
    expect(frameHeightOf(148, true)).toBe(OVERLAY_FRAME_HEIGHT);
    expect(frameHeightOf(OVERLAY_FRAME_HEIGHT + 100, true)).toBe(OVERLAY_FRAME_HEIGHT + 100);
  });
});

/** A document whose body holds elements with these tag names, ids and inline styles. */
function documentHolding(
  ...elements: [tagName: string, id?: string, style?: Partial<{ visibility: string; display: string }>][]
): OverlayDocument {
  return {
    body: {
      children: elements.map(([tagName, id = '', style = {}]) => ({
        tagName,
        id,
        style: { visibility: '', display: '', ...style },
      })),
    },
  };
}

describe('showsOverlay', () => {
  it("is false while the body holds only the app's root and the page's own markup", () => {
    expect(showsOverlay(documentHolding(['NOSCRIPT'], ['DIV', 'root'], ['SCRIPT']))).toBe(false);
  });

  it('is false while the body holds hidden elements beside the root, as the safe area provider and Uniwind keep', () => {
    expect(
      showsOverlay(
        documentHolding(['DIV', 'root'], ['DIV', '', { visibility: 'hidden' }], ['DIV', '', { display: 'none' }]),
      ),
    ).toBe(false);
  });

  it('is true while the body holds an element portalled beside the root, as an open dialog is on the web', () => {
    expect(showsOverlay(documentHolding(['NOSCRIPT'], ['DIV', 'root'], ['SCRIPT'], ['DIV']))).toBe(true);
  });
});
