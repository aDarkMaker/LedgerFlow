import path from 'node:path';

const ROOT = process.cwd();

/**
 * lint-staged always runs from the repo root, but the root ESLint config
 * ignores apps/ and packages/. Group files by workspace so each uses its own config.
 */
function lint(files) {
  const groups = new Map();

  for (const file of files) {
    const relative = path.relative(ROOT, file);
    const [top, name] = relative.split(path.sep);
    const directory = top === 'packages' || top === 'apps' ? path.join(ROOT, top, name) : ROOT;
    const staged = groups.get(directory) ?? [];
    staged.push(quote(file));
    groups.set(directory, staged);
  }

  return [...groups].map(
    ([directory, staged]) =>
      `pnpm --dir ${quote(directory)} exec eslint --fix --max-warnings=0 --no-warn-ignored ${staged.join(' ')}`,
  );
}

function quote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': lint,
  '*.{json,md,yml,yaml}': 'prettier --write',
};
