import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { prefixMultiEnumInt } from '../ModelTrain/ModelTrain';
const s = require('./OptionAdd.module.css');
const sd = require('../antdUseDark.module.css');

interface IOptionAddProps {
  label?: string;
  onChange?: (v1: any, index?, vOld?) => void;
  onAdd?: (v1: any) => void;
  min?: number;
  max?: number;
  prefix?: string;
  formatValue?: (num: number) => any;
  formatValueRev?: (num: number) => any;
  valueRefresh?;
  isStrings?: boolean;
  isNumbers?: boolean;
  o?: any;
}

const OptionAdd = React.memo((props: PropsWithChildren<IOptionAddProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [tags, setTags] = useState([]);

  const alreadySet = useRef(false);
  useEffect(() => {
    if (props.valueRefresh == null) {
      return;
    }
    if (alreadySet.current) {
      return;
    }

    const convRev = (v1) => {
      let v2 = v1;
      if (props.formatValueRev && !props.isStrings && !props.isNumbers) {
        v2 = props.formatValueRev(v2);
      }
      return v2;
    };

    alreadySet.current = true;

    let vv = [...(props.valueRefresh ?? [])];
    props.o?.options?.values?.some((v1) => {
      vv = vv?.filter((v2) => v2 !== v1);
    });

    setTags(vv?.map((v1) => convRev(v1)) ?? []);
  }, [props.valueRefresh]);

  const onChangeValue = (ind, isStrings, e) => {
    let v1 = e;
    if (isStrings) {
      v1 = e.target.value;
    }

    if (v1 !== tags?.[ind]) {
      let tt = [...tags];
      let vOld = tt[ind];
      tt[ind] = v1;
      setTags(tt);

      const conv = (v1) => {
        if (v1 == null) {
          return v1;
        }

        let v2 = v1;
        if (props.formatValue && !props.isStrings && !props.isNumbers) {
          v2 = props.formatValue(v2);
        }
        return v2;
      };
      props.onChange?.(conv(v1), ind, conv(vOld));
    }
  };

  const onClickAdd = (e) => {
    let tt = [...(tags ?? [])];
    let v1: any = props.isStrings ? '' : props.min ?? 0;
    tt.push(v1);
    let ind = tt.length - 1;
    setTags(tt);

    const conv = (v1) => {
      let v2 = v1;
      if (props.formatValue && !props.isStrings && !props.isNumbers) {
        v2 = props.formatValue(v2);
      }
      return v2;
    };
    props.onChange?.(conv(v1), ind);
    props.onAdd?.(conv(v1));
  };

  const onClickTop = (e) => {
    // e?.preventDefault();
    // e?.stopPropagation();
  };

  return (
    <>
      {tags?.map((t1, t1ind) => {
        const v1 = props.isStrings || props.isNumbers ? t1 : props.formatValue ? props.formatValue(t1) : t1;

        // @ts-ignore
        return (
          <Checkbox
            value={prefixMultiEnumInt + t1ind}
            style={{ margin: '4px 4px 4px ' + (t1ind === 0 ? 4 : 1) + 'px' }}
            key={'tagcheck' + t1ind + '_'}
            css={`
              color: white;
              white-space: nowrap;
              margin: 0 9px;
            `}
          >
            <span
              css={`
                color: white;
                margin-right: 3px;
              `}
            >
              {props.prefix}
            </span>
            <span onClick={onClickTop} onMouseDown={onClickTop}>
              {!props.isStrings && (
                <InputNumber
                  step={1}
                  css={`
                    width: 60px;
                  `}
                  min={props.min ?? 0}
                  max={props.max ?? 100}
                  value={t1}
                  onChange={onChangeValue.bind(null, t1ind, false)}
                />
              )}
              {props.isStrings && (
                <Input
                  css={`
                    width: 120px;
                  `}
                  value={t1}
                  onChange={onChangeValue.bind(null, t1ind, true)}
                />
              )}
            </span>
          </Checkbox>
        );
      })}
      <Button
        size={'small'}
        css={`
          margin-left: 10px;
        `}
        type={'primary'}
        onClick={onClickAdd}
      >
        {props.label ?? 'Add'}
      </Button>
    </>
  );
});

export default OptionAdd;
