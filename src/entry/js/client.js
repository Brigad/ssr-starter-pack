import React from 'react';
import { hydrate } from 'react-dom';

import App from './App';
import * as Bundles from './components/Bundles';

import { initializeServerSideHeaders } from 'src/utils/EnvUtils';

const serverSideHeaders = window.serverSideHeaders || {};
initializeServerSideHeaders(serverSideHeaders);

const splitPoints = window.splitPoints || [];
Promise.all(splitPoints.map(chunk => Bundles[chunk].loadComponent())).then(
  () => {
    hydrate(<App type="client" />, document.getElementById('content'));
  },
);
