import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Spin from 'antd/lib/spin';
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
import EditorElem, { EditorElemPreview } from '../EditorElem/EditorElem';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import { calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';

const s = require('./FeaturesOneAddNested.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeaturesOneAddNestedProps {
  isEditName?: any;
}

const FeaturesOneAddNested = React.memo((props: PropsWithChildren<IFeaturesOneAddNestedProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refEditorUsing = useRef(null);
  const refEditorWhere = useRef(null);
  const refEditorOrder = useRef(null);
  const [formRef] = Form.useForm();
  const [isRefreshingSave, setIsRefreshingSave] = useState(false);

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

  const featureGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [projectId, featureGroupsParam]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [projectId, featureGroupsParam]);

  const listFGnames = useMemo(() => {
    return featureGroupsList?.map((f1) => f1?.tableName)?.filter((v1) => !Utils.isNullOrEmpty(v1));
  }, [featureGroupsList]);

  const initialValuesRes = useMemo(() => {
    if (props.isEditName) {
      let f1 = calcSchemaForFeature(featuresOne)?.find((v1) => v1.name === props.isEditName);
      if (f1 != null) {
        let obj1 = {
          name: f1.name,
          sql: f1.selectClause,

          tableName: f1.sourceTable,
          usingClause: f1.usingClause,
          whereClause: f1.whereClause,
          orderClause: f1.orderClause,
        };
        setTimeout(() => {
          formRef?.setFieldsValue(obj1);
        }, 0);
        return obj1;
      }
      return {};
    }
    return {};
  }, [featuresOne, props.isEditName, formRef]);

  const errorConfigMsg = null;

  const handleSubmit = (values) => {
    const doWork = () => {
      if (!props.isEditName) {
        setIsRefreshingSave(true);
        REClient_.client_().addNestedFeature(featureGroupId, values.name, values.tableName, values.usingClause, values.whereClause, values.orderClause, (err, res) => {
          setIsRefreshingSave(false);
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.featureGroupsGetByProject_(projectId, (list) => {
              list?.some((f1) => {
                StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
              });
            });

            Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
          }
        });
      } else {
        setIsRefreshingSave(true);
        REClient_.client_().updateNestedFeature(featureGroupId, props.isEditName, values.name, values.tableName, values.usingClause, values.whereClause, values.orderClause, (err, res) => {
          setIsRefreshingSave(false);
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
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

    doWork();
    // refEditorSql.current?.doValidate().then(isOk => {
    //   if(isOk) {
    //     doWork();
    //   }
    // });
  };

  const onClickFormat = (e) => {
    refEditorUsing.current?.doFormat();
    refEditorWhere.current?.doFormat();
    refEditorOrder.current?.doFormat();
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

  const sampleUsing = `my_nested_fg.id = parent_fg.nested_id`;
  const sampleWhere = `my_nested_fg.timestamp < parent_fg.renewal_time`;
  const sampleOrder = `timestamp`;

  const previewRef = useRef({ previewData: null, setPreviewData: (newValue) => {} });

  return (
    <div style={{ margin: '0 30px' }}>
      <div
        css={`
          width: 350px;
          margin: 20px auto 0 auto;
        `}
      >
        <HelpBox name={'Add Nested Features'} beforeText={' adding Nested Features'} linkTo={'/help/featureEngineering/add_nested_feature'} />
      </div>
      <div style={{ margin: '30px auto', maxWidth: '1000px', color: Utils.colorA(1) }}>
        <RefreshAndProgress isRelative errorMsg={errorConfigMsg} errorButtonText={'Fix Schema Errors'} onClickErrorButton={goToDashboard}>
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
                {props.isEditName ? 'Edit Nested Feature' : 'New Nested Feature'}
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
                  form={formRef}
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
                  <Form.Item
                    name={'name'}
                    rules={[{ required: true, message: 'Name required!' }]}
                    label={
                      <span style={{ color: Utils.colorA(1) }}>
                        Name
                        <HelpIcon id={'feature_nested_name'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input placeholder={'Name'} />
                  </Form.Item>

                  <div>
                    <EditorElemPreview.Provider value={previewRef.current}>
                      <Form.Item
                        name={'tableName'}
                        rules={[{ required: true, message: 'Table Name required!' }]}
                        hasFeedback
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            Table Name:
                            <HelpIcon id={'feature_nested_tablename'} style={{ marginLeft: '4px' }} />
                          </span>
                        }
                      >
                        <EditorElem useInternal validateOnCall height={40} listProperties={listFGnames} />
                      </Form.Item>
                    </EditorElemPreview.Provider>
                  </div>

                  <div>
                    <EditorElemPreview.Provider value={previewRef.current}>
                      <Form.Item
                        name={'usingClause'}
                        rules={[{ required: true, message: 'Using Clause required!' }]}
                        style={{ marginBottom: 0 }}
                        hasFeedback
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            Using Clause:
                            <HelpIcon id={'feature_nested_using_clause'} style={{ marginLeft: '4px' }} />
                          </span>
                        }
                      >
                        <EditorElemForFeatureGroup refEditor={refEditorUsing} height={80} projectId={projectId} featureGroupId={featureGroupId} />
                      </Form.Item>
                    </EditorElemPreview.Provider>

                    {!Utils.isNullOrEmpty(sampleUsing) && (
                      <div
                        css={`
                          border-bottom-left-radius: 4px;
                          border-bottom-right-radius: 4px;
                          margin-top: 0;
                          margin-bottom: 15px;
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
                            {sampleUsing}
                          </div>
                        )}
                        {/*<div css={`color: rgba(255, 255, 255, 0.4); margin-top: ${!props.isEditName ? 5 : 0}px; font-size: 13px; text-align: center;`}>*/}
                        {/*  (Press Ctrl+Space to autocomplete name of columns)*/}
                        {/*</div>*/}
                      </div>
                    )}
                  </div>

                  <div>
                    <EditorElemPreview.Provider value={previewRef.current}>
                      <Form.Item
                        name={'whereClause'}
                        style={{ marginBottom: 0 }}
                        hasFeedback
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            Where Clause:
                            <HelpIcon id={'feature_nested_where_clause'} style={{ marginLeft: '4px' }} />
                          </span>
                        }
                      >
                        <EditorElemForFeatureGroup refEditor={refEditorWhere} height={80} projectId={projectId} featureGroupId={featureGroupId} />
                      </Form.Item>
                    </EditorElemPreview.Provider>

                    {!Utils.isNullOrEmpty(sampleWhere) && (
                      <div
                        css={`
                          border-bottom-left-radius: 4px;
                          border-bottom-right-radius: 4px;
                          margin-top: 0;
                          margin-bottom: 15px;
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
                            {sampleWhere}
                          </div>
                        )}
                        {/*<div css={`color: rgba(255, 255, 255, 0.4); margin-top: ${!props.isEditName ? 5 : 0}px; font-size: 13px; text-align: center;`}>*/}
                        {/*  (Press Ctrl+Space to autocomplete name of columns)*/}
                        {/*</div>*/}
                      </div>
                    )}
                  </div>

                  <div>
                    <EditorElemPreview.Provider value={previewRef.current}>
                      <Form.Item
                        name={'orderClause'}
                        style={{ marginBottom: 0 }}
                        hasFeedback
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            Order Clause:
                            <HelpIcon id={'feature_nested_order_clause'} style={{ marginLeft: '4px' }} />
                          </span>
                        }
                      >
                        <EditorElemForFeatureGroup refEditor={refEditorOrder} height={80} projectId={projectId} featureGroupId={featureGroupId} />
                      </Form.Item>
                    </EditorElemPreview.Provider>

                    {!Utils.isNullOrEmpty(sampleOrder) && (
                      <div
                        css={`
                          border-bottom-left-radius: 4px;
                          border-bottom-right-radius: 4px;
                          margin-top: 0;
                          margin-bottom: 15px;
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
                            {sampleOrder}
                          </div>
                        )}
                        {/*<div css={`color: rgba(255, 255, 255, 0.4); margin-top: ${!props.isEditName ? 5 : 0}px; font-size: 13px; text-align: center;`}>*/}
                        {/*  (Press Ctrl+Space to autocomplete name of columns)*/}
                        {/*</div>*/}
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
                      <Button disabled={isRefreshingSave} type="primary" htmlType="submit" className="login-form-button" style={{ flex: '1' }}>
                        {props.isEditName ? 'Set Nested Feature' : 'Add Nested Feature'}
                      </Button>
                    </div>
                  </Form.Item>
                </FormExt>
              )}
            </Spin>
          </div>
        </RefreshAndProgress>
      </div>
    </div>
  );
});

export default FeaturesOneAddNested;
