import React from 'react';
import { renderToString } from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';

import App from './App';

import storage from '../../store';
import { initializeServerSideHeaders } from 'src/utils/EnvUtils';
import { isMobileBrowser } from 'src/utils/MobileUtils';

import { getPaceLoadingBarStyle, getPaceLoadingBarScript } from 'src/utils/InlineScriptsUtils';

const store = storage();

const render = manifests => (req, res) => {
  initializeServerSideHeaders(req.headers);

  const context = {
    splitPoints: [],
  };

  const markup = renderToString(
    <Provider store={store} key='provider'>
      <App type='server' url={req.url} context={context} />
    </Provider>
  );

  if (context.url) {
    return res.redirect(302, context.url);
  }

  const helmet = Helmet.renderStatic();

  const LoadingBarStyle = !isMobileBrowser() ? getPaceLoadingBarStyle() : '';
  const LoadingBarScript = !isMobileBrowser() ? getPaceLoadingBarScript() : '';

  const SplitPointsScript = `
    <script>
      window.__PRELOADED_STATE__ = ${JSON.stringify(store.getState()).replace(/</g, '\\u003c')};
      window.splitPoints = ${JSON.stringify(context.splitPoints)};
      window.serverSideHeaders = ${JSON.stringify(req.headers)};
    </script>
  `;
  const ChunkManifestScript = manifests.client ? `
    <script src="${manifests.client['manifest.js']}"></script>
  ` : '';

  return res.send(`
    <!doctype html>
    <html>
      <head>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${helmet.script.toString()}
        ${helmet.noscript.toString()}

        <link rel="stylesheet" href="${!manifests.server ? '/dist/server/main.css' : manifests.server['main.css']}" />
        ${LoadingBarStyle}
      </head>
      <body>
        <div id="content">${markup}</div>
        ${LoadingBarScript}
        ${SplitPointsScript}
        ${ChunkManifestScript}
        <script src="${!manifests.client ? '/dist/client/vendors.js' : manifests.client['vendors.js']}"></script>
        <script src="${!manifests.client ? '/dist/client/main.js' : manifests.client['main.js']}"></script>
      </body>
    </html>
  `);
};

export default render;
