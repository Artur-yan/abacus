import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import { useForm } from 'antd/lib/form/Form';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import StoreActions from '../../stores/actions/StoreActions';
import applicationConnectors from '../../stores/reducers/applicationConnectors';
import Connectors from '../Connectors/Connectors';
import FormExt from '../FormExt/FormExt';
import FormItemFileUpload from '../FormItemFileUpload/FormItemFileUpload';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./ModelRegisterPnpPythonSelect.module.css');
const sd = require('../antdUseDark.module.css');

const styleRectType: CSSProperties = {
  position: 'relative',
  backgroundColor: '#19232f',
  padding: '10px',
  flex: 1,
  marginRight: '10px',
  color: 'white',
  lineHeight: '1.2rem',
  textAlign: 'center',
  minHeight: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
};

export const calcModelTypeFromCodeSource = (codeSource?: any) => {
  if (codeSource == null) {
    return null;
  }

  if (_.isObject(codeSource as any)) {
    if (codeSource?.sourceType?.toUpperCase?.() === 'FILE_UPLOAD') {
      return EPnpRegisterModelType.Zip;
    } else if (codeSource?.sourceType?.toUpperCase?.() === 'APPLICATION_CONNECTOR') {
      return EPnpRegisterModelType.Git;
    }
  }
  return EPnpRegisterModelType.Form;
};

export enum EPnpRegisterModelType {
  Form = 'f',
  Zip = 'z',
  Git = 'g',
}

interface IModelRegisterPnpPythonSelectProps {}

