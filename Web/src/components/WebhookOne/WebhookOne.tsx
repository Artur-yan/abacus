import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Menu from 'antd/lib/menu';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useDeploymentsForProject, useNotebook, useWebhookOne } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import DropdownExt from '../DropdownExt/DropdownExt';
import EditorElem from '../EditorElem/EditorElem';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import { EWebhookEventType } from '../WebhookList/WebhookIdHelpers';
const s = require('./WebhookOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IWebhookOneProps {
  isAdd?: boolean;
}

const WebhookOne = React.memo((props: PropsWithChildren<IWebhookOneProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [editNotebookId, setEditNotebookId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  let isEdit = true; //paramsProp?.get('isEdit')==='1';

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  let deployId = paramsProp?.get('deploymentId');
  if (deployId === '' || deployId === '-') {
    deployId = null;
  }

  let webhookId = paramsProp?.get('webhookId');
  if (webhookId === '' || webhookId === '-') {
    webhookId = null;
  }

  const webhookOne = useWebhookOne(webhookId);
  const notebookOne = useNotebook(editNotebookId);

  const onFormChange = (e) => {
    //
  };

  const handleSubmit = (values) => {
    const cb1 = (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let deploymentIdUse = deployId || webhookOne?.deploymentId;

        StoreActions.deployList_(projectId);
        StoreActions.listWebhooks_({ deploymentId: deploymentIdUse });
        StoreActions.describeWebhook_(webhookId);

        Location.push('/' + PartsLink.deploy_detail + '/' + (projectId ?? '-') + '/' + deploymentIdUse);
      }
    };

    if (props.isAdd) {
      REClient_.client_().createDeploymentWebhook(deployId, values.endpoint, values.webhookEventType?.value, values.json || null, cb1);
    } else {
      REClient_.client_().updateWebhook(webhookId, values.endpoint, values.webhookEventType?.value, values.json || null, cb1);
    }
  };

  const optionsEventType = useMemo(() => {
    let res = [];
    for (let e1 in EWebhookEventType) {
      res.push({ label: Utils.camelCaseWords('' + e1), value: e1 });
    }
    // if(res!=null) {
    //   res = _.sortBy(res, 'label');
    // }
    return res;
  }, [webhookOne]);

  const deploymentList = useDeploymentsForProject(projectId);
  const optionsDeployments = useMemo(() => {
    let res = deploymentList?.map((d1) => ({ label: d1?.name, value: d1?.deploymentId }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [deploymentList]);

  const sample1 = null;

  const initAlreadyId = useRef(null);
  useEffect(() => {
    if (webhookOne == null || !form || !optionsDeployments || !optionsEventType || initAlreadyId.current === webhookOne?.webhookId) {
      return;
    }
    initAlreadyId.current = webhookOne?.webhookId;

    form.setFieldsValue({
      deployment: optionsDeployments?.find((o1) => o1.value === webhookOne?.deploymentId),
      endpoint: webhookOne?.endpoint,
      webhookEventType: optionsEventType?.find((o1) => o1.value?.toUpperCase() === webhookOne?.webhookEventType?.toUpperCase()),
      json: webhookOne?.payloadTemplate,
    });
  }, [webhookOne, form, optionsDeployments]);

  useEffect(() => {
    if (!deployId || !optionsDeployments || !form) {
      return;
    }

    let useDeployValue = form?.getFieldValue('deployment');
    if (useDeployValue && useDeployValue?.value == deployId) {
      let oUsed = optionsDeployments?.find((o1) => o1?.value === useDeployValue?.value);
      if (useDeployValue != null && oUsed != null) {
        return;
      }
    }

    let o1 = optionsDeployments?.find((o1) => o1?.value === deployId);
    form?.setFieldsValue({ deployment: o1 });
  }, [deployId, optionsDeployments, form]);

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const listVars = useMemo(() => {
    return ['DEPLOYMENT_ID', 'PROJECT_ID', 'FEATURE_GROUP_ID', 'FEATURE_GROUP_VERSION', 'EVENT_TIME', 'MODEL_VERSION', 'MODEL_ID', 'ALGORITHM'].sort();
  }, []);

  const menuSamples = useMemo(() => {
    const onClickSample = (text) => {
      form?.setFieldsValue({ json: text || '' });
    };

    return (
      <Menu getPopupContainer={popupContainerForMenu}>
        <Menu.Item
          key={'a1'}
          onClick={onClickSample.bind(
            null,
            `{
    "username": "My Bot",
    "icon_emoji": "my icon",
    "text": "My model deployed! {PRODUCT_URL}, {MODEL_VERSION}, {ALGORITHM}, {DEPLOYMENT_ID}, {EVENT_TIME}",
    "color": "green"
}`,
          )}
        >
          Success Sample
        </Menu.Item>
        <Menu.Item
          key={'a2'}
          onClick={onClickSample.bind(
            null,
            `{
    "username": "My Bot",
    "icon_emoji": "my icon",
    "text": "My model failed deploying! {PRODUCT_URL}, {FAILURE_REASON}, {DEPLOYMENT_ID}, {EVENT_TIME}",
    "color": "red"
}`,
          )}
        >
          Failure Sample
        </Menu.Item>
      </Menu>
    );
  }, [form]);

  return (
    <div style={{ margin: '0 30px' }}>
      <div style={{ margin: '30px auto', maxWidth: '1000px', color: Utils.colorA(1) }}>
        {
          <div>
            <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
              <span>
                {'Webhook'}
                <HelpIcon id={'webhook_edit_one'} style={{ marginLeft: '4px' }} />
              </span>
            </div>
          </div>
        }
        <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
          <Spin spinning={isProcessing} size={'large'}>
            {
              <FormExt layout={'vertical'} form={form} onChange={onFormChange} onFinish={handleSubmit} initialValues={{}}>
                {/*{isEdit && editNotebookId!=null && <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Notebook:<HelpIcon id={'algoone_notebook'} style={{ marginLeft: '4px', }} /></span>}>*/}
                {/*  <Link to={['/'+PartsLink.algorithm_one+'/-/'+encodeURIComponent(algoName), 'fromEdit=1&notebookId='+encodeURIComponent(editNotebookId)]} showAsLinkBlue usePointer>*/}
                {/*    <span>{notebookOne?.name} - {editNotebookId}</span>*/}
                {/*    <span css={`margin-left: 20px;`}>*/}
                {/*      <Button ghost type={'primary'} size={'small'}>Edit</Button>*/}
                {/*    </span>*/}
                {/*  </Link>*/}
                {/*</Form.Item>}*/}

                {isEdit && (
                  <Form.Item
                    name={'deployment'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Deployment:
                        <HelpIcon id={'webhook_deployment'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt options={optionsDeployments} />
                  </Form.Item>
                )}

                {isEdit && (
                  <Form.Item
                    name={'endpoint'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Endpoint:
                        <HelpIcon id={'webhook_endpoint'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input placeholder="" autoComplete={'off'} />
                  </Form.Item>
                )}

                {isEdit && (
                  <Form.Item
                    name={'webhookEventType'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Event Type:
                        <HelpIcon id={'webhook_event_type'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt options={optionsEventType} />
                  </Form.Item>
                )}

                {isEdit && (
                  <Form.Item
                    name={'json'}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(rule, value) {
                          if (value == null || value === '') {
                            return Promise.resolve();
                          } else if (Utils.tryJsonParse(value) == null) {
                            return Promise.reject('Invalid JSON');
                          } else {
                            return Promise.resolve();
                          }
                        },
                      }),
                    ]}
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        {'Payload Template'}:<HelpIcon id={'webhook_payload_template'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <EditorElem listProperties={listVars} lang={'json'} height={300} useInternal hideExpandFGs />
                  </Form.Item>
                )}
                {isEdit && (
                  <div
                    css={`
                      font-size: 14px;
                    `}
                  >
                    <DropdownExt overlay={menuSamples} trigger={['click']}>
                      <span className={sd.linkBlue}>Quick Sample</span>
                    </DropdownExt>
                  </div>
                )}

                <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <Button disabled={false} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                    {!props.isAdd ? `Save Webhook` : 'Add Webhook'}
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

export default WebhookOne;
