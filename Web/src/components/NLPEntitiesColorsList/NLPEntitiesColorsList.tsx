import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import REActions from '../../actions/REActions';
import { hexToRgb, rgbToHex, nlpCalcColorToken } from '../NLPEntitiesTables/NLPEntitiesTables';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./NLPEntitiesColorsList.module.css');
const sd = require('../antdUseDark.module.css');

const calcColorInt = (index, name, calcColor) => {
  if (index == null) {
    return { c1: [0, 0, 0], csHex: '#000000' };
  }

  calcColor = calcColor ?? nlpCalcColorToken;
  let csHex = calcColor?.(index, name);
  let c1 = [0, 0, 0];
  if (csHex[0] === '#') {
    c1 = hexToRgb(csHex);
  }
  return { c1, csHex };
};

export const calcColorsNLP = (data, dataAll, dataExtra, onColorsCalc, calcColor) => {
  let resultActual = data;
  let res = [],
    already = {};

  const procColors = (annotations, tokens, doCount = false) => {
    if (!_.isArray(annotations)) {
      return;
    }
    annotations?.some((t1) => {
      let name1 = t1.display_name ?? t1.displayName;
      let s1 = '';

      if (t1.value != null) {
        s1 = t1.value;
      } else if (tokens && doCount) {
        let endToken = t1.end_token ?? t1.endToken;
        if (data?.addTokenSpaces === false) {
          endToken--;
        }

        for (let i = t1.start_token ?? t1.startToken; i <= endToken; i++) {
          let w1 = tokens[i];
          if (w1 != null) {
            s1 += w1 + (data?.addTokenSpaces !== false ? ' ' : '');
          }
        }
        s1 = _.trim(s1);
      }

      if (already[name1] == null) {
        already[name1] = true;

        let { c1, csHex } = calcColorInt(Object.keys(already).length, name1, calcColor) ?? {};

        res.push({
          label: name1,
          color: c1,
          colorHex: csHex,
          count: doCount ? 1 : 0,
          annotations: [s1],
        });
      } else if (doCount) {
        let r1 = res.find((r1) => r1.label === name1);
        if (r1) {
          r1.count++;
          r1.annotations.push(s1);
        }
      }
    });
  };

  if (dataAll != null && _.isArray(dataAll)) {
    dataAll.some((d1) => {
      procColors(d1?.annotations, d1?.tokens, d1 === resultActual);
    });
  } else {
    procColors(resultActual?.annotations, resultActual?.tokens, true);
  }
  if (dataExtra != null) {
    dataExtra.some((e1) => {
      procColors(e1?.annotations, e1?.tokens, false);
    });
  }

  onColorsCalc?.(res);

  return res;
};

interface INLPEntitiesColorsListProps {
  dataAll?: any[];
  data?: any;
  dataExtra?: any;
  calcColor?: (index: number, name: string) => string;
  showHeader?: boolean;
  onColorsCalc?: (colors: { count; label; color; colorHex }[]) => void;
  showEmptyMsg?: boolean;
}

const NLPEntitiesColorsList = React.memo((props: PropsWithChildren<INLPEntitiesColorsListProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [hoverAnnotation, setHoverAnnotation] = useState(null);
  const [expandedAnnotations, setExpandedAnnotations] = useState(null);
  const refTable = useRef(null);

  useEffect(() => {
    let unReg = REActions.nlpHoverAnnotation.listen((a1) => {
      setHoverAnnotation(a1);
    });

    return () => {
      unReg();
    };
  }, []);

  const colors: { count; label; color; colorHex }[] = useMemo(() => {
    setTimeout(() => {
      refTable.current?.refreshHeights();
    }, 0);
    return calcColorsNLP(props.data, props.dataAll, props.dataExtra, props.onColorsCalc, props.calcColor);
  }, [props.data, props.dataAll, props.onColorsCalc, props.calcColor, props.dataExtra]);

  const columns = useMemo(() => {
    return [
      {
        title: 'Annotations',
        field: 'count',
        render: (text, row, index) => {
          let isExp = expandedAnnotations?.[row.label] === true;

          return (
            <div css={``}>
              <div
                css={`
                  display: flex;
                  align-items: center;
                  border-radius: 3px;
                `}
              >
                <div
                  className={sd.pointerEventsNone}
                  css={`
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    ${(hoverAnnotation?.displayName ?? hoverAnnotation?.display_name) != null && (hoverAnnotation?.displayName ?? hoverAnnotation?.display_name) === row.label ? `background: rgba(255,255,255,0.2);` : ''}
                  `}
                ></div>
                <div
                  css={`
                    width: 20px;
                    text-align: center;
                  `}
                >
                  <FontAwesomeIcon
                    icon={!isExp ? require('@fortawesome/pro-regular-svg-icons/faChevronRight').faChevronRight : require('@fortawesome/pro-regular-svg-icons/faChevronDown').faChevronDown}
                    transform={{ size: 14, x: 0, y: 0 }}
                    style={{ color: 'white', cursor: 'pointer', marginRight: '8px' }}
                  />
                </div>
                <div>
                  <div
                    css={`
                      width: 18px;
                      height: 18px;
                      margin-right: 15px;
                      border-radius: 3px;
                      background: ${rgbToHex(row.color)};
                    `}
                  ></div>
                </div>
                <div
                  css={`
                    font-weight: 400;
                    font-size: 14px;
                  `}
                >
                  {row.label}
                </div>
                <div
                  css={`
                    flex: 1;
                  `}
                ></div>
                <div
                  css={`
                    position: absolute;
                    right: 14px;
                    top: 14px;
                    opacity: ${row.count === 0 ? 0.6 : 1};
                  `}
                >
                  {row.count ?? ''}
                </div>
              </div>
              {isExp && row.count != null && row.count > 0 && (
                <div
                  css={`
                    margin: 15px 14px 4px 52px;
                    opacity: 0.8;
                  `}
                >
                  {row?.annotations?.map((a1, a1ind) => {
                    return (
                      <div
                        key={'a' + a1ind}
                        css={`
                          margin: ${4}px 0;
                          word-break: normal;
                          white-space: normal;
                        `}
                      >
                        {a1}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        },
        noAutoTooltip: true,
      },
    ] as ITableExtColumn[];
  }, [hoverAnnotation, expandedAnnotations]);

  const onClickCell = useCallback(
    (row, key, e) => {
      setExpandedAnnotations((exp) => {
        exp = { ...(exp ?? {}) };

        exp[row.label] = !exp[row.label];

        setTimeout(() => {
          refTable.current?.refreshHeights();
        }, 0);

        return exp;
      });
    },
    [refTable.current],
  );

  return (
    <AutoSizer disableWidth>
      {({ height }) => (
        <>
          {props.showEmptyMsg && (colors == null || colors?.length === 0) && (
            <div
              css={`
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                text-align: center;
              `}
            >
              No entities detected
            </div>
          )}
          <TableExt
            ref={(r1) => {
              refTable.current = r1;
            }}
            separatorDark
            onClickCell={onClickCell}
            autoHeight
            isVirtual
            noHeader={!props.showHeader}
            height={height}
            css={`
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
            `}
            dataSource={colors}
            columns={columns}
          />
        </>
      )}
    </AutoSizer>
  );
});

export default NLPEntitiesColorsList;
