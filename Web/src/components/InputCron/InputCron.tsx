import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import cronstrue from 'cronstrue';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import Constants from '../../constants/Constants';
import { Cron } from '../../libs/cron/src';
import HelpIcon from '../HelpIcon/HelpIcon';
const s = require('./InputCron.module.css');
const sd = require('../antdUseDark.module.css');
const cronValidate = require('cron-validate');

interface IInputCronProps {
  defaultValue?: string;
  name?: string;
  onChange?: (v1: any) => void;
  isRequired?: boolean;
  style?: CSSProperties;
  isNew?: boolean;
}

const InputCron = React.memo((props: PropsWithChildren<IInputCronProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const name1 = props.name || 'refreshSchedule';

  const rules = useMemo(() => {
    let res = [];
    if (props.isRequired) {
      res = [{ required: true, message: 'Refresh Schedule Required' }];
    }

    res.push(({ getFieldValue }) => ({
      validator(rule, value) {
        if (!value) {
          return Promise.resolve();
        }

        let res;
        let v1 = value.replace(/\s{2,}/g, ' ');
        try {
          res = cronValidate(v1);
        } catch (e) {
          res = null;
        }

        if (!res?.isValid()) {
          let err1 = res?.getError();

          if (!Utils.isNullOrEmpty(descExpression)) {
            setTimeout(() => {
              setDescExpression(null);
            }, 0);
          }

          return Promise.reject(err1 || 'Invalid cron expression!');
        } else {
          return Promise.resolve();
        }
      },
    }));

    return res;
  }, [props.isRequired]);

  const [cron, setCron] = useState('');

  const [descExpression, setDescExpression] = useState(null);
  const onChangeValue = (e) => {
    let v1 = e.target.value;
    v1 = v1.replace(/\s{2,}/g, ' ');
    if (cron !== v1) {
      setCron(v1);
      props.onChange?.(v1);
    }

    if (Utils.isNullOrEmpty(v1)) {
      if (!Utils.isNullOrEmpty(descExpression)) {
        setDescExpression(null);
      }
    } else {
      let exp1;
      try {
        if (cronValidate(v1)?.isValid()) {
          exp1 = cronstrue.toString(v1);
        }
      } catch (e) {
        exp1 = null;
      }
      if (!_.isString(exp1)) {
        exp1 = null;
      }
      if (descExpression !== exp1) {
        setDescExpression(exp1);
      }
    }
  };

  const [form] = Form.useForm();

  const setValueCron2 = (v1) => {
    setCron(v1);
    props.onChange?.(v1);
  };

  const visual_cron = Constants.flags.visual_cron;

  return (
    <div>
      <Form.Item
        style={props.style || {}}
        required={props.isRequired}
        label={
          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
            {'Set Refresh Schedule UTC' + (props.isNew ? '' : ' (optional)') + ':'}{' '}
            <HelpIcon
              id={'cron_one_title'}
              tooltipOnlyIfNonId
              tooltipText={'The Cron time string format that describes a schedule to retrieve the latest version of the dataset in context. The time is specified in UTC. Use the link to generate schedules: https://crontab.guru/'}
            />
          </span>
        }
      >
        <Form.Item name={name1} rules={rules} style={props.style || {}} noStyle hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Set Refresh Schedule (optional):</span>}>
          <Input defaultValue={props.defaultValue} placeholder="Enter cron expression" autoComplete={'off'} onChange={onChangeValue} />
        </Form.Item>
        {visual_cron && (
          <div style={{ position: 'relative', margin: '8px 0', borderTop: '1px solid ' + Utils.colorA(0.1) }}>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.8)', lineHeight: 1, position: 'absolute', left: '50%', fontSize: '12px', marginLeft: '-20px', top: '-8px', padding: '0 7px', color: Utils.colorA(0.7) }}>OR</div>
          </div>
        )}
        {visual_cron && Utils.isNullOrEmpty(cron) && (
          <div
            style={{ color: Utils.colorA(0.86), lineHeight: 1.3, fontSize: '13px', cursor: 'pointer', textAlign: 'center' }}
            onClick={(e) => {
              setCron('* * * * *');
            }}
          >
            Click To Visual Edit
          </div>
        )}
        {visual_cron && !Utils.isNullOrEmpty(cron) && <Cron humanizeValue={true} humanizeLabels={true} value={cron} setValue={setValueCron2} clearButtonProps={{ style: { backgroundColor: '#280d0d' } }} />}
        {!visual_cron && !Utils.isNullOrEmpty(descExpression) && (
          <div style={{ margin: '4px 0' }} className={sd.styleTextGray}>
            {descExpression}
          </div>
        )}
      </Form.Item>
    </div>
  );
});

export default InputCron;
