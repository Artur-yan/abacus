import Checkbox from 'antd/lib/checkbox';
import * as _ from 'lodash';
import * as React from 'react';
import { MutableRefObject, PropsWithChildren, useEffect, useMemo, useReducer, useRef } from 'react';
import Utils from '../../../core/Utils';
import { prefixMultiEnumC, prefixMultiEnumInt } from '../ModelTrain/ModelTrain';
import OptionAdd from '../OptionAdd/OptionAdd';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./MultiEnumComp.module.css');
const sd = require('../antdUseDark.module.css');

interface IMultiEnumCompProps {
  value?: any;
  onChange?: (newValue?: any) => void;

  o?: any;
  formRef?: MutableRefObject<any>;
  disabled?: boolean;
}

const MultiEnumComp = React.memo((props: PropsWithChildren<IMultiEnumCompProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const isStrings = props.o?.options?.isStrings === true;
  const isNumbers = props.o?.options?.isNumbers === true;
  const allowAdd = props.o?.options?.allowAdd === true;
  const inputInitialValue = props.o?.lastModelValue == undefined ? props.o?.default : props.o?.lastModelValue;
  const inputName = props.o?.name + '_CUSTOMENUM';

  const refValuesAdd = useRef([]);

  const lastValue = useRef(null);
  const lastValueRes = useRef(null);
  const valueUsed = useMemo(() => {
    let vv = props.value;

    if (lastValue.current != null && _.isEqual(vv, lastValue.current)) {
      return lastValueRes.current;
    }
    lastValue.current = vv;

    //
    let res = [];

    props.o?.options.values?.some((v1) => {
      let isIn = vv?.includes(v1);
      vv = vv?.filter((v2) => v2 !== v1);
      if (isIn) {
        res.push(v1);
      }
    });

    vv?.some((v1) => {
      let ind1 = _.findIndex(refValuesAdd.current, (v2) => v2 === v1);
      if (ind1 > -1) {
        res.push(prefixMultiEnumInt + ind1);
      }
    });

    lastValueRes.current = res;
    return res;
  }, [props.value, props.o]);

  const alreadySetInit = useRef(false);
  useEffect(() => {
    if (props.value == null) {
      return;
    }
    if (alreadySetInit.current) {
      return;
    }

    alreadySetInit.current = true;

    refValuesAdd.current ??= [];

    let vv = [...(props.value ?? [])];
    props.o?.options?.values?.some((v1) => {
      vv = vv?.filter((v2) => v2 !== v1);
    });

    vv?.some((v1) => {
      refValuesAdd.current.push(v1);
    });

    lastValue.current = null;

    let vvSet = props.formRef?.current.getFieldValue(inputName) ?? [];
    refValuesAdd.current?.some((s1) => {
      if (!vvSet.includes(s1)) {
        vvSet.push(s1);
      }
    });
    props.formRef?.current.setFieldsValue({ [inputName]: vvSet });
    // props.onChange?.(refValuesAdd.current);
  }, [props.value, isStrings, isNumbers]);

  const onChangeValue = (v1) => {
    if (v1 != null && _.isArray(v1)) {
      let res = [];
      v1?.some((v0) => {
        if (_.startsWith(v0, prefixMultiEnumInt)) {
          let ind1 = Utils.tryParseInt(v0.substring(v0.indexOf('_') + 1));
          if (ind1 != null && ind1 > -1) {
            v0 = refValuesAdd.current?.[ind1];
            res.push(v0);
          }
        } else {
          res.push(v0);
        }
      });

      props.onChange?.(res);
    } else {
      props.onChange?.(v1);
    }
  };

  const onKeyDownCheckbox = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <Checkbox.Group
        disabled={props.disabled}
        value={valueUsed}
        onChange={onChangeValue}
        style={{ marginTop: '1px' }}
        css={`
          & .ant-checkbox-wrapper.ant-checkbox-wrapper {
            margin-top: 5px;
            margin-left: 0;
            margin-right: 5px;
          }
        `}
      >
        {props.o?.options?.names?.map((o1, o1ind) => {
          let isDisabled = props.o?.options.disabled ? props.o?.options.disabled.indexOf(o1) > -1 : false;
          let isDisabledNext = props.o?.options?.names?.[o1ind + 1] != null && props.o?.options.disabled ? props.o?.options.disabled.indexOf(props.o?.options?.names?.[o1ind + 1]) > -1 : false;

          let res = (
            <Checkbox className={isDisabled ? sd.pointerEventsNone : ''} key={'chkbox_' + props.o?.name + '_' + props.o?.options.names?.[o1ind]} value={props.o?.options.values[o1ind]} style={{ color: Utils.colorA(1) }}>
              <span style={{ color: Utils.colorA(1) }}>{props.o?.options.names?.[o1ind]}</span>
            </Checkbox>
          );
          if (isDisabled) {
            res = (
              <TooltipExt key={'chk22_' + props.o?.name + '_' + o1ind} title={'Disabled'}>
                <span
                  css={`
                    margin-right: ${isDisabledNext ? 0 : 8}px;
                    margin-left: 8px;
                  `}
                  onKeyDown={onKeyDownCheckbox}
                >
                  {res}
                </span>
              </TooltipExt>
            );
          }
          return res;
        })}
        {allowAdd && (
          <OptionAdd
            key={'addOptionsKey'}
            onChange={(v1, ind, vOld) => {
              if (true) {
                refValuesAdd.current ??= [];
                refValuesAdd.current[ind] = v1;
                let indOri = ind;

                setTimeout(() => {
                  let vv = props.formRef?.current.getFieldValue(inputName);
                  if (vv == null) {
                    vv = [];
                  } else {
                    vv = [...vv];
                  }

                  vv = vv?.filter((v1) => v1 != null);

                  let ind = vv.indexOf(vOld);
                  if (vOld == null) {
                    ind = vv.length;
                  }
                  if (ind > -1) {
                    vv[ind] = v1;
                    props.formRef?.current.setFieldsValue({ [inputName]: vv });
                  }
                }, 0);
              }
            }}
            isNumbers={isNumbers}
            isStrings={isStrings}
            o={props.o}
            valueRefresh={props.formRef?.current?.getFieldValue(inputName)}
            label={props.o?.options?.addLabel}
            onAdd={(v1) => {
              refValuesAdd.current ??= [];
              refValuesAdd.current.push(v1);

              if (props.formRef?.current) {
                setTimeout(() => {
                  let vv = props.formRef?.current.getFieldValue(inputName);
                  if (vv == null) {
                    vv = [];
                  } else {
                    vv = [...vv];
                  }
                  if (!vv.includes(v1)) {
                    vv.push(v1);

                    props.formRef?.current.setFieldsValue({ [inputName]: vv });
                  }
                }, 0);
              }
            }}
            prefix={props.o?.options?.prefix ?? (isStrings || isNumbers ? null : 'P')}
            min={props.o?.options?.min ?? 1}
            max={props.o?.options?.max ?? 100}
            formatValue={(v1) => (v1 == null ? null : (props.o?.options?.prefixValue ?? prefixMultiEnumC) + v1 / 100)}
            formatValueRev={(v1) => (v1 == null ? null : v1 * 100)}
          />
        )}
      </Checkbox.Group>
    </>
  );
});

export default MultiEnumComp;
