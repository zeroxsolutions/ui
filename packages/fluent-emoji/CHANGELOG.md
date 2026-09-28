## 0.1.0 (2026-09-28)

### 🚀 Features

- **fluent-emoji:** sync the artwork to R2 from CI ([620424f](https://github.com/zeroxsolutions/ui-sdk/commit/620424f))
- **fluent-emoji:** add the r2 sync planner ([a81fa75](https://github.com/zeroxsolutions/ui-sdk/commit/a81fa75))
- **node:** reset version ([65ba65a](https://github.com/zeroxsolutions/ui-sdk/commit/65ba65a))
- **nx:** migrate ([03c1a0e](https://github.com/zeroxsolutions/ui-sdk/commit/03c1a0e))
- **fluent-emoji:** add animated (anim) style, served from a CDN ([04398d6](https://github.com/zeroxsolutions/ui-sdk/commit/04398d6))
- **package:** change chiselart -> zeroxsolutions ([00beb5e](https://github.com/zeroxsolutions/ui-sdk/commit/00beb5e))
- **fluent-emoji:** make the artwork style reactive via React Context ([3dfe39d](https://github.com/zeroxsolutions/ui-sdk/commit/3dfe39d))
- **fluent-emoji:** ship 4 selectable styles with upstream gap-fill ([849a4c8](https://github.com/zeroxsolutions/ui-sdk/commit/849a4c8))
- **fluent-emoji:** self-host Fluent 3D emoji, drop the lobehub CDN ([56d423b](https://github.com/zeroxsolutions/ui-sdk/commit/56d423b))

### 💅 Refactors

- ⚠️ **fluent-emoji:** name the sync for its tool and API, not for R2 ([28df8af](https://github.com/zeroxsolutions/ui-sdk/commit/28df8af))
- ⚠️ **fluent-emoji:** sync with rclone instead of a hand-written S3 client ([ac7beb6](https://github.com/zeroxsolutions/ui-sdk/commit/ac7beb6))
- ⚠️ **icons,fluent-emoji:** rename modules to match primary export ([0cfdec9](https://github.com/zeroxsolutions/ui-sdk/commit/0cfdec9))

### ⚠️ Breaking Changes

- **fluent-emoji:** name the sync for its tool and API, not for R2 ([28df8af](https://github.com/zeroxsolutions/ui-sdk/commit/28df8af))
  the `production` environment must carry `S3_BUCKET` in place of
  `R2_BUCKET`, and the nx target is now `nx rclone:sync fluent-emoji`.
- **fluent-emoji:** sync with rclone instead of a hand-written S3 client ([ac7beb6](https://github.com/zeroxsolutions/ui-sdk/commit/ac7beb6))
  `--prune` is gone. `rclone sync` deletes what the source lacks, so an
  empty or mistyped assets/ would empty the bucket - the exact failure the old tool
  guarded against - and `copy` cannot express prune at all. Removing an object from the
  bucket is now a manual step.
  The gate loses this code entirely: a shell script that shells out has nothing to unit
  test, so tools/** leaves vite.config.mts test.include and tsconfig.spec.json include,
  along with the allowImportingTsExtensions pair that only node's type stripping needed.
  Also drops two things nothing referenced: the sharp devDependency, and the second
  @nx/vitest plugin registration - the one setting testMode: watch that CLAUDE.md already
  called a live defect. Its atomized test-ci targets went with it; no workflow ran them.
- **icons,fluent-emoji:** rename modules to match primary export ([0cfdec9](https://github.com/zeroxsolutions/ui-sdk/commit/0cfdec9))
  @zeroxsolutions/icons/ai-provider-config (a ./* subpath)
  is renamed to ai-provider-mappings. No in-repo consumer of that subpath;
  external consumers must update (major bump via nx release, cluster 5).
  The fluent-emoji lib renames are internal (only "." is exported).

### ❤️ Thank You

- Claude
- Claude Opus 4.8
- Claude Opus 4.8 (1M context)
- Claude Opus 5 (1M context)
- Lương Văn Tú

## 0.0.1 (2026-06-28)

### 🚀 Features

- **node:** reset version ([65ba65a](https://github.com/zeroxsolutions/ui-sdk/commit/65ba65a))
- **nx:** migrate ([03c1a0e](https://github.com/zeroxsolutions/ui-sdk/commit/03c1a0e))
- **fluent-emoji:** add animated (anim) style, served from a CDN ([04398d6](https://github.com/zeroxsolutions/ui-sdk/commit/04398d6))
- **package:** change chiselart -> zeroxsolutions ([00beb5e](https://github.com/zeroxsolutions/ui-sdk/commit/00beb5e))
- **fluent-emoji:** make the artwork style reactive via React Context ([3dfe39d](https://github.com/zeroxsolutions/ui-sdk/commit/3dfe39d))
- **fluent-emoji:** ship 4 selectable styles with upstream gap-fill ([849a4c8](https://github.com/zeroxsolutions/ui-sdk/commit/849a4c8))
- **fluent-emoji:** self-host Fluent 3D emoji, drop the lobehub CDN ([56d423b](https://github.com/zeroxsolutions/ui-sdk/commit/56d423b))

### ❤️ Thank You

- Claude Opus 4.8
- Claude Opus 4.8 (1M context)
- Lương Văn Tú
