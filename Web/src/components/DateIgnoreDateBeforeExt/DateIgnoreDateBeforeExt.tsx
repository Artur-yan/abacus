import { DatePicker } from 'antd';
import Button from 'antd/lib/button';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
const s = require('./DateIgnoreDateBeforeExt.module.css');
const sd = require('../antdUseDark.module.css');

interface IDateIgnoreDateBeforeExtProps {
  date?: any;
  datasetId?: string;
  onChange?: (date) => void;
}

const DateIgnoreDateBeforeExt = React.memo((props: PropsWithChildren<IDateIgnoreDateBeforeExtProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [date, setDate] = useState(props.date ?? null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (props.date !== date) {
      setDate(props.date);
    }
  }, [props.date]);

  const onChangeDate = (v1) => {
    setDate(v1);
  };

  const onClickSetNew = (e) => {
    setDate(moment());
    setVisible(true);
  };

  const onClickSet = (e) => {
    REClient_.client_().setIgnoreBefore(props.datasetId, date?.unix(), (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        setVisible(false);

        props.onChange?.(date);
      }
    });
  };

  const onClickCancel = (e) => {
    setDate(props.date);
    setVisible(false);
  };

  const onClickChange = (e) => {
    setVisible(true);
  };

  return (
    <span>
      {!visible && date == null && (
        <Button type={'primary'} size={'small'} onClick={onClickSetNew}>
          Set
        </Button>
      )}
      {!visible && date != null && (
        <span>
          {date.format('LLL')}
          <span>
            <Button
              css={`
                margin-left: 10px;
              `}
              type={'primary'}
              size={'small'}
              onClick={onClickChange}
            >
              Change
            </Button>
          </span>
        </span>
      )}

      {visible && (
        <span>
          <DatePicker showTime value={date} onChange={onChangeDate} />
          <span>
            <Button
              css={`
                margin-left: 10px;
              `}
              type={'primary'}
              size={'small'}
              onClick={onClickSet}
            >
              Set
            </Button>
            <Button
              css={`
                margin-left: 10px;
              `}
              type={'primary'}
              size={'small'}
              onClick={onClickCancel}
            >
              Cancel
            </Button>
          </span>
        </span>
      )}
    </span>
  );
});

export default DateIgnoreDateBeforeExt;
