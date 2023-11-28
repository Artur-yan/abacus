// Module imports
import React, { PropsWithChildren, useState, useMemo, useEffect } from 'react';
import Popover from 'antd/lib/popover';
import InputNumber from 'antd/lib/input-number';
import Input from 'antd/lib/input';

// Local imports
import Utils from '../../../core/Utils';
const globalStyles = require('../antdUseDark.module.css');
const styles = require('./TimeWindow.module.css');

interface ILookBackWindowWidgetProps {
  value?: number;
  onChange?(changedValue: number): any;
  isInlineReadOnly?: boolean;
}

const lookbackWindowConfig = {
  DAYS: 'days',
  HOURS: 'hours',
  MINUTES: 'minutes',
  SECONDS: 'seconds',
};

const defaultLobackWindowState = {
  text: '',
  time_info: {
    [lookbackWindowConfig.DAYS]: 0,
    [lookbackWindowConfig.HOURS]: 0,
    [lookbackWindowConfig.MINUTES]: 0,
    [lookbackWindowConfig.SECONDS]: 0,
  },
  totalSeconds: 0,
};

const LookBackWindowWidget = (props: PropsWithChildren<ILookBackWindowWidgetProps>) => {
  const [popoverStatus, setPopoverStatus] = useState(false);
  const [currentLookbackWindowSeconds, setLookbackWindowSeconds] = useState(defaultLobackWindowState);

  useEffect(() => {
    if (props?.value === undefined) return;

    const info = Utils?.convertSecondsToDaysHoursMinutesSeconds(props.value || 0);
    setLookbackWindowSeconds(info);
  }, [props.value]);

  const fields = useMemo(() => {
    if (currentLookbackWindowSeconds?.totalSeconds === null) return <></>;

    const updateDuration = (key, value) => {
      const updatedLookbackWindow = Utils.convertDaysHoursMinutesSecondsToSeconds({ ...currentLookbackWindowSeconds?.time_info, [key]: value });
      props.onChange?.(updatedLookbackWindow?.totalSeconds);
    };

    const { time_info } = currentLookbackWindowSeconds || {};

    return (
      <div className={styles.container}>
        {Object.entries(lookbackWindowConfig).map(([title, key]) => (
          <div key={key} className={styles.row}>
            <p>{key}</p>
            <InputNumber min={0} className={styles.windowInput} size="large" value={time_info?.[key]} defaultValue={0} onChange={(val) => updateDuration(key, val)} />
          </div>
        ))}
      </div>
    );
  }, [currentLookbackWindowSeconds, props.onChange]);

  return (
    <Popover content={fields} placement="bottomLeft" trigger="click" open={popoverStatus} onOpenChange={(status) => setPopoverStatus(status)} color="#223347" overlayClassName={styles.lookbackWindowPopover}>
      <Input readOnly autoComplete="off" disabled={props.isInlineReadOnly} className={styles.lookbackInput} value={currentLookbackWindowSeconds?.text} />
    </Popover>
  );
};

export default React.memo(LookBackWindowWidget);
