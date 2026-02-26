# Phase 0 Research - Padel Host App (MVP)

## Decision 1: Backend framework and API contract
- **Decision**: Use FastAPI with Pydantic v2 for REST endpoints and strict request/response schemas.
- **Rationale**: Aligns with required stack, supports typed validation, and keeps API contracts explicit for frontend integration and future multi-client support.
- **Alternatives considered**:
  - Flask + Marshmallow: lighter but weaker typed contract ergonomics.
  - Django REST Framework: mature but heavier than needed for an MVP.

## Decision 2: Persistence strategy
- **Decision**: Use DuckDB as a file-based database for MVP and isolate all SQL in repository modules.
- **Rationale**: Meets raw SQL requirement, keeps local setup simple, and allows later migration by swapping repository implementations.
- **Alternatives considered**:
  - SQLite: acceptable for local MVP but not requested.
  - SQLAlchemy ORM: rejected due to explicit no-ORM constraint.

## Decision 3: Backend architecture boundaries
- **Decision**: Enforce layered design: domain -> services -> repositories -> API.
- **Rationale**: Keeps scheduling/scoring logic framework-independent and testable in pure unit tests.
- **Alternatives considered**:
  - Fat routers with inline SQL: faster short-term but brittle and harder to test.
  - Repository-only logic without services: mixes orchestration and domain rules.

## Decision 4: Scheduling model by event type
- **Decision**:
  - Americano: winners move up one court, losers move down one court, top-court winners stay.
  - Mexicano: regroup by round score into blocks of four; enforce no same partner in consecutive rounds when possible.
  - Beat the Box: groups of four based on persistent global ranking with fixed three-round partner rotation.
- **Rationale**: Exactly maps to business rules while keeping deterministic behavior for testing.
- **Alternatives considered**:
  - Randomized re-pairing each round: violates explicit mode rules.
  - Global optimization solvers: unnecessary complexity for MVP.

## Decision 5: Scoring strategy
- **Decision**:
  - Americano stores win/loss outcomes and updates event-local standings.
  - Mexicano stores explicit team scores that must sum to 24; each player gets team score.
  - Beat the Box applies persistent global ranking deltas (+25 win, -15 loss, +5 draw).
- **Rationale**: Preserves required input modes and enables accurate event summary and future stats.
- **Alternatives considered**:
  - Winner-only normalized schema: loses required Mexicano point detail.

## Decision 6: Frontend architecture
- **Decision**: Use React Router page flow (Home, Create, Preview, Run, Summary) with a reusable AppShell and typed API client.
- **Rationale**: Supports host workflow clarity and keeps presentation reusable across modes.
- **Alternatives considered**:
  - Single mega-screen workflow: reduces navigation clarity and maintainability.

## Decision 7: Design system and interaction patterns
- **Decision**: Use shadcn/ui primitives with Tailwind tokens; add LightRays as non-blocking background and MagicBento for home navigation with stars disabled.
- **Rationale**: Matches requested visual direction while preserving readability and performance.
- **Alternatives considered**:
  - Heavy animation everywhere: risks usability degradation on live event screens.
  - Plain utility-only UI: misses requested design language.

## Decision 8: API interaction shape for running screens
- **Decision**: Return a consistent round view model containing selected courts and per-court match input metadata after start, result submit, and round advance.
- **Rationale**: Minimizes frontend branching and keeps run screen state synchronized.
- **Alternatives considered**:
  - Multiple endpoint-specific payload shapes: increases frontend complexity.

## Decision 9: Testing strategy
- **Decision**: Prioritize unit tests for scheduling/scoring, integration tests for repositories with temporary DuckDB files, and API happy-path/error-path tests per mode.
- **Rationale**: Protects critical match assignment and scoring rules while ensuring persistence correctness.
- **Alternatives considered**:
  - API-only tests: insufficient coverage for complex mode logic.

## Decision 10: Future multi-user readiness
- **Decision**: Keep repository interfaces storage-agnostic and centralize event state transitions in services.
- **Rationale**: Reduces rework when moving to Postgres, auth/roles, and real-time update mechanisms.
- **Alternatives considered**:
  - Embedding state transitions directly in routers or SQL scripts: harder to evolve for concurrent users.

## Decision 11: Constitution gate handling
- **Decision**: Treat constitution as non-enforceable placeholder and use explicit feature requirements plus repo guidelines as temporary gates.
- **Rationale**: `.specify/memory/constitution.md` contains unresolved template tokens, so strict automated gate checks are unavailable.
- **Alternatives considered**:
  - Hard-stop planning: rejected because it blocks delivery without adding product certainty.
