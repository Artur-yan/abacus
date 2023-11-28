import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import CopyText from '../CopyText/CopyText';
const s = require('./HashIdValue.module.css');
const sd = require('../antdUseDark.module.css');

interface IHashIdValueProps {
  value?: string;
}

const HashIdValue = React.memo((props: PropsWithChildren<IHashIdValueProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [valueId, setValueId] = useState(null);

  useEffect(() => {
    if (Utils.isNullOrEmpty(props.value)) {
      setValueId(null);
    } else {
      REClient_.client_()._searchId(props.value, (err, res) => {
        setValueId(res?.result);
      });
    }
  }, [props.value]);

  const render1 = useMemo(() => {
    if (valueId == null) {
      return null;
    } else {
      return (
        <span>
          <span style={{ marginRight: '5px' }}>
            Hash:{' '}
            <span className={sd.styleTextGrayLight}>
              <CopyText>{valueId.hash}</CopyText>
            </span>
          </span>
          <span style={{ margin: '0 9px' }}>-</span>
          <span style={{ marginRight: '5px' }}>
            Number:{' '}
            <span className={sd.styleTextGrayLight}>
              <CopyText>{valueId.num}</CopyText>
            </span>
          </span>
          <span style={{ margin: '0 9px' }}>-</span>
          <span style={{ marginRight: '5px' }}>
            Type:{' '}
            <span className={sd.styleTextGrayLight}>
              <CopyText>{valueId.type}</CopyText>
            </span>
          </span>
        </span>
      );
    }
  }, [valueId]);

  return <span>{render1}</span>;
});

export default HashIdValue;
