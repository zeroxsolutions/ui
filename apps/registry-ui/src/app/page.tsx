import { ButtonDemo } from '@/registry/bases/base-ui/examples/button-demo';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">ZeroXSolutions UI</h1>
        <p className="text-muted-foreground text-sm">
          Base UI components and blocks, distributed as a shadcn registry.
        </p>
      </header>

      <section className="rounded-lg border p-6">
        <ButtonDemo />
      </section>
    </main>
  );
}
