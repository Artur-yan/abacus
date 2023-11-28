import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Col from 'antd/lib/col';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Radio from 'antd/lib/radio';
import Row from 'antd/lib/row';
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
import { calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import { DetailName, DetailValue } from '../ModelDetail/DetailPages';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TimeWindow from '../TimeWindow/TimeWindow';
import TooltipExtOver from '../TooltipExtOver/TooltipExtOver';
const { Option } = Select;

const s = require('./FeaturesOneAddTimeTravelGroup.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeaturesOneAddTimeTravelGroupProps {
  isEditName?: any;
  isInlineReadOnly?: boolean;
  asText?: boolean;
}

const FeaturesOneAddTimeTravelGroup = React.memo((props: PropsWithChildren<IFeaturesOneAddTimeTravelGroupProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentAggKeys, setAggKeys] = useState([]);
  const [currentTimeColumn, setTimeColumn] = useState(null);
  const [formRef] = Form.useForm();
  const [isRefreshingSave, setIsRefreshingSave] = useState(false);
  const [isLookbackSeconds, setIsLookbackSeconds] = useState(true);
  const [currentOnlineLookbackWindowSeconds, setOnlineLookbackWindowSeconds] = useState(null);
  const [currentLookbackWindowSeconds, setLookbackWindowSeconds] = useState(null);
  const [currentOnlineLookbackCount, setOnlineLookbackCount] = useState(null);
  const [currentLookbackCount, setLookbackCount] = useState(null);
  const [currentHistoryTableName, setHistoryTableName] = useState(null);
  const [previewValues, setPreviewValues] = useState(null);

  const [columnsList, setColumnsList] = useState(null);
  const refEditorSql = useRef(null);

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

  const optionsColumns = useMemo(() => {
    return columnsList
      ?.filter((c1) => c1.featureType?.toUpperCase() === 'TIMESTAMP' || c1.featureType?.toUpperCase() === 'NUMERICAL')
      ?.map((c1, c1ind) => {
        return {
          label: c1.name,
          value: c1.name,
        };
      });
  }, [columnsList]);

  const refInitAlreadyUsed = useRef(false);

  const errorConfigMsg = null;

  const handleSubmit = (values) => {
    const doWork = (isLookbackSeconds, currentHistoryTableName) => {
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
      let historyAggregationKeys = values.historyAggregationKeys;
      if (_.isString(historyAggregationKeys)) {
        historyAggregationKeys = historyAggregationKeys
          .split(',')
          .map((f1) => _.trim(f1 ?? ''))
          .filter((f1) => !Utils.isNullOrEmpty(f1));
      }

      if (!props.isEditName) {
        setIsRefreshingSave(true);
        REClient_.client_().createPointInTimeGroup(
          featureGroupId,
          values.name,
          aggKeys,
          values.timeColumn?.value,
          lookbackSeconds,
          values.lookbackWindowLagSeconds,
          lookbackCount,
          values.lookbackUntilPosition,
          currentHistoryTableName,
          values.historyWindowKey?.value,
          historyAggregationKeys,
          (err, res) => {
            setIsRefreshingSave(false);
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              if (projectId == null) {
                // StoreActions.featureGroupsDescribe_(null, res?.result?.featureGroupId);
                if (projectId) {
                  StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
                }
                StoreActions.featureGroupsDescribe_(null, featureGroupId);
              } else {
                if (projectId) {
                  StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
                }
                StoreActions.featureGroupsDescribe_(null, featureGroupId);

                StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                  list?.some((f1) => {
                    StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                    StoreActions.featureGroupsDescribe_(null, f1?.featureGroupId);
                  });
                });
              }

              Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'pitGroup=' + encodeURIComponent(values.name));
            }
          },
        );
      } else {
        setIsRefreshingSave(true);
        REClient_.client_().updatePointInTimeGroup(
          featureGroupId,
          values.name,
          aggKeys,
          values.timeColumn?.value,
          lookbackSeconds,
          values.lookbackWindowLagSeconds,
          lookbackCount,
          values.lookbackUntilPosition,
          currentHistoryTableName,
          values.historyWindowKey?.value,
          historyAggregationKeys,
          (err, res) => {
            setIsRefreshingSave(false);
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              if (projectId == null) {
                if (projectId) {
                  StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
                }
                StoreActions.featureGroupsDescribe_(null, featureGroupId);
                // StoreActions.featureGroupsDescribe_(null, res?.result?.featureGroupId);
              } else {
                if (projectId) {
                  StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
                }
                StoreActions.featureGroupsDescribe_(null, featureGroupId);

                StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                  list?.some((f1) => {
                    StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                    StoreActions.featureGroupsDescribe_(null, f1?.featureGroupId);
                  });
                });
              }

              Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'pitGroup=' + encodeURIComponent(values.name));
            }
          },
        );
      }
    };

    doWork(isLookbackSeconds, currentHistoryTableName);
  };

  const goToDashboard = (e) => {
    //
  };

  useEffect(() => {
    if (featuresOne == null) {
      return;
    }

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

  const columnOptionsList = useMemo(() => {
    const pointInTimeFeatures = new Set();

    featuresOne?.pointInTimeGroups?.forEach?.((group) => {
      group?.features?.forEach?.((feature) => pointInTimeFeatures.add(feature.name));
    });

    const columnOptions = [];
    if (columnsList) {
      const filteredColumnsList = columnsList?.filter?.((item) => !pointInTimeFeatures.has(item?.name)) || [];
      filteredColumnsList.forEach((p1) => {
        let n1 = p1?.name ?? '-';
        columnOptions.push(
          <Option value={n1} key={n1}>
            {n1}
          </Option>,
        );
      });
    }
    return columnOptions;
  }, [columnsList, featuresOne]);

  const [fgJoinId, setFgJoinId] = useState(null);
  const [columnsListJoin, setColumnsListJoin] = useState(null);
  const [columnsListJoinTimestamp, setColumnsListJoinTimestamp] = useState(null);

  const [allFG, setAllFG] = useState(null);
  const [isAllFGRefreshing, setIsAllFGRefreshing] = useState(false);
  useEffect(() => {
    if (allFG == null && !props.isInlineReadOnly) {
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
  }, [projectId, allFG, props.isInlineReadOnly]);

  const featuresOneJoin = useMemo(() => {
    if (props.isInlineReadOnly) {
      return null;
    }
    return featureGroups.memFeatureGroupsForId(false, null, fgJoinId);
  }, [featureGroupsParam, fgJoinId]);
  useEffect(() => {
    if (props.isInlineReadOnly) {
      return;
    }
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

    setColumnsListJoin(res);

    res = res?.filter((r1) => r1?.featureType?.toUpperCase() === 'TIMESTAMP');

    setColumnsListJoinTimestamp(res);
  }, [projectId, featuresOneJoin]);

  const optionsFeatureGroups = useMemo(() => {
    let res = allFG?.map((f1) => {
      return {
        label: f1.tableName ?? f1.name,
        value: f1.featureGroupId,
        data: f1,
      };
    });
    res?.unshift({ label: '(None)', value: null });
    return res;
  }, [allFG, projectId]);

  const optionsFeatureGroupsJoin = useMemo(() => {
    return optionsFeatureGroups; //?.filter(f1 => f1.value!==featureGroupId);
  }, [optionsFeatureGroups, featureGroupId]);

  const optionsColumnsJoin = useMemo(() => {
    return columnsListJoinTimestamp?.map((c1, c1ind) => {
      return {
        label: c1.name,
        value: c1.name,
      };
    });
  }, [columnsListJoinTimestamp]);

  const columnOptionsListJoin = useMemo(() => {
    let columnOptions = [];
    if (columnsListJoin) {
      columnsListJoin?.some((p1) => {
        let n1 = p1?.name ?? '-';
        columnOptions.push(
          <Option value={n1} key={n1}>
            {n1}
          </Option>,
        );
      });
    }
    return columnOptions;
  }, [columnsListJoin]);

  const onChangeFGJoin = (option1) => {
    setHistoryTableName(Utils.isNullOrEmpty(option1?.value) ? null : option1?.label);
    setIsLookbackSeconds(true);
    setFgJoinId(option1?.value);
  };

  const initialValuesRes = useMemo(() => {
    if (props.isEditName) {
      if (refInitAlreadyUsed.current && !props.isInlineReadOnly) {
        return {};
      }

      let f1 = featuresOne?.pointInTimeGroups?.find((v1) => v1.groupName === props.isEditName);
      if (f1 != null) {
        let pitValues: any = {};
        if (f1 != null) {
          if (optionsColumns && ((optionsFeatureGroupsJoin && optionsColumnsJoin) || props.isInlineReadOnly || Utils.isNullOrEmpty(f1.historyTableName))) {
            refInitAlreadyUsed.current = true;
          }

          //
          pitValues = {
            lookbackCount: f1.lookbackCount,
            lookbackSeconds: f1.lookbackWindow,
            timeColumn: props.isInlineReadOnly ? { label: f1.windowKey, value: f1.windowKey } : optionsColumns?.find((v1) => v1.label === f1.windowKey),
            aggKeys: f1.aggregationKeys,

            historyWindowKey: props.isInlineReadOnly ? (f1.historyWindowKey ? { label: f1.historyWindowKey, value: f1.historyWindowKey } : null) : optionsColumnsJoin?.find((v1) => v1.label === f1.historyWindowKey),
            historyTableName: props.isInlineReadOnly ? (f1.historyTableName ? { label: f1.historyTableName, value: f1.historyTableName } : null) : optionsFeatureGroupsJoin?.find((v1) => v1.label === f1.historyTableName),
            historyAggregationKeys: f1.historyAggregationKeys,

            lookbackWindowLagSeconds: f1.lookbackWindowLag,
            lookbackUntilPosition: f1.lookbackUntilPosition,
            onlineLookbackCount: f1.onlineLookbackCount,
            onlineLookbackWindowSeconds: f1.onlineLookbackWindowSeconds,
          };

          if (pitValues.lookbackCount != null && pitValues.lookbackSeconds == null) {
            setIsLookbackSeconds(false);
          } else if (pitValues.lookbackCount == null && pitValues.lookbackSeconds != null) {
            setIsLookbackSeconds(true);
          }

          const windowInfo = Utils.convertSecondsToDaysHoursMinutesSeconds(pitValues.lookbackSeconds);
          setLookbackWindowSeconds(windowInfo);
          setOnlineLookbackCount(pitValues.onlineLookbackCount);
          setLookbackCount(pitValues.lookbackCount);
          setOnlineLookbackWindowSeconds(pitValues.onlineLookbackWindowSeconds);
          setAggKeys(pitValues.aggKeys);
          setTimeColumn(pitValues.timeColumn?.value ?? f1.windowKey);

          setHistoryTableName(f1.historyTableName);
          setFgJoinId(props.isInlineReadOnly ? pitValues.historyTableName : optionsFeatureGroupsJoin?.find((v1) => v1.label === f1.historyTableName)?.value);
        }

        let obj1 = {
          name: f1.groupName,
          sql: f1.selectClause,

          tableName: f1.sourceTable,
          usingClause: f1.usingClause,
          whereClause: f1.whereClause,
          orderClause: f1.orderClause,
        };
        obj1 = _.assign(obj1, pitValues);

        setPreviewValues(obj1);

        setTimeout(() => {
          formRef?.setFieldsValue(obj1);
        }, 0);
        return obj1;
      }
      return {};
    }
    return {};
  }, [featuresOne, props.isEditName, formRef, optionsColumns, optionsFeatureGroupsJoin, optionsColumnsJoin, props.isInlineReadOnly]);

  let topElems: any = [
    <Form.Item
      name={'name'}
      rules={props.isInlineReadOnly ? undefined : Utils.isNullOrEmpty(props.isEditName) ? [{ required: true, message: 'Required' }] : undefined}
      label={
        <span style={{ color: Utils.colorA(1) }}>
          Group Name
          <HelpIcon id={'pit_add_groupname'} style={{ marginLeft: '4px' }} />
        </span>
      }
    >
      <Input
        css={
          Utils.isNullOrEmpty(props.isEditName) || props.isInlineReadOnly
            ? ''
            : `&.ant-input.ant-input {
        background-color: #424242 !important;
      }`
        }
        disabled={!Utils.isNullOrEmpty(props.isEditName) || props.isInlineReadOnly}
        placeholder={'Group Name'}
      />
    </Form.Item>,
    <Form.Item
      rules={props.isInlineReadOnly ? undefined : [{ required: true, message: 'Required' }]}
      name={'aggKeys'}
      hasFeedback={!props.isInlineReadOnly}
      label={
        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
          Partition Keys {!props.isInlineReadOnly && <span>(Used to divide the data into independent subsets)</span>}:<HelpIcon id={'pit_add_agg_feat'} style={{ marginLeft: '4px' }} />
        </span>
      }
    >
      <Select
        disabled={props.isInlineReadOnly}
        mode="tags"
        onChange={(val) => {
          setAggKeys(val);
        }}
        tokenSeparators={[',']}
      >
        {columnOptionsList}
      </Select>
    </Form.Item>,
    <Form.Item
      rules={props.isInlineReadOnly ? undefined : [{ required: true, message: 'Required' }]}
      name={'timeColumn'}
      hasFeedback={!props.isInlineReadOnly}
      label={
        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
          Ordering Key {!props.isInlineReadOnly && <span>(Timestamp / Number to order the records in a partition)</span>}:<HelpIcon id={'pit_add_ts_col'} style={{ marginLeft: '4px' }} />
        </span>
      }
    >
      <SelectExt
        isDisabled={props.isInlineReadOnly}
        onChange={(val) => {
          setTimeColumn(val.value);
        }}
        options={optionsColumns ?? []}
      />
    </Form.Item>,
  ];
  if (props.isInlineReadOnly) {
    topElems = (
      <Row>
        {topElems?.map((c1, c1ind) => {
          return (
            <Col key={'c' + c1ind} style={{ paddingLeft: c1ind > 0 ? '10px' : '', width: Math.trunc(100 / topElems?.length) + '%' }}>
              {c1}
            </Col>
          );
        })}
      </Row>
    );
  }

  let middleElems: any = [
    <Form.Item
      name={'historyTableName'}
      hasFeedback={!props.isInlineReadOnly}
      label={
        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
          (Optional) History Feature Group {!props.isInlineReadOnly && <span>(The FG or table that is the source for PIT features)</span>}:<HelpIcon id={'pit_add_hist_ts_feature'} style={{ marginLeft: '4px' }} />
          {isAllFGRefreshing == true && <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} transform={{ size: 15, x: 0, y: 0 }} spin style={{ color: 'white', marginLeft: '7px' }} />}
        </span>
      }
    >
      <SelectExt placeholder={featuresOne?.tableName ? featuresOne?.tableName + ' (Default)' : undefined} isDisabled={props.isInlineReadOnly} options={optionsFeatureGroupsJoin ?? []} onChange={onChangeFGJoin} />
    </Form.Item>,
    <Form.Item
      rules={[{ required: true, message: 'Required' }]}
      name={'historyAggregationKeys'}
      hasFeedback={!props.isInlineReadOnly}
      label={
        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
          History Partition Keys {!props.isInlineReadOnly && <span>(Used to divide the history FG data into independent subsets)</span>}:<HelpIcon id={'pit_add_agg_feat'} style={{ marginLeft: '4px' }} />
        </span>
      }
    >
      <Select disabled={props.isInlineReadOnly} mode="tags" tokenSeparators={[',']}>
        {columnOptionsListJoin}
      </Select>
    </Form.Item>,
    <Form.Item
      rules={[{ required: true, message: 'Required' }]}
      name={'historyWindowKey'}
      hasFeedback={!props.isInlineReadOnly}
      label={
        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
          History Ordering Key {!props.isInlineReadOnly && <span>(Timestamp / Number to order the records in a history FG partition)</span>}:<HelpIcon id={'pit_add_ts_feature'} style={{ marginLeft: '4px' }} />
        </span>
      }
    >
      <SelectExt isDisabled={props.isInlineReadOnly} options={optionsColumnsJoin ?? []} />
    </Form.Item>,
  ];
  if (!fgJoinId) {
    middleElems = [middleElems[0]];
  }
  if (props.isInlineReadOnly) {
    middleElems = (
      <Row>
        {middleElems?.map((c1, c1ind) => {
          return (
            <Col key={'c' + c1ind} style={{ paddingLeft: c1ind > 0 ? '10px' : '', width: Math.trunc(100 / middleElems?.length) + '%' }}>
              {c1}
            </Col>
          );
        })}
      </Row>
    );
  }

  let bottomElems: any = [];
  if (isLookbackSeconds) {
    bottomElems = [
      <span>
        <div>Lookback Type:</div>
        <div
          css={`
            margin-top: 14px;
          `}
        >
          Seconds
        </div>
      </span>,
      <Form.Item
        name="lookbackSeconds"
        style={{ marginBottom: '7px' }}
        rules={props.isInlineReadOnly ? undefined : [{ required: true, message: 'Required' }]}
        label={
          <span style={{ color: Utils.colorA(1) }}>
            Lookback window <HelpIcon id={'pit_add_lb_interval_seconds'} style={{ marginLeft: '4px' }} />
          </span>
        }
      >
        <TimeWindow isInlineReadOnly={props.isInlineReadOnly} />
      </Form.Item>,
      <Form.Item
        name={'lookbackWindowLagSeconds'}
        label={
          <span style={{ color: Utils.colorA(1) }}>
            Lookback Window Lag {!props.isInlineReadOnly && <span>(in seconds)</span>}:<HelpIcon id={'pit_add_lb_lookbackWindowLagSeconds'} style={{ marginLeft: '4px' }} />
          </span>
        }
      >
        <TimeWindow isInlineReadOnly={props.isInlineReadOnly} />
      </Form.Item>,
    ];
  } else {
    bottomElems = [
      <span>
        <div>Lookback Type:</div>
        <div
          css={`
            margin-top: 14px;
          `}
        >
          Count
        </div>
      </span>,
      <Form.Item
        style={{ marginBottom: '7px' }}
        name={'lookbackCount'}
        rules={props.isInlineReadOnly ? undefined : [{ required: true, message: 'Required' }]}
        label={
          <span style={{ color: Utils.colorA(1) }}>
            Lookback window {!props.isInlineReadOnly && <span>(number of rows)</span>}
            <HelpIcon id={'pit_add_lb_count'} style={{ marginLeft: '4px' }} />
          </span>
        }
      >
        <InputNumber
          disabled={props.isInlineReadOnly}
          style={{ width: '100%' }}
          min={1}
          onChange={(e) => {
            setLookbackCount(e);
          }}
        />
      </Form.Item>,
      <Form.Item
        name={'lookbackUntilPosition'}
        label={
          <span style={{ color: Utils.colorA(1) }}>
            Lookback Window Lag {!props.isInlineReadOnly && <span>(number of rows)</span>}:<HelpIcon id={'pit_add_lb_lookbackUntilPosition'} style={{ marginLeft: '4px' }} />
          </span>
        }
      >
        <InputNumber disabled={props.isInlineReadOnly} style={{ width: '100%' }} min={0} />
      </Form.Item>,
    ];
  }
  if (props.isInlineReadOnly) {
    bottomElems = (
      <Row>
        {bottomElems?.map((c1, c1ind) => {
          return (
            <Col key={'c' + c1ind} style={{ paddingLeft: c1ind > 0 ? '10px' : '', width: Math.trunc(100 / bottomElems?.length) + '%' }}>
              {c1}
            </Col>
          );
        })}
      </Row>
    );
  } else {
    bottomElems = bottomElems?.slice(1);
  }

  if (props.asText) {
    return (
      <div style={{ margin: props.isInlineReadOnly ? '' : '0 30px' }}>
        <div style={{ margin: props.isInlineReadOnly ? '' : '30px auto', maxWidth: props.isInlineReadOnly ? '' : '1000px', color: Utils.colorA(1) }}>
          <RefreshAndProgress isRelative errorMsg={errorConfigMsg} errorButtonText={'Fix Schema Errors'} onClickErrorButton={goToDashboard}>
            <div style={{ color: 'white', padding: '20px 23px' }} className={sd.grayPanel}>
              <Row style={{ width: '100%', marginBottom: '8px' }}>
                <Col style={{ width: '32%', marginRight: '1%' }} className={sd.ellipsis}>
                  <TooltipExtOver>
                    <DetailName>Group Name:</DetailName>
                    <DetailValue>{previewValues?.name}</DetailValue>
                  </TooltipExtOver>
                </Col>
                <Col style={{ width: '32%', marginRight: '1%' }} className={sd.ellipsis}>
                  <TooltipExtOver>
                    <DetailName>Partition Key:</DetailName>
                    <DetailValue>{previewValues?.aggKeys?.join(', ')}</DetailValue>
                  </TooltipExtOver>
                </Col>
                <Col style={{ width: '32%', marginRight: '1%' }} className={sd.ellipsis}>
                  <TooltipExtOver>
                    <DetailName>Ordering Key:</DetailName>
                    <DetailValue>{previewValues?.timeColumn?.value}</DetailValue>
                  </TooltipExtOver>
                </Col>
              </Row>

              <Row style={{ width: '100%', marginBottom: '8px' }}>
                <Col style={{ width: '32%', marginRight: '1%' }} className={sd.ellipsis}>
                  <TooltipExtOver>
                    <DetailName>History Feature Group:</DetailName>
                    <DetailValue>{previewValues?.historyTableName?.value ?? (featuresOne?.tableName ? featuresOne?.tableName + ' (Default)' : null)}</DetailValue>
                  </TooltipExtOver>
                </Col>
                <Col style={{ width: '32%', marginRight: '1%' }} className={sd.ellipsis}>
                  <TooltipExtOver>
                    <DetailName>History Partition Keys:</DetailName>
                    <DetailValue>{previewValues?.historyAggregationKeys?.join(', ') || '-'}</DetailValue>
                  </TooltipExtOver>
                </Col>
                <Col style={{ width: '32%' }} className={sd.ellipsis}>
                  <TooltipExtOver>
                    <DetailName>History Ordering Key:</DetailName>
                    <DetailValue>{previewValues?.historyWindowKey?.value || '-'}</DetailValue>
                  </TooltipExtOver>
                </Col>
              </Row>

              {isLookbackSeconds && (
                <Row style={{ width: '100%' }}>
                  <Col style={{ width: '33%' }} className={sd.ellipsis}>
                    <TooltipExtOver>
                      <DetailName>Lookback Type:</DetailName>
                      <DetailValue>Seconds</DetailValue>
                    </TooltipExtOver>
                  </Col>
                  <Col style={{ width: '33%' }} className={sd.ellipsis}>
                    <TooltipExtOver>
                      <DetailName>Lookback Window (in seconds):</DetailName>
                      <DetailValue>{previewValues?.lookbackSeconds}</DetailValue>
                    </TooltipExtOver>
                  </Col>
                  <Col style={{ width: '33%' }} className={sd.ellipsis}>
                    <TooltipExtOver>
                      <DetailName>Lookback Window Lag (in seconds):</DetailName>
                      <DetailValue>{previewValues?.lookbackWindowLagSeconds}</DetailValue>
                    </TooltipExtOver>
                  </Col>
                </Row>
              )}
              {!isLookbackSeconds && (
                <Row style={{ width: '100%' }}>
                  <Col style={{ width: '33%' }} className={sd.ellipsis}>
                    <TooltipExtOver>
                      <DetailName>Lookback Type:</DetailName>
                      <DetailValue>Count</DetailValue>
                    </TooltipExtOver>
                  </Col>
                  <Col style={{ width: '33%' }} className={sd.ellipsis}>
                    <TooltipExtOver>
                      <DetailName>Lookback Window (number of rows):</DetailName>
                      <DetailValue>{previewValues?.lookbackCount}</DetailValue>
                    </TooltipExtOver>
                  </Col>
                  <Col style={{ width: '33%' }} className={sd.ellipsis}>
                    <TooltipExtOver>
                      <DetailName>Lookback Window Lag (number of rows):</DetailName>
                      <DetailValue>{previewValues?.lookbackUntilPosition}</DetailValue>
                    </TooltipExtOver>
                  </Col>
                </Row>
              )}
            </div>
          </RefreshAndProgress>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: props.isInlineReadOnly ? '' : '0 30px' }}>
      {!props.isInlineReadOnly && (
        <div
          css={`
            width: 440px;
            margin: 20px auto 0 auto;
          `}
        >
          <HelpBox name={'Add Point-In-Time Group'} beforeText={' adding Point-In-Time Group'} linkTo={'/help/featureEngineering/pit_feature_groups'} />
        </div>
      )}

      <div style={{ margin: props.isInlineReadOnly ? '' : '30px auto', maxWidth: props.isInlineReadOnly ? '' : '1000px', color: Utils.colorA(1) }}>
        <RefreshAndProgress isRelative errorMsg={errorConfigMsg} errorButtonText={'Fix Schema Errors'} onClickErrorButton={goToDashboard}>
          <div style={{ color: 'white', padding: '20px 23px' }} className={sd.grayPanel}>
            {/*// @ts-ignore*/}
            <Spin spinning={isRefreshing} size={'large'}>
              {!props.isInlineReadOnly && (
                <div
                  css={`
                    font-family: Matter;
                    font-size: 24px;
                    line-height: 1.33;
                    color: #ffffff;
                  `}
                >
                  {props.isEditName ? 'Edit Point-In-Time Group' : 'New Point-In-Time Group'}
                </div>
              )}
              {!props.isInlineReadOnly && (
                <div
                  css={`
                    border-top: 1px solid white;
                    margin-top: 10px;
                    margin-bottom: 8px;
                  `}
                ></div>
              )}
              {!props.isInlineReadOnly && (
                <div
                  css={`
                    font-size: 14px;
                    opacity: 0.8;
                    margin: 20px 0;
                  `}
                >
                  Point-in-time group makes it easy for you to create features that are aggregated over a time window relative to the rows in your table. For instance, you can create features such as the number of times a user logged into
                  the platform in the past 30 days, amount of time the user spent on the platform in the last week, or the distinct pages a user visited in the last 15 days without writing complex partition / order by clauses
                </div>
              )}

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
                  {props.isInlineReadOnly && (
                    <div
                      css={`
                        color: white;
                        margin: 4px 0 14px 0;
                        border-radius: 3px;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 3px 10px 4px;
                      `}
                    >
                      <span
                        css={`
                          opacity: 0.8;
                        `}
                      >
                        Feature Group TableName:
                      </span>
                      <span
                        css={`
                          margin-left: 5px;
                        `}
                      >
                        {featuresOne?.tableName ?? '-'}
                      </span>
                    </div>
                  )}

                  {topElems}

                  {middleElems}

                  {!props.isInlineReadOnly && (
                    <div
                      css={`
                        height: 20px;
                      `}
                    ></div>
                  )}
                  {!props.isInlineReadOnly && currentHistoryTableName == null && (
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
                          Count (Number of Rows)
                        </span>
                      </Radio>
                    </Radio.Group>
                  )}
                  {!props.isInlineReadOnly && (
                    <div
                      css={`
                        height: 20px;
                      `}
                    ></div>
                  )}

                  {props.isInlineReadOnly && (
                    <div
                      css={`
                        height: 10px;
                      `}
                    ></div>
                  )}

                  {bottomElems}

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
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        onChange={(e) => {
                          setOnlineLookbackWindowSeconds(e);
                        }}
                      />
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
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        onChange={(e) => {
                          setOnlineLookbackCount(e);
                        }}
                      />
                    </Form.Item>
                  )}

                  {!props.isInlineReadOnly && (
                    <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                      <div style={{ borderTop: '1px solid #23305e', margin: '4px -22px' }}></div>
                      <div
                        css={`
                          display: flex;
                          margin-top: 16px;
                        `}
                      >
                        <Button disabled={isRefreshingSave} type="primary" htmlType="submit" className="login-form-button" style={{ flex: '1' }}>
                          {props.isEditName ? 'Set Point-In-Time Group' : 'Add Point-In-Time Group'}
                        </Button>
                      </div>
                    </Form.Item>
                  )}
                </FormExt>
              )}
            </Spin>
          </div>
        </RefreshAndProgress>
      </div>
    </div>
  );
});

export default FeaturesOneAddTimeTravelGroup;
