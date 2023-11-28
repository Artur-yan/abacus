import Col from 'antd/lib/col';
import Form from 'antd/lib/form';
import InputNumber from 'antd/lib/input-number';
import Row from 'antd/lib/row';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useImperativeHandle, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import { useCpuAndMemory } from '../../api/REUses';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./CpuAndMemoryOptions.module.css');
const sd = require('../antdUseDark.module.css');

interface ICpuAndMemoryOptionsProps {
  name?: 'NB' | 'PythonFG' | 'CustomModel' | string;
  isForm?: boolean;
  isOnlyCpu?: boolean;
  isOnlyMemory?: boolean;

  readonly?: boolean;
  form?: any;
  memoryLabel?: string;
  helpidPrefix?: string;

  cpuValue?: any;
  cpuOnChange?: (newValue: any) => void;
  memoryValue?: any;
  memoryOnChange?: (newValue: any) => void;

  asText?: boolean;
  showClosestValue?: boolean;
  fillWidth?: boolean;
}

const CpuAndMemoryOptions = React.memo(
  React.forwardRef((props: PropsWithChildren<ICpuAndMemoryOptionsProps>, ref: any) => {
    const { paramsProp, authUser } = useSelector((state: any) => ({
      paramsProp: state.paramsProp,
      authUser: state.authUser,
    }));

    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

    const cpuAndMemory = useCpuAndMemory();
    const cpuAndMemoryOne = useMemo(() => {
      return cpuAndMemory?.[props.name] ?? null;
    }, [cpuAndMemory, props.name]);

    const optionsCpuSizes = useMemo(() => {
      return cpuAndMemoryOne?.cpu?.list?.map((c1) => ({ label: c1.label, value: c1.value }));
    }, [cpuAndMemoryOne]);

    const optionsMemory = useMemo(() => {
      if (cpuAndMemoryOne?.memory?.isCustom === true) {
        return null;
      } else {
        return cpuAndMemoryOne?.memory?.list?.map((m1) => ({ label: m1.label, value: m1.value }));
      }
    }, [cpuAndMemoryOne]);

    useEffect(() => {
      if (props.isForm) {
        if (props.form) {
          let vv: any = {};

          if (cpuAndMemoryOne?.cpu?.default != null) {
            vv['cpuSize'] = optionsCpuSizes?.find((o1) => o1.value === cpuAndMemoryOne?.cpu?.default);
          }

          if (optionsMemory == null) {
            vv['memory'] = cpuAndMemoryOne?.memory?.default;
          } else {
            vv['memory'] = optionsMemory?.find((o1) => o1.value === cpuAndMemoryOne?.memory?.default);
          }

          setTimeout(() => {
            props.form?.setFieldsValue(vv);
          }, 0);
        }
      } else {
        //
      }
    }, [cpuAndMemoryOne, optionsCpuSizes, optionsMemory, props.form]);

    useImperativeHandle(
      ref,
      () => ({
        setCpuValue: (value) => {
          if (props.isForm) {
            if (props.form) {
              let vv: any = {};

              vv['cpuSize'] = optionsCpuSizes?.find((o1) => o1.value === value);

              props.form?.setFieldsValue(vv);
            }
          } else {
            //
          }
        },
        setMemoryValue: (value) => {
          if (props.isForm) {
            if (props.form) {
              let vv: any = {};

              if (optionsMemory == null) {
                vv['memory'] = value;
              } else {
                let m1 = optionsMemory?.find((o1) => o1.value === value);
                if (m1 == null && value != null) {
                  let diffMin = null;
                  optionsMemory?.some((o1) => {
                    let diff1 = Math.abs(o1.value - value);
                    if (diffMin == null || (_.isNumber(diff1) && diff1 < diffMin)) {
                      diffMin = diff1;
                      m1 = o1;
                    }
                  });
                }
                vv['memory'] = m1;
              }

              props.form?.setFieldsValue(vv);
            }
          } else {
            //
          }
        },
      }),
      [props.isForm, props.form, optionsMemory, optionsCpuSizes],
    );

    const closestMemoryValue = useMemo(() => {
      if (!props.showClosestValue || props.memoryValue == null) {
        return null;
      }

      //
      let m1 = optionsMemory?.find((o1) => o1.value === props.memoryValue);
      if (m1 == null && props.memoryValue != null) {
        let diffMin = null;
        optionsMemory?.some((o1) => {
          let diff1 = Math.abs(o1.value - props.memoryValue);
          if (diffMin == null || (_.isNumber(diff1) && diff1 < diffMin)) {
            diffMin = diff1;
            m1 = o1;
          }
        });

        if (m1 != null) {
          return m1;
        }
      }

      return null;
    }, [props.showClosestValue, props.memoryValue]);

    //
    if (cpuAndMemoryOne == null) {
      return null;
    }

    if (props.isForm) {
      return (
        <Row style={{ width: '100%' }}>
          {optionsCpuSizes != null && (
            <Col style={{ width: '50%', paddingRight: '10px' }}>
              <Form.Item
                name={'cpuSize'}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    CPU Size:
                    <HelpIcon id={props.helpidPrefix + '_cpusize'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <SelectExt isDisabled={props.readonly} options={optionsCpuSizes} />
              </Form.Item>
            </Col>
          )}
          <Col style={{ width: props?.fillWidth ? '100%' : '50%', paddingLeft: props?.fillWidth ? 0 : '10px' }}>
            {optionsMemory == null && (
              <Form.Item
                name={'memory'}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    {props.memoryLabel ?? 'Memory (GB)'}:<HelpIcon id={props.helpidPrefix + '_memory'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <InputNumber disabled={props.readonly} style={{ width: '100%' }} min={cpuAndMemoryOne?.memory?.min ?? 1} max={cpuAndMemoryOne?.memory?.max} autoComplete={'off'} placeholder={cpuAndMemoryOne?.memory?.placeholder} />
              </Form.Item>
            )}
            {optionsMemory != null && (
              <Form.Item
                name={'memory'}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    {props.memoryLabel ?? 'Memory'}:<HelpIcon id={props.helpidPrefix + '_memory'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <SelectExt isDisabled={props.readonly} options={optionsMemory} placeholder={cpuAndMemoryOne?.memory?.placeholder} />
              </Form.Item>
            )}
          </Col>
        </Row>
      );
    } else {
      let cpu1 = null;
      let memory1 = null;

      if (!props.isOnlyMemory) {
        if (props.asText) {
          cpu1 = <span>{optionsCpuSizes?.find((o1) => o1.value == props.cpuValue)?.label}</span>;
        } else {
          cpu1 = <SelectExt isDisabled={props.readonly} options={optionsCpuSizes} value={props.cpuValue} onChange={props.cpuOnChange} />;
        }
      }
      if (!props.isOnlyCpu) {
        if (props.asText) {
          memory1 = <span>{props.showClosestValue ? optionsMemory?.find((o1) => o1.value == (closestMemoryValue ?? props.memoryValue))?.label : (props.memoryValue ?? 0) + ' GB'}</span>;
        } else {
          memory1 = <SelectExt isDisabled={props.readonly} options={optionsMemory} value={closestMemoryValue ?? props.memoryValue} onChange={props.memoryOnChange} />;
        }
      }

      if (cpu1 != null && memory1 != null) {
        return (
          <div>
            {cpu1}
            <div
              css={`
                margin-top: 10px;
              `}
            ></div>
            {memory1}
          </div>
        );
      } else if (cpu1 != null) {
        return cpu1;
      } else {
        return memory1;
      }
    }
  }),
);

export default CpuAndMemoryOptions;
