/* eslint-disable */
import React from 'react';

function decodeParam(val) {
  if (!(typeof val === 'string' || val.length === 0)) {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `Failed to decode param '${val}'`;
      err.status = 400;
    }

    throw err;
  }
}

// Match the provided URL path pattern to an actual URI string. For example:
//   matchURI({ path: '/posts/:id' }, '/dummy') => null
//   matchURI({ path: '/posts/:id' }, '/posts/123') => { id: 123 }
function matchURI(route, path) {
  const match = route.pattern.exec(path);

  if (!match) {
    return null;
  }

  const params = Object.create(null);

  for (let i = 1; i < match.length; i++) {
    params[route.keys[i - 1].name] = match[i] !== undefined ? decodeParam(match[i]) : undefined;
  }

  return params;
}

// Find the route matching the specified location (context), fetch the required data,
// instantiate and return a React component
let cacheParams = {};
let cacheList = [];

function resolve(routes, context) {
  for (const route of routes) {
    const params = matchURI(route, context.error ? '/error' : context.pathname);

    if (!params) {
      continue;
    }

    let paramsProp = params; //matchroute(route);

    let calcKeyForCache = (paramsProp) => {
      let list = [];
      let kk = Object.keys(paramsProp).sort();
      for (let k1ind in kk) {
        let k1 = kk[k1ind];

        list.push({
          key: k1,
          value: paramsProp[k1],
        });
      }
      return JSON.stringify(list);
    };
    let paramsJson = calcKeyForCache(paramsProp);

    if (cacheParams[paramsJson]) {
      paramsProp = cacheParams[paramsJson];
    } else {
      cacheParams[paramsJson] = paramsProp;
      cacheList.push(paramsProp);

      let max = 30;
      while (max > 0 && cacheList.length > 100) {
        max--;

        let c1 = cacheList[0];
        cacheList.splice(0, 1);
        delete cacheParams[calcKeyForCache(c1)];
      }
    }

    // TODO: Fetch data required data for the route. See "routes.json" file in the root directory.
    // console.dir(route);
    return route.load().then((Page) => {
      return <Page.default params={paramsProp} route={route} error={context.error} />;
    });
  }

  const error = new Error('Page not found');
  error.status = 404;
  return Promise.reject(error);
}

export default { resolve };
