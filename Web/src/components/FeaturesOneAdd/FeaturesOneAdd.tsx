import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
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
import { EditorElemPreview, EditorElemPreviewGrid } from '../EditorElem/EditorElem';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { calcSchemaForFeature, FeatureType } from './FeatureType';

const s = require('./FeaturesOneAdd.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeaturesOneAddProps {
  isEditName?: boolean;
}

const FeaturesOneAdd = React.memo((props: PropsWithChildren<IFeaturesOneAddProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typeSelIsTimeWindow, setTypeSelIsTimeWindow] = useState(false);
  const [optionsWindowIntervalTypeSel, setOptionsWindowIntervalTypeSel] = useState(60);
  const [optionsTimestampColumnsSelValue, setOptionsTimestampColumnsSelValue] = useState(null);
  const [formName, setFormName] = useState('');
  const [sqlPreviewData, setSqlPreviewData] = useState(null);
  const [isRefreshingSave, setIsRefreshingSave] = useState(false);

  const refEditorSql = useRef(null);
  const [form] = Form.useForm();

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const featureGroupId = paramsProp?.get('featureGroupId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const featuresOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);

  const optionsWindowIntervalType = useMemo(() => {
    return [
      {
        label: 'Minutes',
        value: 60,
      },
      {
        label: 'Days',
        value: 24 * 60 * 60,
      },
      {
        label: 'Weeks',
        value: 7 * 24 * 60 * 60,
      },
      {
        label: 'Months',
        value: 30 * 24 * 60 * 60,
      },
    ];
  }, []);

  const initialValuesRes = useMemo(() => {
    if (props.isEditName) {
      let f1 = calcSchemaForFeature(featuresOne)?.find((v1) => v1.name === props.isEditName);
      if (f1 != null) {
        let windowInterval = f1.windowInterval;

        let windowIntervalType = optionsWindowIntervalType?.[0]?.value ?? 60;
        optionsWindowIntervalType?.some((int1) => {
          let windowIntervalTypeTemp = int1.value;
          if (windowInterval % windowIntervalTypeTemp === 0) {
            windowIntervalType = windowIntervalTypeTemp;
          }
        });
        if (windowInterval != null) {
          windowInterval = windowInterval / windowIntervalType;
        }

        setTimeout(() => {
          if (f1.featureType === FeatureType.STATIC) {
            setTypeSelIsTimeWindow(false);
          } else {
            setTypeSelIsTimeWindow(true);
          }
          if (f1.startTime == null || !_.isString(f1.startTime)) {
            setOptionsTimestampColumnsSelValue(null);
          } else {
            setOptionsTimestampColumnsSelValue(f1.startTime);
          }
          setOptionsWindowIntervalTypeSel(windowIntervalType);
        }, 0);

        setFormName(f1.name || '');

        let newVars = {
          name: f1.name,
          sql: f1.selectClause,
          windowIntervalNum: windowInterval,
        };

        setTimeout(() => {
          form?.setFieldsValue(newVars);
        }, 0);
        return newVars;
      }
      return {};
    }
    return {};
  }, [featuresOne, props.isEditName, optionsWindowIntervalType]);

  const optionsTimestampColumns = useMemo(() => {
    let res = calcSchemaForFeature(featuresOne)
      ?.filter((f1) => f1.featureType?.toLowerCase() === 'timestamp')
      ?.map((f1) => {
        return {
          label: f1.name,
          value: f1.name,
          data: f1,
        };
      });

    if (res) {
      res.unshift({ label: '(None)', value: null });
    }

    return res;
  }, [featuresOne]);
  const optionsTimestampColumnsSel = useMemo(() => {
    return optionsTimestampColumns?.find((o1) => o1.value === optionsTimestampColumnsSelValue);
  }, [optionsTimestampColumnsSelValue]);
  const onChangeTimestampColumnSel = (option1) => {
    setOptionsTimestampColumnsSelValue(option1?.value);
  };

  const errorConfigMsg = null;

  const handleSubmit = (values) => {
    let timeInterval = values.windowIntervalNum;
    if (!_.isNumber(timeInterval)) {
      timeInterval = null;
    }
    if (timeInterval != null && optionsWindowIntervalTypeSel != null) {
      timeInterval *= optionsWindowIntervalTypeSel;
    } else {
      timeInterval = null;
    }

    let startTime = optionsTimestampColumnsSelValue;

    const doWork = (cbFinish) => {
      if (!props.isEditName) {
        REClient_.client_().addFeature(featureGroupId, values.name, values.sql, (err, res) => {
          if (err || !res?.success) {
            if (res?.sqlError) {
              cbFinish?.(res?.sqlError);
            } else {
              cbFinish?.();
              REActions.addNotificationError(err || Constants.errorDefault);
            }
          } else {
            cbFinish?.();
            if (!projectId) {
              StoreActions.featureGroupsDescribe_(null, featureGroupId);
            } else {
              StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                list?.forEach((f1) => {
                  StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                });
              });
            }
            Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
          }
        });
      } else {
        REClient_.client_().updateFeature(featureGroupId, props.isEditName, values.sql, values.name, (err, res) => {
          if (err || !res?.success) {
            if (res?.sqlError) {
              cbFinish?.(res?.sqlError);
            } else {
              cbFinish?.();
              REActions.addNotificationError(err || Constants.errorDefault);
            }
          } else {
            cbFinish?.();
            StoreActions.featureGroupsGetByProject_(projectId, (list) => {
              list?.some((f1) => {
                StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
              });
            });

            Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
          }
        });
      }
    };

    setIsRefreshingSave(true);
    refEditorSql.current?.doProcessing('Saving...', () => {
      return new Promise((resolve) => {
        doWork((err) => {
          setIsRefreshingSave(false);
          resolve(err);
        });
      });
    });
  };

  const onClickFormat = (e) => {
    refEditorSql.current?.doFormat();
  };

  const onClickPreview = (e) => {
    refEditorSql.current?.doPreview(undefined, (v1) => {
      if (v1) {
        form?.setFieldsValue({ sql: v1 || '' });
      }
    });
  };

  const goToDashboard = () => {};

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
  };

  const onClickType = (type1, e) => {
    setTypeSelIsTimeWindow(type1);
  };

  const sample1 = `CONCAT(REPLACE(title, '.', ''), name)`;

  const onChangeWindowIntervalType = (option1) => {
    setOptionsWindowIntervalTypeSel(option1?.value);
  };

  let timeWindowShow = useMemo(() => {
    // if(Constants.flags.timewindow_demo && (Constants.flags.extra_inputs_schema_usecases || '').split(',').includes(foundProject1?.useCase ?? '-')) {
    //   return true;
    // } else {
    return false;
    // }
  }, []);

  const onChangeForm = () => {
    setTimeout(() => {
      setFormName(form?.getFieldValue('name'));
    }, 0);
  };

  const previewRef = useRef({
    previewData: sqlPreviewData,
    setPreviewData: (newValue) => {
      previewRef.current = { ...previewRef.current };
      previewRef.current.previewData = newValue;
      setSqlPreviewData(newValue);
    },
  });

  return (
    <div style={{ margin: '0 30px' }}>
      <div
        css={`
          width: 320px;
          margin: 20px auto 0 auto;
        `}
      >
        <HelpBox name={'Add Features'} beforeText={' adding Features'} linkTo={'/help/featureEngineering/add_feature'} />
      </div>
      <div style={{ margin: '30px auto', maxWidth: '1000px', color: Utils.colorA(1) }}>
        <RefreshAndProgress isRelative errorMsg={errorConfigMsg} errorButtonText={'Fix Schema Errors'} onClickErrorButton={goToDashboard}>
          <EditorElemPreview.Provider value={previewRef.current}>
            <div style={{ color: 'white', padding: '20px 23px' }} className={sd.grayPanel}>
              {/*// @ts-ignore*/}
              <Spin spinning={isRefreshing} size={'large'}>
                <div
                  css={`
                    font-family: Matter;
                    font-size: 24px;
                    line-height: 1.33;
                    color: #ffffff;
                  `}
                >
                  {props.isEditName ? 'Edit Feature' : 'New Feature'}
                </div>
                <div
                  css={`
                    border-top: 1px solid white;
                    margin-top: 10px;
                    margin-bottom: 8px;
                  `}
                ></div>

                {initialValuesRes != null && (
                  <FormExt
                    onChange={onChangeForm}
                    form={form}
                    css={`
                      font-family: Roboto;
                      font-size: 14px;
                      letter-spacing: 1.31px;
                      color: #ffffff;
                    `}
                    layout={'vertical'}
                    onFinish={handleSubmit}
                    initialValues={initialValuesRes}
                  >
                    <Form.Item name={'name'} rules={[{ required: true, message: 'Name required!' }]} label={<span style={{ color: Utils.colorA(1) }}>Name</span>}>
                      <Input placeholder={'Name'} />
                    </Form.Item>

                    {timeWindowShow && (
                      <Form.Item name={'type'} label={<span style={{ color: Utils.colorA(1) }}>Type of Feature</span>}>
                        <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
                          <div style={styleRectType} className={sd.rectSel + ' ' + (!typeSelIsTimeWindow ? sd.selected + ' ' + s.selected : '')} onClick={onClickType.bind(null, false)}>
                            <div className={s.checkSel}>
                              <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                            </div>
                            Standard
                          </div>
                          <div style={styleRectType} className={sd.rectSel + ' ' + (typeSelIsTimeWindow ? sd.selected + ' ' + s.selected : '')} onClick={onClickType.bind(null, true)}>
                            <div className={s.checkSel}>
                              <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                            </div>
                            Time Window
                          </div>
                        </div>
                      </Form.Item>
                    )}

                    {typeSelIsTimeWindow && timeWindowShow && (
                      <div>
                        <Form.Item label={<span style={{ color: Utils.colorA(1) }}>Timestamp Column</span>}>
                          <SelectExt onChange={onChangeTimestampColumnSel} value={optionsTimestampColumnsSel} options={optionsTimestampColumns} />
                        </Form.Item>

                        <div
                          css={`
                            height: 20px;
                          `}
                        ></div>
                        <Form.Item name={'windowIntervalNum'} label={<span style={{ color: Utils.colorA(1) }}>Time Window Count</span>}>
                          <InputNumber style={{ width: '100%' }} min={1} placeholder={'5'} />
                        </Form.Item>
                        <Form.Item label={<span style={{ color: Utils.colorA(1) }}>Time Window Type</span>}>
                          <SelectExt onChange={onChangeWindowIntervalType} options={optionsWindowIntervalType} value={optionsWindowIntervalType?.find((v1) => v1.value === optionsWindowIntervalTypeSel)} />
                        </Form.Item>
                      </div>
                    )}

                    <div>
                      <Form.Item
                        shouldUpdate
                        name={'sql'}
                        rules={[{ required: true, message: 'Select Clause required!' }]}
                        style={{ marginBottom: 0 }}
                        hasFeedback
                        label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Select Clause:</span>}
                      >
                        <EditorElemForFeatureGroup onlyThisFeatureGroup validateFeatureColumnName={formName} validateFeatureColumn projectId={projectId} featureGroupId={featureGroupId} refEditor={refEditorSql} height={200} />
                      </Form.Item>

                      {!Utils.isNullOrEmpty(sample1) && (
                        <div
                          css={`
                            border-bottom-left-radius: 4px;
                            border-bottom-right-radius: 4px;
                            margin-top: 0;
                            padding: 6px 10px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            background-color: #303030;
                          `}
                        >
                          {!props.isEditName && (
                            <div
                              css={`
                                font-size: 14px;
                                color: #337dee;
                                text-align: center;
                              `}
                            >
                              Sample
                            </div>
                          )}
                          {!props.isEditName && (
                            <div
                              css={`
                                color: rgba(255, 255, 255, 0.7);
                                font-size: 13px;
                                text-align: center;
                              `}
                            >
                              {sample1}
                            </div>
                          )}
                          <div
                            css={`
                              color: rgba(255, 255, 255, 0.4);
                              margin-top: ${!props.isEditName ? 5 : 0}px;
                              font-size: 13px;
                              text-align: center;
                            `}
                          >
                            (Press Ctrl+Space to autocomplete name of columns)
                          </div>
                        </div>
                      )}
                    </div>

                    <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                      <div style={{ borderTop: '1px solid #23305e', margin: '4px -22px' }}></div>
                      <div
                        css={`
                          display: flex;
                          margin-top: 16px;
                        `}
                      >
                        {Constants.flags.show_format_sql && (
                          <Button disabled={isRefreshingSave} type="default" ghost style={{ width: '120px', marginRight: '10px' }} onClick={onClickFormat}>
                            Format SQL
                          </Button>
                        )}
                        <Button disabled={isRefreshingSave} type="default" ghost style={{ width: '120px', marginRight: '10px' }} onClick={onClickPreview}>
                          Preview
                        </Button>
                        <Button disabled={isRefreshingSave} type="primary" htmlType="submit" className="login-form-button" style={{ flex: '1' }}>
                          {props.isEditName ? 'Set Feature' : 'Add Feature'}
                        </Button>
                      </div>
                    </Form.Item>
                  </FormExt>
                )}
              </Spin>
            </div>

            <EditorElemPreviewGrid projectId={projectId} featureGroupId={featureGroupId} />
          </EditorElemPreview.Provider>
        </RefreshAndProgress>
      </div>
    </div>
  );
});

export default FeaturesOneAdd;
