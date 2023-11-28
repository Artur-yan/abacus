import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import datasets from '../../stores/reducers/datasets';
import { calcReqFeaturesByUseCase, calcReqFeaturesByUseCaseError, calcReqFeaturesByUseCaseFindDatasetType } from '../../stores/reducers/defDatasets';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./FeatureGroupSchema.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupSchemaProps {
  projectId?: string;
  featureGroupId?: string;
  height?: number;
  defaultFilter?: string;
  datasetId?: string;
}

const FeatureGroupSchema = React.memo((props: PropsWithChildren<IFeatureGroupSchemaProps>) => {
  const { paramsProp, featureGroupsParam, useCasesParam, datasetsParam, defDatasetsParam, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
    defDatasetsParam: state.defDatasets,
    datasetsParam: state.datasets,
    useCasesParam: state.useCases,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [readonly, setReadonly] = useState(false);
  const [dataList, setDataList] = useState([] as { open?; isNested?; columns?; featureMapping?; name?; sql?; featureType?; isColumn?; dataType?; sourceDatasets? }[]);
  const [nestedData, setNestedData] = useState(null);
  const [columnFilterText, setColumnFilterText] = useState(props.defaultFilter ?? null);

  const [columnFilterOnlyNonIgnored, setColumnFilterOnlyNonIgnored] = useState(false);
  const [modelVersion, setModelVersion] = useState(null);

  const featureGroupId = props.featureGroupId;
  const datasetId = props.datasetId;
  const isDataset = !Utils.isNullOrEmpty(datasetId) && Utils.isNullOrEmpty(featureGroupId);

  let projectId = props.projectId;
  if (projectId === '-') {
    projectId = null;
  }
  const nested = paramsProp?.get('nested');
  const featureGroupIdOri = paramsProp?.get('featureGroupIdOri');

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

  const featureGroupForDatasetOne = useMemo(() => {
    let res = null;
    if (featureGroupId) {
      res = featuresGroupsList?.find((v1) => v1.featureGroupId === featureGroupId);
    }
    return res;
  }, [featuresGroupsList, datasetId, featureGroupId]);

  useEffect(() => {
    datasets.memDatasetsFromIDs(true, [datasetId]);
  }, [datasetsParam, datasetId]);
  const datasetOne = useMemo(() => {
    return datasets.memDatasetsFromIDs(false, [datasetId])?.[datasetId];
  }, [datasetsParam, datasetId]);

  const optionsValidFeatureTypes = useMemo(() => {
    let vv = datasetOne?.toJS()?.validFeatureTypes ?? featureGroupForDatasetOne?.validFeatureTypes ?? [];
    return vv.map((v1) => {
      return {
        label: v1,
        value: v1,
      };
    });
  }, [featureGroupForDatasetOne, datasetOne]);

  const memRequFeatures = (doCall, defDatasets, projects, projectId, projectFound1, datasetType) => {
    if (projects && projectId && defDatasets) {
      if (projectFound1) {
        let useCase = projectFound1.useCase;
        if (!Utils.isNullOrEmpty(useCase)) {
          let reqFields = calcReqFeaturesByUseCase(undefined, useCase);
          let reqError = calcReqFeaturesByUseCaseError(undefined, useCase);
          if (reqFields) {
            const reqFieldsAll = reqFields?.toJS();
            if (datasetType && reqFields) {
              let rr = calcReqFeaturesByUseCaseFindDatasetType(reqFields, datasetType);
              if (rr) {
                rr = rr.toJS();
              }
              reqFields = rr || [];
            } else {
              reqFields = [];
            }

            return { reqFields, reqError, reqFieldsAll };
          } else {
            if (defDatasets.get('isRefreshing') === 0) {
              if (doCall) {
                StoreActions.featuresByUseCase_(useCase);
              }
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    memRequFeatures(true, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne?.datasetType);
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne]);
  const { reqFields, reqError, reqFieldsAll } = useMemo(() => {
    return memRequFeatures(false, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne?.datasetType) ?? { reqFields: null, reqError: null, reqFieldsAll: null };
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne]);

  const optionsValidFeatureTypesMapV = (mapV) => {
    let allowed_data_types = reqFields?.allowedFeatureMappings?.[mapV]?.allowed_data_types;

    return allowed_data_types?.map((v1) => {
      return {
        label: v1,
        value: v1,
      };
    });
  };

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, null, featureGroupIdOri);
  }, [featureGroupsParam, featureGroupIdOri]);
  const featureGroupOri = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, null, featureGroupIdOri);
  }, [featureGroupsParam, featureGroupIdOri]);

  const optionsValidDataTypesOri = useMemo(() => {
    let vv = featureGroupOri?.validFeatureTypes;
    return vv?.map((v1) => {
      return {
        label: v1,
        value: v1,
      };
    });
  }, [featureGroupOri]);

  useEffect(() => {
    memRequFeatures(true, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupOri?.datasetType);
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupOri]);
  const {
    reqFields: reqFieldsOri,
    reqError: reqErrorOri,
    reqFieldsAll: reqFieldsAllOri,
  } = useMemo(() => {
    return memRequFeatures(false, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupOri?.datasetType) ?? { reqFields: null, reqError: null, reqFieldsAll: null };
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupOri]);

  const optionsValidFeatureTypesOriMapV = (mapV) => {
    let allowed_data_types = reqFieldsOri?.allowedFeatureMappings?.[mapV]?.allowed_data_types;

    return allowed_data_types?.map((v1) => {
      return {
        label: v1,
        value: v1,
      };
    });
  };

  const onChangeSelectOptionFeatureType = (row, index, featureGroupIdOri, option1, e) => {
    if (!option1) {
      return;
    }

    setDataList((dataList) => {
      let index2 = dataListFiltered?.[index] == null ? -1 : dataList?.findIndex((v1) => v1 === dataListFiltered?.[index]);
      if (index2 === -1) {
        return dataList;
      }

      let data1 = dataList?.[index2];

      if (isDataset) {
        REClient_.client_().setDatasetColumnDataTypeQueue(datasetId, data1?.name, option1?.value, (err, res, isLast) => {
          if (err || !res) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            if (isLast) {
              StoreActions.listDatasets_([datasetId]);

              StoreActions.validateProjectDatasets_(projectId);
              StoreActions.featureGroupsGetByProject_(projectId);
              StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
              if (featureGroupIdOri) {
                StoreActions.schemaGetFileFeatureGroup_(projectId, featureGroupId, null);
              }
            }

            setDataList((dataList) => {
              dataList = [...(dataList ?? [])];

              let data1 = dataList[index2];
              if (data1) {
                data1 = { ...data1 };
                data1.featureType = option1?.value;
                dataList[index2] = data1;
              }

              return dataList;
            });

            StoreActions.resetSchemaChanged_();
          }
        });
      } else {
        REClient_.client_().setFeatureType(featureGroupIdOri || featureGroupId, data1?.name, option1?.value, (err, res, isLast) => {
          if (err || !res) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            if (isLast) {
              StoreActions.validateProjectDatasets_(projectId);
              StoreActions.featureGroupsGetByProject_(projectId);
              StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
              if (featureGroupIdOri) {
                StoreActions.schemaGetFileFeatureGroup_(projectId, featureGroupId, null);
              }
            }

            setDataList((dataList) => {
              dataList = [...(dataList ?? [])];

              let data1 = dataList[index2];
              if (data1) {
                data1 = { ...data1 };
                data1.featureType = option1?.value;
                dataList[index2] = data1;
              }

              return dataList;
            });

            StoreActions.resetSchemaChanged_();
          }
        });
      }

      return dataList;
    });
  };

  const dataListFiltered = useMemo(() => {
    if (_.trim(columnFilterText || '') === '' || !dataList || dataList.length === 0) {
      if (columnFilterOnlyNonIgnored === true) {
        let list = [...(dataList ?? [])];
        list = list.filter((v1) => v1.featureMapping?.toLowerCase() !== 'ignore');
        return list;
      } else {
        return dataList;
      }
    } else {
      let fs1 = columnFilterText?.toLowerCase() ?? '';

      let list = [...(dataList ?? [])];
      list = list.filter((v1) => v1.name?.toLowerCase().indexOf(fs1) > -1);
      if (columnFilterOnlyNonIgnored === true) {
        list = list.filter((v1) => v1.featureMapping?.toLowerCase() !== 'ignored');
      }
      return list;
    }
  }, [dataList, columnFilterText, columnFilterOnlyNonIgnored]);

  const columns = useMemo(() => {
    let popupContainerForMenu = (node) => document.getElementById('body2');
    let menuPortalTarget = popupContainerForMenu(null);

    return [
      {
        title: 'Name',
        field: 'name',
        width: 200,
        helpId: 'fgschema_name',
      },
      {
        title: 'Feature Type',
        field: 'featureType',
        helpId: 'fgschema_datatype',
        width: 200,
        noAutoTooltip: true,
        noLink: true,
        render: (text, row, index) => {
          if (row.isNested) {
            return (
              <div
                className={sd.linkBlue}
                css={`
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                `}
                onClick={(e) => {
                  Location.push('/' + PartsLink.features_list + '/' + projectId + '/' + featureGroupId, undefined, 'nested=' + encodeURIComponent(row.name) + '&featureGroupIdOri=' + encodeURIComponent(row.featureGroupIdOri ?? ''));
                }}
              >
                (Nested Feature {'>'} View)
              </div>
            );
          }

          let mapV = row.featureMapping;
          let options = null;
          if (isDataset) {
            options = optionsValidFeatureTypes;
          } else if (featureGroupIdOri) {
            if (mapV) {
              options = optionsValidFeatureTypesOriMapV(mapV);
              if (options == null) {
                options = optionsValidDataTypesOri;
              }
            } else {
              options = optionsValidDataTypesOri;
            }
          } else {
            if (mapV) {
              options = optionsValidFeatureTypesMapV(mapV);
              if (options == null) {
                options = optionsValidFeatureTypes;
              }
            } else {
              options = optionsValidFeatureTypes;
            }
          }

          options = options ?? [];

          let selOption = options?.find((o1) => o1.value === text);
          if (options == null) {
            selOption = selOption ?? { label: '', value: '' };
          }

          return (
            <SelectExt
              isDisabled={readonly || options == null}
              value={selOption}
              options={options}
              onChange={onChangeSelectOptionFeatureType.bind(null, row, index, featureGroupIdOri)}
              isSearchable={false}
              menuPortalTarget={menuPortalTarget}
            />
          );
        },
      },
    ] as ITableExtColumn[];
  }, [
    isDataset,
    nested,
    featureGroupIdOri,
    projectId,
    optionsValidDataTypesOri,
    optionsValidFeatureTypesMapV,
    optionsValidFeatureTypesOriMapV,
    optionsValidFeatureTypes,
    onChangeSelectOptionFeatureType,
    readonly,
    dataList,
    dataListFiltered,
  ]);

  const featuresOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);

  useEffect(() => {
    if (readonly || modelVersion != null) {
      return;
    }

    let res = [];

    const calcObj = (c1) => {
      return {
        featureGroupIdOri: c1.featureGroupId,
        isNested: c1.columns != null,
        isColumn: c1.selectClause == null && c1.columns == null,
        name: c1.name,
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

    calcSchemaForFeature(featuresOne)?.some((c1) => {
      res.push(calcObj(c1));
    });

    datasetOne?.toJS()?.schema?.some((c1) => {
      res.push(calcObj(c1));
    });

    if (res.length === 0) {
      featuresOne?.features?.some((f1, f1ind) => {
        res.push(calcObj(f1));
      });
    }

    let nestedData1 = null;
    if (!Utils.isNullOrEmpty(nested)) {
      let n1 = res?.find((v1) => v1.name === nested);
      if (n1 == null) {
        res = [];
      } else {
        nestedData1 = n1;
        res = n1.columns?.map((c1) => calcObj(c1));
      }
    }

    setNestedData(nestedData1);
    setDataList(res);
  }, [projectId, datasetOne, featuresOne, readonly, modelVersion, nested]);

  let topHH = 50;
  let hh = props.height ?? 250;

  return (
    <div
      css={`
        height: ${hh + 2 * 15}px;
        color: white;
        padding: 15px;
      `}
    >
      <div
        css={`
          height: ${topHH}px;
          display: flex;
          justify-self: center;
          align-items: center;
        `}
      >
        <span>Filter Columns By Name:</span>
        <span
          css={`
            margin-left: 10px;
            width: 300px;
          `}
        >
          <Input
            value={columnFilterText ?? ''}
            onChange={(e) => {
              setColumnFilterText(e.target.value);
            }}
            allowClear={true}
          />
        </span>
      </div>
      <TableExt isVirtual height={hh - topHH} showEmptyIcon={true} dataSource={dataListFiltered} columns={columns} calcKey={(r1) => r1.name} calcLink={null} />
    </div>
  );
});

export default FeatureGroupSchema;
