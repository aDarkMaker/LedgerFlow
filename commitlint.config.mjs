export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 120],
    'scope-empty': [2, 'never'],
    'scope-enum': [
      2,
      'always',
      ['repo', 'config', 'core', 'db', 'sync', 'ui', 'mobile', 'release', 'deps', 'docs'],
    ],
  },
};
