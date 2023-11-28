import { createPath } from 'history';
import * as React from 'react';
import { CSSProperties, PropsWithChildren } from 'react';
import history from '../../../core/history';
import Location from '../../../core/Location';
import { startsWithInt } from '../../api/REClient';
import PartsLink from '../NavLeft/PartsLink';

const sd = require('../antdUseDark.module.css');
const _ = require('lodash');

let addApp = (res) => {
  if (res == null) {
    return res;
  }
  const isActualDevCenter = window.location.pathname ? startsWithInt(window.location.pathname, '/' + PartsLink.devCenter) : false;
  const nameApp = isActualDevCenter ? 'models' : 'app';

  if (!_.startsWith(res, '/' + nameApp)) {
    if (!_.startsWith(res, '/')) {
      res = '/' + res;
    }
    res = '/' + nameApp + res;
  }
  return res;
};

interface ILinkProps {
  to?: string | object | any[];
  onClick?: (event: Event) => void;
  style?: CSSProperties;
  className?: any;
  forceSpanUse?: boolean;
  noApp?: boolean;
  newWindow?: boolean;
  showAsLink?: boolean;
  showAsLinkBlue?: boolean;
  useUnderline?: boolean;
  usePointer?: boolean;
  noAutoParams?: boolean;
}

interface ILinkState {}

class Link extends React.PureComponent<PropsWithChildren<ILinkProps>, ILinkState> {
  handleClick = (event) => {
    if (this.props.onClick) {
      this.props.onClick(event);
    }

    if (event.button !== 0 /* left click */) {
      return;
    }

    event.stopPropagation();

    if (!this.props.forceSpanUse) {
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }
    }

    if (event.defaultPrevented === true) {
      return;
    }

    event.preventDefault();

    let linkUrl = this.props.to;
    Link.doGotoLink(linkUrl, event, this.props.noApp, this.props.newWindow, this.props.noAutoParams);
  };

  render() {
    const { to, noAutoParams, className, forceSpanUse, noApp: noAppTemp, newWindow, showAsLink, showAsLinkBlue, useUnderline, usePointer, ...props } = this.props; // eslint-disable-line no-use-before-define

    let noApp = noAppTemp;
    let to1 = null;

    const helpStart = '/help/';
    if (_.isString(to)) {
      if (_.startsWith(to, helpStart)) {
        noApp = true;
      }
    } else if (_.isArray(to)) {
      if (_.startsWith(to?.[0] ?? '', helpStart)) {
        noApp = true;
      }
    }

    if (_.isString(to)) {
      to1 = noApp ? to : addApp(to);
    } else if (_.isArray(to)) {
      let toApp1 = to?.[0] ?? '';
      if (!noApp) {
        toApp1 = addApp(toApp1);
      }

      let url1 = '' + toApp1;
      if (to?.[1] != null && to?.[1] !== '') {
        url1 += '?' + to?.[1];
      }
      to1 = url1;
    } else if (_.isObject(to)) {
      to1 = createPath(to as any);
    }

    if (to1 == null || _.trim(to1 || '') === '') {
      to1 = '';
    }

    if (forceSpanUse) {
      return (
        <span
          className={
            sd.nolink +
            ' ' +
            (showAsLink ? sd.linkBlue : '') +
            ' ' +
            (showAsLinkBlue ? sd.styleTextBlueBrightColor : '') +
            ' ' +
            (useUnderline ? sd.linkUnderline : '') +
            ' ' +
            (usePointer === false ? '' : sd.linkCursor) +
            ' ' +
            (className || '')
          }
          {...props}
          onClick={this.handleClick}
        />
      );
    } else {
      return (
        <a
          href={to1}
          className={
            sd.nolink +
            ' ' +
            (showAsLink ? sd.linkBlue : '') +
            ' ' +
            (showAsLinkBlue ? sd.styleTextBlueBrightColor : '') +
            ' ' +
            (useUnderline ? sd.linkUnderline : '') +
            ' ' +
            (usePointer === false ? '' : sd.linkCursor) +
            ' ' +
            (className || '')
          }
          {...props}
          onClick={this.handleClick}
        />
      );
    }
  }

  static doGotoLink = (linkUrl, event = null, noApp = false, newWindow = false, noAutoParams = false) => {
    const helpStart = '/help/';
    if (_.isString(linkUrl)) {
      if (_.startsWith(linkUrl, helpStart)) {
        noApp = true;
      }
    } else if (_.isArray(linkUrl)) {
      if (_.startsWith(linkUrl?.[0] ?? '', helpStart)) {
        noApp = true;
      }
    }

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

    if (event?.metaKey || event?.ctrlKey) {
      newWindow = true;
    }

    if (_.isString(linkUrl) && (!_.startsWith(linkUrl?.toLowerCase() || '', 'http://') || !_.startsWith(linkUrl?.toLowerCase() || '', 'https://'))) {
      const isActualDevCenter = window.location.pathname ? startsWithInt(window.location.pathname, '/' + PartsLink.devCenter) : false;
      let isDevCenter = linkUrl ? startsWithInt(linkUrl, '/' + PartsLink.devCenter) : false;
      if (startsWithInt(linkUrl, '/app')) {
        isDevCenter = false;
      } else {
        if (!isDevCenter) {
          isDevCenter = isActualDevCenter;
        }
      }

      if (isActualDevCenter !== isDevCenter) {
        if (!noApp) {
          if (isDevCenter) {
            if (!_.startsWith(linkUrl, '/models')) {
              linkUrl = '/models' + linkUrl;
            }
          } else {
            if (!_.startsWith(linkUrl, '/app')) {
              linkUrl = '/app' + linkUrl;
            }
          }
        }

        let url = window.location.protocol + '//' + window.location.hostname + (window.location.port === '' ? '' : ':' + window.location.port) + linkUrl;
        if (newWindow) {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }
        return;
      }
    }

    if (linkUrl == null || linkUrl === '') {
      //skip
    } else if (linkUrl) {
      if (_.isArray(linkUrl)) {
        Location.push(noApp ? linkUrl[0] : addApp(linkUrl[0]), undefined, linkUrl[1], noAutoParams, newWindow);
      } else {
        if (noApp && (_.startsWith(linkUrl.toLowerCase(), 'http://') || _.startsWith(linkUrl.toLowerCase(), 'https://'))) {
          if (newWindow) {
            window.open(linkUrl, '_blank');
          } else {
            window.location.href = linkUrl;
          }
        } else {
          if (newWindow) {
            window.open(noApp ? linkUrl : addApp(linkUrl), '_blank');
          } else if (noApp) {
            window.location.href = linkUrl;
          } else {
            Location.push(noApp ? linkUrl : addApp(linkUrl), undefined, undefined, noAutoParams);
          }
        }
      }
    } else if (event) {
      history.push({
        pathname: event.currentTarget.pathname,
        search: event.currentTarget.search,
      });
    }
  };
}

export default Link;