const ModelRegisterPnpPythonSelect = React.memo((props: PropsWithChildren<IModelRegisterPnpPythonSelectProps>) => {
  const { paramsProp, authUser, applicationConnectorsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    applicationConnectorsParam: state.applicationConnectors,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const useSel = paramsProp?.get('useSel');
  const typeSel = useMemo(() => {
    let s1 = paramsProp?.get('useSel') || EPnpRegisterModelType.Form;
    if (![EPnpRegisterModelType.Form, EPnpRegisterModelType.Zip, EPnpRegisterModelType.Git].includes(s1)) {
      s1 = EPnpRegisterModelType.Form;
    }
    return s1;
  }, [useSel]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [form] = useForm();
  const [fileSel, setFileSel] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '') {
    projectId = null;
  }

  const onClickType = (type1, e) => {
    Location.push('/' + paramsProp.get('mode') + '/' + projectId, undefined, Utils.processParamsAsQuery({ useSel: type1 }, window.location.search));
  };

  const handleSubmit = (values) => {
    if (projectId == null) {
      return;
    }

    switch (typeSel) {
      case EPnpRegisterModelType.Form:
        Location.push('/' + PartsLink.model_register_form + '/' + projectId);
        break;
      case EPnpRegisterModelType.Zip:
        Location.push('/' + PartsLink.model_register_zip + '/' + projectId);
        break;
      case EPnpRegisterModelType.Git:
        Location.push('/' + PartsLink.model_register_git + '/' + projectId, undefined, 'gitRepoId=' + encodeURIComponent(values?.repo?.value));
        break;
    }
  };

  const onChangeFile = (v1) => {
    setFileSel(v1);
    StoreActions.ModelRegisterPnpPythonZipFile = v1;
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  useEffect(() => {
    applicationConnectors.memApplicationConnectors(true, applicationConnectorsParam);
  }, [applicationConnectorsParam]);
  const applicationList = useMemo(() => {
    return applicationConnectors.memApplicationConnectors(false, applicationConnectorsParam);
  }, [applicationConnectorsParam]);

  const objectsRepo = useMemo(() => {
    return applicationList?.filter((a1) => a1?.service?.toUpperCase() === 'GIT' && a1?.status?.toUpperCase() === 'ACTIVE')?.map((a1) => ({ label: a1?.name + ' - ' + (a1?.auth?.repoUrl ?? ''), value: a1?.applicationConnectorId }));
  }, [applicationList]);

  return (
    <div style={{ margin: '30px auto', maxWidth: '90%', minWidth: '600px', color: Utils.colorA(1), position: 'relative' }}>
      <RefreshAndProgress isRefreshing={isProcessing} isRelative={true}>
        <div style={{ maxWidth: 600 + 'px', margin: '0 auto' }}>
          <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: 'none', borderRadius: '5px' }} className={sd.grayDarkPanel}>
            <FormExt layout={'vertical'} form={form} onFinish={handleSubmit} initialValues={{}}>
              <div
                css={`
                  border-bottom: 1px solid white;
                  padding-bottom: 8px;
                  margin-bottom: 20px;
                  font-family: Matter;
                  font-size: 24px;
                  line-height: 1.33;
                  color: white;
                `}
              >
                Plug and Play Import
              </div>

              {
                <Form.Item style={{ marginBottom: '3px' }} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>{'How would you like to import your model'.toUpperCase()}</span>}>
                  <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
                    <div style={styleRectType} className={sd.rectSel + ' ' + (typeSel === EPnpRegisterModelType.Form ? sd.selected + ' ' + s.selected : '')} onClick={onClickType.bind(null, EPnpRegisterModelType.Form)}>
                      <div className={s.checkSel}>
                        <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                      </div>
                      <div
                        css={`
                          height: 32px;
                        `}
                      >
                        <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPenToSquare').faPenToSquare} transform={{ size: 25, x: 0, y: 2 }} style={{ color: '#' }} />
                      </div>
                      <div>Editor</div>
                    </div>
                    <div style={styleRectType} className={sd.rectSel + ' ' + (typeSel === EPnpRegisterModelType.Zip ? sd.selected + ' ' + s.selected : '')} onClick={onClickType.bind(null, EPnpRegisterModelType.Zip)}>
                      <div className={s.checkSel}>
                        <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                      </div>
                      <div
                        css={`
                          height: 32px;
                        `}
                      >
                        <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faFileArrowUp').faFileArrowUp} transform={{ size: 28, x: 0, y: 2 }} style={{ color: '#' }} />
                      </div>
                      <div>Zip Upload</div>
                    </div>
                    <div style={styleRectType} className={sd.rectSel + ' ' + (typeSel === EPnpRegisterModelType.Git ? sd.selected + ' ' + s.selected : '')} onClick={onClickType.bind(null, EPnpRegisterModelType.Git)}>
                      <div className={s.checkSel}>
                        <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                      </div>
                      <div
                        css={`
                          height: 32px;
                        `}
                      >
                        <FontAwesomeIcon icon={require('@fortawesome/free-brands-svg-icons/faGitAlt').faGitAlt} transform={{ size: 32, x: 0, y: 2 }} style={{ color: '#' }} />
                      </div>
                      <div>Git</div>
                    </div>
                  </div>
                </Form.Item>
              }

              {typeSel === EPnpRegisterModelType.Zip && <FormItemFileUpload accept={'.zip'} dark formRefInstance={form} name={'files'} onChangeFile={onChangeFile} />}
              {typeSel === EPnpRegisterModelType.Git && (
                <span
                  css={`
                    & label {
                      width: 100%;
                    }
                  `}
                >
                  <Form.Item
                    rules={[{ required: true, message: 'Repository Required' }]}
                    name={'repo'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black', width: '100%' }}>
                        SELECT REPOSITORY
                        <span
                          css={`
                            float: right;
                          `}
                        >
                          {/*//@ts-ignore*/}
                          <Connectors style={{ display: 'block' }} isGit>
                            <Button type={'primary'} size={'small'}>
                              Add New Connector
                            </Button>
                          </Connectors>
                        </span>
                      </span>
                    }
                  >
                    <SelectExt options={objectsRepo} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                  </Form.Item>
                </span>
              )}

              <div
                css={`
                  margin-top: 0;
                `}
              >
                <Button
                  htmlType="submit"
                  type={'primary'}
                  css={`
                    width: 100%;
                  `}
                >
                  Continue
                </Button>
              </div>
            </FormExt>
          </Card>
        </div>
      </RefreshAndProgress>
    </div>
  );
});

export default ModelRegisterPnpPythonSelect;
