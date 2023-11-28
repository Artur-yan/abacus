import * as he from 'he';
import * as Immutable from 'immutable';
import * as ls from 'local-storage';
import * as moment from 'moment';
import querystring from 'query-string';
import * as React from 'react';
import * as uuid from 'uuid';
import PartsLink from '../src/components/NavLeft/PartsLink';
import Constants from '../src/constants/Constants';
import JsPDF from 'jspdf';
import html2canvas from 'html2canvas';

var _ = require('lodash');
var cookies = require('browser-cookies');
const BigNumber = require('bignumber.js');
const colorsPallete = require('nice-color-palettes');
const tinycolor2 = require('tinycolor2');

let rdSearchTextCache = {};
let defaultDarkMode = true;

export const forceDarkMode = true;
const replaceEncode = 'hd8hd87hd873hd83hd3hd324242hd38hudhh';
const replaceEncode2 = 'hd8hiuhufuibfu33h3h8dh24242d3hh3hdhh';
const replaceEncode3 = 'hd93hd93hd93hd92423423423hhddhd3hhdhh';
const replaceEncode4 = 'h9fh8hf84f83hf83h8fh38hfh43hh3dj39djhh';
const replaceEncode5 = 'u3hdu3fu3hufh49hg43h734hfh3fhf9hfhfhf8h';

let colorsProcessed = 0;

export const ColorsGradients = [
  { from: '#9137ff', to: '#4b00a7' },
  { from: '#245bff', to: '#002bc9' },
  { from: '#ff5bf4', to: '#7e05b1' },
  { from: '#06edbd', to: '#006870' },
  { from: '#ffc443', to: '#db5704' },
  { from: '#0995ff', to: '#00497e' },
  { from: '#ff603a', to: '#cc2100' },
  { from: '#ffeb3a', to: '#ba9400' },
  { from: '#09daff', to: '#00687a' },
  { from: '#c4ff3a', to: '#638e00' },
  { from: '#09ff9c', to: '#008e51' },
  { from: '#3aff40', to: '#008801' },
  { from: '#6041ff', to: '#2800a4' },
  { from: '#ff415e', to: '#b20023' },
  { from: '#ff8f5c', to: '#cb3d00' },
  { from: '#c76c43', to: '#792600' },
  { from: '#aeacba', to: '#838292' },
  { from: '#26c363', to: '#16763d' },
  { from: '#edbd42', to: '#a17c0f' },
  { from: '#f15e9b', to: '#9e2756' },
];

export const ColorsGradientsForWhiteText = ['#9137ff', '#245bff', '#ff5bf4', '#0995ff', '#ff603a', '#6041ff', '#ff415e', '#ff8f5c', '#c76c43', '#aeacba', '#26c363', '#edbd42', '#f15e9b'];

export const ReactLazyExt = (importFunc: () => any, fromInsideClass?: string) => {
  function sleep(ms) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // @ts-ignore
  return React.lazy(async () => {
    let mod = null,
      retry = 5;
    while (mod == null && retry > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        mod = await importFunc();

        if (fromInsideClass != null) {
          mod = { default: mod?.[fromInsideClass] };
          // .then(module=>({default:module.FontAwesomeIcon})))
        }
      } catch (err) {
        retry--;
        if (retry < 3) {
          // eslint-disable-next-line no-await-in-loop
          await sleep(400);
        }
      }
    }
    return mod;
  });
};

export const sortStrings = (fieldName, a, b) => {
  let getVal = (v1, fieldName) => {
    if (_.isString(fieldName)) {
      return v1[fieldName];
    } else if (_.isArray(fieldName)) {
      let res = v1;
      fieldName.some((f1) => {
        if (res != null) {
          res = res[f1];
        }
      });
      return res;
    } else {
      return null;
    }
  };

  if (a != null) {
    a = getVal(a, fieldName);
  }
  if (b != null) {
    b = getVal(b, fieldName);
  }

  if (_.isString(a) || _.isString(b)) {
    a = a == null ? '' : '' + a;
    b = b == null ? '' : '' + b;
    return a.toLowerCase().localeCompare(b.toLowerCase());
  } else {
    return (a || 0) - (b || 0);
  }
};

