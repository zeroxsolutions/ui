import { HEIGHT_MESSAGE, postHeightToHost, type FramedWindow } from './frame-height';

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
