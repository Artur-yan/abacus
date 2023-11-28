import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
const s = require('./NLPEntitiesTables.module.css');
const sd = require('../antdUseDark.module.css');

const componentToHex = (c) => {
  if (c == null) {
    return '00';
  }
  let hex = Math.trunc(c * 255).toString(16);
  return hex.length == 1 ? '0' + hex : hex;
};

export const rgbToHex = (c1) => {
  return '#' + componentToHex(c1?.[0]) + componentToHex(c1?.[1]) + componentToHex(c1?.[2]);
};

export const hexToRgb = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255] : null;
};

export const nlpCalcColorToken = (index) => {
  return Utils.getColorPaletteByIndex((index ?? 0) + 10, true);
};

interface INLPEntitiesTablesProps {
  data?: any;
  dataExtraBefore?: any;
  calcColor?: (index: number, name: string) => string;
  hideHover?: boolean;
  hoverStyle?: any;
  maxLen?: number;
  header?: string | React.ReactNode;
}

const NLPEntitiesTables = React.memo((props: PropsWithChildren<INLPEntitiesTablesProps>) => {
  const [hoverAnnotation, setHoverAnnotation] = useState(null);

  const onMouseEnterAnnotation = useCallback((annotationOne, e) => {
    setHoverAnnotation(annotationOne);
    REActions.nlpHoverAnnotation(annotationOne);
  }, []);

  const onMouseLeaveAnnotation = useCallback((annotationOne, e) => {
    setHoverAnnotation(null);
    REActions.nlpHoverAnnotation(null);
  }, []);

  const textRes = useMemo(() => {
    let resultActual = props.data;

    let res = [];

    const calcColor = (index, name) => {
      if (index == null) {
        return [0.5, 0.5, 0.5];
      }
      const calcColorFunction = props.calcColor ?? nlpCalcColorToken;
      let csHex = calcColorFunction?.(index, name);
      let c1 = [0, 0, 0];
      if (csHex[0] === '#') {
        c1 = hexToRgb(csHex);
      }
      return c1;
    };

    let already = {};

    let ee = props.dataExtraBefore;
    if (ee != null && !_.isArray(ee)) {
      ee = [ee];
    }
    ee?.some((e1) => {
      if (!_.isArray(e1?.annotations)) {
        return false;
      }
      e1?.annotations?.some((t1, t1ind) => {
        let dn1 = t1.display_name ?? t1.displayName;
        if (dn1 == null) {
          return false;
        }

        if (already[dn1] == null) {
          already[dn1] = Object.keys(already ?? {}).length + 1;
        }

        let c = calcColor(already[dn1], dn1);
      });
    });

    let token_annotations = resultActual?.tokens?.map((x) => null) ?? [];
    let token_colors = resultActual?.tokens?.map((x) => null) ?? [];
    if (_.isArray(resultActual?.annotations)) {
      resultActual?.annotations?.some((t1, t1ind) => {
        let dn1 = t1.display_name ?? t1.displayName;
        if (dn1 == null) {
          return false;
        }

        if (already[dn1] == null) {
          already[dn1] = Object.keys(already ?? {}).length + 1;
        }

        let c = calcColor(already[dn1], dn1);
        let endTokenInd = t1.end_token ?? t1.endToken;
        if (resultActual?.addTokenSpaces === false) {
          endTokenInd--;
        }
        for (let i = t1.start_token ?? t1.startToken; i <= endTokenInd; i++) {
          token_annotations[i] = token_annotations[i] ?? [];
          if (!token_annotations[i].includes(t1)) {
            token_annotations[i].push(t1);
          }

          if (token_colors[i] == null) {
            token_colors[i] = [0, 0, 0];
          }
          for (let j = 0; j < 3; j++) {
            token_colors[i][j] = 1 - (1 - c[j]) * (1 - token_colors[i][j]);
          }
        }
      });
    }

    let totLen = 0;
    resultActual?.tokens?.some((t1, t1ind) => {
      if (t1 === null) {
        t1 = '';
      }
      if (resultActual?.addTokenSpaces === false) {
        //
      } else {
        t1 += ' ';
      }

      totLen += t1.length;
      if (props.maxLen != null && totLen > props.maxLen) {
        res.push(<span key={'t' + t1ind}>...</span>);
        return true;
      }

      let isHover = false;
      let color1 = token_colors[t1ind];
      let annotations = token_annotations[t1ind];
      let annotationOne = null,
        annotationOneLen = null;
      if (color1 != null && _.isArray(annotations)) {
        annotations?.some((a1) => {
          let len1 = a1.endToken - a1.startToken + 1;
          if (annotationOne == null || len1 < annotationOneLen) {
            annotationOneLen = len1;
            annotationOne = a1;
          }
        });

        if (annotations?.includes(hoverAnnotation)) {
          isHover = true;
          color1 = [1, 1, 1];
        }
      }

      res.push(
        <span
          key={'t' + t1ind}
          onMouseEnter={color1 == null ? null : onMouseEnterAnnotation.bind(null, annotationOne)}
          onMouseLeave={color1 == null ? null : onMouseLeaveAnnotation.bind(null, annotationOne)}
          css={`
            cursor: default;
            ${color1 == null ? '' : `color: black !important; background: ${rgbToHex(color1)} !important;`}
          `}
        >
          {t1}
        </span>,
      );
    });
    return res;
  }, [props.data, onMouseEnterAnnotation, onMouseLeaveAnnotation, hoverAnnotation, props.maxLen, props.dataExtraBefore]);

  return (
    <div
      css={`
        white-space: normal;
        line-height: 1.4;
      `}
    >
      {props.header}
      {!props.hideHover && (
        <div
          css={`
            padding: 4px 0px;
            color: rgba(255, 255, 255, 0.7);
          `}
          style={props.hoverStyle}
        >
          {hoverAnnotation == null ? '' : `Entity: ${hoverAnnotation?.displayName ?? hoverAnnotation?.display_name}`}&nbsp;
        </div>
      )}
      {textRes}
    </div>
  );
});

export default NLPEntitiesTables;
