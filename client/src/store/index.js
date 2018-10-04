

import { createStore, applyMiddleware, compose } from 'redux';
import logger from 'redux-logger';
import promiseMiddleware from 'redux-promise-middleware';

import rootReducer from '../reducers';

// A nice helper to tell us if we're on the server
export const isServer = !(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export default () => {
  const enhancers = [];

  // Dev tools are helpful
  if (process.env.NODE_ENV === 'development' && !isServer) {
    const devToolsExtension = window.devToolsExtension;

    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension());
    }
  }

  const middleware = process.env.NODE_ENV === 'development' ? [logger, promiseMiddleware()] : [promiseMiddleware()];
  const composedEnhancers = compose(
    applyMiddleware(...middleware),
    ...enhancers
  );

  // Do we have preloaded state available? Great, save it.
  const initialState = !isServer ? window.__PRELOADED_STATE__ : {};

  // Delete it once we have it stored in a variable
  if (!isServer) {
    delete window.__PRELOADED_STATE__;
  }

  // Create the store
  let store = createStore(
    rootReducer,
    initialState,
    composedEnhancers
  );

  if (module.hot) {
    module.hot.accept(() => {
      // This fetch the new state of the above reducers.
      const nextRootReducer = require('../reducers')
      store.replaceReducer(
        nextRootReducer
      )
    })
  }
  return store
}
