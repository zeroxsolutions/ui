import { expect, test } from './test/fixtures';

test('the native pages from before /native answer 301 with their new address, the query kept', async ({ request }) => {
  for (const [old, location] of [
    ['/docs/native', '/native/docs'],
    ['/docs/native/installation', '/native/docs/installation'],
    ['/docs/native.md', '/native/docs.md'],
    ['/docs/native/installation.md', '/native/docs/installation.md'],
    ['/docs/native/button.md', '/native/components/nativewind/button.md'],
    ['/docs/native/button', '/native/components/nativewind/button'],
    ['/docs/native/tab-bar?style=nova', '/native/components/nativewind/tab-bar?style=nova'],
  ]) {
    const response = await request.get(old, { maxRedirects: 0 });

    expect(response.status(), old).toBe(301);
    expect(response.headers()['location'], old).toBe(location);
  }
});
