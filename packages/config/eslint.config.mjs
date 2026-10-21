import { baseConfig, workspaceDir } from './eslint/index.mjs';

export default baseConfig({ rootDir: workspaceDir(import.meta.url), typeChecked: false });
