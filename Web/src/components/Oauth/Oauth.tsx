import _ from 'lodash';
import querystring from 'query-string';
import * as uuid from 'uuid';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';

class Oauth {
  private windowOpen: Window;
  private randomS: any;

  doCloseWindow = () => {
    if (this.windowOpen) {
      if (!this.windowOpen.closed) {
        this.windowOpen.close();
        this.windowOpen = null;
      }
    }
  };

  handleCallback = (params, callback) => {
    if (params) {
      let error = params.error;
      if (!Utils.isNullOrEmpty(error)) {
        error = params.error_description ? params.error_description : error;
        REActions.addNotificationError(error || Constants.errorDefault);
        return;
      }
      let code = params.code;
      let state = params.state;

      if (!Utils.isNullOrEmpty(code) && !Utils.isNullOrEmpty(state)) {
        if (state === this.randomS) {
          return callback(code);
        }
      }
    }
    callback(null);
  };

  openOauth = (base_url: string, client_id: string, scopes: string[], extra_params: string[], callback: any) => {
    this.doCloseWindow();

    let realDomain = window.location.protocol + '//' + window.location.hostname;
    let port1 = window.location.port;
    if (!Utils.isNullOrEmpty(port1)) {
      realDomain += ':' + port1;
    }
    this.randomS = uuid.v1() + '__' + realDomain;

    let redirectUri = 'https://abacus.ai';
    redirectUri += '/oauth/callback';

    let url =
      base_url + '?client_id=' + client_id + '&redirect_uri=' + Utils.encodeQueryParam(redirectUri) + '&scope=' + scopes.join('%20') + '&state=' + Utils.encodeQueryParam(this.randomS) + (extra_params ? '&' + extra_params.join('&') : '');

    window['__oauthCallback'] = (queryParam) => {
      if (_.startsWith(queryParam, '?')) {
        queryParam = queryParam.substring(1);
      }
      let params = querystring.parse(queryParam);
      this.handleCallback(params, callback);
      this.doCloseWindow();
    };

    //
    let dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : window.screenX;
    let dualScreenTop = window.screenTop != undefined ? window.screenTop : window.screenY;

    // eslint-disable-next-line no-restricted-globals
    let width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    // eslint-disable-next-line no-restricted-globals
    let height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    let w = 600,
      h = 600;

    let systemZoom = width / window.screen.availWidth;
    let left = (width - w) / 2 / systemZoom + dualScreenLeft;
    let top = (height - h) / 2 / systemZoom + dualScreenTop;

    this.windowOpen = window.open(url, '_blank', 'toolbar=0,location=0,menubar=0,height=600,width=600,top=' + top + ',left=' + left);
    this?.windowOpen?.focus?.();
  };
}

export default Oauth;
