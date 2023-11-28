import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import DatePicker from 'antd/lib/date-picker';
import Menu from 'antd/lib/menu';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import DropdownExt from '../DropdownExt/DropdownExt';
const s = require('./InputDateExt.module.css');
const sd = require('../antdUseDark.module.css');

interface IInputDateExtProps {
  placeholder?: string;
  style?: CSSProperties;
  showAfterBefore?: boolean;
  value?: { isBefore: boolean; value: any };
  onChange?: (v1) => void;
  disableBefore?: number;
  disableAfter?: number;
}

const InputDateExt = React.memo((props: PropsWithChildren<IInputDateExtProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const { showAfterBefore = true, disableBefore, disableAfter } = props;
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [allState, setAllState] = useState({ isBefore: false, value: null } as any);
  useEffect(() => {
    setAllState(props.value ?? { isBefore: false, value: null });
  }, [props.value]);

  const calcValueForm = (fieldName) => {
    let res = allState[fieldName ?? '-'];
    if (res != null && ['value'].includes(fieldName)) {
      res = moment.unix(res);
    }
    return res;
  };
  const onChangeForm = (fieldName, isValue, e, doCall = true) => {
    let s1 = { ...(allState ?? {}) };
    const doChange = (fieldName, isValue, e) => {
      s1[fieldName] = isValue ? e : e.target.value;

      if (s1[fieldName] != null && moment.isMoment(s1[fieldName])) {
        s1[fieldName] = s1[fieldName].unix();
      }
    };
    if (_.isArray(fieldName) && _.isArray(isValue) && _.isArray(e)) {
      fieldName.some((f1, f1ind) => {
        doChange(f1, isValue[f1ind], e[f1ind]);
      });
    } else {
      doChange(fieldName, isValue, e);
    }

    setAllState(s1);
    props.onChange?.(s1);
  };

  const onClickBeforeAfter = (e) => {
    let isBefore = !allState['isBefore'];
    onChangeForm('isBefore', true, isBefore);
  };

  const onClickVoid = (event) => {
    if (event && event.domEvent) {
      event.domEvent.stopPropagation();
    }
  };
  const onClickFastMenu = (days, e) => {
    if (days < 0) {
      onChangeForm(['isBefore', 'value'], [true, true], [false, null]);
      return;
    }

    let dt1 = moment()
      .startOf('day')
      .add(-1 * (days ?? 0), 'days');
    onChangeForm(['value', 'isBefore'], [true, true], [dt1, false]);
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');
  const menu = (
    <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
      <Menu.Item onClick={onClickFastMenu.bind(null, -1)}>Clear</Menu.Item>
      <Menu.Item onClick={onClickFastMenu.bind(null, 0)}>Today</Menu.Item>
      <Menu.Item onClick={onClickFastMenu.bind(null, 7)}>Last Week</Menu.Item>
      <Menu.Item onClick={onClickFastMenu.bind(null, 30)}>Last 30 days</Menu.Item>
    </Menu>
  );
  const disabledDate = (current) => {
    if (current) {
      if (disableBefore && !disableAfter) {
        return current?.unix() <= disableBefore;
      } else if (disableAfter && !disableBefore) {
        return current?.unix() >= disableAfter;
      }
    }
  };
  return (
    <span
      className={sd.darkdate}
      css={`
        display: flex;
        align-items: center;
      `}
      style={props.style}
    >
      {showAfterBefore && (
        <Button onClick={onClickBeforeAfter} type={'default'} style={{ borderRadius: 0, border: '1px solid #595959', backgroundColor: '#0C121B', color: 'white', fontSize: '11px', marginRight: '4px', padding: '0 8px', height: '33px' }}>
          {allState['isBefore'] ? 'Before' : 'After'}
        </Button>
      )}
      <DatePicker disabledDate={disabledDate} value={calcValueForm('value')} onChange={onChangeForm.bind(null, 'value', true)} placeholder={props.placeholder} style={{ flex: 1, height: '33px' }} />
      <DropdownExt overlay={menu} trigger={['click']}>
        <Button type={'default'} style={{ borderRadius: 0, border: '1px solid #595959', backgroundColor: '#0C121B', color: 'white', fontSize: '11px', marginLeft: '4px', padding: '0 9px', height: '33px' }}>
          <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faAngleDown').faAngleDown} transform={{ size: 21, x: 0, y: 2 }} style={{ opacity: 0.5 }} />
        </Button>
      </DropdownExt>
    </span>
  );
});

export default InputDateExt;
