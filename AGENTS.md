# Repository coding instructions

- Every code, UI, behaviour or data-flow change must increase the visible in-app semantic version and add a concise changelog entry. Use one version metadata source of truth in each deployable tool where possible, and keep links/cache versions consistent.
- Keep the public production Should I Fix calculator and shared customer views isolated from test/preview changes until relevant tests pass.
- Preserve UK energy tariff region units and source PDF references. Never identify a historical tariff version solely using a source_ref; use a unique version ID when source_ref is shared by different PDFs.
- When pre/post-April classification is inferred from a lower/higher published rate pair rather than an explicitly dated PDF, carry that evidence classification and do not silently overwrite historical input.