export const calcImgSrc = (url) => {
  if (_.startsWith(url, 'http://') || _.startsWith(url, 'https://')) {
    return url;
  }

  if (_.startsWith(url, '/app')) {
    url = url.substring('/app'.length);
  }

  if (_.startsWith(url, '/imgs/')) {
    url = '/static' + url;
  }
  if (_.startsWith(url, 'imgs/')) {
    url = '/static/' + url;
  }

  return url;
};

export const calcStaticUrl = (url) => {
  if (url && _.startsWith(url, '/app')) {
    url = url.substring('/app'.length);
  }

  return url;
};

export interface ISaveRedirectURL {
  url: string;
  savedOn: number;
}

const Utils = {
  isDarkInt: undefined as boolean,
  colorsListNotDark: [],
  dayFirstOnDate: undefined as boolean,

  isDayFirstOnDate() {
    if (this.dayFirstOnDate != null) {
      return this.dayFirstOnDate;
    }

    try {
      const r1 = new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale).format(new Date(2021, 11, 30));
      if (r1.substring(0, 2) === '30') {
        this.dayFirstOnDate = true;
      } else {
        this.dayFirstOnDate = false;
      }
    } catch (e) {
      this.dayFirstOnDate = false;
    }
    return this.dayFirstOnDate;
  },

  escapeRegex(s1) {
    if (s1 == null) {
      return s1;
    }
    return s1.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  },

  momentFormatForPython(dt1) {
    if (!dt1) {
      return dt1;
    }

    if (!moment.isMoment(dt1)) {
      if (_.isNumber(dt1)) {
        dt1 = dt1.unix(dt1);
      } else if (_.isString(dt1)) {
        if (dt1.indexOf('Z') === -1) {
          dt1 = moment.utc(dt1);
        } else {
          dt1 = moment(dt1);
        }
      }
    }
    return dt1.format('YYYY-MM-DDTHH:mm:ss');
  },

  generateRandomColor() {
    return `rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`;
  },

  removeTags(text) {
    if (!text || !_.isString(text)) {
      return text;
    }

    return text?.replace(/<[^>]*>/gi, '');
  },

  addLinksSpans(text, tagsUsed?: string[], tagStyle?: (tagName) => string, tagAddCopy?: string[], createCopyElem?: (value: string) => any) {
    if (Utils.isNullOrEmpty(text)) {
      return text;
    }

    const sep = uuid.v1();

    let mapLinks = {};
    let textRep = text.replace(/\bhttp[s]*:\/\/[^\b]+\b/gi, (v1) => {
      const id1 = uuid.v1();
      mapLinks[id1] = v1;
      return sep + id1 + sep;
    });

    let mapTags = {};
    tagsUsed?.some((t1) => {
      textRep = textRep?.replace(new RegExp(`<${t1}>(.*)</${t1}>`), (v1) => {
        const id1 = uuid.v1();
        mapTags[id1] = {
          tagName: t1,
          styleString: tagStyle?.(t1),
          text: v1,
          useCopy: tagAddCopy?.includes(t1),
        };
        return sep + id1 + sep;
      });
    });

    if (Object.keys(mapLinks).length === 0 && Object.keys(mapTags).length === 0) {
      return text;
    }

    const ss = textRep.split(sep);
    return (
      <span>
        {ss.map((s1, s1ind) => {
          if (mapTags[s1]) {
            let st = mapTags[s1].text;
            if (!Utils.isNullOrEmpty(st)) {
              let tag1 = `<${mapTags[s1].tagName}>`;
              if (_.startsWith(st, tag1)) {
                st = st.substring(tag1.length);
              }
              tag1 = `</${mapTags[s1].tagName}>`;
              if (_.endsWith(st, tag1)) {
                st = st.substring(0, st.length - tag1.length);
              }
            }

            let copyElem = null;
            if (mapTags[s1].useCopy) {
              copyElem = (
                <span
                  css={`
                    margin-left: 7px;
                  `}
                >
                  {createCopyElem?.(st)}
                </span>
              );
            }

            return (
              <span>
                <span key={'tag' + s1ind} css={mapTags[s1].styleString ?? ''}>
                  {st}
                </span>
                {copyElem}
              </span>
            );
          } else if (mapLinks[s1]) {
            return (
              <a key={'link' + s1ind} rel={'noreferrer'} target={'_blank'} href={mapLinks[s1]}>
                {mapLinks[s1]}
              </a>
            );
          } else {
            return s1;
          }
        })}
      </span>
    );
  },

  isElement(elem) {
    return React.isValidElement(elem);
  },

  toSnakeCase(str) {
    if (!str) {
      return str;
    }
    return (
      str &&
      str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map((x) => x.toLowerCase())
        .join('_')
    );
  },

  toSnakeCaseNew(str: string) {
    if (!str) return str;
    const firstCapRegex = /(.)([A-Z][a-z]+)/g;
    const allCapRegex = /([a-z0-9])([A-Z])/g;
    const result = str.replace(firstCapRegex, '$1_$2');
    return result.replace(allCapRegex, '$1_$2').toLowerCase();
  },

  dateToStringShort(dt) {
    if (!moment.isMoment(dt)) {
      if (_.isNumber(dt)) {
        dt = moment.unix(dt);
      } else {
        dt = moment(dt);
      }
    }

    if (dt.isSame(moment(), 'day')) {
      return dt.format('h:mm a');
    } else {
      return dt.format('MMM D');
    }
  },

  getColorForWhiteText(index: number) {
    const size = ColorsGradientsForWhiteText.length;
    return ColorsGradientsForWhiteText[index % size];
  },

  getColorPaletteByIndex(colorIndex, useFirstStatic = false) {
    if (useFirstStatic === true) {
      const extraColors2 = [
        { from: '#9137ff', to: '#4b00a7' },
        { from: '#245bff', to: '#002bc9' },
        { from: '#06edbd', to: '#006870' },
        { from: '#ff5bf4', to: '#7e05b1' },
        { from: '#ffc443', to: '#db5704' },
      ];

      let cc = ColorsGradients.concat(extraColors2).map((c1) => c1.from);
      if (colorIndex != null && colorIndex >= 0 && colorIndex < cc.length) {
        return cc[colorIndex];
      } else {
        colorIndex -= cc.length;
      }
    }

    let nextColor = (max = 100) => {
      if (max < 0) {
        return '#fff';
      }
      let color1 = this.calcColorPalette(colorsPallete[colorsProcessed || 0]);
      colorsProcessed++;
      if (tinycolor2(color1).isDark()) {
        color1 = nextColor(max - 1);
      }
      return color1;
    };

    for (let i = this.colorsListNotDark.length; i <= colorIndex; i++) {
      this.colorsListNotDark[i] = nextColor();
    }

    return this.colorsListNotDark[colorIndex];
  },

  calcColorPalette(value) {
    if (_.isArray(value)) {
      value = value[0];
    }
    return value;
  },

  headFavicon(newUrl?: string) {
    if (!newUrl) {
      return;
    }

    try {
      let changeIcon = (id1) => {
        let created = false;
        let link: any = document.querySelector('#' + id1); //link[rel='shortcut icon']
        if (link == null) {
          created = true;
          link = document.createElement('link');
        }

        if (created) {
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
        }
        link.href = newUrl;

        if (created) {
          document.getElementsByTagName('head')[0].appendChild(link);
        }
      };

      changeIcon('iconFav1');
      changeIcon('iconFav2');
    } catch (e) {
      //
    }
  },

  camelCaseWords(value: string) {
    if (!value) {
      return value;
    }

    let ss = value.split(/[^a-zA-Z]/);
    return ss.map((s1, s1ind) => Utils.upperFirst(s1)).join(' ');
  },

  camelCaseUnder(value: string) {
    if (!value) {
      return value;
    }

    let ss = value.split('_');
    return ss.map((s1, s1ind) => (s1ind === 0 ? s1 : Utils.upperFirst(s1))).join('');
  },

  prepareHeaderString(value: string) {
    if (value == null || _.trim(value) === '') {
      return value;
    }

    value = value.replace(/[^a-zA-Z0-9]/gi, ' ');
    while (value.indexOf('  ') > -1) {
      value = value.replace('  ', ' ');
    }
    return value;
  },

  initials(text: string, maxSize = 3) {
    if (!text) {
      return '';
    }
    let ss = text.split(' ');
    let firstLetters = '';
    ss &&
      ss.some((s1) => {
        if (s1 && s1.length > 0) {
          firstLetters += s1[0].toUpperCase();
        }
      });

    if (firstLetters && firstLetters.length > 0) {
      return firstLetters.substring(0, maxSize);
    } else {
      let uppercaseLetters = text.replace(/[^A-Z]/, '');
      if (uppercaseLetters && uppercaseLetters.length > 0) {
        return uppercaseLetters.substring(0, maxSize);
      } else {
        //just use any letter
        let anyLetters = text.replace(/[^A-Za-z]/, '');
        if (anyLetters && anyLetters.length > 0) {
          return anyLetters.substring(0, maxSize);
        } else {
          return '';
        }
      }
    }
  },

  stringToColorHexTwo(text: string) {
    let hash: any = 0;
    if (!text || text.length === 0) {
      return '';
    }

    for (var i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    return `hsl(${hash % 360}, 60%, 44%)`;
  },

  stringToColorHex(text: string, notDark = false) {
    let hash: any = 0;
    if (!text || text.length === 0) {
      return '';
    }
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      let value = (hash >> (i * 8)) & 255;
      color += ('00' + value.toString(16)).substr(-2);
    }

    if (notDark) {
      let t1 = tinycolor2(color);
      if (t1.getBrightness() < 30) {
        color = '#' + t1.lighten(70).toHex();
      }
    }

    return color;
  },

  check2FAInterval: null,

  start2Fa(sendPushFunc, checkStatusFunc) {
    let currentUri = window.location.href;
    if (currentUri.toLowerCase().indexOf(('/app/' + PartsLink.signin + '?2faRequired=1').toLowerCase()) < 0) {
      return;
    }

    sendPushFunc((err, data) => {
      if (!err) {
        let repeatCheck = setInterval(
          () =>
            checkStatusFunc((err, data) => {
              if (data?.result) {
                clearInterval(repeatCheck);
                this.check2FAInterval = null;
                this.rediretToOrSaved('/app/' + PartsLink.project_list);
              }
            }),
          1000,
        );

        this.check2FAInterval = repeatCheck;
      }
    });
  },

  stop2FaTimer() {
    if (this.check2FAInterval != null) {
      clearInterval(this.check2FAInterval);
      this.check2FAInterval = null;
    }
  },

  rediretToOrSaved(url, skipSaved = false) {
    let modelsRedirect = Utils.dataNum('models_signin_url');
    if (!Utils.isNullOrEmpty(modelsRedirect)) {
      window.location.href = modelsRedirect;
      return;
    }

    let gotoUrl: ISaveRedirectURL = Utils.dataNum(Constants.signin_redirect_after, undefined);
    Utils.dataNum(Constants.signin_redirect_after, undefined, null);

    let isUrlInside = () => {
      let url1 = gotoUrl?.url;
      if (!url1) {
        return true;
      }
      url1 = url1.toLowerCase();
      if (url1.indexOf(('/app/' + PartsLink.signin).toLowerCase()) > 0) {
        return true;
      }
      if (url1.indexOf(('/app/' + PartsLink.signup).toLowerCase()) > 0) {
        return true;
      }
      if (url1.indexOf(('/app/' + PartsLink.workspace_join).toLowerCase()) > 0) {
        return true;
      }

      return false;
    };

    if (skipSaved || !gotoUrl || isUrlInside() || Utils.isNullOrEmpty(gotoUrl.url) || moment.unix(gotoUrl.savedOn).isAfter(moment().add(3, 'hour'))) {
      //
    } else {
      url = gotoUrl.url;
    }
    window.location.href = url;
  },

  askRecaptcha(action: string = 'homepage', cbFinish?: (token: string) => void) {
    if (Constants.flags.onprem) {
      cbFinish && cbFinish('-');
      return;
    }

    // @ts-ignore
    if (window['grecaptcha']) {
      // @ts-ignore
      window['grecaptcha'].ready(function () {
        // @ts-ignore
        window['grecaptcha'].execute('6LecNb4UAAAAAD9bzZveB8dUdkUrJJZYQO1woMxw', { action: action }).then(function (token) {
          cbFinish && cbFinish(token);
        });
      });
    } else {
      Utils.error('recaptcha not registered');
      cbFinish && cbFinish(null);
    }
  },

  processParamsAsQuery(params, useActualsFrom = null) {
    if (useActualsFrom != null) {
      if (_.startsWith(useActualsFrom, '?')) {
        useActualsFrom = useActualsFrom.substring(1);
      }

      let paramsActual = querystring.parse(useActualsFrom);
      if (paramsActual != null) {
        params = _.assign({}, paramsActual, params);
      }
    }

    let kk = Object.keys(params);
    kk.some((k1) => {
      if (params[k1] == null) {
        delete params[k1];
      } else if (_.isArray(params[k1])) {
        params[k1] = JSON.stringify(params[k1]);
      } else if (_.isObject(params[k1]) && !_.isNumber(params[k1]) && !_.isString(params[k1])) {
        params[k1] = JSON.stringify(params[k1]);
      }
    });

    return querystring.stringify(params);
  },

  roundDefault(value, decimals = 3) {
    if (value == null) {
      return '';
    } else if (_.isString(value)) {
      value = Utils.tryParseFloat(value, value);
    }
    if (_.isNumber(value)) {
      if (Math.abs(value) < 0.1 ** (decimals + 1)) {
        let res = value.toExponential();
        let ind1 = res.indexOf('e-');
        if (ind1 > -1) {
          res = res.substring(0, Math.min(2 + decimals + (value < 0 ? 1 : 0), ind1)) + res.substring(ind1);
          return res;
        }
      }
      return value.toFixed(decimals);
    } else {
      return value == null ? '' : '' + value;
    }
  },

  isNullOrEmpty(value: any): boolean {
    return value == null || value === '';
  },

  joinPathWithDelimiter(delimiter: string, forceDelimitierAtStart: boolean, forceDelimiterAtEnd: boolean, ...parts) {
    let res = '';
    if (parts) {
      parts.some((p1) => {
        if (p1) {
          if (!_.endsWith(res, delimiter)) {
            res += delimiter;
          }
          res += p1;
        }

        return false;
      });
    }

    if (res !== '') {
      if (forceDelimitierAtStart && res[0] !== delimiter) {
        res = delimiter + res;
      }
      if (forceDelimiterAtEnd && res[res.length - 1] !== delimiter) {
        res += delimiter;
      }
    }

    return res;
  },

  joinPath(...parts) {
    return this.joinPathWithDelimiter('/', false, false, ...parts);
  },

  isDark() {
    if (forceDarkMode) {
      return true;
    }

    if (_.isUndefined(this.isDarkInt)) {
      let saved1 = Utils.loadData('appDarkMode');
      if (saved1 == null) {
        this.isDarkInt = true;
      } else {
        this.isDarkInt = !!saved1;
      }
    }

    return this.isDarkInt;
  },

  setIsDark(isDark: boolean) {
    this.isDarkInt = isDark;
    Utils.saveData('appDarkMode', isDark);
  },

  formatTime(secs) {
    if (secs == null) {
      return '-:-';
    }

    let mins = Math.floor(secs / 60);
    secs = Math.floor(secs - mins * 60);
    return '' + mins + ':' + (secs < 10 ? '0' : '') + secs;
  },

  getInside(data?, path?, isNullValue?, sep?) {
    if (data && Immutable.isImmutable(data)) {
      data = data.toJS();
    }

    sep = sep || '.';
    let pp = path.split(sep);
    // eslint-disable-next-line no-restricted-syntax
    for (let i in pp) {
      let key = pp[i];
      data = data && data[key];
      if (!data) {
        return isNullValue || null;
      }
    }
    return data || isNullValue;
  },

  replaceNumbersForSort(value) {
    if (!value || value === '' || !_.isString(value)) {
      return value;
    }

    let repl1 = (match) => {
      let n1 = Utils.tryParseInt(match);
      if (n1 == null) {
        return match;
      } else {
        let s1 = n1.toString(16);
        while (s1.length < 16) {
          s1 = '0' + s1;
        }
        return s1;
      }
    };
    return value.replace(/[0-9]+/g, repl1);
  },

  colorA(a, aForDark?, isOpposite = false) {
    let isDarkMode = Utils.isDark();
    if (isDarkMode && aForDark != null) {
      a = aForDark;
    }

    let c1 = isOpposite ? (isDarkMode ? '0' : '255') : isDarkMode ? '255' : '0';
    return `rgba(${c1},${c1},${c1},${a})`;
  },

  colorAall(a, isWhite = true) {
    let c1 = !isWhite ? '0' : '255';
    return `rgba(${c1},${c1},${c1},${a})`;
  },

  emptyStaticArray() {
    if (this.staticEmptyArray == null) {
      this.staticEmptyArray = [];
    }
    return this.staticEmptyArray;
  },

  emptyStaticObject() {
    if (this.staticEmptyObject == null) {
      this.staticEmptyObject = {};
    }
    return this.staticEmptyObject;
  },

  searchIsTextInside(value, searchText) {
    if (_.trim(value || '') === '') {
      return false;
    }
    if (_.trim(searchText || '') === '') {
      return true;
    }

    if (_.isString(searchText)) {
      let ss = rdSearchTextCache[searchText];
      if (!ss) {
        ss = searchText
          .toLowerCase()
          .split(' ')
          .filter((s1) => _.trim(s1 || '') !== '');
        rdSearchTextCache[searchText] = ss;
      }
      searchText = ss;
    }

    let res = true;
    searchText.some((s1) => {
      if (value.indexOf(s1) === -1) {
        res = false;
        return true;
      }
    });
    return res;
  },

  tryJsonStringify(value: any, ...options: any[]): string {
    let stringified = '';
    try {
      stringified = JSON.stringify(value, ...options);
    } catch (ex) {
      stringified = value?.toString?.() || stringified;
    }
    return stringified;
  },

  stateMergeIfNotEqual(actualState, changes) {
    let res: any = {};

    let changesToUse: any = changes == null ? changes : { ...changes };
    let kk = Object.keys(changesToUse ?? {});
    kk.some((k1) => {
      if (actualState?.[k1] == null && changesToUse?.[k1] == null && actualState?.[k1] === changesToUse?.[k1]) {
        //for ==null needs to be exactly same ===
        delete changesToUse[k1];
      } else if (_.isEqual(actualState?.[k1], changesToUse?.[k1])) {
        delete changesToUse[k1];
      }
    });

    if (Object.keys(changesToUse ?? {}).length === 0) {
      changesToUse = null;
    }
    return changesToUse ?? null;
  },

  tryJsonParse(value) {
    let json = null;
    try {
      json = JSON.parse(value);
    } catch (ex) {
      json = null;
    }
    return json;
  },

  decimals(value, numDecimals = 3, formatK = false) {
    if (value == null || !_.isNumber(value)) {
      return null;
    } else {
      let res: any = parseFloat(value.toFixed(numDecimals));
      if (numDecimals > 0 && Math.abs(value) < 0.1 ** numDecimals) {
        let res = value.toExponential();
        let ind1 = res.indexOf('e-');
        if (ind1 > -1) {
          res = res.substring(0, Math.min(2 + numDecimals + (value < 0 ? 1 : 0), ind1)) + res.substring(ind1);
          return res;
        }
      }
      if (formatK) {
        res = res.toLocaleString('en-US', { minimumFractionDigits: numDecimals });
      }
      return res;
    }
  },

  floatSimilar(val1, val2) {
    if (val1 === val2) {
      return true;
    }
    if (parseFloat(Math.abs(val1 - val2).toFixed(3)) === 0) {
      return true;
    }
    return false;
  },

  upperFirst(value, forAllUpper = false) {
    if (!value || value.length === 0) {
      return '';
    } else if (value.length === 1) {
      return value.toUpperCase();
    } else {
      if (forAllUpper) {
        let nextDoUp = true;
        let res = '';
        for (let i = 0; i < value.length; i++) {
          if (nextDoUp) {
            res += value.substring(i, i + 1).toUpperCase();
            nextDoUp = false;
          } else {
            let ch1 = value.substring(i, i + 1);
            nextDoUp = !/[a-zA-Z0-9]/.test(ch1);
            res += nextDoUp ? ' ' : ch1.toLowerCase();
          }
        }
        return res;
      } else {
        return value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase();
      }
    }
  },

  setGlobalStore(store) {
    this.globalStoreInt = store;
  },

  globalStore() {
    return this.globalStoreInt;
  },

  encodeQueryParam(value) {
    if (!value) {
      return value;
    }
    return encodeURIComponent(value);
  },

  decodeQueryParam(value) {
    if (!value) {
      return value;
    }
    return decodeURIComponent(value);
  },

  encodeRouter(value) {
    return Utils.encode(value);
  },

  encode(value, extras = true) {
    if (!value || value === '' || !_.isString(value)) {
      return value;
    }

    if (extras) {
      value = value.replace(/\//g, replaceEncode3);
      value = value.replace(/%/g, replaceEncode2);
      value = value.replace(/\?/g, replaceEncode4);
      value = value.replace(/&/g, replaceEncode5);
    }
    let res = he.encode(value);
    if (extras) {
      res = res.replace(new RegExp(replaceEncode2, 'g'), '%25');
      res = res.replace(new RegExp(replaceEncode3, 'g'), '%2F');
      res = res.replace(new RegExp(replaceEncode4, 'g'), '%3F');
      res = res.replace(new RegExp(replaceEncode5, 'g'), '%26');
    }
    return res;
  },

  decodeRouter(value) {
    return Utils.decode(value);
  },

  decode(value, doExtras = true) {
    if (!value || value === '') {
      return value;
    }

    let res = he.decode(value);
    if (doExtras) {
      res = res.replace(/%2F/g, '/');
      res = res.replace(/%3F/g, '?');
      res = res.replace(/%26/g, '&');
    }
    return res;
  },

  prettyPrintNumber(number, decimals = 1, isNumber = true) {
    let numBig = new BigNumber(number || 0);

    var numberString;
    var scale = '';
    var absVal = numBig.abs();

    if (absVal.isLessThan(new BigNumber(1000))) {
      scale = '';
    } else if (absVal.isLessThan(new BigNumber(1000000))) {
      scale = isNumber ? 'K' : 'KB';
      absVal = absVal.dividedBy(new BigNumber(1000));
    } else if (absVal.isLessThan(new BigNumber(1000000000))) {
      scale = isNumber ? 'M' : 'MB';
      absVal = absVal.dividedBy(new BigNumber(1000000));
    } else if (absVal.isLessThan(new BigNumber(1000000000000))) {
      scale = isNumber ? 'B' : 'GB';
      absVal = absVal.dividedBy(new BigNumber(1000000000));
    } else if (absVal.isLessThan(new BigNumber(1000000000000000))) {
      scale = isNumber ? 'T' : 'TB';
      absVal = absVal.dividedBy(new BigNumber(1000000000000));
    }

    var maxDecimals = 0;
    if (absVal.isLessThan(new BigNumber(10)) && scale != '') {
      maxDecimals = decimals;
    }
    numberString = absVal.toFixed(maxDecimals);
    numberString += scale;

    return numberString;
  },

  tryParseInt(value, defaultValue = null) {
    try {
      if (_.isString(value) && !/^(-){0,1}[0-9.,]+$/.test(value)) {
        return defaultValue;
      }

      let res = parseInt(value, 10);
      if (isNaN(res) && value !== 'NaN') {
        return defaultValue;
      } else {
        return res;
      }
    } catch (ex) {
      return defaultValue;
    }
  },

  tryParseFloat(value, defaultValue = null) {
    try {
      if (_.isString(value) && !/^(-){0,1}[0-9.,]+$/.test(value)) {
        return defaultValue;
      }

      let res = parseFloat(value);
      if (isNaN(res) && value !== 'NaN') {
        return defaultValue;
      } else {
        return res;
      }
    } catch (ex) {
      return defaultValue;
    }
  },

  toInt(value) {
    if (_.isNumber(value)) {
      return value;
    } else if (_.isString(value)) {
      return parseInt(value, 10);
    } else {
      return value;
    }
  },

  truncStr(str, num) {
    if (str == null) {
      return '';
    }
    if (_.isString(str) && str.length > num) {
      return str.substring(0, num) + '...';
    } else {
      return str;
    }
  },

  isLoggedIn() {
    let check = ['s', 'u'];
    // eslint-disable-next-line no-restricted-syntax
    for (var i in check) {
      var c1 = check[i];

      if (!cookies.get(c1)) {
        return false;
      }
    }
    return true;
  },

  logMem(msg) {
    if (window && window['isD'] !== true) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log(msg);
  },

  log(msg) {
    if (window && window['isD'] !== true) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log(msg);
  },
  dir(msg) {
    if (window && window['isD'] !== true) {
      return;
    }
    // eslint-disable-next-line no-console
    console.dir(msg);
  },
  warn(msg) {
    if (window && window['isD'] !== true) {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(msg);
  },
  error(msg, e?) {
    if (window && window['isD'] !== true) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error(msg, e);
  },

  removeData(storeName, isTemp?) {
    return ls.remove('rd_data_' + storeName);
  },

  dataNum(storeName?, defaultValue?, setValue?) {
    if (!_.isUndefined(setValue)) {
      let data = {
        num: setValue,
      };
      Utils.saveData(storeName, data);
      return setValue;
    }
    let data = Utils.loadData(storeName);
    if (data && !_.isUndefined(data.num)) {
      return data.num == null ? defaultValue : data.num;
    } else {
      return defaultValue;
    }
  },

  loadData(storeName?, isTemp?) {
    var data = null;
    var json;
    json = ls.get('rd_data_' + storeName);
    if (json != null) {
      data = json;
    }

    return data;
  },

  saveData(storeName?, dataToStore?, isTemp?) {
    ls.set('rd_data_' + storeName, dataToStore);
  },

  Flags: {},

  isMobile() {
    return window.matchMedia('only screen and (max-width: 991px)').matches;
  },

  isMac() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  },
  convertSecondsToDaysHoursMinutesSeconds(totalSeconds, windowObj?) {
    if (!totalSeconds) return;

    const toReableText = (num, singular) => (num > 0 ? `${num} ${singular}${num > 1 ? 's, ' : ', '}` : '');

    const time_info = windowObj || {
      days: Math.floor(totalSeconds / (3600 * 24)),
      hours: Math.floor((totalSeconds % (3600 * 24)) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: Math.floor(totalSeconds % 60),
    };

    const readableTexts = [`${totalSeconds} seconds (`, toReableText(time_info.days, 'day'), toReableText(time_info.hours, 'hour'), toReableText(time_info.minutes, 'minute'), toReableText(time_info.seconds, 'second'), `)`];

    return {
      text: readableTexts.join('').replace(/,\s([^,\s]*)$/, '$1'),
      time_info,
      totalSeconds,
    };
  },
  convertDaysHoursMinutesSecondsToSeconds: function ({ days = 0, hours = 0, minutes = 0, seconds = 0 }) {
    const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;

    return this.convertSecondsToDaysHoursMinutesSeconds(totalSeconds, { days, hours, minutes, seconds });
  },

  async htmlStringToPdf(htmlString, fileName) {
    let iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    iframe.style.width = '800px';
    document.body.appendChild(iframe);
    let iframedoc = iframe.contentDocument || iframe.contentWindow.document;
    iframedoc.body.innerHTML = htmlString;

    let canvas = await html2canvas(iframedoc.body, {});

    // Convert the iframe into a PNG image using canvas.
    let imgData = canvas.toDataURL('image/jpeg');

    const pdfWidth = 210; // default 210 mm x 297 mm
    const pdfHeight = (iframedoc.body.scrollHeight * pdfWidth) / iframedoc.body.scrollWidth;
    // Create a PDF document and add the image as a page.
    const doc = new JsPDF({
      orientation: pdfWidth > pdfHeight ? 'l' : 'p',
      format: [pdfWidth, pdfHeight],
      unit: 'mm',
    });

    doc.addImage(imgData, 'JPG', 0, 0, pdfWidth, pdfHeight);

    // Save
    await doc.save(fileName);

    // Remove the iframe from the document when the file is generated.
    document.body.removeChild(iframe);
  },
};

export default Utils;
