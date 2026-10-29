# Architecture (keep updated — agents must read before coding)
## Layers
UI (src/app pages) -> server actions/route handlers -> src/lib/domain (business logic)
-> Prisma -> DB. Analyser pipeline: src/lib/analyser. Scheduler: src/instrumentation.ts.
## Conventions (fill in / correct from the real code)
- Auth/session helper: <file>      - Role/permission helper: <file>
- Config/env module: <file>        - Validation schemas: <file>
- Error handling pattern: <file>   - Test setup: <file>
## Data flow notes
Document, per feature, which tables are read/written, so changes can be impact-checked.
