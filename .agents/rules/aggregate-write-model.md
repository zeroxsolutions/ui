## Model Writes Through Aggregates and Value Objects; Read Through the Row
`[HIGH]` `aggregate-write-model`

A write-owning `<domain>` context splits its two paths (CQRS). The **write** path is a **Command → handler → load one Aggregate**: the aggregate root is the **consistency boundary** — it enforces every invariant that must hold together, mutates in place, and `raise()`s **Domain Events** — then persists inside one atomic Unit of Work (see `unit-of-work-and-outbox`). A write mutates **exactly one aggregate per transaction**; aggregates reference each other **by branded id**, never by holding another aggregate instance, and a rule spanning two aggregates is coordinated by a Domain Event (eventual consistency), not one transaction. The aggregate is a **pure class** — no I/O, no DI, no framework — whose methods take value objects / primitives.

A **Value Object** — a domain concept defined by its attributes, not an identity (`Money`, `ExamWindow`, `RecurrenceRule`) — is an **immutable, pure class in `lib/domain/`** extending the house toolkit's `ValueObject` base, equal by value (see `lib-house-toolkits`). It has no id, no I/O, no DI; it validates its invariants **in construction** and exposes behavior as methods that return **new** instances. `lib/domain/` is the sanctioned layer for aggregates and value objects (see `structure-lib-layers`), not an arbitrary concept bucket. A domain VO differs from a `lib/utils/` value class: the VO owns a **domain invariant + value equality**; the util is a stateless helper with no domain rule.

The **read** path never touches the write stack: a query returns a persistence **row**, and its DTO is **derived from that row** (see `contract-derive-schema`), never from an aggregate. A create/update route returns the aggregate's **id**, then **re-reads the row post-commit** to serialize the response document — a DTO is never mapped from an aggregate. Keep the two persistence seams as **distinct classes**: the row repository (read side — `findOne` / `findAll` → rows; see `naming-backend-layers`) and the aggregate repository (write side — `load` / `save` → aggregates, with row↔aggregate mapping). The aggregate repo MAY compose the row repo but never merges both responsibilities into one class.

**Incorrect — a DTO from an aggregate, merged seams, two aggregates in one tx, or a bare mutable VO:**
```ts
return c.json(serialize(classAggregate));            // 🔴 DTO mapped from an aggregate — derive it from the re-read row
class ClassRepository { load(id) {} findAll(q) {} }  // 🔴 read-row + write-aggregate merged into one class
await uow.run(async (repos) => {
  const klass  = await repos.classes.load(id);
  const roster = await repos.rosters.load(rid);      // 🔴 two aggregates mutated in one transaction
});
export interface Money { amount: number }            // 🔴 a value object is an immutable class, not a bare mutable type
```
**Correct — write via one aggregate; read via the re-read row; VO immutable and equal by value:**
```ts
// write: Command → one aggregate (invariants + events) → Unit of Work
const id  = await bus.send(new EnrollStudent({ classId, studentId, actorId }));
// read: re-read the row post-commit; the DTO derives from the row only
const row = await read.classes.findOne({ id, orgId });
return c.json(serialize(row), 201);
// value object — immutable, equal by value, invariant validated in construction
export class Money extends ValueObject {
  constructor(readonly amount: number, readonly currency: string) {
    super(); if (amount < 0) throw new NegativeAmount();
  }
  add(other: Money): Money { return new Money(this.amount + other.amount, this.currency); }
}
```

Reference: see `unit-of-work-and-outbox` · `message-bus-and-handlers` · `contract-derive-schema` · `repo-extend-baserepository` · `structure-lib-layers` · `lib-house-toolkits` · `naming-backend-layers`
