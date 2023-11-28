import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./DateOld.module.css');
const sd = require('../antdUseDark.module.css');

interface IDateOldProps {
  unix?: number;
  date?: any;
  format?: string;
  oldDays?: number;
  oldMsg?: string;
  always?: boolean;
  useUTC?: boolean;
}

const DateOld = React.memo((props: PropsWithChildren<IDateOldProps>) => {
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const dt = useMemo(() => {
    let dt: any = null;
    if (props.unix != null) {
      dt = moment.unix(props.unix);
    } else if (props.date != null) {
      dt = moment(props.date);
    }

    if (dt != null && props.useUTC) {
      dt = dt.utc();
    }

    return dt;
  }, [props.unix, props.date, props.useUTC]);

  const res = useMemo(() => {
    if (dt == null) {
      return null;
    } else {
      let days = props.oldDays ?? 7;
      if (!props.always && dt.isBefore(moment().startOf('day').add(-days, 'days'))) {
        return (
          <TooltipExt title={dt.format('LLL')}>
            <span>{props.oldMsg || '> 1 week ago'}</span>
          </TooltipExt>
        );
      } else {
        return dt.format(props.format ?? 'LLL');
      }
    }
  }, [dt, props.oldDays, props.oldMsg]);

  return <span>{res}</span>;
});

export default DateOld;
