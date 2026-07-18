## Extend `BaseRepository`; Add Custom Finders Only
`[HIGH]` `repo-extend-baserepository`

In a bounded context's `lib/` data layer, a repository interface **extends `IBaseRepository<typeof <entity>Table, AppSchema, '<entity>Table'>`** - **three** type args: the table, the schema-namespace type (`AppSchema = typeof schema`), and the table's **export-name key** as a string literal (`'<entity>Table'`) for precise relational typing - **plus custom finders only**. Never re-declare inherited CRUD; that breaks `IBaseRepository`'s contract. The class mirrors the interface - `extends BaseRepository<typeof <entity>Table, AppSchema, '<entity>Table'>` - and passes the same export-name key as the 3rd `super` arg (`super(db, <entity>Table, '<entity>Table')`); the drizzle client arrives as a plain constructor argument. For a paginated/searchable list, add a `findAllAndCount...` finder returning `Promise<[<Entity>[], number]>`, built with the house DB toolkit's `buildFilterConditions` + `FilterValue` and its `FindAllAndCountOptions` / `FindOneOptions` types (subpaths in the `CLAUDE.md` catalog).

Repositories are **data access only** - no business logic lives here (that belongs to the service). A listable entity's `findAllAndCount...` finder honors a **whitelist** of filterable/sortable fields from the query adapter: it rejects a `filter`/`sort` on any field outside the whitelist and never builds a SQL condition for a hidden column such as an access code (see `hono-openapi-routes`).

**Incorrect - re-declared CRUD / hand-rolled pagination:**
```ts
interface I<Entity>Repository extends IBaseRepository</* ... */> {
  findOne(id: string): Promise<Entity>;               // 🔴 re-declares inherited CRUD
}
// ... `LIMIT ${n} OFFSET ${m}` assembled by hand         // 🔴 build it with the toolkit
```

**Correct - extend, add only entity-specific finders:**
```ts
class <Entity>Repository extends BaseRepository<typeof <entity>Table, AppSchema, '<entity>Table'> {
  constructor(db: DrizzleClient) { super(db, <entity>Table, '<entity>Table'); }
  findAllAndCountByOrg(/* ... */): Promise<[Entity[], number]> { /* buildFilterConditions + FindAllAndCountOptions */ }
}
```

**Why:**
- The toolkit already implements CRUD, soft-delete, pagination, and relations; re-implementing them invites drift and subtle typing breaks. Passing the table's export-name string literal as the 3rd arg to both the type and `super` is what drives the relational typing.

Reference: see `lib-house-toolkits`, `db-client-per-invocation`, `hono-openapi-routes`
