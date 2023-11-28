import * as base64arraybuffer from 'base64-arraybuffer';
import Immutable from 'immutable';
import $ from 'jquery';
import localforage from 'localforage';
import React from 'react';
import * as uuid from 'uuid';
import Link from '../src/components/Link/Link';
import PartsLink from '../src/components/NavLeft/PartsLink';
var _ = require('lodash');
// var Long = require('long');
// import ls from 'local-storage';
var cookies = require('browser-cookies');
var b64toBlob = require('b64-to-blob');

const UtilsWeb = {
  blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  },

  copyToClipboard(text) {
    var $temp = $('<textarea>');
    $('body').append($temp);
    $temp.val(text).select();
    document.execCommand('copy');
    $temp.remove();
  },

  arrayBufferToBase64(arrayBuffer) {
    return base64arraybuffer.encode(arrayBuffer);
  },

  convertUrlToBase64(url, cb, removePrefix = false, format = null) {
    if (!url || url === '') {
      cb(null);
      return;
    }

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let image = new Image();
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      UtilsWeb.canvasToUrl(canvas, cb, removePrefix, format);
    };
    image.onerror = (ex) => {
      cb(null);
    };
    image.src = url;
  },

  canvasToUrl(canvas, cbUrl, removePrefix = true, format = null) {
    /*    if (canvas.toBlob && FileReader) {
          canvas.toBlob((blob) => {
            // let urlBlob = window.URL.createObjectURL(blob);

            const reader = new FileReader();
            reader.onload = () => {
              const fileAsBinaryString = reader.result;
              let content64 = base64.encode(fileAsBinaryString);

              cbUrl && cbUrl(content64);

              // window.URL.revokeObjectURL(urlBlob);
            };
            reader.onabort = () => { cbUrl && cbUrl(null); };
            reader.onerror = () => { cbUrl && cbUrl(null); };

            reader.readAsDataURL(blob);
          }, 'image/png');

        } else {*/
    let url1 = canvas.toDataURL(format ?? undefined);

    //data:image/png;base64,
    if (removePrefix && _.startsWith(url1, 'data:')) {
      let p1 = url1.indexOf(',');
      if (p1 > -1) {
        url1 = url1.substring(p1 + 1);
      }
    }

    cbUrl && cbUrl(url1);
    //    }
  },

  canvasToBlob(canvas, cbFinish) {
    this.canvasToUrl(canvas, (url1) => {
      if (url1) {
        let blob = b64toBlob(url1, 'image/png');
        cbFinish && cbFinish(blob);
      } else {
        cbFinish && cbFinish(null);
      }
    });
  },

  isImmutable(obj1) {
    if (!obj1) {
      return false;
    } else {
      return (
        Immutable.Map.isMap(obj1) ||
        Immutable.List.isList(obj1) ||
        Immutable.Stack.isStack(obj1) ||
        Immutable.OrderedMap.isOrderedMap(obj1) ||
        Immutable.OrderedSet.isOrderedSet(obj1) ||
        Immutable.Set.isSet(obj1) ||
        Immutable.Seq.isSeq(obj1)
      );
    }
  },

  dataNumForage(storeName, defaultValue, setValue, cbFinish) {
    if (!_.isUndefined(setValue)) {
      let data = {
        num: setValue,
      };
      localforage.setItem(storeName, data, () => {
        cbFinish && cbFinish();
      });
    }
    localforage.getItem(storeName, (err, res) => {
      let data = err ? undefined : res;
      if (data && !_.isUndefined(data.num)) {
        cbFinish && cbFinish(data.num == null ? defaultValue : data.num);
      } else {
        cbFinish && cbFinish(defaultValue);
      }
    });
  },

  isNullOrEmpty(value) {
    return value == null || value === '';
  },

  addLinksSpansSmartLinkString(text, newWindow = undefined, noApp = undefined) {
    if (UtilsWeb.isNullOrEmpty(text)) {
      return text;
    }

    const sep = uuid.v1();

    let textRep = text;

    let tagsUsed = ['link'];

    let mapTags = {};
    tagsUsed?.some((t1) => {
      textRep = textRep?.replace(new RegExp(`<${t1}([^>]*)>(.*)</${t1}>`), (v1) => {
        const id1 = uuid.v1();

        let pp = {};
        let s1 = v1;

        if (!UtilsWeb.isNullOrEmpty(v1)) {
          let tag1 = `<${t1}`;
          if (_.startsWith(s1, tag1)) {
            s1 = s1.substring(tag1.length);

            let ind1 = s1.indexOf('>');
            if (ind1 > -1) {
              let sp = s1.substring(0, ind1);
              s1 = s1.substring(ind1 + 1);

              let ppList = sp
                ?.split(' ')
                ?.filter((s0) => _.trim(s0 || '') !== '')
                ?.map((s1) => _.trim(s1 || ''));
              pp = {};
              ppList?.some((sp1) => {
                let ind1 = sp1?.indexOf('=');
                if (ind1 > -1) {
                  let k1 = sp1.substring(0, ind1);
                  let val1 = sp1.substring(ind1 + 1);
                  if (_.startsWith(val1, '"')) {
                    val1 = val1.substring(1);
                    if (_.endsWith(val1, '"')) {
                      val1 = val1.substring(0, val1.length - 1);
                    }
                  } else if (_.startsWith(val1, "'")) {
                    val1 = val1.substring(1);
                    if (_.endsWith(val1, "'")) {
                      val1 = val1.substring(0, val1.length - 1);
                    }
                  } else if (_.startsWith(val1, '”')) {
                    val1 = val1.substring(1);
                    if (_.endsWith(val1, '”')) {
                      val1 = val1.substring(0, val1.length - 1);
                    }
                  }
                  if (!UtilsWeb.isNullOrEmpty(k1) && val1 != null) {
                    pp[k1] = val1;
                  }
                }
              });
            }
          }
          tag1 = `</${t1}>`;
          if (_.endsWith(s1, tag1)) {
            s1 = s1.substring(0, s1.length - tag1.length);
          }
        }

        mapTags[id1] = {
          tagName: t1,
          text: s1,
          params: pp,
        };
        return sep + id1 + sep;
      });
    });

    if (Object.keys(mapTags).length === 0) {
      return text;
    }

    const ss = textRep.split(sep);
    return (
      <span>
        {ss.map((s1, s1ind) => {
          if (mapTags[s1]) {
            let st = mapTags[s1].text;
            let pp = mapTags[s1].params;

            let link1 = null;

            if (pp != null) {
              if (pp.to != null) {
                link1 = pp.to;
              } else {
                let type1 = pp.type?.toLowerCase();

                if (pp.featureGroupId != null) {
                  if (type1 === 'features_list') {
                    link1 = '/' + PartsLink.features_list + '/' + (pp.projectId ?? '-') + '/' + pp.featureGroupId;
                  } else {
                    link1 = '/' + PartsLink.feature_group_detail + '/' + (pp.projectId ?? '-') + '/' + pp.featureGroupId;
                  }
                }

                if (link1 != null && pp.params != null && _.isString(pp.params)) {
                  let ex1 = pp.params;
                  if (_.startsWith(ex1, '?')) {
                    ex1 = ex1.substring(1);
                  }
                  link1 = [link1, ex1];
                }
              }
            }

            let elem1 =
              link1 == null ? (
                st
              ) : (
                <Link to={link1} showAsLinkBlue usePointer newWindow={newWindow} noApp={noApp}>
                  {st}
                </Link>
              );
            return <span key={'tag' + s1ind}>{elem1}</span>;
          } else {
            return s1;
          }
        })}
      </span>
    );
  },

  enters(s1, spacesConvert = false) {
    if (s1 == null) {
      return s1;
    }

    function convSpaces(v1) {
      return v1;
    }

    if (_.isString(s1)) {
      if (s1.indexOf('\n')) {
        let ss = s1.split('\n');
        return ss.map((s1, ind) => <div key={'s' + ind}>{convSpaces(s1)}</div>);
      } else {
        return convSpaces(s1);
      }
    } else {
      return s1;
    }
  },

  isElementEmpty(el) {
    return !_.trim(window['$'](el).html());
  },

  refreshCursor() {
    let body = window['$']('body');
    body.addClass('busy');
    setTimeout(() => {
      body.removeClass('busy');
    }, 0);
  },
};

export default UtilsWeb;
