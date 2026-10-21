const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: Metro watches the workspace and resolves both hoisted module trees.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.sourceExts.push('sql');

// expo-sqlite ships its web engine as a wasm asset that Metro must pass through.
config.resolver.assetExts.push('wasm');

// expo-sqlite web runs sync SQLite in a worker backed by SharedArrayBuffer,
// which browsers only expose to cross-origin isolated documents.
const enhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;

  return (request, response, next) => {
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    return enhanced(request, response, next);
  };
};

module.exports = config;
