/* eslint-disable */
import _ from 'lodash';
import PartsLink from '../src/components/NavLeft/PartsLink';
import history from './history';
import Utils from './Utils';

const startsWithInt = (value, start) => {
  if (value == null || start == null) {
    return false;
  }

  if (value.toLowerCase() === start.toLowerCase()) {
    return true;
  }
  if (_.startsWith(value.toLowerCase(), (start + '/').toLowerCase())) {
    return true;
  }
  return false;
};

const location = {
  actualHref(includeDomain) {
    let url = window.location.href || '';
    url = decodeURI(url);
    if (includeDomain === false) {
      if (url.indexOf('://') > -1) {
        url = url.substring(url.indexOf('://') + 3);
        let p = url.indexOf('/');
        if (p === -1) {
          url = '/';
        } else {
          url = url.substring(p);
        }
      }
    }
    return url;
  },

  pushModels: function (url, state, search) {
    if (!_.startsWith(url, '/models')) {
      url = '/models' + url;
    }

    this.push(url, state, search);
  },

  push: function (url, state, search, noAutoParams = false, newWindow = false) {
    const isCommunity = window.location.pathname ? startsWithInt(window.location.pathname, '/models') : false;

    let linkUrl = url;
    if (_.isString(linkUrl) && (!_.startsWith(linkUrl?.toLowerCase() || '', 'http://') || !_.startsWith(linkUrl?.toLowerCase() || '', 'https://'))) {
      const isActualDevCenter = window.location.pathname ? startsWithInt(window.location.pathname, '/' + PartsLink.devCenter) : false;
      let isDevCenter = linkUrl ? startsWithInt(linkUrl, '/' + PartsLink.devCenter) : false;
      if (startsWithInt(linkUrl, '/app')) {
        isDevCenter = false;
      }

      if (isActualDevCenter !== isDevCenter) {
        let url = window.location.protocol + '//' + window.location.hostname + (window.location.port === '' ? '' : ':' + window.location.port) + linkUrl;
        window.location.href = url;
        return;
      }
    }

    if (isCommunity) {
      if (!_.startsWith(url, '/models')) {
        url = '/models' + url;
      }
    } else {
      if (!_.startsWith(url, '/app')) {
        url = '/app' + url;
      }
    }

    //
    let store1 = Utils.globalStore().getState();
    let mode1 = store1.paramsProp?.get('mode');
    let batchPredId = store1.paramsProp?.get('batchPredId');

    if (batchPredId && !noAutoParams) {
      const modeGotoList = [
        PartsLink.batchpred_datasets,
        PartsLink.batchpred_featuregroups,
        PartsLink.batchpred_create,
        PartsLink.batchpred_detail,
        PartsLink.batchpred_add_fg,
        PartsLink.batchpred_outliers,
        PartsLink.batchpred_rawdata,
        PartsLink.deploy_batch,
        PartsLink.project_dashboard,
        PartsLink.batchpred_create,
        PartsLink.project_list,
        PartsLink.profile,
        PartsLink.batchpred_detail,
        PartsLink.batchpred_add_fg,
      ];
      let willGoToMode = false;
      modeGotoList.some((s1) => {
        if (url.indexOf('/' + s1 + '/') > -1 || _.endsWith(url, '/' + s1)) {
          willGoToMode = true;
          return true;
        }
      });
      if (willGoToMode) {
        //
      } else {
        search = Utils.processParamsAsQuery({ batchPredId: batchPredId }, search);
      }
    }

    //
    let requestId = store1.paramsProp?.get('requestId');
    if (requestId && !noAutoParams) {
      let willGoToMode = false;
      let s1 = PartsLink.model_predictions;
      if (url.indexOf('/' + s1 + '/') > -1 || _.endsWith(url, '/' + s1)) {
        willGoToMode = true;
        // return true;
      }
      if (willGoToMode) {
        //
      } else {
        search = Utils.processParamsAsQuery({ requestId: requestId }, search);
      }
    }

    //
    let requestBPId = store1.paramsProp?.get('requestBPId');
    if (requestBPId && !noAutoParams) {
      let willGoToMode = true;
      let s1 = PartsLink.model_predictions;
      if (url.indexOf('/' + s1 + '/') > -1 || _.endsWith(url, '/' + s1)) {
        willGoToMode = false;
        // return true;
      }
      if (willGoToMode) {
        //
      } else {
        search = Utils.processParamsAsQuery({ requestBPId: requestBPId }, search);
      }
    }

    //
    let obj = { pathname: url };
    if (state) {
      obj.state = state;
    }
    if (search) {
      obj.search = search;
    }

    if (newWindow) {
      let url1 = window.location.protocol + '//' + window.location.hostname + (window.location.port === '' ? '' : ':' + window.location.port);
      if (!_.endsWith(url1, '/') && !_.startsWith(obj.pathname ?? '', '/') && (obj.pathname ?? '') !== '') {
        url1 += '/';
      }
      url1 += '' + (obj.pathname ?? '');
      if (!Utils.isNullOrEmpty(obj.search)) {
        url1 += '?' + obj.search;
      }
      window.open(url1, '_blank');
    } else {
      history.push(obj);
    }
  },

  gotoBack: function () {
    history.goBack();
  },

  replace: function (url, state, search) {
    const isCommunity = window.location.pathname ? startsWithInt(window.location.pathname, '/models') : false;

    if (isCommunity) {
      if (!_.startsWith(url, '/models')) {
        url = '/models' + url;
      }
    } else {
      if (!_.startsWith(url, '/app')) {
        url = '/app' + url;
      }
    }

    let obj = { pathname: url };
    if (state) {
      obj.state = state;
    }
    if (search) {
      obj.search = search;
    }
    history.replace(obj);
  },
};

export default location;
