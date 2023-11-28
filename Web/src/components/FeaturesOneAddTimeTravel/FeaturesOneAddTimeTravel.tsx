import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Radio from 'antd/lib/radio';
import Select from 'antd/lib/select';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import { calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const { Option } = Select;

const s = require('./FeaturesOneAddTimeTravel.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeaturesOneAddTimeTravelProps {
  isEditName?: any;
}

const FeaturesOneAddTimeTravel = React.memo((props: PropsWithChildren<IFeaturesOneAddTimeTravelProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComputingComplexity, setIsComputingComplexity] = useState(false);
  const [timeComplexity, setTimeComplexity] = useState(null);
  const [currentHistoryTableName, setHistoryTableName] = useState(null);
  const [currentAggKeys, setAggKeys] = useState([]);
  const [currentTimeColumn, setTimeColumn] = useState(null);
  const refEditorUsing = useRef(null);
  const refEditorWhere = useRef(null);
  const refEditorOrder = useRef(null);
  const [formRef] = Form.useForm();
  const [isRefreshingSave, setIsRefreshingSave] = useState(false);
  const [isLookbackSeconds, setIsLookbackSeconds] = useState(false);
  const [currentOnlineLookbackWindowSeconds, setOnlineLookbackWindowSeconds] = useState(null);
  const [currentLookbackWindowSeconds, setLookbackWindowSeconds] = useState(null);
  const [currentOnlineLookbackCount, setOnlineLookbackCount] = useState(null);
  const [currentLookbackCount, setLookbackCount] = useState(null);
  const [currentSql, setSql] = useState(null);

  const [fgJoinId, setFgJoinId] = useState(null);
  const [columnsListJoin, setColumnsListJoin] = useState(null);

  const [columnsList, setColumnsList] = useState(null);
  const refEditorSql = useRef(null);
  const refOldName = useRef(null);

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

  const [allFG, setAllFG] = useState(null);
  const [isAllFGRefreshing, setIsAllFGRefreshing] = useState(false);
  useEffect(() => {
    if (allFG == null) {
      setIsAllFGRefreshing(true);
      REClient_.client_()._listFeatureGroupsDashboard(null, 5000, null, null, null, (err, res) => {
        setAllFG(
          res?.result?.sort((a, b) => {
            return (a.tableName ?? a.name)?.toLowerCase()?.localeCompare((b.tableName ?? b.name)?.toLowerCase());
          }) ?? [],
        );
        setIsAllFGRefreshing(false);
      });
    }
  }, [projectId, allFG]);

  const optionsFeatureGroups = useMemo(() => {
    return allFG?.map((f1) => {
      return {
        label: f1.tableName ?? f1.name,
        value: f1.featureGroupId,
        data: f1,
      };
    });
  }, [
    /*featureGroupsList, */
    allFG,
    projectId,
  ]);

  const optionsColumnsJoin = useMemo(() => {
    return columnsListJoin?.map((c1, c1ind) => {
      return {
        label: c1.name,
        value: c1.name,
      };
    });
  }, [columnsListJoin]);

  const optionsFeatureGroupsJoin = useMemo(() => {
    return optionsFeatureGroups; //?.filter(f1 => f1.value!==featureGroupId);
  }, [optionsFeatureGroups, featureGroupId]);

  const optionsColumns = useMemo(() => {
    return columnsList
      ?.filter((c1) => c1.featureType?.toUpperCase() === 'TIMESTAMP')
      ?.map((c1, c1ind) => {
        return {
          label: c1.name,
          value: c1.name,
        };
      });
  }, [columnsList]);

  const refInitAlreadyUsed = useRef(false);

  const initialValuesRes = useMemo(() => {
    if (props.isEditName) {
      if (refInitAlreadyUsed.current) {
        return {};
      }

      let f1 = calcSchemaForFeature(featuresOne)?.find((v1) => v1.name === props.isEditName);
      if (f1 != null) {
        let pitValues: any = {};
        if (f1.pointInTimeInfo != null) {
          if (optionsColumns && optionsColumnsJoin && optionsFeatureGroupsJoin) {
            refInitAlreadyUsed.current = true;
          }

          //
          pitValues = {
            lookbackCount: f1.pointInTimeInfo?.lookbackCount,
            lookbackSeconds: f1.pointInTimeInfo?.lookbackWindowSeconds,
            timeColumn: optionsColumns?.find((v1) => v1.label === f1.pointInTimeInfo?.timestampKey),
            fgTimestampFeature: optionsColumnsJoin?.find((v1) => v1.label === f1.pointInTimeInfo?.historicalTimestampKey),
            fgJoin: optionsFeatureGroupsJoin?.find((v1) => v1.data?.tableName === f1.pointInTimeInfo?.historyTableName),
            aggKeys: f1.pointInTimeInfo?.aggregationKeys,
            sql: f1.pointInTimeInfo?.expression,

            lookbackWindowLagSeconds: f1.pointInTimeInfo?.lookbackWindowLagSeconds,
            lookbackUntilPosition: f1.pointInTimeInfo?.lookbackUntilPosition,
            onlineLookbackCount: f1.pointInTimeInfo?.onlineLookbackCount,
            onlineLookbackWindowSeconds: f1.pointInTimeInfo?.onlineLookbackWindowSeconds,
          };

          if (pitValues.lookbackCount != null && pitValues.lookbackSeconds == null) {
            setIsLookbackSeconds(false);
          } else if (pitValues.lookbackCount == null && pitValues.lookbackSeconds != null) {
            setIsLookbackSeconds(true);
          }
          setOnlineLookbackCount(pitValues.onlineLookbackCount);
          setLookbackCount(pitValues.lookbackCount);
          setOnlineLookbackWindowSeconds(pitValues.onlineLookbackWindowSeconds);
          setLookbackWindowSeconds(pitValues.lookbackSeconds);
          setSql(pitValues.sql);
          setHistoryTableName(f1.pointInTimeInfo?.historyTableName);
          setAggKeys(pitValues.aggKeys);
          setTimeColumn(pitValues.timeColumn?.value);

          setTimeout(() => {
            setFgJoinId(pitValues?.fgJoin?.value);
          }, 0);
        }

        refOldName.current = f1.name;
        let obj1 = {
          name: f1.name,
          sql: f1.selectClause,

          tableName: f1.sourceTable,
          usingClause: f1.usingClause,
          whereClause: f1.whereClause,
          orderClause: f1.orderClause,
        };
        obj1 = _.assign(obj1, pitValues);

        setTimeout(() => {
          formRef?.setFieldsValue(obj1);
        }, 0);
        return obj1;
      }
      return {};
    }
    return {};
  }, [featuresOne, props.isEditName, formRef, optionsFeatureGroupsJoin, optionsColumns, optionsColumnsJoin]);

  const errorConfigMsg = null;

  const handleSubmit = (values) => {
    const doWork = (isLookbackSeconds) => {
      let lookbackCount = isLookbackSeconds ? null : values.lookbackCount;
      let lookbackSeconds = isLookbackSeconds ? values.lookbackSeconds : null;
      let onlineLookbackCount = isLookbackSeconds ? null : values.onlineLookbackCount;
      let onlineLookbackSeconds = isLookbackSeconds ? values.onlineLookbackWindowSeconds : null;
      let aggKeys = values.aggKeys;
      if (_.isString(aggKeys)) {
        aggKeys = aggKeys
          .split(',')
          .map((f1) => _.trim(f1 ?? ''))
          .filter((f1) => !Utils.isNullOrEmpty(f1));
      }

      if (!props.isEditName) {
        setIsRefreshingSave(true);
        REClient_.client_().createPointInTimeFeature(
          featureGroupId,
          values.name,
          values.fgJoin?.data?.tableName,
          aggKeys,
          values.timeColumn?.value,
          values.fgTimestampFeature?.value,
          lookbackSeconds,
          values.lookbackWindowLagSeconds,
          lookbackCount,
          values.lookbackUntilPosition,
          values.sql,
          onlineLookbackCount,
          onlineLookbackSeconds,
          (err, res) => {
            setIsRefreshingSave(false);
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              if (projectId == null) {
                StoreActions.featureGroupsDescribe_(null, res?.result?.featureGroupId);
              } else {
                StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                  list?.some((f1) => {
                    StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                  });
                });
              }

              Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
            }
          },
        );
      } else {
        setIsRefreshingSave(true);
        let newName = values.name === refOldName.current ? undefined : values.name;
        REClient_.client_().updatePointInTimeFeature(
          featureGroupId,
          refOldName.current,
          values.fgJoin?.data?.tableName,
          aggKeys,
          values.timeColumn?.value,
          values.fgTimestampFeature?.value,
          lookbackSeconds,
          values.lookbackWindowLagSeconds,
          lookbackCount,
          values.lookbackUntilPosition,
          values.sql,
          newName,
          onlineLookbackCount,
          onlineLookbackSeconds,
          (err, res) => {
            setIsRefreshingSave(false);
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              if (projectId == null) {
                StoreActions.featureGroupsDescribe_(null, res?.result?.featureGroupId);
              } else {
                StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                  list?.some((f1) => {
                    StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                  });
                });
              }

              Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
            }
          },
        );
      }
    };

    doWork(isLookbackSeconds);
  };

  const goToDashboard = (e) => {
    //
  };

  useEffect(() => {
    let res = [];

    const calcObj = (c1) => {
      return {
        featureGroupIdOri: c1.featureGroupId,
        isNested: c1.columns != null,
        isColumn: c1.selectClause == null && c1.columns == null,
        name: c1.name,
        dataType: c1.dataType,
        featureType: c1.featureType,
        featureMapping: c1.featureMapping,
        sourceDatasets: c1.sourceDatasets,
        sourceTable: c1.sourceTable,
        sql: c1.selectClause,

        columns: c1.columns,
        usingClause: c1.usingClause,
        whereClause: c1.whereClause,
        orderClause: c1.orderClause,
      };
    };

    calcSchemaForFeature(featuresOne)?.some((c1) => {
      res.push(calcObj(c1));
    });

    if (res.length === 0) {
      featuresOne?.features?.some((c1, f1ind) => {
        res.push(calcObj(c1));
      });
    }

    setColumnsList(res);
  }, [projectId, featuresOne]);

  const sample1 = `Count(1)`;

  const onChangeFGJoin = (option1) => {
    setHistoryTableName(option1?.label);
    setFgJoinId(option1?.value);
  };

  const featuresOneJoin = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, null, fgJoinId);
  }, [featureGroupsParam, fgJoinId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, null, fgJoinId);
  }, [featureGroupsParam, fgJoinId]);

  useEffect(() => {
    let res = [];

    const calcObj = (c1) => {
      return {
        featureGroupIdOri: c1.featureGroupId,
        isNested: c1.columns != null,
        isColumn: c1.selectClause == null && c1.columns == null,
        name: c1.name,
        dataType: c1.dataType,
        featureType: c1.featureType,
        featureMapping: c1.featureMapping,
        sourceDatasets: c1.sourceDatasets,
        sourceTable: c1.sourceTable,
        sql: c1.sql ?? c1.selectClause,

        columns: c1.columns,
        usingClause: c1.usingClause,
        whereClause: c1.whereClause,
        orderClause: c1.orderClause,
      };
    };

    calcSchemaForFeature(featuresOneJoin)?.some((c1) => {
      res.push(calcObj(c1));
    });

    if (res?.length === 0) {
      featuresOneJoin?.features?.some((c1, f1ind) => {
        res.push(calcObj(c1));
      });
    }

    if (res.length === 0 && featuresOneJoin == null) {
      res = null;
    }

    res = res?.filter((r1) => r1?.featureType?.toUpperCase() === 'TIMESTAMP');

    setColumnsListJoin(res);
  }, [projectId, featuresOneJoin]);

  const onClickGetTimeComplexity = (e) => {
    setIsComputingComplexity(true);
    REClient_.client_().estimatePointInTimeComplexity(
      featureGroupId,
      currentHistoryTableName,
      currentAggKeys,
      currentTimeColumn,
      currentTimeColumn,
      currentOnlineLookbackWindowSeconds || currentLookbackWindowSeconds,
      0,
      currentOnlineLookbackCount || currentLookbackCount,
      0,
      currentSql,
      (err, res) => {
        setIsComputingComplexity(false);
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          setTimeComplexity(null);
        } else {
          setTimeComplexity(res?.result);
        }
      },
    );
  };

  const columnOptionsList = useMemo(() => {
    let columnOptions = [];
    if (columnsList) {
      columnsList?.some((p1) => {
        let n1 = p1?.name ?? '-';
        columnOptions.push(
          <Option value={n1} key={n1}>
            {n1}
          </Option>,
        );
      });
    }
    return columnOptions;
  }, [columnsList]);

  return (
    <div style={{ margin: '0 30px' }}>
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
                {props.isEditName ? 'Edit Point-In-Time Feature' : 'New Point-In-Time Feature'}
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
                    rules={[{ required: true, message: 'Required' }]}
                    label={
                      <span style={{ color: Utils.colorA(1) }}>
                        Name
                        <HelpIcon id={'pit_add_name'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input placeholder={'Name'} />
                  </Form.Item>

                  <Form.Item
                    rules={[{ required: true, message: 'Required' }]}
                    name={'aggKeys'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Partition Key:
                        <HelpIcon id={'pit_add_agg_feat'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Select
                      mode="tags"
                      onChange={(val) => {
                        setAggKeys(val);
                      }}
                      tokenSeparators={[',']}
                    >
                      {columnOptionsList}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    rules={[{ required: true, message: 'Required' }]}
                    name={'timeColumn'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Ordering Key:
                        <HelpIcon id={'pit_add_ts_col'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt
                      onChange={(val) => {
                        setTimeColumn(val.value);
                      }}
                      options={optionsColumns ?? []}
                    />
                  </Form.Item>

                  <Form.Item
                    rules={[{ required: true, message: 'Required' }]}
                    name={'fgJoin'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        History Feature Group:
                        <HelpIcon id={'pit_add_hist_ts_feature'} style={{ marginLeft: '4px' }} />
                        {isAllFGRefreshing == true && <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} transform={{ size: 15, x: 0, y: 0 }} spin style={{ color: 'white', marginLeft: '7px' }} />}
                      </span>
                    }
                  >
                    <SelectExt options={optionsFeatureGroupsJoin ?? []} onChange={onChangeFGJoin} />
                  </Form.Item>

                  <Form.Item
                    rules={[{ required: true, message: 'Required' }]}
                    name={'fgTimestampFeature'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        History Ordering Key:
                        <HelpIcon id={'pit_add_ts_feature'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt options={optionsColumnsJoin ?? []} />
                  </Form.Item>

                  <div
                    css={`
                      height: 20px;
                    `}
                  ></div>
                  <Radio.Group
                    value={isLookbackSeconds}
                    onChange={(e) => {
                      setIsLookbackSeconds(e.target.value);
                    }}
                  >
                    <Radio value={true}>
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Seconds
                      </span>
                    </Radio>
                    <Radio value={false}>
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Count
                      </span>
                    </Radio>
                  </Radio.Group>
                  <div
                    css={`
                      height: 20px;
                    `}
                  ></div>

                  {isLookbackSeconds && (
                    <Form.Item
                      style={{ marginBottom: '7px' }}
                      name={'lookbackSeconds'}
                      rules={[{ required: true, message: 'Required' }]}
                      label={
                        <span style={{ color: Utils.colorA(1) }}>
                          Lookback Interval Seconds
                          <HelpIcon id={'pit_add_lb_interval_seconds'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>
                  )}
                  {!isLookbackSeconds && (
                    <Form.Item
                      style={{ marginBottom: '7px' }}
                      name={'lookbackCount'}
                      rules={[{ required: true, message: 'Required' }]}
                      label={
                        <span style={{ color: Utils.colorA(1) }}>
                          Lookback Count
                          <HelpIcon id={'pit_add_lb_count'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>
                  )}
                  <div
                    css={`
                      height: 20px;
                    `}
                  ></div>

                  {isLookbackSeconds && (
                    <Form.Item
                      name={'lookbackWindowLagSeconds'}
                      label={
                        <span style={{ color: Utils.colorA(1) }}>
                          Lookback Window Lag Seconds (Optional):
                          <HelpIcon id={'pit_add_lb_lookbackWindowLagSeconds'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  )}

                  {!isLookbackSeconds && (
                    <Form.Item
                      name={'lookbackUntilPosition'}
                      label={
                        <span style={{ color: Utils.colorA(1) }}>
                          Lookback Until Position (Optional):
                          <HelpIcon id={'pit_add_lb_lookbackUntilPosition'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  )}

                  {false && (
                    <Form.Item
                      name={'onlineLookbackWindowSeconds'}
                      label={
                        <span style={{ color: Utils.colorA(1) }}>
                          Online Lookback Interval Seconds:
                          <HelpIcon id={'pit_add_onlineLookbackWindowSeconds'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  )}

                  {false && (
                    <Form.Item
                      name={'onlineLookbackCount'}
                      label={
                        <span style={{ color: Utils.colorA(1) }}>
                          Online Lookback Count:
                          <HelpIcon id={'pit_add_onlineLookbackCount'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  )}

                  <div
                    css={`
                      margin: 14px 0;
                    `}
                  >
                    <Form.Item
                      name={'sql'}
                      rules={[{ required: true, message: 'Required' }]}
                      style={{ marginBottom: 0 }}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {'Aggregation Function'}:<HelpIcon id={'pit_add_agg_func'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <EditorElemForFeatureGroup
                        onChange={(e) => {
                          setSql(e);
                        }}
                        height={200}
                        projectId={projectId}
                        refEditor={refEditorSql}
                      />
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
                          (Press Ctrl+Space to autocomplete name of columns and datasets)
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
                      <Button
                        type={'default'}
                        ghost
                        onClick={onClickGetTimeComplexity}
                        css={`
                          margin-right: 10px;
                        `}
                      >
                        Estimate Online Streaming Complexity
                      </Button>
                      {isComputingComplexity && (
                        <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} transform={{ size: 15, x: 0, y: 0 }} spin style={{ color: 'white', marginLeft: '7px', marginTop: '8px' }} />
                      )}
                      {timeComplexity && (
                        <span
                          css={`
                            color: rgba(255, 255, 255, 0.7);
                            font-size: 13px;
                            text-align: left;
                            margin-left: 7px;
                            margin-top: 8px;
                          `}
                        >
                          ~{timeComplexity}ms
                        </span>
                      )}
                    </div>
                    <div
                      css={`
                        display: flex;
                        margin-top: 16px;
                      `}
                    >
                      <Button disabled={isRefreshingSave} type="primary" htmlType="submit" className="login-form-button" style={{ flex: '1' }}>
                        {props.isEditName ? 'Set Point-In-Time Feature' : 'Add Point-In-Time Feature'}
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

export default FeaturesOneAddTimeTravel;
