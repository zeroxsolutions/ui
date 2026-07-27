## Name Files Kebab, Case Symbols by Kind, SCREAMING_SNAKE Env and Bindings
`[MEDIUM]` `naming-files-and-symbols`

All source files and directories are **kebab-case**, each **suffixed by its role** (`*-repository.ts`, `*-service.ts`, `*-card.tsx`) so a single glob - and your eye - finds every file of a layer; the exact suffix vocabulary per backend layer lives in `naming-backend-layers`. `index.ts` is the **only** barrel - one per directory, re-exporting that directory's public surface, nothing else.

Case each **TypeScript symbol by its kind**: values and functions **camelCase**; types, classes, and enums **PascalCase**; module-level constants **SCREAMING_SNAKE**; **port** interfaces carry an **`I` prefix** (`ICardService`, `IClassRepository`, `IUnitOfWork`) - a port is a swap-behind seam with a concrete impl **plus a second impl behind it** (a fake, a test double, an alternate adapter); define the `I*` port the moment that second impl appears, never speculatively. A **structural shape** - a dependency-bag (`*Deps`, `*Repositories`), an options object (`*Options`), env/variables (`*Env`, `*Variables`), a DTO - carries **no `I`**: it is shaped data with one realization, not a role with alternates. One-line test: *would this interface ever have a fake or a second impl?* yes -> port -> `I`; no -> shape -> no `I` (see `di-plain-construction`). A **value is named for what it holds**, not its grammatical role - a resolved dependency is `cardService`, never a bare `service` / `svc` / `repo`; that self-descriptive receiver is what lets a method stay bare (see `naming-backend-layers`). A React component is a **PascalCase** symbol living in a **kebab-case** file.

Env vars, secret names, and platform **bindings** are **SCREAMING_SNAKE, prefixed by concern** (`<APP>_DATABASE_URL`, `HYPERDRIVE`, `R2`) - bindings and env are matched by **exact name** at the platform boundary, so consistent case plus a concern prefix prevents collisions and marks the owner. Concrete per-repo names live in the worker's config or `CLAUDE.md`; keep secret values out of committed config (see `secrets-and-logging`).

**Incorrect - miscased file, symbol, or binding:**
```ts
// CardService.ts                          // 🔴 PascalCase file - should be card-service.ts
const MaxPageSize = 50;                     // 🔴 module constant -> MAX_PAGE_SIZE
class cardService {}                        // 🔴 class -> PascalCase, role-suffixed
const service = new CardService(cardRepository);   // 🔴 generic name - say what it holds
// wrangler binding "databaseUrl"           // 🔴 camelCase binding won't match at the boundary
```
**Correct - kebab file, kind-cased symbols, SCREAMING_SNAKE binding:**
```ts
// card-service.ts  +  index.ts (the one barrel)
const MAX_PAGE_SIZE = 50;
class CardService implements ICardService {}   // ✅ PascalCase + I-prefixed interface
const cardService = new CardService(cardRepository);   // ✅ named for its contents
const syncUser = () => {};                       // ✅ camelCase value
// binding: HYPERDRIVE, env: <APP>_DATABASE_URL   ✅ SCREAMING_SNAKE, concern-prefixed
```

**Why:**
- Kebab filenames avoid case clashes across OSes and make each layer greppable by one glob; kind-cased symbols let a reader infer a symbol's role from its name, and a value named for its contents keeps every call site self-descriptive; SCREAMING_SNAKE concern-prefixed env/bindings match by exact name at the platform boundary without collision.

Reference: see `naming-backend-layers`, `di-plain-construction`, `secrets-and-logging`
