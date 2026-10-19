import js from '@eslint/js';
import expo from 'eslint-config-expo/flat.js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import cjk from './rules/no-cjk-comment.mjs';

const IGNORES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.expo/**',
  '**/.turbo/**',
  '**/android/**',
  '**/ios/**',
  '**/src/icons/generated/**',
  '**/migrations.generated.ts',
];

const SHARED_RULES = {
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-else-return': ['error', { allowElseIf: false }],
  'no-implicit-coercion': 'error',
  'no-param-reassign': ['error', { props: false }],
  'object-shorthand': ['error', 'always'],
  'prefer-const': ['error', { destructuring: 'all' }],
  eqeqeq: ['error', 'smart'],
  'ledgerflow/no-cjk-comment': 'error',
};

const TS_RULES = {
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
};

/** Rules that need the type checker; only enabled when a project is attached. */
const TYPED_RULES = {
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/require-await': 'error',
  '@typescript-eslint/return-await': ['error', 'in-try-catch'],
};

const IMPORT_RULES = {
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
      pathGroups: [
        { pattern: '@ledgerflow/**', group: 'internal', position: 'before' },
        { pattern: 'react', group: 'external', position: 'before' },
      ],
      pathGroupsExcludedImportTypes: ['react', 'builtin'],
    },
  ],
  'import/no-cycle': ['error', { maxDepth: 6, ignoreExternal: true }],
  'import/no-default-export': 'off',
  // Expo packages ship an exports map the namespace resolver cannot follow.
  'import/namespace': 'off',
};

const REACT_RULES = {
  'react/jsx-boolean-value': ['error', 'never'],
  'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
  'react/self-closing-comp': 'error',
  'react-hooks/exhaustive-deps': 'error',
  'react-hooks/rules-of-hooks': 'error',
};

const TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];
const SCRIPT_FILES = ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'];

/**
 * The IDE launches ESLint from the monorepo root, so type-aware parsing must be
 * pinned to the workspace that owns the linted files; otherwise typescript-eslint
 * aborts with "multiple candidate TSConfigRootDirs".
 */
function typedConfig(rootDir) {
  return {
    files: TS_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: rootDir,
      },
    },
  };
}

/** Scripts and configs stay outside the type programs and run untyped. */
function scriptConfig() {
  return {
    files: SCRIPT_FILES,
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      parserOptions: { project: false, projectService: false, program: null },
      globals: { ...globals.node },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/no-require-imports': 'off',
    },
  };
}

/** Shared preset for every workspace. */
export function baseConfig({ rootDir = process.cwd(), typeChecked = true } = {}) {
  return tseslint.config(
    { ignores: IGNORES },
    js.configs.recommended,
    ...(typeChecked ? tseslint.configs.recommendedTypeChecked : tseslint.configs.recommended),
    ...(typeChecked ? [typedConfig(rootDir)] : []),
    {
      plugins: { ledgerflow: cjk, import: importPlugin },
      rules: {
        ...SHARED_RULES,
        ...TS_RULES,
        ...IMPORT_RULES,
        ...(typeChecked ? TYPED_RULES : {}),
      },
    },
    scriptConfig(),
  );
}

/** Expo + React preset for app and UI packages. */
export function reactConfig({ rootDir = process.cwd() } = {}) {
  return tseslint.config(
    { ignores: IGNORES },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...expo,
    typedConfig(rootDir),
    {
      plugins: { ledgerflow: cjk },
      languageOptions: {
        globals: { ...globals.browser, ...globals.node },
        parserOptions: {
          projectService: true,
          tsconfigRootDir: rootDir,
          ecmaFeatures: { jsx: true },
        },
      },
      settings: {
        react: { version: 'detect' },
        'import/resolver': { typescript: { alwaysTryTypes: true }, node: true },
      },
      rules: { ...SHARED_RULES, ...TS_RULES, ...TYPED_RULES, ...IMPORT_RULES, ...REACT_RULES },
    },
    scriptConfig(),
  );
}
