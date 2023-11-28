import * as React from 'react';
import * as uuid from 'uuid';
import Utils from '../core/Utils';
const _ = require('lodash');
const cookies = require('browser-cookies');
const BigNumber = require('bignumber.js');
const colorsPallete = require('nice-color-palettes');
const tinycolor2 = require('tinycolor2');

let rdSearchTextCache = {};

const UtilsTS = {
  escapeRegex(s1) {
    if (s1 == null) {
      return s1;
    }
    return s1.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  },

  //
  highlightIsTextInside(value, searchText, onlyStart = false, useColor = '#86bcff') {
    if (!_.isString(value)) {
      return value;
    }
    if (_.trim(value || '') === '') {
      return value;
    }
    if (_.trim(searchText || '') === '') {
      return value;
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

    const marks: any = {};

    searchText.some((s1) => {
      if (Utils.isNullOrEmpty(s1)) {
        return;
      }

      value = value.replace(new RegExp('(' + this.escapeRegex(s1) + ')', 'gi'), (match, contents, offset, input_string) => {
        if (onlyStart && offset > 0) {
          return match;
        }
        if (marks[contents] == null) {
          const u1 = uuid.v1();
          marks[contents] = u1;
        }
        return marks[contents];
      });
    });

    const repl = (v1, max = 500) => {
      if (!v1 || max <= 0) {
        return v1;
      }

      v1 = [v1];
      const kk = Object.keys(marks);
      kk.some((k1) => {
        v1 = _.flatten(
          v1.map((v2) => {
            if (!_.isString(v2)) {
              return v2;
            }

            let p1 = v2.indexOf(marks[k1]);
            if (p1 === -1) {
              return v2;
            }

            return [v2.substring(0, p1), <b style={{ color: useColor, fontWeight: 600 }}>{k1}</b>, repl(v2.substring(p1 + marks[k1].length), max - 1)];
          }),
        );
      });

      return (
        <span>
          {v1?.map((v2, v2ind) => (
            <span key={'s' + v2ind}>{v2}</span>
          ))}
        </span>
      );
    };

    if (Object.keys(marks).length > 0) {
      return <span>{repl(value)}</span>;
    } else {
      return value;
    }
  },
};

export default UtilsTS;
