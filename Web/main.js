/* eslint-disable */
// import '@babel/polyfill';
// import 'react-hot-loader';
import 'whatwg-fetch';

import FastClick from 'fastclick';
import React from 'react';
import { Provider } from 'react-redux';
import Utils from './core/Utils';
// import {AppContainer, hot} from 'react-hot-loader';
import { createRoot } from 'react-dom/client';

import * as Sentry from '@sentry/browser';
import store from './core/store';
import { AppMain } from './src/AppMain';
import Constants from './src/constants/Constants';

// import { setConfig } from 'react-hot-loader'
// setConfig({ /*pureSFC: true, */logLevel: 'debug' });

!Constants.flags.onprem &&
  Sentry.init({
    dsn: 'https://3562c3aa61504cbf8ead291f6331f65c@sentry.io/1480810',
    ignoreErrors: ['ResizeObserver loop limit exceeded'],
  });

if (document.getElementById('useReact')) {
  if (!window.piConstsAlready) {
    window.piConstsAlready = true;
  }

  if (!window['isD'] && !window.alreadyRaven) {
    // Sentry.init({
    //  dsn: "https://@sentry.io/"
    // });
    window.alreadyRaven = true;
    window.ravenE = true;
  } else {
    window.ravenE = false;
  }

  const container = document.getElementById('container');

  Utils.setGlobalStore(store);

  const root = createRoot(container);
  //ReactDOM
  root.render(
    <Provider store={store}>
      <AppMain />
    </Provider> /*, container*/,
  );

  // Eliminates the 300ms delay between a physical tap
  // and the firing of a click event on mobile browsers
  // https://github.com/ftlabs/fastclick
  FastClick.attach(document.body);

  if (module.hot) {
    module.hot.accept();
    module.hot.accept('./src/stores/reducers', () => {
      const nextRootReducer = require('./core/store');
      store.replaceReducer(nextRootReducer);
    });
  }
}
