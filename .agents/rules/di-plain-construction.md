## Wire Dependencies by Plain Construction Against Interfaces
`[HIGH]` `di-plain-construction`

Backend logic depends on **interfaces** — `I<Entity>Repository`, `I<Entity>Service`, the `IUnitOfWork` port — never a concrete class. The interface is the **seam** a test fakes and an implementation swaps behind. Wiring is **plain construction**: the per-invocation `bootstrap` (the one composition root) constructs each concrete and passes it to its consumer by constructor argument or closure — nothing is registered or resolved at runtime, and only the `bootstrap` names a concrete class; the rest of `lib/` sees the interface. Env-derived deps (the DB client, the unit of work) are built by the transport per invocation and passed into the `bootstrap`; pure deps (`clock`, `ids`) are defaulted.

Backend code is plain functions and classes, and nothing reads runtime type information — so the whole object graph is ordinary readable code in one `bootstrap`, and the build compiles with **esbuild** (`@nx/esbuild`), the same bundler the workers use, with no extra build machinery. A jest spec constructs its subject directly with fakes at the same interface seams.

**Incorrect — a consumer bound to a concrete class:**
```ts
class CardService {
  constructor(private repo: CardRepository) {}   // 🔴 depends on the concrete class, not the seam
}
```

**Correct — depend on the interface; the bootstrap constructs the concrete:**
```ts
class CardService implements ICardService {
  constructor(private readonly repo: ICardRepository) {}   // ✅ depends on the seam
}
// lib/bootstrap.ts — the one place that names concretes
const cards = new CardService(new CardRepository(tx));     // ✅ plain construction
```

**Rules of thumb:**
- Depend on `I<Entity>Repository` / `I<Entity>Service` / `IUnitOfWork` interfaces; only the `bootstrap` names a concrete class.
- Wiring is plain construction at the composition root — nothing to register, nothing to resolve at runtime.
- Interfaces are test seams and swap points; a jest spec injects a fake at the same seam.
- Env-derived deps are built per invocation by the transport and passed into the bootstrap; pure deps default.

**Why:**
- Programming to interfaces keeps the domain testable (a fake at the seam) and swappable, and wiring by plain construction keeps the whole object graph readable as ordinary code in one bootstrap — nothing to register, nothing to resolve.

Reference: see `message-bus-and-handlers` · `db-client-per-invocation` · `test-seams-and-real-db` · `run-through-nx`
