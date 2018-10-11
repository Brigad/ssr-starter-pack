import React from 'react';
import { renderToString } from 'react-dom/server';
import { Helmet } from 'react-helmet';

import App from './App';

import { initializeServerSideHeaders } from 'src/utils/EnvUtils';
import { isMobileBrowser } from 'src/utils/MobileUtils';

import {
  getPaceLoadingBarStyle,
  getPaceLoadingBarScript,
} from 'src/utils/InlineScriptsUtils';

const ENTRY_POINTS = ['main'];

const formatWebpackDevServerManifest = manifestObject =>
  Object.entries(manifestObject.clientStats.assetsByChunkName).reduce(
    (allManifest, [key, chunks]) => ({
      ...allManifest,
      ...(Array.isArray(chunks)
        ? chunks.reduce(
            (prev, curr) => ({
              ...prev,
              [`${key}${curr.endsWith('.css') ? '.css' : '.js'}`]: curr,
            }),
            {},
          )
        : { chunks }),
    }),
    {},
  );

const render = manifestObject => (req, res) => {
  const IS_PRODUCTION = __NODE_ENV__ === 'production';

  const manifest = IS_PRODUCTION
    ? manifestObject
    : formatWebpackDevServerManifest(manifestObject);

  initializeServerSideHeaders(req.headers);

  const context = {
    splitPoints: [],
  };

  const markup = renderToString(
    <App type="server" url={req.url} context={context} />,
  );

  if (context.url) {
    return res.redirect(302, context.url);
  }

  const helmet = Helmet.renderStatic();

  const LoadingBarStyle = !isMobileBrowser() ? getPaceLoadingBarStyle() : '';
  const LoadingBarScript = !isMobileBrowser() ? getPaceLoadingBarScript() : '';

  const splitPointsRegex = new RegExp(
    [...ENTRY_POINTS, ...context.splitPoints].join('|'),
  );
  const SplitPointsStyles = Object.keys(manifest)
    .filter(
      chunkName =>
        chunkName.endsWith('.css') &&
        (chunkName.length > 100 || chunkName.match(splitPointsRegex)),
    )
    .sort(
      a =>
        ENTRY_POINTS.find(entryPoint => a.split('.')[0] === entryPoint)
          ? -1
          : 1,
    )
    .map(
      chunk =>
        `
    <link rel="stylesheet" href="${!IS_PRODUCTION ? '/' : ''}${
          manifest[chunk]
        }" data-href="${!IS_PRODUCTION ? '/' : ''}${manifest[chunk]}" />
  `,
    )
    .join('\n');

  const InjectScripts = `
    <script>
      window.splitPoints = ${JSON.stringify(context.splitPoints)};
      window.serverSideHeaders = ${JSON.stringify(req.headers)};
    </script>
  `;

  const RuntimeScript = `
    <script src="${
      manifest && manifest['runtime.js']
        ? manifest['runtime.js']
        : '/client/runtime.js'
    }"></script>
  `;
  const EntryScripts = ENTRY_POINTS.map(
    entryPoint => `
    <script src="${!IS_PRODUCTION ? '/' : ''}${
      manifest[`${entryPoint}.js`]
    }"></script>
  `,
  );

  return res.send(`
    <!doctype html>
    <html>
      <head>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${helmet.script.toString()}
        ${helmet.noscript.toString()}

        ${SplitPointsStyles}
        ${LoadingBarStyle}
      </head>
      <body>
        <div id="content">${markup}</div>

        ${LoadingBarScript}
        ${InjectScripts}
        ${RuntimeScript}
        ${EntryScripts}
      </body>
    </html>
  `);
};

export default render;
