import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import Tag from 'antd/lib/tag';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import { useFeatureGroup, useFeatureGroupFeaturesFromFG } from '../../api/REUses';
import batchPred from '../../stores/reducers/batchPred';
import databaseConnectorObjects from '../../stores/reducers/databaseConnectorObjects';
import databaseConnectorObjectSchema from '../../stores/reducers/databaseConnectorObjectSchema';
import databaseConnectors from '../../stores/reducers/databaseConnectors';
import deployments from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import HelpIcon from '../HelpIcon/HelpIcon';
import { DetailName, DetailValue } from '../ModelDetail/DetailPages';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./ConnectorEditInline.module.css');
const sd = require('../antdUseDark.module.css');
const { Option } = Select;

interface IConnectorEditInlineProps {
  isEdit?: boolean;
  onChangeState?: (stateNew: any) => void;
  useForm?: boolean;
  isFeatureGroup?: boolean;
  idColumnAsString?: boolean;
  isDeployment?: boolean;
  featureGroupId?: string;
  ref?: (ref) => void;
  showTooltips?: boolean;
  editState?: any;
}

const ConnectorEditInline = React.memo((props: PropsWithChildren<IConnectorEditInlineProps>) => {
  const { paramsProp, authUser, featureGroupsParam, deployParam, batchPredParam, databaseConnectorsParam, databaseConnectorObjectSchemaParam, databaseConnectorObjectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    databaseConnectorsParam: state.databaseConnectors,
    databaseConnectorObjectsParam: state.databaseConnectorObjects,
    databaseConnectorObjectSchemaParam: state.databaseConnectorObjectSchema,
    batchPredParam: state.batchPred,
    featureGroupsParam: state.featureGroups,
    deployParam: state.deployment,
  }));

  const defaultIsEdit = props.isEdit ?? (props.useForm === true ? true : null);

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isEdit, setIsEdit] = useState(defaultIsEdit ?? false);

  const [editConnector, setEditConnector] = useState(null);
  const [editConnectorConfig, setEditConnectorConfig] = useState(null);
  const [editConnectorMode, setEditConnectorMode] = useState(null);
  const [editConnectorColumns, setEditConnectorColumns] = useState(null);
  const [editConnectorIDColumn, setEditConnectorIDColumn] = useState(null);
  const [editConnectorAdditionalIDColumns, setEditConnectorAdditionalIDColumns] = useState(null);
  const [editConnectorIDColumnValue, setEditConnectorIDColumnValue] = useState(null);
  const [editConnectorColumnsValues, setEditConnectorColumnsValues] = useState(null);

  const projectId = paramsProp?.get('projectId');
  const batchPredId = paramsProp?.get('batchPredId');
  const featureGroupId = paramsProp?.get('featureGroupId');
  const deploymentId = paramsProp?.get('deployId');

  useEffect(() => {
    props.ref?.(this);

    return () => {
      props.ref?.(null);
    };
  }, []);

  useEffect(() => {
    if (props.editState) {
      setEditConnector(props.editState?.editConnector);
      setEditConnectorConfig(props.editState?.editConnectorConfig);
      setEditConnectorMode(props.editState?.editConnectorMode);
      setEditConnectorColumns(props.editState?.editConnectorColumns);
      setEditConnectorColumnsValues(props.editState?.editConnectorColumnsValues);
      setEditConnectorIDColumn(props.editState?.editConnectorIDColumn);
    }
  }, [props.editState]);

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const doReset = () => {
    setEditConnector(null);
    setEditConnectorConfig(null);
    setEditConnectorMode(null);
    setEditConnectorColumns(null);
    setEditConnectorIDColumn(null);
    setEditConnectorIDColumnValue(null);
    setEditConnectorColumnsValues(null);
    setEditConnectorAdditionalIDColumns(null);
  };

  const featureGroupOne = featuresGroupsList?.find((f1) => f1.featureGroupId === featureGroupId);

  const deployList = useMemo(() => {
    return deployments.memDeployForProject(false, undefined, projectId);
  }, [deployParam, projectId]);
  useEffect(() => {
    deployments.memDeployForProject(true, undefined, projectId);
  }, [deployParam, projectId]);

  const deployOne = deployList?.find((d1) => d1.deploymentId === deploymentId);

  useEffect(() => {
    batchPred.memBatchDescribe(undefined, batchPredId, true);
  }, [batchPredParam, batchPredId]);
  const batchPredOne = useMemo(() => {
    return batchPred.memBatchDescribe(undefined, batchPredId, false);
  }, [batchPredParam, batchPredId]);

  let databaseOutputConfiguration = props.isFeatureGroup ? (deployOne ? deployOne.featureGroupExportConfig : featureGroupOne?.databaseOutputConfiguration) : batchPredOne?.databaseOutputConfiguration;

  const FGUsed = useFeatureGroup(null, props.featureGroupId);
  const FGFeatures = useFeatureGroupFeaturesFromFG(FGUsed);
  const FGFeaturesOptions = useMemo(() => {
    return FGFeatures?.map((s1) => ({ label: s1, value: s1, tooltipPos: props.showTooltips ? 'right' : undefined, tooltipShow: props.showTooltips ? s1 : undefined }));
  }, [FGFeatures, props.showTooltips]);

  let usedId = (isEdit ? editConnector : null) ?? batchPredOne?.databaseConnectorId ?? databaseOutputConfiguration?.databaseConnectorId;
  let usedIdConfig = editConnectorConfig ?? databaseOutputConfiguration?.objectName;
  let usedIdMode = editConnectorMode ?? databaseOutputConfiguration?.mode ?? databaseOutputConfiguration?.writeMode;

  let usedIdColumnsValues = editConnectorColumnsValues;

  useEffect(() => {
    setIsEdit(defaultIsEdit);
  }, [defaultIsEdit]);

  //
  useEffect(() => {
    databaseConnectors.memDatabaseConnectors(true, databaseConnectorsParam);
  }, [databaseConnectorsParam]);
  let optionsConnectorAll = useMemo(() => {
    return databaseConnectors.memDatabaseConnectors(false, databaseConnectorsParam);
  }, [databaseConnectorsParam]);

  useEffect(() => {
    databaseConnectorObjects.memDatabaseConnectorObjects(true, usedId, databaseConnectorObjectsParam);
  }, [databaseConnectorObjectsParam, usedId]);
  let optionsConnectorObjects = useMemo(() => {
    return databaseConnectorObjects.memDatabaseConnectorObjects(false, usedId, databaseConnectorObjectsParam);
  }, [databaseConnectorObjectsParam, usedId]);

  let optionsConnector = useMemo(() => {
    let optionsConnector = optionsConnectorAll?.map((c1) => ({ label: c1.name, value: c1.databaseConnectorId }));
    optionsConnector?.unshift({ label: '(None)', value: null });
    return optionsConnector;
  }, [optionsConnectorAll]);

  let optionsConfigs = useMemo(() => {
    let optionsConfigs = optionsConnectorObjects?.map((c1) => ({ label: c1, value: c1 }));
    optionsConfigs?.unshift({ label: '(None)', value: null });
    return optionsConfigs;
  }, [optionsConnectorObjects]);

  let optionsMode = useMemo(() => {
    return [
      { label: '(None)', value: null },
      { label: 'UPSERT', value: 'UPSERT' },
      { label: 'INSERT', value: 'INSERT' },
    ];
  }, []);

  let additionalIDColumnOptions = useMemo(() => {
    let additionalIDColumnOptions = [];
    let options = editConnectorColumns ?? (usedIdColumnsValues ? Object.keys(usedIdColumnsValues) : []) ?? [];
    if (options) {
      options?.some((p1) => {
        if (p1 != editConnectorIDColumn) {
          additionalIDColumnOptions.push(
            <Option value={p1} key={p1}>
              {p1}
            </Option>,
          );
        }
      });
    }
    return additionalIDColumnOptions;
  }, [editConnectorColumns, usedIdColumnsValues, editConnectorIDColumn]);

  const refsByLabel = useRef({});

  const onChangeTagValue = (label, e) => {
    let v1 = e.target.value;

    setEditConnectorColumnsValues((vv) => {
      if (vv == null) {
        vv = {};
      } else {
        vv = { ...vv };
      }

      vv[label] = v1;

      props.onChangeState?.({ editConnectorColumnsValues: vv });

      return vv;
    });
  };

  const onChangeTagValueOption = (label, option1) => {
    let v1 = option1?.value;

    setEditConnectorColumnsValues((vv) => {
      if (vv == null) {
        vv = {};
      } else {
        vv = { ...vv };
      }

      vv[label] = v1;

      props.onChangeState?.({ editConnectorColumnsValues: vv });

      return vv;
    });
  };

  const FGFeaturesUsed = useMemo(() => {
    return props.isDeployment || props.isFeatureGroup ? FGFeaturesOptions : null;
  }, [FGFeaturesOptions, props.isDeployment, props.isFeatureGroup]);

  const tagRenderColumns = useCallback(
    (props2) => {
      const { label, value, closable, onClose } = props2;

      let v1 = editConnectorColumnsValues?.[label];
      const onMouseDown = (e) => {
        e.stopPropagation();

        setTimeout(() => {
          refsByLabel.current?.[label]?.current?.focus();
        }, 300);
      };
      const onKeyPress = (e) => {
        e.stopPropagation();
      };
      const onKeyDown = (e) => {
        e.stopPropagation();
      };

      refsByLabel.current = refsByLabel.current ?? {};
      let ref1 = refsByLabel.current[label];
      if (ref1 == null) {
        ref1 = React.createRef();
        refsByLabel.current[label] = ref1;
      }

      const onMouseDownTagValuesOption = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        setTimeout(() => {
          refsByLabel.current?.[label]?.current?.onClickBackDrag();
        }, 300);
      };

      return (
        <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
          <span>{label}</span>
          <span
            onMouseDown={props.isDeployment || props.isFeatureGroup ? onMouseDownTagValuesOption : undefined}
            css={`
              margin-left: 4px;
              font-size: 11px;
              & input {
                margin: 3px 0;
                height: 24px !important;
              }
              ${props.isDeployment ? `width: 150px; display: inline-block; ` : ``}
            `}
          >
            {!(props.isDeployment || props.isFeatureGroup) && (
              <Input
                ref={ref1}
                onKeyDown={onKeyDown}
                onKeyPress={onKeyPress}
                onMouseDown={onMouseDown}
                css={`
                  width: 110px;
                `}
                value={v1}
                onChange={onChangeTagValue.bind(null, label)}
              />
            )}
            {(props.isDeployment || props.isFeatureGroup) && (
              <SelectExt
                showTooltips={props.showTooltips}
                useOpen
                options={FGFeaturesUsed}
                ref={ref1}
                css={`
                  width: 100%;
                `}
                value={FGFeaturesUsed?.find((o1) => o1?.value === v1)}
                onChange={onChangeTagValueOption.bind(null, label)}
              />
            )}
          </span>
        </Tag>
      );
    },
    [editConnectorColumnsValues, FGFeaturesUsed, props.isDeployment, props.isFeatureGroup],
  );

  useEffect(() => {
    databaseConnectorObjectSchema.memDatabaseConnectorObjectSchema(true, usedId, usedIdConfig, databaseConnectorObjectSchemaParam);
  }, [databaseConnectorObjectSchemaParam, usedId, usedIdConfig]);
  const objectSchema = useMemo(() => {
    return databaseConnectorObjectSchema.memDatabaseConnectorObjectSchema(false, usedId, usedIdConfig, databaseConnectorObjectSchemaParam);
  }, [databaseConnectorObjectSchemaParam, usedId, usedIdConfig]);

  const columnOptions = useMemo(() => {
    let columnOptions = [];
    if (objectSchema) {
      objectSchema?.some((p1) => {
        columnOptions.push(
          <Option value={p1} key={p1}>
            {p1}
          </Option>,
        );
      });
    }
    return columnOptions;
  }, [objectSchema]);

  let dataList = useMemo(() => {
    let usedIdColumns = usedIdColumnsValues ? Object.keys(usedIdColumnsValues) : null;
    if (usedIdColumnsValues == null) {
      let cc = databaseOutputConfiguration?.dataColumns ?? databaseOutputConfiguration?.databaseFeatureMapping;
      if (cc != null) {
        usedIdColumnsValues = cc;
        usedIdColumns = Object.keys(cc);
        if (editConnectorColumnsValues == null) {
          setTimeout(() => {
            setEditConnectorColumnsValues(cc);
            props.onChangeState?.({ editConnectorColumnsValues: cc });
          }, 0);
        }
      }
    }
    if (Utils.isNullOrEmpty(usedIdColumns)) {
      usedIdColumns = null;
    }

    let usedIdIdColumn = editConnectorIDColumn;
    let usedIdIdColumnValue = editConnectorIDColumnValue;
    if (usedIdIdColumn == null) {
      let cc = databaseOutputConfiguration?.idColumn;
      if (cc != null) {
        usedIdIdColumn = props.isDeployment || props.isFeatureGroup ? cc : Object.keys(cc)?.[0];
        usedIdIdColumnValue = props.isDeployment || props.isFeatureGroup ? null : Object.values(cc)?.[0];

        if ((!(props.isDeployment || props.isFeatureGroup) && editConnectorIDColumnValue == null && usedIdIdColumnValue != null) || ((props.isDeployment || props.isFeatureGroup) && editConnectorIDColumn == null && usedIdIdColumn != null)) {
          setTimeout(() => {
            setEditConnectorIDColumn(usedIdIdColumn);
            setEditConnectorIDColumnValue(usedIdIdColumnValue);
            props.onChangeState?.({ editConnectorIDColumn: usedIdIdColumn, editConnectorIDColumnValue: usedIdIdColumnValue });
          }, 0);
        }
      }
    }

    let usedAdditionalIdColumns = editConnectorAdditionalIDColumns;
    if (usedAdditionalIdColumns == null) {
      let cc = databaseOutputConfiguration?.additionalIdColumns;
      if (cc && cc?.length) {
        usedAdditionalIdColumns = cc;
        setTimeout(() => {
          setEditConnectorAdditionalIDColumns(usedAdditionalIdColumns);
          props.onChangeState?.({ editConnectorAdditionalIDColumns: usedAdditionalIdColumns });
        }, 0);
      }
    }

    let obj1 = {
      id: 778,
      name: 'Connector:',
      helpId: 'batchDetail_connector',
      value: (
        <span
          css={`
            display: inline-block;
            width: ${props.useForm ? '100%' : '300px'};
          `}
        >
          {isEdit && (
            <span
              css={`
                width: ${props.useForm ? '100%' : '480px'};
                font-size: 14px;
                display: inline-block;
              `}
            >
              <SelectExt
                onChange={(option1) => {
                  setEditConnector(option1?.value);
                  props.onChangeState?.({ editConnector: option1?.value });
                }}
                value={optionsConnector?.find((v1) => v1.value == usedId)}
                options={optionsConnector}
              />
            </span>
          )}
          {!isEdit && <span>{optionsConnector?.find((v1) => v1.value === usedId)?.label ?? '-'}</span>}
        </span>
      ),
      sid: 'databaseConnectorId',
    };
    let obj2 = {
      id: 77801,
      name: 'Object Name:',
      helpId: 'batchDetail_connectorObjectName',
      value: (
        <span
          css={`
            display: inline-block;
            width: ${props.useForm ? '100%' : '300px'};
          `}
        >
          {isEdit && (
            <span
              css={`
                width: ${props.useForm ? '100%' : '480px'};
                font-size: 14px;
                display: inline-block;
              `}
            >
              <SelectExt
                onChange={(option1) => {
                  setEditConnectorConfig(option1?.value);
                  props.onChangeState?.({ editConnectorConfig: option1?.value });
                }}
                value={optionsConfigs?.find((v1) => v1.value === usedIdConfig)}
                options={optionsConfigs}
              />
            </span>
          )}
          {!isEdit && <span>{usedIdConfig ?? '-'}</span>}
        </span>
      ),
      sid: 'objectName',
    };
    let obj3 = {
      id: 77802,
      name: 'Connector Mode:',
      helpId: 'batchDetail_connectorMode',
      value: (
        <span
          css={`
            display: inline-block;
            width: ${props.useForm ? '100%' : '300px'};
          `}
        >
          {isEdit && (
            <span
              css={`
                width: ${props.useForm ? '100%' : '480px'};
                font-size: 14px;
                display: inline-block;
              `}
            >
              <SelectExt
                onChange={(option1) => {
                  setEditConnectorMode(option1?.value);
                  props.onChangeState?.({ editConnectorMode: option1?.value });
                }}
                value={optionsMode?.find((v1) => v1.value === usedIdMode)}
                options={optionsMode}
              />
            </span>
          )}
          {!isEdit && <span>{usedIdMode ?? '-'}</span>}
        </span>
      ),
    };

    const onChangeColumns = (v1) => {
      setEditConnectorColumnsValues((vv) => {
        let cols = {};
        v1.some((col) => {
          cols[col] = editConnectorColumnsValues?.[col];
        });

        props.onChangeState?.({ editConnectorColumns: Object.keys(cols) });

        return cols;
      });
      setEditConnectorColumns(v1);
    };

    let obj4 = {
      id: 77803,
      name: 'Connector Columns:',
      helpId: 'batchDetail_connectorColumns',
      value: (
        <span
          css={`
            display: inline;
          `}
        >
          {isEdit && (
            <span
              css={`
                width: ${props.useForm ? '100%' : '600px'};
                font-size: 14px;
                display: inline-block;
              `}
            >
              <Select tagRender={tagRenderColumns} style={{ width: '100%', minHeight: '60px' }} mode="tags" onChange={onChangeColumns} value={editConnectorColumns ?? usedIdColumns ?? []} tokenSeparators={[',']}>
                {columnOptions}
              </Select>
            </span>
          )}
          {!isEdit && (
            <span>
              {usedIdColumns?.map((s1, s1ind) => {
                return (
                  <span key={'c' + s1ind}>
                    {s1ind > 0 ? <span>, </span> : null}
                    {s1}:{' '}
                    <span
                      css={`
                        font-size: 14px;
                        opacity: 0.8;
                      `}
                    >
                      {usedIdColumnsValues?.[s1] ?? '-'}
                    </span>
                  </span>
                );
              }) ?? '-'}
            </span>
          )}
        </span>
      ),
      marginVert: 20,
      sid: 'featureMapping',
    };

    const onChangeIdIdColumn = (option1) => {
      setEditConnectorIDColumn(option1?.value);
      props.onChangeState?.({ editConnectorIDColumn: option1?.value });
    };
    const onChangeIdIdColumnValue = (e) => {
      setEditConnectorIDColumnValue(e.target.value);
      props.onChangeState?.({ editConnectorIDColumnValue: e.target.value });
    };

    let optionsColumns = objectSchema?.map((s1) => ({ label: s1, value: s1 }));
    let obj5 = {
      id: 77804,
      name: 'Connector ID Column:',
      helpId: 'batchDetail_connectorIdColumn',
      value: (
        <span
          css={`
            display: inline-block;
            width: ${props.useForm ? '100%' : '300px'};
          `}
        >
          {isEdit && (
            <span
              css={`
                width: ${props.useForm ? '100%' : '480px'};
                font-size: 14px;
                display: inline-block;
              `}
            >
              <span
                css={`
                  width: 200px;
                  font-size: 14px;
                  display: inline-block;
                `}
              >
                <SelectExt options={optionsColumns} value={optionsColumns?.find((v1) => v1.value === usedIdIdColumn)} onChange={onChangeIdIdColumn} />
              </span>
              {!props.idColumnAsString && <span>:</span>}
              {!props.idColumnAsString && (
                <span
                  css={`
                    width: 200px;
                    margin-left: 10px;
                    font-size: 14px;
                    display: inline-block;
                  `}
                >
                  <Input value={usedIdIdColumnValue} onChange={onChangeIdIdColumnValue} />
                </span>
              )}
            </span>
          )}
          {!isEdit && (
            <span>
              {usedIdIdColumn ?? '-'}
              {!props.idColumnAsString && <span>: </span>}
              {!props.idColumnAsString && (
                <span
                  css={`
                    font-size: 14px;
                    opacity: 0.8;
                  `}
                >
                  {usedIdIdColumnValue ?? '-'}
                </span>
              )}
            </span>
          )}
        </span>
      ),
      sid: 'idColumn',
    };

    const onChangeAdditionalIDColumns = (v1) => {
      setEditConnectorAdditionalIDColumns(v1);
      props.onChangeState?.({ editConnectorAdditionalIDColumns: v1 });
    };

    let obj6 = {
      id: 77805,
      name: 'Additional Connector ID Columns:',
      helpId: 'batchDetail_additional_connectorIDColumns',
      value: (
        <span
          css={`
            display: inline;
          `}
        >
          {isEdit && (
            <span
              css={`
                width: ${props.useForm ? '100%' : '600px'};
                font-size: 14px;
                display: inline-block;
              `}
            >
              <Select style={{ width: '100%', minHeight: '60px' }} mode="tags" onChange={onChangeAdditionalIDColumns} value={editConnectorAdditionalIDColumns ?? []} tokenSeparators={[',']}>
                {additionalIDColumnOptions}
              </Select>
            </span>
          )}
          {!isEdit && (
            <span>
              {editConnectorAdditionalIDColumns?.map((s1, s1ind) => {
                return (
                  <span key={'s' + s1ind}>
                    {s1ind > 0 ? <span>, </span> : null}
                    {s1}
                  </span>
                );
              }) ?? '-'}
            </span>
          )}
        </span>
      ),
      sid: 'additionalIDColumns',
    };
    //
    let dataList = [];
    let ind1 = 0;

    if (usedIdMode === 'UPSERT') {
      if (usedIdIdColumn && (isEdit || editConnectorAdditionalIDColumns?.length)) {
        dataList.splice(ind1, 0, obj6);
      }
      dataList.splice(ind1, 0, obj5);
    }

    dataList.splice(ind1, 0, obj4);
    dataList.splice(ind1, 0, obj3);
    dataList.splice(ind1, 0, obj2);
    dataList.splice(ind1, 0, obj1);

    return dataList;
  }, [
    batchPredOne,
    editConnector,
    editConnectorConfig,
    editConnectorMode,
    editConnectorColumnsValues,
    editConnectorIDColumn,
    editConnectorIDColumnValue,
    usedId,
    usedIdConfig,
    usedIdMode,
    databaseOutputConfiguration,
    optionsConfigs,
    optionsMode,
    optionsConnector,
    tagRenderColumns,
    objectSchema,
    columnOptions,
    editConnectorAdditionalIDColumns,
  ]);

  return (
    <>
      {props.useForm &&
        dataList?.map((d1, d1ind) => {
          let name1 = d1.name;
          if (name1 !== '' && name1[name1.length - 1] === ':') {
            name1 = name1.substring(0, name1.length - 1);
          }

          return (
            <div key={'val_' + d1.id} style={{ margin: (d1.marginVert ?? 5) + 'px 0' }}>
              <Form.Item name={d1.sid ?? d1.name} style={{ marginBottom: '10px' }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>{name1}:</span>}>
                {d1.value}
              </Form.Item>
            </div>
          );
        })}

      {!props.useForm &&
        dataList?.map((d1) => (
          <div key={'val_' + d1.id} style={{ margin: (d1.marginVert ?? 5) + 'px 0' }}>
            <span>
              <DetailName>
                {d1.name}
                <HelpIcon id={d1.helpId} style={{ marginLeft: '4px' }} />
              </DetailName>
              <DetailValue style={{ color: d1.valueColor ?? '#ffffff' }}>{d1.value}</DetailValue>
            </span>
          </div>
        ))}
    </>
  );
});

export default ConnectorEditInline;
