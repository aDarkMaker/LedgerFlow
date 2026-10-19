/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies break tree-shaking and imply a design smell.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-stays-pure',
      severity: 'error',
      comment: 'The domain package must not depend on UI, storage or network concerns.',
      from: { path: '^packages/core' },
      to: { path: '^(packages/(ui|db|sync)|apps/)' },
    },
    {
      name: 'ui-stays-presentational',
      severity: 'error',
      comment: 'UI primitives may only consume tokens and domain types.',
      from: { path: '^packages/ui' },
      to: { path: '^(packages/(db|sync)|apps/)' },
    },
    {
      name: 'db-no-ui',
      severity: 'error',
      from: { path: '^packages/db' },
      to: { path: '^(packages/ui|apps/)' },
    },
    {
      name: 'sync-no-ui',
      severity: 'error',
      from: { path: '^packages/sync' },
      to: { path: '^(packages/ui)' },
    },
    {
      name: 'app-does-not-import-server-sdk',
      severity: 'error',
      comment: 'Service role credentials never ship inside the client bundle.',
      from: { path: '^apps/' },
      to: { path: 'node_modules/@supabase/supabase-js/.+service' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(node_modules|\\.expo|dist|generated)' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    reporterOptions: { dot: { collapsePattern: 'node_modules/[^/]+' } },
  },
};
