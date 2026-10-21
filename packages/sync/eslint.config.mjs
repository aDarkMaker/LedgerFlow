import { baseConfig, workspaceDir } from '@ledgerflow/config/eslint';

export default baseConfig({ rootDir: workspaceDir(import.meta.url) });
