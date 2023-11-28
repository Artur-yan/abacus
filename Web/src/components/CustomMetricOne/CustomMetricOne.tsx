import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Spin from 'antd/lib/spin';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useCustomMetricOne, useListSupportedCustomMetricProblemTypes, useNotebook } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./CustomMetricOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IPythonFunctionOneProps {}

const CustomMetricOne = React.memo((props: PropsWithChildren<IPythonFunctionOneProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [form] = Form.useForm();
  const [isProcessing, setIsProcessing] = useState(false);

  const [editNotebookId, setEditNotebookId] = useState(null);

  let name = paramsProp?.get('name');
  if (name === '' || name === '-') {
    name = null;
  }

  let isEdit = paramsProp?.get('isEdit') === '1';

  const customMetricOne = useCustomMetricOne(name);
  const notebookOne = useNotebook(editNotebookId);
  const alreadyInitEdit = useRef(false);

  useEffect(() => {
    alreadyInitEdit.current = false;
  }, [editNotebookId]);

  useEffect(() => {
    if (alreadyInitEdit.current) {
      return;
    }

    if (isEdit && customMetricOne != null) {
      alreadyInitEdit.current = true;

      let vv: any = {
        name: customMetricOne?.name,
        problemType: customMetricOne?.problemType,
        sourceCode: customMetricOne?.latestCustomMetricVersion?.codeSource?.sourceCode,
      };

      setEditNotebookId(customMetricOne?.notebookId);

      form?.setFieldsValue(vv);
    }
  }, [isEdit, customMetricOne, form]);

  const supportedCustomMetricProblemTypes = useListSupportedCustomMetricProblemTypes();
  const problemTypeOptions = useMemo(() => {
    return supportedCustomMetricProblemTypes?.map((s1) => ({ label: s1[1], value: s1[0] }));
  }, [supportedCustomMetricProblemTypes]);

  const onFormChange = (e) => {
    //
  };

  const handleSubmit = (values) => {
    if (!isEdit) {
      REClient_.client_()._createCustomMetricNotebook(values.name, values.problemType?.value, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.listCustomMetrics_();
          Location.push('/' + PartsLink.custom_metric_one + '/' + '-' + '/' + encodeURIComponent(values.name), undefined, 'notebookId=' + encodeURIComponent(res?.result?.notebookId));
        }
      });
    } else {
      Location.push('/' + PartsLink.custom_metrics_list + '/' + '-');
    }
  };

  const onKeyPressName = (e) => {};

  return (
    <div style={{ margin: '0 30px' }}>
      <div style={{ margin: '30px auto', maxWidth: '1000px', color: Utils.colorA(1) }}>
        {
          <div>
            <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
              <span>
                {'Custom Metric'}
                <HelpIcon id={'customMetric_edit_one'} style={{ marginLeft: '4px' }} />
              </span>
            </div>
          </div>
        }
        <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
          {/*// @ts-ignore*/}
          <Spin spinning={isProcessing} size={'large'}>
            {
              <FormExt layout={'vertical'} form={form} onChange={onFormChange} onFinish={handleSubmit} initialValues={{}}>
                {
                  <Form.Item
                    normalize={(value, prevValue, allValues) => {
                      return value?.toUpperCase()?.replace(/[^0-9A-Za-z_]/gi, '');
                    }}
                    name={'name'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Name:
                        <HelpIcon id={'customMetric_name'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input
                      css={
                        isEdit
                          ? `&.ant-input-affix-wrapper.ant-input-affix-wrapper {
                  background-color: #424242 !important;
                }`
                          : ''
                      }
                      disabled={isEdit}
                      placeholder=""
                      autoComplete={'off'}
                      onKeyPress={onKeyPressName}
                    />
                  </Form.Item>
                }

                {
                  <Form.Item
                    name={'problemType'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Type:
                        <HelpIcon id={'customMetric_type'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt isDisabled={isEdit} placeholder={customMetricOne?.problemType} options={problemTypeOptions} />
                  </Form.Item>
                }

                {isEdit && (
                  <div
                    css={`
                      position: relative;
                    `}
                  >
                    <Form.Item
                      name={'sourceCode'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {'Source Code'}:<HelpIcon id={'customMetric_code'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <EditorElemForFeatureGroup readonly allowResizeHeight={'hh_edit_code_custom_metric'} height={400 - 30 - 90} lang={'python'} />
                    </Form.Item>
                  </div>
                )}

                <div
                  css={`
                    margin-top: 15px;
                    font-size: 1px;
                  `}
                >
                  &nbsp;
                </div>

                {isEdit && editNotebookId != null && (
                  <Form.Item
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Notebook:
                        <HelpIcon id={'customMetric_notebook'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Link to={['/' + PartsLink.custom_metric_one + '/-/' + encodeURIComponent(name), 'fromEdit=1&notebookId=' + encodeURIComponent(editNotebookId)]} showAsLinkBlue usePointer>
                      <span>
                        {notebookOne?.name} - {editNotebookId}
                      </span>
                      <span
                        css={`
                          margin-left: 20px;
                        `}
                      >
                        <Button ghost type={'primary'} size={'small'}>
                          Edit
                        </Button>
                      </span>
                    </Link>
                  </Form.Item>
                )}

                <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <Button disabled={false} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                    {isEdit ? 'Close' : 'Add New Custom Metric'}
                  </Button>
                </div>
              </FormExt>
            }
          </Spin>
        </Card>
      </div>
    </div>
  );
});

export default CustomMetricOne;
