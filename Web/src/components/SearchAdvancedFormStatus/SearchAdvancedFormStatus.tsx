import * as React from 'react';
const s = require('./SearchAdvancedFormStatus.module.css');
const sd = require('../antdUseDark.module.css');
import { connect } from 'react-redux';
import Constants from '../../constants/Constants';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import * as _ from 'lodash';
import cx from 'classnames';
import REActions from '../../actions/REActions';
import Reflux from 'reflux';
import $ from 'jquery';
import memoizeOne, { memoizeOneCurry, memoizeBind } from '../../libs/memoizeOne';
import * as Immutable from 'immutable';
import { PropsWithChildren, useMemo, useState, useEffect, useCallback, useContext, useRef, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { css } from 'styled-components';
import Input from 'antd/lib/input';
import SelectExt from '../SelectExt/SelectExt';
import InputDateExt from '../InputDateExt/InputDateExt';

interface ISearchAdvancedFormStatusProps {
  value?: any;
  onChange?: (v1) => void;
  statusList?: string[];
  type0?: string;
}

const SearchAdvancedFormStatus = React.memo((props: PropsWithChildren<ISearchAdvancedFormStatusProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const styleInput = {
    marginBottom: '7px',
  };

  const [searchFormState, setSearchFormState] = useState(() => {
    let res = null; //Utils.dataNum('advSearchFormRight');
    return res ?? {};
  });

  useEffect(() => {
    if (!_.isEqual(props.value, searchFormState)) {
      setSearchFormState(props.value);
    }
  }, [props.value]);

  const calcValueForm = (fieldName) => {
    return searchFormState?.[fieldName ?? '-'];
  };

  const onChangeForm = (fieldName, isValue, e) => {
    let s1 = { ...(searchFormState ?? {}) };
    let v1 = isValue ? e : e.target.value;

    if (v1 != null && _.isObject(v1 as any)) {
      v1 = v1.value;
    }

    s1[fieldName] = v1;

    // setSearchFormState(s1);
    props.onChange?.(s1);
  };

  const listSearch = [
    {
      type: 'last',
      name: 'Last Version Status of',
    },
    {
      type: 'more',
      name: 'At Least 1 Version Status of',
    },
  ];

  const optionsStatus = useMemo(() => {
    let res = props.statusList?.map((s1) => ({ label: s1, value: s1 })) ?? [];
    res.unshift({ label: '(Select)', value: null });
    return res;
  }, [props.statusList]);

  return (
    <div>
      {listSearch.map((s1, s1ind) => {
        let selValue = calcValueForm(s1.type);
        let optionSel = optionsStatus?.find((v1) => v1.value === selValue);
        if (optionSel == null) {
          optionSel = optionsStatus?.[0];
        }

        return (
          <div
            key={'sea_' + s1ind}
            css={`
              display: flex;
              margin-bottom: 8px;
            `}
          >
            <div
              css={`
                margin-left: 20px;
                font-size: 14px;
                padding-top: 12px;
                margin-right: 15px;
                width: 130px;
              `}
            >
              <div>{s1.name}</div>
            </div>
            <div style={{ flex: 1, marginBottom: '8px', padding: '14px' }}>
              <SelectExt value={optionSel ?? { label: '(Select)', value: null }} onChange={onChangeForm.bind(null, s1.type, true)} placeholder={'Status'} options={optionsStatus} />
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default SearchAdvancedFormStatus;
