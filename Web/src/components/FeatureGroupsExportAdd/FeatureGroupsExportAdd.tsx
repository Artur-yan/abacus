import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import confirm from 'antd/lib/modal/confirm';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import ConnectorEditInline from '../ConnectorEditInline/ConnectorEditInline';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import InputCloud from '../InputCloud/InputCloud';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./FeatureGroupsExportAdd.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupsExportAddProps {
  isEditFeatureGroupId?: string;
}

const FeatureGroupsExportAdd = React.memo((props: PropsWithChildren<IFeatureGroupsExportAddProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam, useCasesParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
  }));

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnector, setIsConnector] = useState(paramsProp?.get('useConnector') === 'true');
  const [isConsole, setIsConsole] = useState(paramsProp?.get('useConsole') === 'true');

  useEffect(() => {
    setIsConsole((c1) => {
      setIsConnector((c2) => {
        if (!c1 && !c2) {
          c1 = true;
        }

        return c2;
      });

      return c1;
    });
  }, []);

  const [editConnectorState, setEditConnectorState] = useState(
    {} as {
      editConnector?: any;
      editConnectorConfig?: any;
      editConnectorMode?: any;
      editConnectorColumns?: any;
      editConnectorIDColumn?: any;
      editConnectorIDColumnValue?: any;
      editConnectorColumnsValues?: any;
      editConnectorAdditionalIDColumns?: any;
    },
  );

  const projectId = paramsProp?.get('projectId');
  const featureGroupId = paramsProp?.get('featureGroupId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const featureGroupOne = featuresGroupsList?.find((f1) => f1.featureGroupId === featureGroupId);

  let useVersion = paramsProp?.get('useVersion');
  if (useVersion === '') {
    useVersion = null;
  }

  const refConfirmOverwrite = useRef(null);
  useEffect(() => {
    return () => {
      if (refConfirmOverwrite.current != null) {
        refConfirmOverwrite.current.destroy();
        refConfirmOverwrite.current = null;
      }
    };
  }, []);

  const handleSubmit = (values) => {
    setIsConsole((isConsoleV) => {
      setIsConnector((isC) => {
        if (isC) {
          setEditConnectorState((connectorState) => {
            let usedId = connectorState?.editConnector ?? featureGroupOne?.databaseConnectorId;
            let usedIdConfig = connectorState?.editConnectorConfig ?? featureGroupOne?.databaseOutputConfiguration?.objectName;
            let usedIdMode = connectorState?.editConnectorMode ?? featureGroupOne?.databaseOutputConfiguration?.mode;

            let cols = {};

            let colsValues = connectorState?.editConnectorColumnsValues;
            let usedIdColumns = colsValues ? Object.keys(colsValues) : null;
            if (colsValues == null) {
              let cc = featureGroupOne?.databaseOutputConfiguration?.dataColumns;
              if (cc != null) {
                cols = cc;
              }
            } else {
              usedIdColumns?.some((s1) => {
                cols[s1] = colsValues?.[s1];
              });
            }
            if (Utils.isNullOrEmpty(usedIdColumns)) {
              usedIdColumns = null;
            }

            let usedIdIdColumn = connectorState?.editConnectorIDColumn;
            let usedAdditionalIdColumns = connectorState?.editConnectorAdditionalIDColumns;
            if (_.isArray(usedAdditionalIdColumns) && usedAdditionalIdColumns?.length === 0) {
              usedAdditionalIdColumns = null;
            }

            const stringifyInt = (s1) => {
              if (s1 == null) {
                return s1;
              } else if (_.isString(s1) || _.isNumber(s1) || _.isBoolean(s1)) {
                return s1;
              } else {
                return JSON.stringify(s1);
              }
            };

            //
            REClient_.client_().exportFeatureGroupVersionToDatabaseConnector(useVersion, usedId, usedIdConfig, usedIdMode, stringifyInt(cols), usedIdIdColumn, usedAdditionalIdColumns, (err, res) => {
              if (err || !res?.success) {
                REActions.addNotificationError(err || Constants.errorDefault);
              } else {
                StoreActions.refreshDoFeatureGroupsExportsAll_(res?.result?.exportId ?? res?.result?.featureGroupExportId, featureGroupId);
                StoreActions.featureExportsList_(featureGroupId);
                Location.push('/' + PartsLink.feature_groups_export + '/' + (projectId ?? '-') + '/' + featureGroupId);
              }
            });

            //
            return connectorState;
          });
        } else if (isConsoleV) {
          REClient_.client_().exportFeatureGroupVersionToConsole(useVersion, values.format?.value || 'CSV', (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              StoreActions.refreshDoFeatureGroupsExportsAll_(res?.result?.exportId ?? res?.result?.featureGroupExportId, featureGroupId);
              StoreActions.featureExportsList_(featureGroupId);
              Location.push('/' + PartsLink.feature_groups_export + '/' + (projectId ?? '-') + '/' + featureGroupId);
            }
          });
        } else {
          const doExport = (overwrite = false) => {
            REClient_.client_().exportFeatureGroupVersionToFileConnector(useVersion, values.location, values.format?.value || 'CSV', overwrite, (err, res) => {
              if (err || !res?.success) {
                REActions.addNotificationError(err || Constants.errorDefault);
              } else {
                StoreActions.refreshDoFeatureGroupsExportsAll_(res?.result?.exportId ?? res?.result?.featureGroupExportId, featureGroupId);
                StoreActions.featureExportsList_(featureGroupId);
                Location.push('/' + PartsLink.feature_groups_export + '/' + (projectId ?? '-') + '/' + featureGroupId);
              }
            });
          };

          let b1 = null,
            path1 = null;
          let s1 = values.location;
          if (_.trim(s1 || '') === '') {
            REActions.addNotificationError('Invalid location!');
            return;
          }

          let p1 = s1.indexOf('://');
          if (p1 > -1) {
            let sch1 = s1.substring(0, p1 + 3);
            s1 = s1.substring(sch1.length);

            p1 = s1.indexOf('/');
            if (p1 === -1) {
              b1 = sch1 + s1;
              path1 = '';
            } else {
              let s2 = s1.substring(0, p1);
              b1 = sch1 + s2;
              path1 = s1.substring(s2.length);
            }

            REClient_.client_()._fileExists(b1, path1, (err, res) => {
              if (res?.result === true) {
                //confirm
                refConfirmOverwrite.current = confirm({
                  title: 'Overwrite File',
                  okText: 'Overwrite',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  maskClosable: true,
                  content: 'File already exists, do you want to overwrite?',
                  onOk: () => {
                    refConfirmOverwrite.current = null;
                    doExport(true);
                  },
                  onCancel: () => {
                    refConfirmOverwrite.current = null;
                  },
                });
              } else {
                doExport(false);
              }
            });
          } else {
            REActions.addNotificationError('Invalid location!');
            return;
          }
        }

        return isC;
      });

      return isConsoleV;
    });
  };

  const optionsFormat = useMemo(() => {
    return [
      { label: 'CSV', value: 'CSV' },
      { label: 'JSON', value: 'JSON' },
      { label: 'AVRO', value: 'AVRO' },
    ];
  }, []);

  const styleRectType: CSSProperties = useMemo(() => {
    return {
      position: 'relative',
      backgroundColor: '#131b25',
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
    };
  }, []);

  const onClickType = (isConnectorParam, isConsoleParam) => {
    setIsConnector(isConnectorParam);
    setIsConsole(isConsoleParam);
    Location.push(
      '/' + paramsProp.get('mode') + '/' + projectId + '/' + featureGroupId,
      undefined,
      Utils.processParamsAsQuery({ useConsole: isConsoleParam ? 'true' : '', useConnector: isConnectorParam ? 'true' : '' }, window.location.search),
    );
  };

  const onStateChangeConnector = (stateNew) => {
    setEditConnectorState((stateN) => {
      stateN = { ...(stateN ?? {}) };

      stateN = _.assign(stateN, stateNew ?? {});

      return stateN;
    });
  };

  return (
    <div style={{ margin: '30px auto', maxWidth: '600px', color: Utils.colorA(1) }}>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
        {/*// @ts-ignore*/}
        <Spin spinning={isProcessing} size={'large'}>
          <FormExt layout={'vertical'} form={form} onFinish={handleSubmit} initialValues={{ format: optionsFormat?.find((f1) => f1.value === 'CSV') }}>
            {featureGroupOne != null && (
              <div
                css={`
                  margin: 5px 0 20px;
                  font-size: 20px;
                `}
              >
                <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Feature Group:</span>}>
                  <Input autoComplete={'off'} value={featureGroupOne?.tableName} disabled={true} />
                </Form.Item>
              </div>
            )}

            {
              <Form.Item
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Destination:
                    <HelpIcon id={'fg_export_destination'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
                  <div style={styleRectType} className={sd.rectSel + ' ' + (isConsole ? sd.selected + ' ' + s.selected : '')} onClick={onClickType.bind(null, false, true)}>
                    <div className={s.checkSel}>
                      <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                    </div>
                    Download
                  </div>
                  <div style={styleRectType} className={sd.rectSel + ' ' + (!isConnector && !isConsole ? sd.selected + ' ' + s.selected : '')} onClick={onClickType.bind(null, false, false)}>
                    <div className={s.checkSel}>
                      <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                    </div>
                    File Connector
                  </div>
                  <div style={styleRectType} className={sd.rectSel + ' ' + (isConnector ? sd.selected + ' ' + s.selected : '')} onClick={onClickType.bind(null, true, false)}>
                    <div className={s.checkSel}>
                      <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                    </div>
                    Database Connector
                  </div>
                </div>
              </Form.Item>
            }

            {!isConnector && !isConsole && (
              <Form.Item
                name={'location'}
                style={{ marginBottom: '10px' }}
                hasFeedback
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Location:
                    <HelpIcon id={'fg_export_file_connector_location'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <InputCloud placeholder="Location" />
              </Form.Item>
            )}

            {!isConnector && (
              <Form.Item name={'format'} style={{ marginBottom: '10px' }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Format:</span>}>
                <SelectExt options={optionsFormat} />
              </Form.Item>
            )}

            {isConnector && <ConnectorEditInline showTooltips idColumnAsString isFeatureGroup featureGroupId={featureGroupId} useForm onChangeState={onStateChangeConnector} />}

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                {'Export'}
              </Button>
            </div>
          </FormExt>
        </Spin>
      </Card>

      {/*<div style={{ marginTop: '40px', textAlign: 'center', }}>*/}
      {/*  {useCase1!=null && <HelpBox isBig={true} name={'Need more help adding dataset with appropriate schema?'} subtitle={'Refer to'} subtitle2={'Use-case specific schema'} linkTo={'/help/useCases/'+useCase1+'/datasets'} />}*/}
      {/*</div>*/}
    </div>
  );
});

export default FeatureGroupsExportAdd;
