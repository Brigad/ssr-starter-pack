const pkg = require('./package.json');

const ENVS = {
  WEB_CLIENT_DEVELOPMENT: 'web-client-development',
  WEB_CLIENT_PRODUCTION: 'web-client-production',
  WEB_SERVER_DEVELOPMENT: 'web-server-development',
  WEB_SERVER_PRODUCTION: 'web-server-production',
  TEST: 'test',
};

module.exports = api => {
  api.cache(true);

  const env = process.env.NODE_ENV;

  const presets = [
    [
      '@babel/env',
      {
        modules: [ENVS.TEST].includes(env) ? 'commonjs' : false,
        useBuiltIns: [ENVS.TEST].includes(env) ? 'usage' : 'entry',
        ...([
          ENVS.WEB_SERVER_DEVELOPMENT,
          ENVS.WEB_SERVER_PRODUCTION,
          ENVS.TEST,
        ].includes(env)
          ? { targets: { node: pkg.engines.node } }
          : {}),
      },
    ],
    '@babel/react',
    '@babel/typescript',
  ];

  const plugins = [
    '@babel/proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import',
    [ENVS.WEB_CLIENT_DEVELOPMENT, ENVS.WEB_SERVER_DEVELOPMENT].includes(env) &&
      '@babel/transform-react-jsx-source',
  ].filter(Boolean);

  return {
    presets,
    plugins,
  };
};
