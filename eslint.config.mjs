import { baseConfig } from '@ledgerflow/config/eslint';

/**
 * Root config covers repository tooling only; each workspace resolves its own
 * config, so the IDE and turbo agree on the typed parser settings.
 */
export default [
  { ignores: ['apps/**', 'packages/**', 'supabase/**'] },
  ...baseConfig({ rootDir: import.meta.dirname, typeChecked: false }),
];
