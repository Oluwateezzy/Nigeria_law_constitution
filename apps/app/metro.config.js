const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

const isolationHeaders = {
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

function applyIsolationHeaders(res) {
  for (const [name, value] of Object.entries(isolationHeaders)) {
    res.setHeader(name, value);
  }
}

const { ManifestMiddleware } = require('@expo/cli/build/src/start/server/middleware/ManifestMiddleware');
const serveWebIndex = ManifestMiddleware.prototype.handleWebRequestAsync;
ManifestMiddleware.prototype.handleWebRequestAsync = async function (req, res) {
  applyIsolationHeaders(res);
  return serveWebIndex.call(this, req, res);
};

const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhancedMiddleware = enhanceMiddleware
    ? enhanceMiddleware(middleware, metroServer)
    : middleware;
  return (req, res, next) => {
    applyIsolationHeaders(res);
    return enhancedMiddleware(req, res, next);
  };
};

const sqliteWorkerStub = path.resolve(
  projectRoot,
  'src/search/sqlite-worker-stub.mjs',
);
const sqliteWasm = path.resolve(
  workspaceRoot,
  'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm',
);
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'sqlite3-worker1.mjs') {
    return { type: 'sourceFile', filePath: sqliteWorkerStub };
  }
  if (moduleName === 'sqlite3.wasm') {
    return { type: 'asset', filePath: sqliteWasm };
  }
  if (resolveRequest) {
    return resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
