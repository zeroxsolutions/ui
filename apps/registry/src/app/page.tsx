import Link from 'next/link';

/**
 * The registry app index. It documents and live-previews `@zeroxsolutions/ui`
 * components in isolation (the Storybook replacement) and hosts the
 * shadcn-compatible registry served as static JSON under `/r/<name>.json`.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-semibold">@zeroxsolutions/ui registry</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Isolated component previews and the shadcn-compatible registry, served
        as static JSON under <code>/r/&lt;name&gt;.json</code>.
      </p>
      <nav aria-label="Component previews">
        <ul className="list-disc pl-5 text-sm">
          <li>
            <Link href="/preview/button" className="underline">
              Button preview
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
