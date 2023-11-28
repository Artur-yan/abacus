import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import InputNumber from 'antd/lib/input-number';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useState } from 'react';
import Utils from '../../../core/Utils';
import SelectExt from '../SelectExt/SelectExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./OptionMultiDropdown.module.css');
const sd = require('../antdUseDark.module.css');

export interface IMultiDropdownDataOne {
  title?: string;
  key?: string;
  options?: { label?: string; value?: any }[];
  numeric?: { decimals?: number; min?: number; max?: number; step?: number };
  defaultValue?: any;

  visibleForAnd?: boolean;
  visibleFor?: { key?: string; value?: any }[];
}

interface IOptionMultiDropdownProps {
  data?: IMultiDropdownDataOne[];

  titleWidth?: number;
  primaryKey?: string;
  disabled?: boolean;

  value?: { key?; value? }[][];
  onChange?: (newValue?: { key?; value? }[][]) => void;
}

const OptionMultiDropdown = React.memo((props: PropsWithChildren<IOptionMultiDropdownProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [itemSel, setItemSel] = useState(null as { [key: string]: any });

  const calcKey = (d1) => {
    return d1?.key ?? null;
  };

  const calcValueForKey = (key, useItemSel?, forceVal?) => {
    let v1 = null;
    props.data?.some((d1, d1ind) => {
      let keyUse = calcKey(d1);
      if (keyUse === key) {
        v1 = d1?.defaultValue;
        return true;
      }
    });
    if (forceVal != null) {
      return forceVal ?? v1;
    } else {
      return (useItemSel ?? itemSel)?.[key] ?? v1;
    }
  };

  const calcIsVisible = (key1, useItemSel?, forceVal?) => {
    if (!key1) {
      return false;
    }

    let o1 = props.data?.find((d1) => calcKey(d1) === key1);

    if (o1 == null) {
      Utils.error('o1 not found ' + key1);
      return false;
    }

    let isVisible = false;
    if (o1.visibleFor == null || o1.visibleFor?.length === 0) {
      isVisible = true;
    }
    if (!isVisible) {
      let isAND = o1.visibleForAnd === true;
      if (isAND) {
        isVisible = true;
      }

      o1.visibleFor?.some((f1) => {
        let pass1 = calcValueForKey(f1?.key, useItemSel) == f1?.value;

        if (isAND) {
          if (!pass1) {
            isVisible = false;
          }
        } else {
          if (pass1) {
            isVisible = true;
          }
        }
      });
    }
    return isVisible;
  };

  const listElem = useMemo(() => {
    if (props.data == null || props.data?.length === 0) {
      return null;
    }

    let res = props.data?.map((d1, d1ind) => {
      let keyUse = calcKey(d1);

      let isVisible = calcIsVisible(keyUse, itemSel);
      if (!isVisible) {
        return null;
      }

      let input = null;
      if (d1?.options != null) {
        let oo = d1?.options ?? [];
        let v1 = oo?.find((o1) => o1?.value == calcValueForKey(keyUse, itemSel)) ?? null;
        let onChange1 = (o1) => {
          setItemSel((ss) => {
            ss = { ...(ss ?? {}) };
            ss[keyUse] = o1?.value ?? null;

            return ss;
          });
        };

        input = (
          <SelectExt
            isDisabled={props.disabled}
            css={`
              width: 100%;
            `}
            options={oo}
            value={v1}
            onChange={onChange1}
          />
        );
      } else if (d1?.numeric != null) {
        let v1 = calcValueForKey(keyUse, itemSel);
        const onChangeNum1 = (v1) => {
          setItemSel((ss) => {
            ss = { ...(ss ?? {}) };
            ss[keyUse] = v1 ?? null;

            return ss;
          });
        };

        input = (
          <InputNumber
            disabled={props.disabled}
            css={`
              width: 100%;
            `}
            min={d1?.numeric?.min}
            max={d1?.numeric?.max}
            step={d1?.numeric?.step}
            precision={d1?.numeric?.decimals ?? 0}
            value={v1}
            onChange={onChangeNum1}
          />
        );
      } else {
        return null;
      }

      return (
        <div
          css={`
            margin: 4px 0;
            display: flex;
            align-items: center;
          `}
          key={'d' + d1?.key}
        >
          {!Utils.isNullOrEmpty(d1?.title) && (
            <div
              css={`
                color: white;
                ${props.titleWidth != null ? `width: ${props.titleWidth}px;` : ''} margin-right: 5px;
              `}
            >
              {d1?.title}:
            </div>
          )}
          <div
            css={`
              flex: 1;
            `}
          >
            {input}
          </div>
        </div>
      );
    });

    return res;
  }, [props.data, itemSel, props.disabled]);

  const resultList = useMemo(() => {
    let res = null;

    if (props.value == null || !_.isArray(props.value)) {
      return null;
    }

    props.value?.some((v1, v1ind) => {
      let resOne = null;
      v1?.some((v1One, v1Oneind) => {
        let o1 = props.data?.find((d1) => calcKey(d1) === v1One?.key);
        if (o1 != null) {
          let label1 = null;
          if (o1?.numeric == null) {
            let optionFound1 = o1?.options?.find((o2) => o2?.value == v1One?.value);
            if (optionFound1 == null) {
              return;
            }
            label1 = optionFound1?.label;
          } else {
            label1 = '' + v1One?.value;
          }

          resOne ??= [];

          if (resOne.length > 0) {
            resOne.push(
              <span
                css={`
                  margin-right: 5px;
                `}
                key={'sep_v1' + v1Oneind + '_' + v1ind}
              >
                ,
              </span>,
            );
          }
          resOne.push(
            <span css={``} key={'v1' + v1Oneind + '_' + v1ind}>
              <span
                css={`
                  color: white;
                `}
              >
                <span
                  css={`
                    opacity: 0.8;
                    margin-right: 5px;
                  `}
                >
                  {o1?.title}:
                </span>
                {label1}
              </span>
            </span>,
          );
        }
      });

      if (resOne != null) {
        resOne.push(
          <span
            key={'trash_' + v1ind}
            css={`
              margin-left: 6px;
            `}
            onClick={(e) => {
              let vv = [...(props.value ?? [])];

              vv.splice(v1ind, 1);

              props.onChange?.(vv);
            }}
          >
            <TooltipExt title={'Remove'}>
              <span
                css={`
                  opacity: 0.8;
                  :hover {
                    opacity: 1;
                  }
                `}
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTrash').faTrash} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'red', cursor: 'pointer', marginLeft: '7px' }} />
              </span>
            </TooltipExt>
          </span>,
        );

        res ??= [];
        res.push(
          <div
            css={`
              margin: 4px 0;
              display: flex;
            `}
            key={'r1' + v1ind}
          >
            <span
              css={`
                margin-top: 4px;
                display: inline-block;
                border-radius: 50%;
                width: 8px;
                height: 8px;
                background: rgba(255, 255, 255, 0.35);
                margin-right: 5px;
              `}
            ></span>
            <span
              css={`
                flex: 1;
              `}
            >
              {resOne}
            </span>
          </div>,
        );
      }
    });

    return res;
  }, [props.data, props.value]);

  const onClickAdd = (e) => {
    setItemSel((i1) => {
      if (i1 != null) {
        let res = [...(props.value ?? [])];

        let resOne = null;
        let kk = Object.keys(i1 ?? {});
        kk.some((k1) => {
          if (!calcIsVisible(k1, i1, i1?.[k1])) {
            return;
          }

          resOne ??= [];
          resOne.push({ key: k1, value: i1?.[k1] });
        });
        props.data?.some((d1) => {
          let key1 = calcKey(d1);
          let v1 = calcValueForKey(key1, i1);

          if (!calcIsVisible(key1, i1, i1?.[key1])) {
            return;
          }

          if (!kk.includes(key1)) {
            resOne ??= [];
            resOne.push({ key: key1, value: v1 });
          }
        });

        //re order
        if (resOne != null) {
          let kkSorted = props.data?.map((d1) => calcKey(d1));
          let res2 = [];
          if (kkSorted != null && kkSorted?.length > 0) {
            kkSorted?.some((k1) => {
              let o1 = resOne.find((o2) => calcKey(o2) === k1);
              if (o1 != null) {
                res2.push(o1);
                resOne = resOne.filter((o2) => calcKey(o2) !== k1);
              }
            });
          }
          if (resOne?.length > 0) {
            res2 = res2.concat(resOne);
          }
          resOne = res2;
        }

        if (resOne != null) {
          let vAlready = null;
          if (props.primaryKey != null) {
            res?.some((r1) => {
              let found1 = r1?.find((r2) => r2.key === props.primaryKey);
              let foundResOne1 = resOne?.find((r2) => r2.key === props.primaryKey);
              if (found1 != null && foundResOne1 != null && found1?.value === foundResOne1?.value) {
                vAlready = r1;
                return true;
              }
            });
          }

          if (vAlready != null) {
            res = res.filter((r1) => r1 !== vAlready);
          }
          res.push(resOne);

          props.onChange?.(res);
        }
      }

      return null;
    });
  };

  return (
    <div
      css={`
        font-size: 11px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 4px 7px;
      `}
    >
      {listElem}
      <Button
        disabled={props.disabled}
        type={'primary'}
        css={`
          margin: 6px 0;
        `}
        onClick={onClickAdd}
        size={'small'}
      >
        Add
      </Button>
      {resultList}
    </div>
  );
});

export default OptionMultiDropdown;
