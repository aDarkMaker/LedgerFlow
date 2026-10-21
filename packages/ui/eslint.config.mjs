import { reactConfig, workspaceDir } from '@ledgerflow/config/eslint';

export default reactConfig({ rootDir: workspaceDir(import.meta.url) });
