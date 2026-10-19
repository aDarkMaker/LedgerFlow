# LedgerFlow

Local-first spending tracker for people who want to know how much leaves their wallet every day.
Built as a pnpm + Turborepo monorepo with an Expo (Android first) client, an SQLite write model and
Supabase as the sync backend.

## Workspace layout

| Path              | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `apps/mobile`     | Expo Router application (Android only for now)                   |
| `packages/core`   | Pure domain logic: money, dates, aggregates, budgets, streaks    |
| `packages/db`     | Drizzle schema, repositories and the generated migration bundle  |
| `packages/sync`   | Supabase client, outbox engine and remote gateway                |
| `packages/ui`     | Sticker design tokens, primitives, charts and the icon pipeline  |
| `packages/config` | Shared ESLint, Prettier, TypeScript and cspell presets           |
| `supabase`        | Postgres schema, RLS policies and triggers                       |
| `tooling`         | Icon export, migration bundling and placeholder asset generation |

Dependencies only point inward: `mobile -> sync -> db -> core`, and `ui` may consume domain types but
never storage or network code. `pnpm deps:check` enforces this in CI.

## Getting started

```bash
corepack enable
pnpm install
cp apps/mobile/.env.example apps/mobile/.env
pnpm android          # needs an attached device or emulator
```

Required environment values:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Never place the service role key in the repository or the client bundle: the app only needs the anon
key, and every table is protected by row level security.

## Scripts

| Command           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `pnpm dev`        | Start the Expo dev server through Turbo             |
| `pnpm android`    | Build and run on an Android device or emulator      |
| `pnpm lint`       | ESLint across every workspace                       |
| `pnpm typecheck`  | TypeScript project checks                           |
| `pnpm test`       | Vitest suites for `core`, `db` and `sync`           |
| `pnpm format`     | Prettier write                                      |
| `pnpm spell`      | cspell over source, config and docs                 |
| `pnpm deps:check` | Dependency boundary rules                           |
| `pnpm icons`      | Regenerate icons from the iconify manifest          |
| `pnpm migrations` | Inline SQLite migrations into the TypeScript bundle |
| `pnpm verify`     | Everything CI runs, in one command                  |

## Data model

Amounts are stored as integer minor units (`amount_cents`) and dates as local `YYYY-MM-DD` strings, so
no timezone conversion can shift a transaction to another day. Every mutation writes the business row
and an outbox entry in one SQLite transaction; the sync engine drains the outbox when the app is
online and authenticated. Deletes are tombstones, and conflicts resolve with last write wins.

## Design language

The UI is a printed sticker sheet: cream canvas, ink borders, hard offset shadows and a coral, gold
and teal accent trio. Bricolage Grotesque carries headings and amounts, Inter handles body copy, and
every number uses tabular figures so animated amounts never jitter. Open `/(dev)/gallery` in a
development build to inspect tokens, primitives, charts and the icon set.

## Backend setup

```bash
supabase link --project-ref <project-ref>
supabase db push
```

`supabase/migrations/0001_init.sql` creates the mirrored tables, ownership policies and the
`updated_at` trigger. The app expects email OTP sign-in; no additional auth configuration is needed
beyond enabling email signups in the dashboard.

## Release

Android builds run through EAS from GitHub Actions. Add `EXPO_TOKEN`, `EAS_PROJECT_ID`,
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as repository secrets, then trigger
the "Release Android" workflow or push a `v*` tag. iOS is intentionally out of scope for now.

## Commit conventions

Conventional commits with a mandatory scope from `commitlint.config.mjs`:
`repo`, `config`, `core`, `db`, `sync`, `ui`, `mobile`, `release`, `deps`, `docs`.
