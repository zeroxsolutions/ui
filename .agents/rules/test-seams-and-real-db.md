## Unit-Test at the Interface Seams; Exercise the Data Layer on a Real Disposable DB
`[HIGH]` `test-seams-and-real-db`

Backend logic programs to interfaces (`I<entity>Service` / `I<entity>Repository`) and the write model's ports (the unit of work), so unit-test behind the seams the code already exposes: construct the subject directly and inject fakes - a service under test gets a fake repository, a command handler gets a fake unit of work plus an in-memory bus. No infrastructure, no framework. Because the logic layers are transport-agnostic, most logic is testable off-runtime this way.

A repository is the one seam a fake can't validate - a mocked Drizzle client exercises no SQL. Test repositories against a **real, disposable, local** database of the service's dialect (Postgres or D1 - see `CLAUDE.md`), never a shared or production one, which is flaky and destructive.

Code that touches a Worker binding (Hyperdrive, R2, `c.env`) can't run under plain Node. Prefer pushing its logic behind a port so the binding is mocked and the test stays a plain unit test; where a real runtime test is unavoidable, reach for the current Cloudflare-recommended Workers test tooling - verified against the docs, not a version pinned from memory.

**Incorrect - standing up infrastructure for logic, or mocking the query away:**
```ts
const svc  = new <Entity>Service(realDbBackedRepo);        // 🔴 real DB / runtime to test logic that has a seam
const repo = new <Entity>Repository(mockDrizzle);          // 🔴 mocked Drizzle validates no SQL
```
**Correct - fake at the seam; real DB only for the data layer:**
```ts
const svc  = new <Entity>Service(new Fake<Entity>Repository());              // ✅ inject a fake, no infrastructure
const repo = new <Entity>Repository(drizzle(disposableLocalConnection));    // ✅ exercise real SQL, dialect per CLAUDE.md
// ✅ binding-touching logic behind a port -> mocked -> stays a plain unit test
```
A write handler is tested by passing a fake `deps` (fake unit of work + in-memory bus) straight to it.

Reference: see `di-plain-construction`, `bounded-context-transport-agnostic`, `db-drizzle-hyperdrive-or-d1`, `run-through-nx`, [Cloudflare Workers testing](https://developers.cloudflare.com/workers/testing/)
