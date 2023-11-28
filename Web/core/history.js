/* eslint-disable */
var createBrowserHistory = require('history').createBrowserHistory;
// import useQueries from 'history/lib/useQueries';
import _ from 'lodash';

var history = /*useQueries(*/ createBrowserHistory();

history.gotoPush = function (pageName, values) {
  let url = '/' + pageName + '/';

  if (values && _.isObject(values)) {
    if (pageName === 'v') {
      url += (values.uuid || '') + '/' + (values.artId || '') + '/';
    }
  }

  let max = 30;
  while (max > 0 && _.endsWith(url, '/')) {
    url = url.substring(0, url.length - 1);
    max--;
  }

  history.push(url);
};

history.listen(function (loc) {
  window.didChangeLocation = true;
  window.isNewLocation = false;
  window.isNewLocationActivity = false;
  if (loc.action === 'POP' || loc.action === 'REPLACE') {
    var query = window.location.pathname || window.location.search;
    setTimeout(() => {
      if (typeof gtag !== 'undefined' && query) {
        gtag('config', 'UA-138588938-1', {
          page_path: query,
        });
      } else if (typeof ga !== 'undefined' && query) {
        ga('set', 'page', query);
        ga('send', 'pageview');
      }
      // Utils.checkCookiesGotoHome();
    }, 200);
    return;
  }

  //Allow the client to control scroll-to-top using location.state
  if (loc.state && loc.state.scroll !== undefined && !loc.state.scroll) {
    return;
  }

  //delay hack (for Firefox?)
  window.isNewLocation = true;
  window.isNewLocationActivity = true;
  setTimeout(() => {
    var query = window.location.pathname || window.location.search;
    setTimeout(() => {
      if (typeof gtag !== 'undefined' && query) {
        gtag('config', 'UA-138588938-1', {
          page_path: query,
        });
      } else if (typeof ga !== 'undefined' && query) {
        ga('set', 'page', query);
        ga('send', 'pageview');
      }
    }, 200);
    // Utils.checkCookiesGotoHome();
    window.scrollTo(0, 0);
  }, 0);
});

history.sendGA = function () {
  // if(typeof gtag !== 'undefined') {
  //   gtag('config', 'UA-138588938-1', {});
  // } else if(typeof ga !== 'undefined') {
  //   ga('send', 'pageview');
  // }
};

export default history;
