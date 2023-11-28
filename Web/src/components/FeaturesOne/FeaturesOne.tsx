import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import Menu from 'antd/lib/menu';
import Modal from 'antd/lib/modal';
import Popover from 'antd/lib/popover';
import Radio from 'antd/lib/radio';
import classNames from 'classnames';
import $ from 'jquery';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider, useSelector } from 'react-redux';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import dark from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import datasets, { DatasetLifecycle, DatasetLifecycleDesc } from '../../stores/reducers/datasets';
import defDatasets, { calcReqFeaturesByUseCase, calcReqFeaturesByUseCaseError, calcReqFeaturesByUseCaseFindDatasetType } from '../../stores/reducers/defDatasets';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import { DragFieldTarget } from '../DatasetSchema/DatasetSchema';
import DropdownExt from '../DropdownExt/DropdownExt';
import FeatureNoteEdit from '../FeatureNoteEdit/FeatureNoteEdit';
import { calcSchemaDuplicatedForFeature, calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import FeaturesOneAddTimeTravelGroup from '../FeaturesOneAddTimeTravelGroup/FeaturesOneAddTimeTravelGroup';
import FeaturesOneAddTimeTravelGroupFeature from '../FeaturesOneAddTimeTravelGroupFeature/FeaturesOneAddTimeTravelGroupFeature';
import FeaturesOneWizard from '../FeaturesOneWizard/FeaturesOneWizard';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import PITLineageDiagram from './PITLineageDiagram/PITLineageDiagram';

const featuresOneStyles = require('./FeaturesOne.module.css');
const sd = require('../antdUseDark.module.css');
const { confirm } = Modal;

interface IFeaturesOneProps {}

const FeaturesOne = React.memo((props: PropsWithChildren<IFeaturesOneProps>) => {
  const { paramsProp, featureGroupsParam, useCasesParam, datasetsParam, defDatasetsParam, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
    defDatasetsParam: state.defDatasets,
    datasetsParam: state.datasets,
    useCasesParam: state.useCases,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredRefreshAll, forceUpdateRefreshAll] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataList, setDataList] = useState([] as { isDuplicated?; detectedFeatureType?; isPIT?; pointInTimeInfo?; open?; isNested?; columns?; featureMapping?; name?; sql?; featureType?; isColumn?; dataType?; sourceDatasets? }[]);
  const [nestedData, setNestedData] = useState(null);
  const [pitGroupData, setPitGroupData] = useState(null);
  const [selectedPITGroupName, setPITGroupName] = useState('');

  const [radioSel, setRadioSel] = useState(true);

  const [readonly, setReadonly] = useState(false);
  const [modelVersion, setModelVersion] = useState(null);
  const refFile = useRef(null);
  const [columnFilterText, setColumnFilterText] = useState(null);
  const [columnFilterOnlyNonIgnored, setColumnFilterOnlyNonIgnored] = useState(false);

  const [lookupKeysSel, setLookupKeysSel] = useState(null);
  const [recordIdSel, setRecordIdSel] = useState(null);
  const [eventTimestampSel, setEventTimestampSel] = useState(null);
  const [notePopoverVisible, setNotePopoverVisible] = useState({});
  const [expandedPITGroups, setExpandedPITGroups] = useState({});
  const [isInferMapping, setIsInferMapping] = useState(false);

  const isPitUseGroup = useMemo(() => {
    return dataList?.find((r1) => r1.isPIT) == null;
  }, [dataList]);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const nested = paramsProp?.get('nested');
  const pitGroup = paramsProp?.get('pitGroup');

  let showWizardStreaming = paramsProp?.get('showWizardStreaming') === '1';

  useEffect(() => {
    if (projectId == null) {
      setReadonly(true);
    }
  }, [projectId]);

  const featureGroupId = paramsProp?.get('featureGroupId');
  const featureGroupIdOri = paramsProp?.get('featureGroupIdOri');
  const showWizard = paramsProp?.get('showWizard') === 'true';

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

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const isFeatureStore = foundProject1?.isFeatureStore === true;

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const featuresOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);

  const selectedPITGroupData = useMemo(() => {
    if (!selectedPITGroupName) return null;

    return featuresOne?.pointInTimeGroups?.filter((group) => group?.groupName === selectedPITGroupName);
  }, [selectedPITGroupName]);

  const isStreaming = featuresOne?.streamingEnabled === true;

  const optionsFeatureGroups = useMemo(() => {
    return featuresGroupsList?.map((f1) => {
      return {
        label: f1.tableName,
        value: f1.featureGroupId,
      };
    });
  }, [featuresGroupsList]);

  const optionsFeatureGroupsSel = useMemo(() => {
    let res = optionsFeatureGroups?.find((v1) => v1.value === featureGroupId);
    if (res == null && projectId == null) {
      res = { label: featuresOne?.tableName ?? '-', value: null };
    }
    return res;
  }, [optionsFeatureGroups, featureGroupId, projectId, featuresOne]);

  const validation = useMemo(() => {
    return defDatasets.memValidationForProjectId(false, projectId);
  }, [defDatasetsParam, projectId]);
  useEffect(() => {
    defDatasets.memValidationForProjectId(true, projectId);
  }, [defDatasetsParam, projectId]);

  const errMsg = useMemo(() => {
    if (!Utils.isNullOrEmpty(nested) || !Utils.isNullOrEmpty(pitGroup)) {
      return null;
    }

    let res = null;
    validation?.datasetErrors?.some((e1) => {
      if (e1?.featureGroupId === featureGroupId) {
        if (e1.message) {
          res = res ?? [];
          res.push(e1.message);
        }
      }
    });

    validation?.requiredDatasets?.concat(validation?.optionalDatasets ?? [])?.some((r1) => {
      if (r1?.featureGroupId === featureGroupId) {
        r1?.invalidColumns?.some((ic1) => {
          let k1 = Object.keys(ic1 ?? {})?.[0];
          if (!Utils.isNullOrEmpty(k1)) {
            let errM1 = ic1[k1];

            res = res ?? [];
            res.push(`Field "${k1}": ${errM1}`);
          }
        });
      }
    });

    if (dataList != null) {
      let duplicateList = [];
      dataList?.some((d1) => {
        if (d1.isDuplicated) {
          duplicateList.push(d1.name);
        }
      });

      if (duplicateList?.length > 0) {
        res ??= [];
        res.push(
          `Feature${duplicateList.length === 1 ? '' : 's'}: ${duplicateList.map((d1) => `"${d1}"`).join(', ')} ${
            duplicateList.length === 1 ? 'is' : 'are'
          } duplicated and can not be referenced in downstream feature groups or model training. Please scope your select statement, or make sure you use USING joins when joining columns with the same name`,
        );
      }
    }

    if (res != null && res.length > 0) {
      return (
        <span
          css={`
            color: #ff3a3a;
            font-size: 14px;
          `}
        >
          {res.map((r1, r1ind) => (
            <span key={'r1' + r1ind}>
              {r1ind > 0 ? <span>, </span> : null}
              {r1}
            </span>
          ))}
        </span>
      );
    } else {
      return null;
    }
  }, [validation, featureGroupId, nested, pitGroup, dataList]);

  const datasetId = featuresOne?.datasetId;
  const datasetOne = useMemo(() => {
    let res = datasets.memDatasetListCall(false, undefined, [datasetId]);
    if (res != null) {
      res = Object.values(res)[0];
    }
    return res;
  }, [datasetsParam, datasetId]);
  useEffect(() => {
    datasets.memDatasetListCall(true, undefined, [datasetId]);
  }, [datasetsParam, datasetId]);

  const featureGroupForDatasetOne = useMemo(() => {
    let res = null;
    if (featureGroupId) {
      res = featuresGroupsList?.find((v1) => v1.featureGroupId === featureGroupId);
    }
    if (res == null && datasetId) {
      res = featuresGroupsList?.find((v1) => v1.datasetId === datasetId);
    }
    return res;
  }, [featuresGroupsList, datasetId, featureGroupId]);

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

  const optionsValidDataTypesOriMapV = (mapV) => {
    let allowed_data_types = reqFieldsOri?.allowedFeatureMappings?.[mapV]?.allowed_data_types;

    return allowed_data_types?.map((v1) => {
      return {
        label: v1,
        value: v1,
      };
    });
  };

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
    memRequFeatures(true, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne?.datasetType ?? featureGroupForDatasetOne?.featureGroupType);
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne]);
  const { reqFields, reqError, reqFieldsAll } = useMemo(() => {
    return memRequFeatures(false, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne?.datasetType ?? featureGroupForDatasetOne?.featureGroupType) ?? { reqFields: null, reqError: null, reqFieldsAll: null };
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne]);

  useEffect(() => {
    memRequFeatures(true, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupOri?.datasetType ?? featureGroupOri?.featureGroupType);
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupOri]);
  const {
    reqFields: reqFieldsOri,
    reqError: reqErrorOri,
    reqFieldsAll: reqFieldsAllOri,
  } = useMemo(() => {
    return memRequFeatures(false, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupOri?.datasetType ?? featureGroupOri?.featureGroupType) ?? { reqFields: null, reqError: null, reqFieldsAll: null };
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupOri]);

  const useCase1 = foundProject1?.useCase;

  const optionsValidDataTypes = useMemo(() => {
    let vv = (featureGroupForDatasetOne ?? featuresOne)?.validFeatureTypes ?? [];
    return vv.map((v1) => {
      return {
        label: v1,
        value: v1,
      };
    });
  }, [featureGroupForDatasetOne, featuresOne]);

  const optionsValidDataTypesMapV = (mapV) => {
    let allowed_data_types = reqFields?.allowedFeatureMappings?.[mapV]?.allowed_data_types;

    return allowed_data_types?.map((v1) => {
      return {
        label: v1,
        value: v1,
      };
    });
  };

  useEffect(() => {
    memUseCasesSchemasInfo(true, useCase1);
  }, [useCasesParam, useCase1]);
  const useCaseInfo = useMemo(() => {
    return memUseCasesSchemasInfo(false, useCase1);
  }, [useCasesParam, useCase1]);

  const optionsFeatureMappings = useMemo(() => {
    const obj1 = reqFields?.allowedFeatureMappings;
    const kk = Object.keys(obj1 ?? {});
    return (
      kk.map((k1, k1ind) => {
        const v1 = k1;

        return {
          label: v1,
          value: v1,
          // hideCross: obj1[v1]?.required===true,
        };
      }) ?? []
    );
  }, [reqFields]);
  const optionsFeatureMappingsNested = useMemo(() => {
    const obj1 = reqFields?.allowedNestedFeatureMappings;
    const kk = Object.keys(obj1 ?? {});
    return (
      kk.map((k1, k1ind) => {
        const v1 = k1;

        return {
          label: v1,
          value: v1,
          // hideCross: obj1[v1]?.required===true,
        };
      }) ?? []
    );
  }, [reqFields]);
  const optionsFeatureMappingsIsMultiple = useMemo(() => {
    let res = {};

    const obj1 = reqFields?.allowedFeatureMappings;
    const kk = Object.keys(obj1 ?? {});
    kk.map((k1, k1ind) => {
      res[k1] = obj1[k1]?.multiple === true;
    });

    if (isFeatureStore) {
      res['lookupKeys'] = true;
    }

    return res;
  }, [reqFields, isFeatureStore]);

  const optionsDsTypes = useMemo(() => {
    let res = reqFieldsAll
      ?.map((r1, r1ind) => {
        return r1?.datasetType;
      })
      ?.filter((v1) => v1 != null)
      ?.sort();

    let list = res?.map((s1) => {
      let name1 = s1;

      let findAlreadyOne = false;
      useCaseInfo?.list?.some((st) => {
        if (useCaseInfo?.[st]?.dataset_type === s1 || useCaseInfo?.[st]?.datasetType === s1) {
          if (!Utils.isNullOrEmpty(useCaseInfo?.[st]?.title)) {
            findAlreadyOne = true;
            name1 = useCaseInfo?.[st]?.title;
          }
          return true;
        }
      });

      if (!findAlreadyOne) {
        let sFind = useCaseInfo?.list?.find((st) => st?.toLowerCase() === s1?.toLowerCase());
        if (sFind != null) {
          let n1 = useCaseInfo?.[sFind]?.title;
          if (!Utils.isNullOrEmpty(n1)) {
            name1 = n1;
          }
        }
      }

      return {
        label: name1,
        value: s1,
      };
    });
    if (list?.find((o1) => o1.value?.toUpperCase() === Constants.custom_table) == null) {
      list?.unshift({
        label: Constants.custom_table_desc,
        value: Constants.custom_table,
      });
    }

    return list;
  }, [useCaseInfo, reqFieldsAll]);

  const onClickCancelEvents = (e) => {
    // e.preventDefault();
    e.stopPropagation();
  };

  const onClickFeatureEdit = (name, isNested, isPIT, isPITNew, isPITFeature, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    let mode1;
    if (isPITNew) {
      mode1 = PartsLink.features_add_point_in_time_group;
    } else if (isPITFeature) {
      return;
    } else if (isPIT) {
      mode1 = PartsLink.features_add_point_in_time;
    } else if (isNested) {
      mode1 = PartsLink.features_add_nested;
    } else {
      mode1 = PartsLink.features_add;
    }

    Location.push('/' + mode1 + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'isEditName=' + encodeURIComponent(name) + (isPITFeature ? '&pitGroup=' + encodeURIComponent(pitGroup) : ''));
  };

  const onClickFeatureDelete = (name, isNested, isPIT, isPITNew, isPITFeature, isStreaming, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (isPITNew) {
      REClient_.client_().deletePointInTimeGroup(featureGroupId, name, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.featureGroupsGetByProject_(projectId);
          StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        }
      });
    } else if (isPITFeature) {
      REClient_.client_().deleteFeature(featureGroupId, name, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.featureGroupsGetByProject_(projectId);
          StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        }
      });
    } else if (isNested) {
      REClient_.client_().deleteNestedFeature(featureGroupId, name, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.featureGroupsGetByProject_(projectId);
          StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        }
      });
    } else {
      REClient_.client_().deleteFeature(featureGroupId, name, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.featureGroupsGetByProject_(projectId);
          StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        }
      });
    }
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

      return dataList;
    });
  };

  const onChangeSelectOptionTarget = (row, index, nestedColumnName, isFeatureStore, newValue, e) => {
    if (newValue == null) {
      newValue = '';
    } else {
      newValue = newValue.value;
    }

    let index2 = -1;

    const fieldMapping = isFeatureStore ? 'featureMappingFS' : 'featureMapping';

    let doStateWork = (setFeatureType = null) => {
      setDataList((dataList) => {
        dataList = [...(dataList ?? [])];
        let data1 = dataList[index2];
        if (data1) {
          data1 = { ...data1 };
          data1[fieldMapping] = newValue;
          if (setFeatureType != null) {
            data1.featureType = setFeatureType;
          }
          data1.open = false;
          dataList[index2] = data1;

          let allowMultiple = optionsFeatureMappingsIsMultiple?.[newValue];
          if (!allowMultiple) {
            for (let i = 0; i < dataList.length; i++) {
              if (i != index2) {
                data1 = dataList[i];
                if (data1[fieldMapping] === newValue) {
                  data1 = { ...data1 };
                  data1[fieldMapping] = '';
                  data1.open = false;
                  dataList[i] = data1;
                }
              }
            }
          }
        }

        if (isFeatureStore) {
          let eventTimestampKey = null;
          let recordIdKey = null;
          let lookupKeys = null;

          dataList?.some((d1) => {
            if (d1[fieldMapping] === 'recordId') {
              recordIdKey = d1.name;
            }
            if (d1[fieldMapping] === 'eventTimestamp') {
              eventTimestampKey = d1.name;
            }
            if (d1[fieldMapping] === 'lookupKeys') {
              lookupKeys ??= [];
              lookupKeys.push(d1.name);
            }
          });

          REClient_.client_().setFeatureGroupIndexingConfig(featureGroupId, recordIdKey, eventTimestampKey, lookupKeys, (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              StoreActions.featureGroupsGetByProject_(projectId);
              StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
            }
          });
        }

        return dataList;
      });
    };

    setDataList((dataList) => {
      index2 = dataListFiltered?.[index] == null ? -1 : dataList?.findIndex((v1) => v1 === dataListFiltered?.[index]);
      if (index2 === -1) {
        return dataList;
      }

      let data1 = dataList?.[index2];
      if (isFeatureStore) {
        doStateWork(null);
      } else {
        REClient_.client_().setFeatureMapping(projectId, featureGroupId, data1?.name, newValue, nestedColumnName, (err, res, isLast) => {
          if (err || !res || !res.result) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            if (isLast) {
              StoreActions.validateProjectDatasets_(projectId);
              StoreActions.featureGroupsGetByProject_(projectId);
              StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
            }

            let columnFromRes = res?.result?.find((s1) => s1.name === data1?.name);
            if (columnFromRes) {
              let setFeatureType = columnFromRes.featureType;
              doStateWork(setFeatureType);
            }
          }
        });
      }

      return dataList;
    });
  };

  let fgType1 = featuresOne?.datasetType ?? featuresOne?.featureGroupType;
  const optionsDsTypesSel = useMemo(() => {
    let res = optionsDsTypes?.find((o1) => o1.value == featuresOne?.datasetType ?? featuresOne?.featureGroupType);
    if (res == null && projectId == null) {
      res = { label: fgType1 ?? '-', value: null };
    }
    return res;
  }, [optionsDsTypes, fgType1, projectId]);

  const onMouseDownNote = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
  };

  const optionsFeatureStore = useMemo(() => {
    if (!isFeatureStore) {
      return [];
    } else {
      let res = [
        {
          label: '',
          value: null,
        },
        {
          label: 'Event Timestamp',
          value: 'eventTimestamp',
        },
        {
          label: 'Primary Key',
          value: 'recordId',
        },
        {
          label: 'Look-up Key',
          value: 'lookupKeys',
        },
      ];

      // if(!isStreaming) {
      //   res = res.filter(r1 => r1.value!=='recordId');
      // }

      return res;
    }
  }, [isFeatureStore, isStreaming]);

  const onVisibleChangePopoverVisible = (name, isVisible) => {
    setNotePopoverVisible((vv) => {
      vv = {};

      if (isVisible) {
        vv[name] = true;
      }

      return vv;
    });
  };

  const refPITEdit = useRef({} as any);
  useEffect(() => {
    return () => {
      refPITEdit.current = {};
    };
  }, []);

  const PITFeatureSql = useRef(null as string);
  const PITFeatureSqlName = useRef(null as string);
  const columns = useMemo(() => {
    let popupContainerForMenu = (node) => document.getElementById('body2');
    let menuPortalTarget = popupContainerForMenu(null);
    const nameColumnWidth = 200;
    const nameLargeScreenWidth = 140;
    let res = [
      {
        title: 'Name',
        field: 'name',
        isLinked: (row) => !!row.isNested /* || !!row.isPIT || !!row.isPITNew*/,
        isBlueLight: (row) => !row.isNested /* && !row.isPIT && !row.isPITNew*/,
        width: nameColumnWidth,
        widthLessMedium: nameLargeScreenWidth,
        helpId: 'fgschema_name',
        render: (text, row, index, isLarge) => {
          const onCloseNoteEdit = () => {
            setNotePopoverVisible({});
          };

          let note1 = row.note;
          let noteIsEmpty = Utils.isNullOrEmpty(note1);

          let tags1 = row.tags;
          if (tags1 == null || !_.isArray(tags1) || tags1?.length === 0) {
            tags1 = null;
          }
          let tagsIsEmpty = tags1 == null;

          let res = (
            <span
              className={'noTooltip ' + (noteIsEmpty && tagsIsEmpty ? '' : sd.styleTextYellow)}
              css={`
                margin-right: 7px;
                cursor: pointer;
                opacity: 0.8;
                &:hover {
                  opacity: 1;
                }
              `}
              onMouseDown={onMouseDownNote}
            >
              {/*// @ts-ignore*/}
              <FontAwesomeIcon
                icon={require('@fortawesome/pro-duotone-svg-icons/faStickyNote').faStickyNote}
                transform={{ size: 16, x: 0, y: 0 }}
                style={{ '--fa-primary-opacity': 1, '--fa-secondary-opacity': noteIsEmpty && tagsIsEmpty ? 0.44 : 0.86 } as any}
              />
            </span>
          );

          if (!noteIsEmpty || !tagsIsEmpty) {
            if (noteIsEmpty) {
              note1 = '';
            }
            if (note1?.indexOf('\n') > -1) {
              let nn = note1.split('\n');
              note1 = nn.map((n1, n1ind) => {
                return <div key={'n' + n1ind}>{n1}</div>;
              });
            }

            let tt1 = [];
            if (!noteIsEmpty) {
              if (_.isArray(note1)) {
                tt1 = note1;
              } else {
                tt1.push(<div key={'n00'}>{note1}</div>);
              }
            }
            if (!tagsIsEmpty) {
              tt1.push(
                <div key={'t00'}>
                  <span
                    css={`
                      opacity: 0.7;
                    `}
                  >
                    Tags:{' '}
                  </span>
                  {tags1?.join(', ')}
                </div>,
              );
            }

            res = (
              <TooltipExt title={tt1} placement={'right'}>
                {res}
              </TooltipExt>
            );
            res = <span onMouseDown={onMouseDownNote}>{res}</span>;
          }

          res = (
            <Popover
              destroyTooltipOnHide={true}
              content={<FeatureNoteEdit projectId={projectId} featureGroupId={featureGroupId} feature={row.name} onClose={onCloseNoteEdit} />}
              title={
                <div style={{ textAlign: 'left' }}>
                  <span style={{ color: 'white' }}>
                    Feature Note for {"'"}
                    {row.name}
                    {"'"}:
                  </span>
                </div>
              }
              trigger={'click'}
              getPopupContainer={popupContainerForMenu}
              placement={'right'}
              onOpenChange={onVisibleChangePopoverVisible.bind(null, row.name)}
              open={notePopoverVisible?.[row.name] ?? false}
            >
              {res}
            </Popover>
          );
          res = (
            <span onMouseDown={onMouseDownNote} onClick={onMouseDownNote}>
              {res}
            </span>
          );

          let pitRowItems = (
            <>
              <span>{res}</span>
              <span>{text}</span>
              <span
                className={classNames('noTooltip', featuresOneStyles.pitChevron, expandedPITGroups[text] ? featuresOneStyles.pitAccordionCollapsed : featuresOneStyles.pitAccordionExpanded)}
                onClick={() => setExpandedPITGroups({ ...expandedPITGroups, [text]: !expandedPITGroups[text] })}
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faChevronUp').faChevronUp} />
              </span>
            </>
          );

          return row.isPITNew ? (
            <span>
              <p className={featuresOneStyles.shadowElement}>{pitRowItems}</p>
              <span
                css={`
                  width: ${isLarge ? nameLargeScreenWidth - 30 : nameColumnWidth - 30}px;
                `}
                className={featuresOneStyles.truncatedText}
              >
                {pitRowItems}
              </span>
            </span>
          ) : (
            <span>
              {res}
              {text}
            </span>
          );
        },
      },
      {
        title: 'Data Type',
        field: 'dataType',
        helpId: 'fgschema_datatype_readonly',
        width: 200,
        widthLessMedium: 140,
        noAutoTooltip: true,
        noLink: true,
        hidden: false,
        render: (text, row, index) => {
          if (row.isPIT) {
            return <div></div>;
          }
          if (row.isPITNew) {
            return (
              <TooltipExt title={'Lineage diagram'}>
                <FontAwesomeIcon onClick={() => setPITGroupName(row?.name)} icon={require('@fortawesome/pro-solid-svg-icons/faEye').faEye} transform={{ size: 15, x: 0, y: 0 }} />
              </TooltipExt>
            );
          }
          if (row.isNested) {
            return <div></div>;
          }
          if (row.isPITFeature) {
          }

          let s1 = row.dataType;
          let value1: any = { label: s1, value: s1 };
          return (
            <SelectExt
              isDisabled={true}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              value={value1}
              style={{ width: '100%' }}
              options={[]}
              menuPortalTarget={menuPortalTarget}
            />
          );
        },
      },
      {
        title: '',
        field: '',
        width: 16,
        hidden: false,
        noAutoTooltip: true,
        render: (text, row, index) => {
          let span1 = null;
          if (!Utils.isNullOrEmpty(row?.detectedFeatureType) && row?.detectedFeatureType?.toUpperCase() !== row?.featureType?.toUpperCase()) {
            span1 = (
              <TooltipExt title={'Detected Type: ' + row?.detectedFeatureType}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faInfoCircle').faInfoCircle} transform={{ size: 15, x: 0, y: 0 }} />
              </TooltipExt>
            );
          }

          let span2 = null;
          if (row?.isDuplicated) {
            span2 = (
              <TooltipExt title={'Duplicated Column'}>
                <FontAwesomeIcon
                  css={`
                    color: #ff2727;
                  `}
                  icon={require('@fortawesome/pro-solid-svg-icons/faClone').faClone}
                  transform={{ size: 15, x: 0, y: 0 }}
                />
              </TooltipExt>
            );
          }

          if (span1 == null && span2 == null) {
            return null;
          }

          return (
            <span
              css={`
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              {span1}
              {span1 != null && span2 != null && <div css={``}>&nbsp;</div>}
              {span2}
            </span>
          );
        },
      },
      {
        title: 'Feature Type',
        field: 'featureType',
        helpId: 'fgschema_featuretype',
        width: 200,
        widthLessMedium: 150,
        hidden: false,
        noAutoTooltip: true,
        noLink: true,
        render: (text, row, index) => {
          if (row.isPITNew) {
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
                  Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'pitGroup=' + encodeURIComponent(row.name));
                }}
              >
                (Point-In-Time Group {'>'} View)
              </div>
            );
          }
          if (row.isPIT) {
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
                  Location.push('/' + PartsLink.features_add_point_in_time + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'isEditName=' + encodeURIComponent(row.name));
                }}
              >
                (Point-In-Time Feature {'>'} View)
              </div>
            );
          }
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
                  Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'nested=' + encodeURIComponent(row.name) + '&featureGroupIdOri=' + encodeURIComponent(row.featureGroupIdOri ?? ''));
                }}
              >
                (Nested Feature {'>'} View)
              </div>
            );
          }
          // if(row.isPITFeature) {
          //   return <div css={`position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center;`}>(PIT Feature)</div>;
          // }

          let mapV = row.featureMapping;
          if (projectId == null) {
            mapV = null;
          }

          let options = null;
          if (featureGroupIdOri) {
            if (mapV) {
              options = optionsValidDataTypesOriMapV(mapV);
              if (options == null) {
                options = optionsValidDataTypesOri;
              }
            } else {
              options = optionsValidDataTypesOri;
            }
          } else {
            if (mapV) {
              options = optionsValidDataTypesMapV(mapV);
              if (options == null) {
                options = optionsValidDataTypes;
              }
            } else {
              options = optionsValidDataTypes;
            }
          }

          options = options ?? [];

          let selOption = options?.find((o1) => o1.value === text);
          if (options == null) {
            selOption = selOption ?? { label: '', value: '' };
          }

          let isDis = readonly || options == null;
          if (isDis && projectId == null && Utils.isNullOrEmpty(modelVersion)) {
            isDis = false;
          }

          return <SelectExt isDisabled={isDis} value={selOption} options={options} onChange={onChangeSelectOptionFeatureType.bind(null, row, index, featureGroupIdOri)} isSearchable={false} menuPortalTarget={menuPortalTarget} />;
        },
      },
      {
        title: 'Feature Store Mapping',
        field: 'featureMappingFS',
        helpId: 'fgschema_columnmapping_featurestore',
        width: isStreaming ? 200 : 280,
        widthLessMedium: (isStreaming ? 200 : 280) - 60,
        noAutoTooltip: true,
        noLink: true,
        hidden: !isFeatureStore,
        render: (text, row, index) => {
          if (row.isPITNew) {
            return <div></div>;
          }
          if (row.isPIT) {
            return <div></div>;
          }
          if (row.isNested) {
            return <div></div>;
          }
          if (row.isPITFeature) {
            return <div></div>;
          }

          let isDisableForce = false;

          let optionsUse = optionsFeatureStore;

          let alertMsg;
          let value1: any = optionsUse?.find((o1) => o1.value === text);

          if (readonly) {
            if (!Utils.isNullOrEmpty(text)) {
              value1 = { label: text, value: text };
            } else {
              value1 = { label: '', value: null };
            }
          }

          let res = (
            <SelectExt
              isDisabled={isDisableForce || readonly}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              value={value1}
              style={{ width: '100%' }}
              options={optionsUse}
              onChange={onChangeSelectOptionTarget.bind(null, row, index, !Utils.isNullOrEmpty(nested) ? nested : undefined, isFeatureStore)}
              menuPortalTarget={menuPortalTarget}
            />
          );
          if (alertMsg != null) {
            res = (
              <span
                css={`
                  display: flex;
                  width: 100%;
                  align-items: center;
                `}
              >
                <span
                  css={`
                    margin-right: 8px;
                  `}
                >
                  <TooltipExt title={alertMsg}>
                    <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faExclamationTriangle').faExclamationTriangle} transform={{ size: 18, x: 0, y: 0 }} />
                  </TooltipExt>
                </span>
                <span
                  css={`
                    flex: 1;
                  `}
                >
                  {res}
                </span>
              </span>
            );
          }
          return res;
        },
      },
      {
        title: 'Feature Mapping',
        field: 'featureMapping',
        helpId: 'fgschema_columnmapping',
        width: isStreaming ? 300 : 300,
        widthLessMedium: isStreaming ? 240 : 240,
        noAutoTooltip: true,
        noLink: true,
        hidden: isFeatureStore,
        render: (text, row, index) => {
          if (row.isPITNew) {
            return (
              <div
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
                  Location.push('/' + PartsLink.features_add_point_in_time_group + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'isEditName=' + encodeURIComponent(row.name));
                }}
              ></div>
            );
          }
          if (row.isPIT) {
            return (
              <div
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
                  Location.push('/' + PartsLink.features_add_point_in_time + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'isEditName=' + encodeURIComponent(row.name));
                }}
              ></div>
            );
          }
          if (row.isNested) {
            return (
              <div
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
                  Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'nested=' + encodeURIComponent(row.name) + '&featureGroupIdOri=' + encodeURIComponent(row.featureGroupIdOri ?? ''));
                }}
              >
                ({row.columns?.length ?? 0} nested columns)
              </div>
            );
          }

          let isDisableForce = false;
          if (featuresOne?.shouldEnableSchema === false) {
            isDisableForce = true;
          }

          let optionsUse = optionsFeatureMappings;
          if (!Utils.isNullOrEmpty(nested)) {
            optionsUse = optionsFeatureMappingsNested;
          }

          let alertMsg;
          let value1: any = optionsUse?.find((o1) => o1.value === text);
          if (isDisableForce && optionsDsTypesSel?.value === Constants.custom_table) {
            value1 = { label: '', value: '' };
            alertMsg = 'Change Feature Group Type to set mappings';
          } else if (readonly || isDisableForce) {
            value1 = value1 ?? { label: '', value: '' };
          } else if (nested) {
            let t1 = text;
            if (t1 != null) {
              t1 = '' + t1;
            }
            if (!Utils.isNullOrEmpty(t1)) {
              value1 = { label: t1, value: t1 };
            }
          }

          if (readonly) {
            if (!Utils.isNullOrEmpty(text)) {
              value1 = { label: text, value: text };
            } else {
              value1 = { label: '', value: null };
            }
          }

          let res = (
            <SelectExt
              isDisabled={isDisableForce || readonly}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              dragItemName={isDisableForce || readonly ? undefined : DragFieldTarget}
              allowDrag={!(isDisableForce || readonly)}
              value={value1}
              style={{ width: '100%' }}
              options={optionsUse}
              onChange={onChangeSelectOptionTarget.bind(null, row, index, !Utils.isNullOrEmpty(nested) ? nested : undefined, false)}
              menuPortalTarget={menuPortalTarget}
            />
          );
          if (alertMsg != null) {
            res = (
              <span
                css={`
                  display: flex;
                  width: 100%;
                  align-items: center;
                `}
              >
                <span
                  css={`
                    margin-right: 8px;
                  `}
                >
                  <TooltipExt title={alertMsg}>
                    <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faExclamationTriangle').faExclamationTriangle} transform={{ size: 18, x: 0, y: 0 }} />
                  </TooltipExt>
                </span>
                <span
                  css={`
                    flex: 1;
                  `}
                >
                  {res}
                </span>
              </span>
            );
          }
          return res;
        },
      },
      {
        title: 'Source Table',
        field: 'sourceTable',
        helpId: 'fgschema_sourcetable',
        width: 140,
        hidden: isStreaming || pitGroupData !== null,
        isLinked: true,
        render: (text, row) => {
          if (optionsFeatureGroupsSel?.label == text) {
            return null;
          }

          let onClick1 = null;
          if (!Utils.isNullOrEmpty(text)) {
            onClick1 = (e) => {
              e.stopPropagation();
              e.preventDefault();

              let dsId1 = featuresOne?.sourceTableInfos?.find((s1) => s1.sourceTable === text)?.datasetId;
              if (dsId1 != null) {
                Location.push('/' + PartsLink.dataset_detail + '/' + dsId1 + (projectId == null ? '' : '/' + projectId));
              } else {
                REClient_.client_().describeFeatureGroupByTableName(text, projectId, (err, res) => {
                  if (err || !res?.success || res?.result?.featureGroupId == null || res?.result?.projects == null || res?.result?.projects?.length === 0) {
                    REActions.addNotificationError(err || Constants.errorDefault);
                  } else {
                    let pId = projectId;
                    let featureGroupIdSent = res?.result?.featureGroupId;

                    let ppIds = res?.result?.projects?.map((p1) => p1?.projectId);
                    if (ppIds != null) {
                      if (ppIds.length === 1) {
                        pId = ppIds[0];
                        Location.push('/' + PartsLink.feature_group_detail + '/' + pId + '/' + featureGroupIdSent);
                      } else {
                        if (!ppIds?.includes(projectId)) {
                          pId = '-';
                        }
                        Location.push('/' + PartsLink.feature_group_detail + '/' + pId + '/' + featureGroupIdSent);
                      }
                    }
                  }
                });
              }
            };
          }

          return <span onClick={onClick1}>{text}</span>;
        },
      },
      {
        title: 'Select Clause',
        field: 'sql',
        // hideLessMedium: pitGroupData==null,
        hidden: isStreaming,
        helpId: 'fgschema_sql',
        render: (text, row, index) => {
          let sql1 = text;
          if (row.isPIT) {
            sql1 = row.expression;
          }
          if (row.isPITFeature && !pitGroup) {
            return <></>;
          } else if (row.isNested) {
            sql1 = row.usingClause;
          } else if (row.isColumn || row.isPITNew) {
            return null;
          }

          let styleCodeRoot: CSSProperties = {
            borderRadius: '4px',
            padding: '5px 12px',
          };

          return (
            <div
              css={`
                height: 30px;
                width: 400px;
                & pre {
                  margin-bottom: 0;
                }
              `}
              className={' ' + sd.codeSyntax}
            >
              <SyntaxHighlighter language={'sql'} style={dark} showLineNumbers={false} customStyle={styleCodeRoot} wrapLines={false}>
                {sql1 || ''}
              </SyntaxHighlighter>
            </div>
          );
        },
        width: 200,
        widthLessMedium: 120,
        noAutoTooltip: true,
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'actions',
        field: 'actions',
        helpId: 'fgschema_actions',
        width: 200 + (true ? 60 : 0),
        widthLessMedium: 260,
        render: (text, row) => {
          if (isStreaming) {
            //
          } else if (row.isNested || row.isPIT || row.isPITNew || row.isPITFeature) {
            //
          } else if (row.isColumn || (projectId != null && readonly) || optionsFeatureGroupsSel?.label != row.sourceTable || featuresOne?.featureGroupSourceType?.toLowerCase() === 'template') {
            return null;
          }

          let showMenu = ((!row.isColumn || row.isPIT || row.isPITNew) && !row.isPITFeature) || !row.isColumn || row.isPIT || row.isPITNew || row.isPITFeature;
          const menu = (
            <Menu getPopupContainer={popupContainerForMenu}>
              {(!row.isColumn || row.isPIT || row.isPITNew) && !row.isPITFeature && (
                <Menu.Item key={'1'} onClick={onClickFeatureEdit.bind(null, row.name, row.isNested, row.isPIT, row.isPITNew, row.isPITFeature)}>
                  Edit
                </Menu.Item>
              )}
              {(!row.isColumn || row.isPIT || row.isPITNew || row.isPITFeature) && (
                <Menu.Item key={'2'}>
                  <ModalConfirm
                    onConfirm={onClickFeatureDelete.bind(null, row.name, row.isNested, row.isPIT, row.isPITNew, row.isPITFeature, isStreaming)}
                    title={`Do you want to delete this feature "${row.name || ''}"?`}
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    okText={'Delete'}
                    cancelText={'Cancel'}
                    okType={'danger'}
                  >
                    <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red' }}>Delete</div>
                  </ModalConfirm>
                </Menu.Item>
              )}
            </Menu>
          );

          const styleButton: CSSProperties = { margin: '4px' };
          return (
            <div style={{ whiteSpace: 'normal', paddingRight: row.isPITFeature ? 83 : 5, display: 'flex', justifyContent: row.isPITFeature ? 'flex-end' : 'flex-start' }}>
              {row.isPITFeature && !row.isPitOperationConfig && (
                <Provider store={Utils.globalStore()}>
                  <FeaturesOneAddTimeTravelGroupFeature buttonProps={{ children: 'Edit', type: 'default', ghost: true, style: { margin: 4 } }} pitGroupName={row.groupName} pitGroupFeatureName={row.name} />
                </Provider>
              )}
              {row.isPITFeature && (
                <ModalConfirm
                  onConfirm={onClickFeatureDelete.bind(null, row.name, row.isNested, row.isPIT, row.isPITNew, row.isPITFeature, isStreaming)}
                  title={`Do you want to delete this feature "${row.name || ''}"?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Delete'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  {/*// @ts-ignore*/}
                  <Button style={styleButton} ghost type={'danger'} onClick={onClickCancelEvents}>
                    Delete
                  </Button>
                </ModalConfirm>
              )}

              {!row.isPITFeature && showMenu && (
                <DropdownExt overlay={menu} trigger={['click']}>
                  <Button style={styleButton} ghost type={'default'} onClick={onClickCancelEvents}>
                    Actions
                  </Button>
                </DropdownExt>
              )}
            </div>
          );
        },
      },
    ] as ITableExtColumn[];

    res = res?.filter((r1) => !r1.hidden);

    if (projectId == null) {
      res = res?.filter((r1) => !['featureMapping'].includes(r1.field as string));
    }

    return res;
  }, [
    featuresOne,
    optionsFeatureStore,
    optionsDsTypesSel,
    isStreaming,
    nested,
    featureGroupIdOri,
    notePopoverVisible,
    modelVersion,
    projectId,
    optionsValidDataTypesOri,
    optionsValidDataTypesMapV,
    optionsValidDataTypesOriMapV,
    optionsFeatureMappingsNested,
    optionsFeatureMappings,
    optionsValidDataTypes,
    onChangeSelectOptionTarget,
    onChangeSelectOptionFeatureType,
    readonly,
    dataList,
    dataListFiltered,
    optionsFeatureGroupsSel,
    pitGroupData,
    expandedPITGroups,
  ]);

  const getPITGroupInfoFromSchemaByName = (groupName) => {
    return featuresOne?.projectFeatureGroupSchema?.schema?.filter((featureSchema) => featureSchema?.pointInTimeInfo?.groupName === groupName);
  };

  useEffect(() => {
    if (readonly || modelVersion != null) {
      if (projectId != null) {
        return;
      }
    }

    let res = [];
    let duplicatedFeatures = calcSchemaDuplicatedForFeature(featuresOne);
    calcSchemaForFeature(featuresOne)?.some((c1) => {
      if (c1?.pointInTimeInfo?.groupName) {
        //
      } else {
        res.push(calcObj(c1, duplicatedFeatures));
      }
    });

    if (res.length === 0) {
      featuresOne?.features?.some((c1, f1ind) => {
        if (c1?.pointInTimeInfo?.groupName) {
          //
        } else {
          res.push(calcObj(c1, duplicatedFeatures));
        }
      });
    }

    featuresOne?.pointInTimeGroups?.some((pitGroupInfo) => {
      const pitGroupSchema = getPITGroupInfoFromSchemaByName(pitGroupInfo.groupName);
      res.push({
        name: pitGroupInfo?.groupName,
        pointInTimeInfoNew: pitGroupInfo,
        isPITNew: true,
      });

      if (expandedPITGroups[pitGroupInfo?.groupName]) {
        const currentPitGroupFeatures = pitGroupInfo?.features?.map((feature) => {
          const featureSchema = pitGroupSchema?.filter((schema) => schema.name === feature.name)[0];

          return {
            ...calcObj(feature),
            dataType: featureSchema?.dataType,
            featureMapping: featureSchema?.featureMapping,
            featureType: featureSchema?.featureType,
            isPITFeature: true,
            groupName: pitGroupInfo?.groupName,
            sql: feature?.expression,
            isColumn: feature.expression === null && feature.columns === null,
          };
        });
        if (currentPitGroupFeatures?.length) {
          res.push(...currentPitGroupFeatures);
        }
      }

      // pitGroup?.features?.some(c1 => {
      //   let item1: any = calcObj(c1);
      //   item1.sql = c1.expression;
      //   item1.isPITFeature = true;
      //   item1.groupName = p1?.groupName;
      //   res.push(item1);
      // });
    });

    let nestedData1 = null;
    if (!Utils.isNullOrEmpty(nested)) {
      let n1 = res?.find((v1) => v1.name === nested);
      if (n1 == null) {
        res = [];
      } else {
        nestedData1 = n1;
        res = n1.columns?.map((c1) => calcObj(c1, duplicatedFeatures));
      }
    }

    let pitGroupData1 = null;
    if (!Utils.isNullOrEmpty(pitGroup)) {
      let p1 = res?.find((v1) => v1.name === pitGroup);
      if (p1 == null) {
        res = [];
      } else {
        pitGroupData1 = p1;
        const pitGroupSchema = getPITGroupInfoFromSchemaByName(p1.name);
        res = p1?.pointInTimeInfoNew?.features?.map((c1) => {
          const featureSchema = pitGroupSchema?.find((schema) => schema.name === c1.name);

          return {
            ...calcObj(c1),
            dataType: featureSchema?.dataType,
            featureMapping: featureSchema?.featureMapping,
            featureType: featureSchema?.featureType,
            isPITFeature: true,
            groupName: p1.name,
            name: c1.name,
            sql: c1.expression,
            isColumn: c1.expression == null && c1.columns == null,
            isPitOperationConfig: !!c1?.pitOperationConfig,
          };
        });
      }
    }

    if (res != null && featuresOne?.featureTags != null) {
      res.some((r1) => {
        let tags1 = featuresOne?.featureTags?.[r1.name];
        if (tags1 != null) {
          r1.tags = tags1;
        }
      });
    }

    setPitGroupData(pitGroupData1);
    setNestedData(nestedData1);

    //
    if (isFeatureStore) {
      res = res?.map((d1) => {
        let m1 = null;

        if (d1.name === featuresOne?.primaryKey) {
          m1 = 'recordId';
        }
        if (d1.name === featuresOne?.updateTimestampKey) {
          m1 = 'eventTimestamp';
        }
        if (featuresOne?.lookupKeys?.includes(d1.name ?? '---')) {
          m1 = 'lookupKeys';
        }

        d1.featureMappingFS = m1;
        return d1;
      });
    }

    //
    setDataList(res);
  }, [isFeatureStore, projectId, featuresOne, readonly, modelVersion, nested, pitGroup, expandedPITGroups]);

  const calcObj = (c1, duplicatedFeatures?) => {
    if (duplicatedFeatures != null && !_.isArray(duplicatedFeatures)) {
      duplicatedFeatures = null;
    }

    return {
      isDuplicated: duplicatedFeatures?.find((d1) => d1.name === c1.name) != null,
      detectedFeatureType: c1.detectedFeatureType,
      featureGroupIdOri: c1.featureGroupId,
      isNested: c1.columns != null,
      isColumn: c1.selectClause == null && c1.columns == null,
      name: c1.name,
      featureType: c1.featureType,
      featureMapping: c1.featureMapping,
      dataType: c1.dataType,
      sourceDatasets: c1.sourceDatasets,
      sourceTable: c1.sourceTable,
      sql: c1.selectClause,

      note: c1.note,

      columns: c1.columns,
      usingClause: c1.usingClause,
      whereClause: c1.whereClause,
      orderClause: c1.orderClause,

      pointInTimeInfo: c1.pointInTimeInfo,
      isPIT: c1.pointInTimeInfo != null,
    };
  };

  useEffect(() => {
    if (readonly && modelVersion != null) {
      defDatasets.memSchemaForFeatureGrouptId(true, projectId, featureGroupId, modelVersion);
    }
  }, [readonly, modelVersion, defDatasetsParam, projectId, featureGroupId]);
  const schemaFeatureGroupModel = useMemo(() => {
    if (readonly && modelVersion != null) {
      return defDatasets.memSchemaForFeatureGrouptId(false, projectId, featureGroupId, modelVersion);
    }
    return null;
  }, [readonly, modelVersion, defDatasetsParam, projectId, featureGroupId]);
  useEffect(() => {
    let json1 = schemaFeatureGroupModel?.toJS();
    if (json1) {
      let res = [];

      let duplicatedFeatures = json1?.duplicatedFeatures;

      let list = json1?.schema;
      let pitGroupNameList = [];
      list?.some((c1) => {
        if (c1?.pointInTimeInfo?.groupName) {
          pitGroupNameList.push(c1?.pointInTimeInfo?.groupName);
        } else {
          res.push(calcObj(c1, duplicatedFeatures));
        }
      });

      featuresOne?.pointInTimeGroups
        ?.filter((item) => pitGroupNameList.includes(item.groupName))
        ?.some((pitGroupInfo) => {
          const pitGroupSchema = getPITGroupInfoFromSchemaByName(pitGroupInfo.groupName);
          res.push({
            name: pitGroupInfo?.groupName,
            pointInTimeInfoNew: pitGroupInfo,
            isPITNew: true,
          });

          if (expandedPITGroups[pitGroupInfo?.groupName]) {
            const currentPitGroupFeatures = pitGroupInfo?.features?.map((feature) => {
              const featureSchema = pitGroupSchema?.filter((schema) => schema.name === feature.name)[0];

              return {
                ...calcObj(feature),
                dataType: featureSchema?.dataType,
                featureMapping: featureSchema?.featureMapping,
                featureType: featureSchema?.featureType,
                isPITFeature: true,
                groupName: pitGroupInfo?.groupName,
                sql: feature?.expression,
              };
            });
            if (currentPitGroupFeatures?.length) {
              res.push(...currentPitGroupFeatures);
            }
          }
        });

      let nestedData1 = null;
      if (!Utils.isNullOrEmpty(nested)) {
        let n1 = res?.find((v1) => v1.name === nested);
        if (n1 == null) {
          res = [];
        } else {
          nestedData1 = n1;
          res = n1.columns?.map((c1) => calcObj(c1, duplicatedFeatures));
        }
      }

      let pitGroupData1 = null;
      if (!Utils.isNullOrEmpty(pitGroup)) {
        let p1 = res?.find((v1) => v1.name === pitGroup);
        if (p1 == null) {
          res = [];
        } else {
          pitGroupData1 = p1;
          res = p1?.pointInTimeInfoNew?.features?.map((c1) => ({ sql: c1.expression, name: c1.name, isPITFeature: true, groupName: p1?.groupName, isPitOperationConfig: !!c1?.pitOperationConfig }));
        }
      }

      if (res != null && featuresOne?.featureTags != null) {
        res.some((r1) => {
          let tags1 = featuresOne?.featureTags?.[r1.name];
          if (tags1 != null) {
            r1.tags = tags1;
          }
        });
      }

      setPitGroupData(pitGroupData1);
      setNestedData(nestedData1);

      //
      if (isFeatureStore) {
        res = res?.map((d1) => {
          let m1 = null;

          if (d1.name === featuresOne?.primaryKey) {
            m1 = 'recordId';
          }
          if (d1.name === featuresOne?.updateTimestampKey) {
            m1 = 'eventTimestamp';
          }
          if (featuresOne?.lookupKeys?.includes(d1.name ?? '---')) {
            m1 = 'lookupKeys';
          }

          d1.featureMappingFS = m1;
          return d1;
        });
      }

      setDataList(res);
    }
  }, [schemaFeatureGroupModel, isFeatureStore, featuresOne, nested, pitGroup, expandedPITGroups]);

  const onClickAddFeature = (e) => {
    Location.push('/' + PartsLink.features_add + '/' + (projectId ?? '-') + '/' + featureGroupId);
  };

  const onClickAddTimeTravelFeatureGroup = (e) => {
    Location.push('/' + PartsLink.features_add_point_in_time_group + '/' + (projectId ?? '-') + '/' + featureGroupId);
  };

  const onClickAddTimeTravelFeature = (e) => {
    Location.push('/' + PartsLink.features_add_point_in_time + '/' + (projectId ?? '-') + '/' + featureGroupId);
  };

  const onClickAddNestedFeature = (e) => {
    Location.push('/' + PartsLink.features_add_nested + '/' + (projectId ?? '-') + '/' + featureGroupId);
  };

  const onClickRawData = (e) => {
    Location.push('/' + PartsLink.features_rawdata + '/' + (projectId ?? '-') + '/' + featureGroupId);
  };

  const onClickFeaturesEdit = (e) => {
    Location.push('/' + PartsLink.feature_groups_edit + '/' + (projectId ?? '-') + '/' + featureGroupId);
  };

  const onChangeFeatureGroup = (option1) => {
    if (option1?.value) {
      Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + option1?.value);
    }
  };

  const onClickRow = useCallback((row) => {
    if (row.isPITFeature) {
      refPITEdit.current?.[row.name]?.doConfirm?.();
    }
  }, []);

  const calcLink = (row) => {
    if (row.isPIT) {
      return ['/' + PartsLink.features_add_point_in_time + '/' + (projectId ?? '-') + '/' + featureGroupId, 'isEditName=' + encodeURIComponent(row.name)];
    } else if (row.isNested) {
      return ['/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, 'nested=' + encodeURIComponent(row.name) + '&featureGroupIdOri=' + encodeURIComponent(row.featureGroupIdOri ?? '')];
    } else if (row.isColumn) {
      return null;
    } else if (optionsFeatureGroupsSel?.label == row.sourceTable) {
      return ['/' + (row.isPIT ? PartsLink.features_add_point_in_time : row.isNested ? PartsLink.features_add_nested : PartsLink.features_add) + '/' + (projectId ?? '-') + '/' + featureGroupId, 'isEditName=' + encodeURIComponent(row.name)];
    }
  };

  const confirmDsType = useRef(null);
  const confirmMapping = useRef(null);

  useEffect(() => {
    return () => {
      if (confirmDsType.current != null) {
        confirmDsType.current.destroy();
        confirmDsType.current = null;
      }
      if (confirmMapping.current != null) {
        confirmMapping.current.destroy();
        confirmMapping.current = null;
      }
    };
  }, []);

  const onChangeDsType = (option1) => {
    if (confirmDsType.current != null) {
      confirmDsType.current.destroy();
      confirmDsType.current = null;
    }

    confirmDsType.current = confirm({
      title: 'Do you want to change the Feature Group Type to ' + (option1?.value ?? '(None)'),
      okText: 'Change',
      maskClosable: true,
      content: <div></div>,
      onOk: () => {
        REClient_.client_().updateFeatureGroupDatasetType(projectId, featureGroupId, option1?.value, (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.featureGroupsGetByProject_(projectId, (list) => {
              list?.some((f1) => {
                StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
              });
            });
          }
        });

        if (confirmDsType.current != null) {
          confirmDsType.current.destroy();
          confirmDsType.current = null;
        }
      },
      onCancel: () => {
        if (confirmDsType.current != null) {
          confirmDsType.current.destroy();
          confirmDsType.current = null;
        }
      },
    });
  };

  const onChangeUseForTraining = (e) => {
    let v1 = e.target.checked;

    REActions.addNotification('Processing...');
    REClient_.client_().useFeatureGroupForTraining(projectId, featureGroupId, v1 === true, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.validateProjectDatasets_(projectId);
        StoreActions.featureGroupsGetByProject_(projectId, (list) => {
          list?.some((f1) => {
            StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
          });
        });
      }
    });
  };

  const topAfterHeaderHH = 120;

  const onClickExportSchema = (modelVersionCount, e) => {
    REClient_.client_()._exportFeatureGroupSchema(projectId, featureGroupId, modelVersion, (err, res) => {
      // if(err) {
      //   REActions.addNotificationError(err || Constants.errorDefault);
      //
      // } else {
      //   let s1 = JSON.stringify(res ?? '');
      //
      //   let dataStr = "data:text/json;charset=utf-8," +encodeURIComponent(s1);
      //   let link1 = document.createElement('a');
      //   document.body.appendChild(link1);
      //   link1.setAttribute('href', dataStr);
      //   link1.setAttribute('download', `featuregroup_schema_${modelVersionCount ?? ''}.json`);
      //   link1.click();
      //   link1.remove();
      // }
    });
  };

  const onChangeImportSchema = (e) => {
    let fileList = e.target.files;
    if (fileList != null && fileList.length > 0) {
      let f1 = fileList[0];

      REClient_.client_()._importFeatureGroupSchema(projectId, featureGroupId, f1, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Done');

          setModelVersion(null);
          setReadonly(false);

          Location.replace('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);

          //
          StoreActions.featureGroupsDescribe_(projectId, featureGroupId);

          StoreActions.getProjectsList_();
          StoreActions.getProjectsById_(projectId);
          StoreActions.getProjectDatasets_(projectId, (res, ids) => {
            ids?.some((id1) => {
              StoreActions.schemaGetFileDataUse_(projectId, id1);
            });
          });

          StoreActions.validateProjectDatasets_(projectId);
          StoreActions.featureGroupsGetByProject_(projectId, (list) => {
            list?.some((f1) => {
              StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
            });
          });

          forceUpdateRefreshAll();
        }
      });
    }
  };

  const onClickImportSchema = (e) => {
    $(refFile.current).click();
  };

  const lastDatasetIdUsedForDatasetVersions = useRef(null);
  useEffect(() => {
    datasets.memSchemaDatasetListVersionsFeatureGroup(true, undefined, projectId, featureGroupId);
  }, [projectId, featureGroupId, datasetsParam]);
  const listDatasetVersions = useMemo(() => {
    let res = datasets.memSchemaDatasetListVersionsFeatureGroup(false, undefined, projectId, featureGroupId);
    if (featureGroupId !== lastDatasetIdUsedForDatasetVersions.current) {
      lastDatasetIdUsedForDatasetVersions.current = featureGroupId;

      setModelVersion(null);
      setReadonly(projectId == null);

      let url1 = window.location.href;
      if (url1.indexOf('?') === -1) {
        url1 = undefined;
      } else {
        url1 = url1.substring(url1.indexOf('?') + 1);
      }

      Location.replace('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, url1);
    }
    return res;
  }, [projectId, featureGroupId, datasetsParam]);

  const usedModelVersionFistTime = useRef(null);
  useEffect(() => {
    if (listDatasetVersions) {
      if (usedModelVersionFistTime.current === true) {
        return;
      }

      let mv1 = paramsProp?.get('modelVersion');
      if (!Utils.isNullOrEmpty(mv1)) {
        usedModelVersionFistTime.current = true;
        setModelVersion(mv1);
        setReadonly(true);
      }
    }
  }, [listDatasetVersions]);

  let optionsDatasetsVersions = useMemo(() => {
    let res = listDatasetVersions?.map((d1, d1ind) => ({
      label: '(' + (listDatasetVersions.length - d1ind) + ')',
      value: d1.modelVersion,
      isLast: false,
      count: listDatasetVersions.length - d1ind,
    }));

    res = res ?? [];
    res.unshift({
      label: 'Latest',
      value: null,
      isLast: true,
      count: (listDatasetVersions?.length ?? 0) + 1,
    });

    return res;
  }, [listDatasetVersions]);
  let datasetVersionsSelectValue = optionsDatasetsVersions?.find((v1) => v1.value === modelVersion);

  let modelVersionCount = datasetVersionsSelectValue?.count ?? 1;

  let buttonImport = readonly ? null : (
    <TooltipExt title={'Import Schema...'}>
      <Button
        type={'default'}
        ghost
        css={`
          margin-right: 10px;
          padding: 0 10px 0 8px;
        `}
        onClick={onClickImportSchema}
      >
        <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faFileImport').faFileImport} transform={{ size: 15, x: 0, y: 0 }} />
      </Button>
    </TooltipExt>
  );
  let buttonExport = (
    <TooltipExt title={'Export Schema...'}>
      <Button
        type={'default'}
        ghost
        css={`
          margin-right: 10px;
          padding: 0 8px 0 10px;
        `}
        onClick={onClickExportSchema.bind(null, modelVersionCount)}
      >
        <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faFileExport').faFileExport} transform={{ size: 15, x: 0, y: 0 }} />
      </Button>
    </TooltipExt>
  );
  let buttonEditSql = (
    <TooltipExt title={'Edit SQL'}>
      <Button
        type={'default'}
        ghost
        css={`
          margin-left: 10px;
          margin-right: 10px;
          padding: 0 8px 0 10px;
        `}
        onClick={onClickFeaturesEdit}
      >
        <img
          alt={''}
          src={calcImgSrc('/imgs/editSql.png')}
          css={`
            width: 18px;
          `}
        />
      </Button>
    </TooltipExt>
  );

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const onChangeSelectURLDirectFromValueVersion = (option1) => {
    let v1 = option1?.value;
    setModelVersion(v1);
    setReadonly(option1?.isLast !== true);

    Location.replace('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, v1 == null ? undefined : 'modelVersion=' + encodeURIComponent(v1));
  };

  //
  if ([DatasetLifecycle.IMPORTING, DatasetLifecycle.CONVERTING, DatasetLifecycle.INSPECTING, DatasetLifecycle.PENDING].includes(featuresOne?.lastDatasetVersion?.status ?? '---')) {
    return <RefreshAndProgress isMsgAnimRefresh={true} msgMsg={'Status: ' + DatasetLifecycleDesc[featuresOne?.lastDatasetVersion?.status]}></RefreshAndProgress>;
  }

  let showExtraInputsTop = useMemo(() => {
    return isStreaming || showWizardStreaming;
  }, [isStreaming, showWizardStreaming]);

  const { optionsColumnNames, optionsColumnNamesWithoutNone, optionsColumnNamesTimestamps } = useMemo(() => {
    let optionsColumnNamesTimestamps = [];

    let optionsColumnNames = dataList?.map((c1) => {
      if (c1.featureType?.toLowerCase() === 'timestamp') {
        optionsColumnNamesTimestamps.push({
          label: c1.name,
          value: c1.name,
        });
      }

      return {
        label: c1.name,
        value: c1.name,
      };
    });

    //
    if (isStreaming || isFeatureStore) {
      if (eventTimestampSel && optionsColumnNames?.find((o1) => o1.value === eventTimestampSel) == null) {
        optionsColumnNames = optionsColumnNames ?? [];
        optionsColumnNames.push({ label: eventTimestampSel, value: eventTimestampSel });
      }
      if (recordIdSel && optionsColumnNames?.find((o1) => o1.value === recordIdSel) == null) {
        optionsColumnNames = optionsColumnNames ?? [];
        optionsColumnNames.push({ label: recordIdSel, value: recordIdSel });
      }
      if (lookupKeysSel != null && _.isArray(lookupKeysSel)) {
        lookupKeysSel?.some((s1) => {
          if (optionsColumnNames?.find((o1) => o1.value === s1) == null) {
            optionsColumnNames = optionsColumnNames ?? [];
            optionsColumnNames.push({ label: s1, value: s1 });
          }
        });
      }
    }

    //
    let optionsColumnNamesWithoutNone = optionsColumnNames == null ? null : [...optionsColumnNames];
    optionsColumnNames?.unshift({ label: '(None)', value: null });
    optionsColumnNamesTimestamps?.unshift({ label: '(None)', value: null });

    return { optionsColumnNames, optionsColumnNamesWithoutNone, optionsColumnNamesTimestamps };
  }, [dataList, eventTimestampSel, recordIdSel, lookupKeysSel, isStreaming, isFeatureStore]);

  const fgIdRef = useRef(null);
  useEffect(() => {
    setRecordIdSel(featuresOne?.primaryKey);
    setEventTimestampSel(featuresOne?.updateTimestampKey);
    if (_.isArray(featuresOne?.lookupKeys)) {
      setLookupKeysSel(featuresOne?.lookupKeys?.join(', ') || '');
    } else {
      setLookupKeysSel('');
    }

    if (fgIdRef.current !== featuresOne?.featureGroupId) {
      fgIdRef.current = featuresOne?.featureGroupId;
      setRadioSel(featuresOne?.lookupKeys?.length <= 0);
    }
  }, [featuresOne]);

  const isStreamingConfigEmpty = useMemo(() => {
    return Utils.isNullOrEmpty(lookupKeysSel) && Utils.isNullOrEmpty(eventTimestampSel) && Utils.isNullOrEmpty(recordIdSel);
  }, [lookupKeysSel, eventTimestampSel, recordIdSel]);

  // const optionRecordIdSel = useMemo(() => {
  //   return optionsColumnNames?.find(v1 => v1.value===recordIdSel);
  // }, [optionsColumnNames, recordIdSel]);

  const onChangeExtraRecordId = (e) => {
    setRecordIdSel(e.target?.value);
    setLookupKeysSel(null);
    setRadioSel(true);

    // setTimeout(() => {
    //   doSetExtra();
    // }, 0);
  };

  const onChangeExtraLookupKeys = (e) => {
    setLookupKeysSel(e.target.value);
    setRecordIdSel(null);
    setRadioSel(false);

    // setTimeout(() => {
    //   doSetExtra();
    // }, 0);
  };

  const doSetExtra = (cbFinish?) => {
    setRecordIdSel((r1) => {
      setEventTimestampSel((e1) => {
        setLookupKeysSel((lookKeysList) => {
          let kk = Utils.isNullOrEmpty(lookKeysList) ? null : lookKeysList.split(',').map((s1) => _.trim(s1));

          REClient_.client_().setFeatureGroupIndexingConfig(featureGroupId, r1, e1, kk, (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
              cbFinish?.(false);
            } else {
              StoreActions.featureGroupsGetByProject_(projectId);
              StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
              cbFinish?.(true);
            }
          });

          return lookKeysList;
        });

        return e1;
      });

      return r1;
    });
  };

  const onChangeExtraEventTimestamp = (e) => {
    setEventTimestampSel(e.target.value);
    // setTimeout(() => {
    //   doSetExtra();
    // }, 0);
  };

  // const optionEventTimestampSel = useMemo(() => {
  //   return optionsColumnNames?.find(v1 => v1.value===eventTimestampSel);
  // }, [optionsColumnNames, eventTimestampSel]);

  const nonIgnoredColumnsCount = useMemo(() => {
    let res = 0,
      resNested = 0;
    dataListFiltered?.some((d1) => {
      if (d1?.isNested) {
        resNested += (d1?.columns ?? []).length ?? 0;
      } else if (d1?.featureMapping?.toUpperCase() !== 'IGNORE') {
        res++;
      }
    });

    let s1 = '' + res;
    if (resNested > 0) {
      s1 += ' + ' + resNested + ' nested';
    }

    let pitgCount = 0;
    dataList?.some((p1: any) => {
      if (p1.isPITNew && p1.pointInTimeInfoNew != null) {
        pitgCount += p1.pointInTimeInfoNew?.features?.length ?? 0;
      }
    });
    if (pitgCount > 0) {
      s1 += ' + ' + pitgCount + ' in PIT Groups';
    }

    return s1;
  }, [dataListFiltered, dataList]);

  const onClickBackNested = (e) => {
    Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
  };

  const showProcessing = useMemo(() => {
    if (datasetVersionsSelectValue?.value != null) {
      return null;
    }

    if (datasetOne == null) {
      //
    } else {
      let datasetLifecycle = (datasetOne as any)?.get('status');
      if ([DatasetLifecycle.COMPLETE].includes(datasetLifecycle)) {
        //
      } else if ([DatasetLifecycle.CANCELLED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED, DatasetLifecycle.FAILED].includes(datasetLifecycle)) {
        if (featuresOne == null) {
          return <RefreshAndProgress errorMsg={'Dataset ' + DatasetLifecycleDesc[datasetLifecycle]}></RefreshAndProgress>;
        }
      } else {
        if ([DatasetLifecycle.INSPECTING, DatasetLifecycle.IMPORTING, DatasetLifecycle.UPLOADING, DatasetLifecycle.CONVERTING].includes(datasetLifecycle)) {
          StoreActions.refreshDoDatasetAll_(datasetId, projectId);
        }
        if (featuresOne == null) {
          return <RefreshAndProgress isMsgAnimRefresh={true} msgMsg={'Dataset is processing'}></RefreshAndProgress>;
        }
      }
    }
  }, [datasetOne, datasetVersionsSelectValue, featuresOne]);

  let showActions = !readonly || (projectId == null && Utils.isNullOrEmpty(modelVersion));
  let featureGroupSourceType = featuresOne?.featureGroupSourceType?.toLowerCase();
  let showNested = featureGroupSourceType !== null && featureGroupSourceType !== 'merge' && featureGroupSourceType !== 'snapshot';
  let showFeatures = ['sql', 'dataset'].includes(featuresOne?.featureGroupSourceType?.toLowerCase());
  let showPit = featureGroupSourceType !== null && featureGroupSourceType !== 'sampling' && featureGroupSourceType !== 'transform' && featureGroupSourceType !== 'snapshot' && featureGroupSourceType !== 'merge';
  let showAddDropdown = showNested || showFeatures || showPit;

  const onChangeRadioSel = (e) => {
    let v1 = e.target.value;
    setRadioSel(v1);

    if (v1 === true) {
      setLookupKeysSel(null);
      // setTimeout(() => {
      //   doSetExtra();
      // }, 0);
    } else {
      setRecordIdSel(null);
      // setTimeout(() => {
      //   doSetExtra();
      // }, 0);
    }
  };

  const onClickStreamingSet = (e) => {
    setLookupKeysSel((lk1) => {
      setRecordIdSel((ri1) => {
        setEventTimestampSel((et1) => {
          if (_.trim(lk1 || '') === '' && _.trim(ri1 || '') === '') {
            REActions.addNotificationError("Primary Key and Lookup Keys can't be empty");
          } else {
            doSetExtra((isOk) => {
              if (isOk) {
                if (isStreaming) {
                  Location.push('/' + PartsLink.dataset_streaming + '/' + datasetId + (projectId ? '/' + projectId : ''));
                } else {
                  Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
                }
              }
            });
          }

          return et1;
        });

        return ri1;
      });

      return lk1;
    });
  };

  const onClickConfigStreaming = (e) => {
    Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, 'showWizardStreaming=1');
  };

  const OnClickInferFeatureMappings = (e) => {
    setIsInferMapping(true);
    REClient_.client_().inferFeatureMappings(projectId, featureGroupId, (err, res) => {
      setIsInferMapping(false);
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        if (res?.result) {
          if (res?.result?.error) {
            REActions.addNotificationError(res?.result?.error);
          } else if (res?.result?.featureMappings?.length) {
            onFeatureMapping(res?.result?.featureMappings);
          }
        }
      }
    });
  };

  const onFeatureMapping = (featureMappings) => {
    if (confirmMapping.current != null) {
      confirmMapping.current.destroy();
      confirmMapping.current = null;
    }

    const mappingList = featureMappings.map((item) => ({ checked: true, featureName: item.featureName, featureMapping: item.featureMapping }));

    const getMappingContent = (featureMappings) => (
      <div css={'margin-top: 10px;'}>
        <div css={'display: flex; gap: 20px; margin-left: 30px;'}>
          <div css={'min-width: 100px;'}>Feature Name</div>
          <div css={'min-width: 100px;'}>Feature Mapping</div>
        </div>
        {featureMappings &&
          featureMappings.map((mapping) => (
            <div css={'display: flex; gap: 20px;'}>
              <Checkbox
                checked={mapping.checked}
                onChange={(e) => {
                  mapping.checked = e.target.checked;
                  if (confirmMapping.current) {
                    confirmMapping.current.update({
                      content: getMappingContent(mappingList),
                    });
                  }
                }}
              />
              <div css={'min-width: 100px;'}>{mapping.featureName}</div>
              <div css={'min-width: 100px;'}>{mapping.featureMapping}</div>
            </div>
          ))}
      </div>
    );

    confirmMapping.current = confirm({
      title: 'Recommended Feature Mappings',
      okText: 'Apply',
      maskClosable: true,
      content: getMappingContent(mappingList),
      onOk: () => {
        const resultFeatureMappings = mappingList.filter((item) => item.checked).map((item) => ({ featureName: item.featureName, featureMapping: item.featureMapping }));
        const featureGroupTypeMappings = [{ feature_group_id: featureGroupId, feature_mappings: resultFeatureMappings }];
        REClient_.client_()._bulkSetProjectFeatureGroupTypesAndFeatureMappings(projectId, featureGroupTypeMappings, (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            if (res?.success) {
              REActions.addNotification('Applied the feature mappings.');

              StoreActions.featureGroupsGetByProject_(projectId);
              StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
              Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
            }
          }
        });

        if (confirmMapping.current != null) {
          confirmMapping.current.destroy();
          confirmMapping.current = null;
        }
      },
      onCancel: () => {
        if (confirmMapping.current != null) {
          confirmMapping.current.destroy();
          confirmMapping.current = null;
        }
      },
    });
  };

  // const hasPITGFeatures = useMemo(() => {
  //   return dataList?.some((c1: any) => c1.isPITFeature) ?? false;
  // }, [dataList]);
  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 10px 30px;
      `}
    >
      <RefreshAndProgress isDim={isRefreshing || featuresOne == null} isMsgAnimRefresh={featuresOne == null} msgMsg={featuresOne == null ? 'Processing...' : null}>
        {nestedData == null && pitGroupData == null && (
          <div
            className={sd.titleTopHeaderAfter}
            css={`
              display: flex;
              align-items: center;
              margin-top: 10px;
            `}
          >
            <div
              css={`
                margin-right: 5px;
              `}
            >
              Features
              <span
                css={`
                  @media screen and (max-width: 1450px) {
                    display: none;
                  }
                `}
              >
                {' '}
                for Group
              </span>
              :
            </div>
            <div
              css={`
                width: 300px;
                font-size: 15px;
                @media screen and (max-width: 1350px) {
                  width: 200px;
                }
                @media screen and (max-width: 1250px) {
                  width: 140px;
                }
              `}
            >
              <SelectExt isDisabled={projectId == null || showWizardStreaming === true} value={optionsFeatureGroupsSel ?? { label: '(Select)', value: null }} onChange={onChangeFeatureGroup} options={optionsFeatureGroups} />
            </div>
            {!showWizard && (
              <span
                css={`
                  margin-left: 10px;
                `}
              >
                Version
              </span>
            )}
            {!showWizard && (
              <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '100px', display: 'inline-block', fontSize: '12px' }}>
                <SelectExt
                  isDisabled={showWizardStreaming === true}
                  value={datasetVersionsSelectValue}
                  options={optionsDatasetsVersions}
                  onChange={onChangeSelectURLDirectFromValueVersion}
                  isSearchable={true}
                  menuPortalTarget={popupContainerForMenu(null)}
                />
              </span>
            )}
            {!showWizard && (
              <span
                css={`
                  margin-left: 20px;
                  font-size: 16px;
                  margin-right: 5px;
                `}
              >
                Feature Group Type:
              </span>
            )}
            {!showWizard && (
              <div
                css={`
                  width: 180px;
                  font-size: 14px;
                  @media screen and (max-width: 1250px) {
                    width: 100px;
                  }
                `}
              >
                <SelectExt isDisabled={projectId == null || showProcessing != null || showWizardStreaming === true} value={optionsDsTypesSel ?? { label: '(Select)', value: null }} onChange={onChangeDsType} options={optionsDsTypes} />
              </div>
            )}
            {!Utils.isNullOrEmpty(modelVersion) && (
              <span
                css={`
                  margin-left: 20px;
                  display: inline-flex;
                  padding-top: 2px;
                  align-self: flex-start;
                `}
              >
                {buttonExport}
              </span>
            )}
          </div>
        )}
        {nestedData == null && pitGroupData == null && showProcessing == null && (
          <div
            css={`
              display: flex;
              align-items: center;
              margin-top: 17px;
            `}
          >
            {showWizardStreaming !== true && (
              <span
                css={`
                  margin-right: ${readonly ? 0 : 20}px;
                `}
              >
                {!isStreaming && !readonly && buttonImport}
                {!isStreaming && !readonly && (
                  <input
                    onChange={onChangeImportSchema}
                    type={'file'}
                    css={`
                      display: none;
                    `}
                    ref={refFile}
                  />
                )}
                {!isStreaming && Utils.isNullOrEmpty(modelVersion) && buttonExport}
                {!readonly && !showWizard && !isStreaming && buttonEditSql}
              </span>
            )}
            <span
              css={`
                flex: 1;
              `}
            ></span>
            {!Constants.flags.onprem && (
              <Button
                css={`
                  margin-left: 10px;
                `}
                type={'primary'}
                onClick={OnClickInferFeatureMappings}
                loading={isInferMapping}
              >
                Infer Feature Mappings
              </Button>
            )}
            {showActions && !isStreaming && nestedData == null && pitGroupData == null && !showWizard && showWizardStreaming !== true && showAddDropdown && (
              <div>
                <DropdownExt
                  overlay={
                    <Menu getPopupContainer={popupContainerForMenu}>
                      {showFeatures && (
                        <Menu.Item key={'1'} onClick={onClickAddFeature}>
                          Add Feature
                        </Menu.Item>
                      )}
                      {showNested && (
                        <Menu.Item key={'2'} onClick={onClickAddNestedFeature}>
                          Add Nested Feature
                        </Menu.Item>
                      )}
                      {showPit && !isPitUseGroup && (
                        <Menu.Item key={'3'} onClick={onClickAddTimeTravelFeature}>
                          Add Point-In-Time Feature
                        </Menu.Item>
                      )}
                      {showPit && isPitUseGroup && (
                        <Menu.Item key={'4'} onClick={onClickAddTimeTravelFeatureGroup}>
                          Add Point-In-Time Group
                        </Menu.Item>
                      )}
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <Button
                    css={`
                      margin-left: 10px;
                    `}
                    type={'primary'}
                  >
                    Add...
                  </Button>
                </DropdownExt>
              </div>
            )}
          </div>
        )}

        <div
          css={`
            position: absolute;
            top: ${nestedData != null || pitGroupData != null ? 0 : topAfterHeaderHH + (Utils.isNullOrEmpty(modelVersion) ? 0 : -60)}px;
            left: 0;
            right: 0;
            bottom: 0;
          `}
        >
          {showProcessing}
          {!showProcessing && (
            <AutoSizer disableWidth>
              {({ height }) => {
                const filterHH = showWizard ? 0 : 50;
                let extraHH = showWizardStreaming ? 120 : showExtraInputsTop ? 80 : 0;
                let errHH = errMsg == null ? 0 : 50;
                let pitGroupDataHH = pitGroupData == null ? 0 : /*390+*/ 160 + 44 + 10;

                let filterListElem = [
                  <span key={'f1'}>Filter Columns By Name:</span>,
                  <span
                    key={'f2'}
                    css={`
                      margin-left: 10px;
                      width: 200px;
                    `}
                  >
                    <Input
                      value={columnFilterText ?? ''}
                      onChange={(e) => {
                        setColumnFilterText(e.target.value);
                      }}
                      allowClear={true}
                    />
                  </span>,
                  pitGroupData == null && projectId ? (
                    <span
                      key={'f3'}
                      css={`
                        margin-left: 20px;
                      `}
                    >
                      <Checkbox
                        checked={!!columnFilterOnlyNonIgnored}
                        onChange={(e) => {
                          setColumnFilterOnlyNonIgnored(e.target.checked);
                        }}
                      >
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Show only non-ignored columns
                        </span>
                      </Checkbox>
                    </span>
                  ) : null,
                  pitGroupData != null ? null : (
                    <span
                      key={'f4'}
                      css={`
                        margin-left: 20px;
                        font-size: 14px;
                      `}
                    >
                      <span>Active columns:</span>
                      <span
                        css={`
                          margin-left: 5px;
                        `}
                      >
                        {nonIgnoredColumnsCount}
                      </span>
                    </span>
                  ),
                ].filter((v1) => v1 != null);

                return (
                  <div css={``}>
                    {showExtraInputsTop && !showWizardStreaming && (
                      <div
                        css={`
                          position: absolute;
                          top: ${0}px;
                          left: 10px;
                          height: ${extraHH - 10}px;
                          right: 10px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        `}
                      >
                        {!isStreamingConfigEmpty && (
                          <span
                            css={`
                              display: inline-flex;
                              align-items: center;
                              justify-content: center;
                            `}
                          >
                            <div
                              css={`
                                font-family: Roboto;
                                font-size: 12px;
                                font-weight: bold;
                                color: #d1e4f5;
                                text-transform: uppercase;
                                margin-left: 20px;
                              `}
                            >
                              Event Timestamp:
                              <HelpIcon id={'fg_set_eventtimestamp'} style={{ marginLeft: '4px' }} />
                            </div>
                            <span
                              css={`
                                margin-left: 5px;
                                margin-right: 15px;
                              `}
                            >
                              {eventTimestampSel ?? '-'}
                            </span>

                            <div
                              css={`
                                font-family: Roboto;
                                font-size: 12px;
                                font-weight: bold;
                                color: #d1e4f5;
                                text-transform: uppercase;
                                margin-left: 20px;
                              `}
                            >
                              Primary Key:
                              <HelpIcon id={'fg_set_recordid'} style={{ marginLeft: '4px' }} />
                            </div>
                            <span
                              css={`
                                margin-left: 5px;
                                margin-right: 15px;
                              `}
                            >
                              {recordIdSel ?? '-'}
                            </span>

                            <div
                              css={`
                                font-family: Roboto;
                                font-size: 12px;
                                font-weight: bold;
                                color: #d1e4f5;
                                text-transform: uppercase;
                                margin-left: 20px;
                              `}
                            >
                              Lookup Keys:
                              <HelpIcon id={'fg_set_lookupkeys'} style={{ marginLeft: '4px' }} />
                            </div>
                            <span
                              css={`
                                margin-left: 5px;
                                margin-right: 15px;
                              `}
                            >
                              {Utils.isNullOrEmpty(lookupKeysSel) ? '-' : lookupKeysSel}
                            </span>
                          </span>
                        )}

                        {
                          <Button type={'primary'} onClick={onClickConfigStreaming}>
                            {isStreamingConfigEmpty ? 'Alert: ' : 'Re-'}Configure {!isStreaming ? 'Settings' : 'Streaming'} and Deployment Settings{isStreamingConfigEmpty ? ' (Required)' : ''}
                          </Button>
                        }
                      </div>
                    )}
                    {showExtraInputsTop && showWizardStreaming && (
                      <div
                        css={`
                          position: absolute;
                          top: ${0}px;
                          left: 10px;
                          height: ${extraHH - 10}px;
                          right: 10px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          flex-direction: column;
                        `}
                      >
                        <div
                          css={`
                            display: flex;
                            margin: 18px 0;
                            color: white;
                            margin-top: 170px;
                          `}
                        >
                          <span>
                            <HelpBox name={'streaming'} beforeText={' configuring the streaming feature group'} linkTo={'/help/useCases/DATA_INGESTION_STREAMING'} />
                          </span>
                        </div>
                        <div
                          css={`
                            margin-top: 10px;
                            padding: 20px;
                            border-radius: 3px;
                          `}
                          className={sd.grayPanel}
                        >
                          <div
                            css={`
                              margin-top: 30px;
                              line-height: 1;
                              font-size: 14px;
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              flex-wrap: nowrap;
                            `}
                          >
                            {
                              <div
                                css={`
                                  font-family: Roboto;
                                  font-size: 12px;
                                  font-weight: bold;
                                  color: #d1e4f5;
                                  text-transform: uppercase;
                                  margin-left: 20px;
                                `}
                              >
                                Event Timestamp:
                                <HelpIcon id={'fg_set_eventtimestamp'} style={{ marginLeft: '4px' }} />
                              </div>
                            }
                            {
                              <div
                                css={`
                                  margin-left: 5px;
                                  padding-bottom: 2px;
                                  width: 200px;
                                `}
                              >
                                <Input value={eventTimestampSel} onChange={onChangeExtraEventTimestamp} />
                              </div>
                            }
                          </div>
                          <div
                            css={`
                              line-height: 1.2;
                              font-size: 14px;
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              flex-wrap: nowrap;
                            `}
                          >
                            <Radio.Group value={radioSel} onChange={onChangeRadioSel}>
                              <div
                                css={`
                                  margin-top: 30px;
                                `}
                              >
                                {/*// @ts-ignore*/}
                                <Radio value={true}></Radio>
                                <div
                                  css={`
                                    font-size: 16px;
                                    display: inline-flex;
                                    white-space: nowrap;
                                    align-items: center;
                                    color: white;
                                  `}
                                >
                                  <div
                                    css={`
                                      width: 120px;
                                      font-family: Roboto;
                                      font-size: 12px;
                                      font-weight: bold;
                                      color: #d1e4f5;
                                      text-transform: uppercase;
                                    `}
                                  >
                                    Primary Key:
                                    <HelpIcon id={'fg_set_recordid'} style={{ marginLeft: '4px' }} />
                                  </div>
                                  <div
                                    css={`
                                      width: 200px;
                                      margin-left: 5px;
                                      padding-bottom: 2px;
                                    `}
                                  >
                                    <Input value={recordIdSel} onChange={onChangeExtraRecordId} />
                                  </div>
                                </div>
                              </div>

                              <div
                                css={`
                                  margin-top: 10px;
                                `}
                              >
                                {/*// @ts-ignore*/}
                                <Radio value={false} css={``}></Radio>
                                <div
                                  css={`
                                    font-size: 16px;
                                    display: inline-flex;
                                    white-space: nowrap;
                                    align-items: center;
                                    color: white;
                                  `}
                                >
                                  <div
                                    css={`
                                      width: 120px;
                                      font-family: Roboto;
                                      font-size: 12px;
                                      font-weight: bold;
                                      color: #d1e4f5;
                                      text-transform: uppercase;
                                    `}
                                  >
                                    Lookup Keys:
                                    <HelpIcon id={'fg_set_lookupkeys'} style={{ marginLeft: '4px' }} />
                                  </div>
                                  <div
                                    css={`
                                      width: ${500}px;
                                      margin-left: 5px;
                                      padding-bottom: 2px;
                                    `}
                                  >
                                    <Input value={lookupKeysSel} onChange={onChangeExtraLookupKeys} />
                                    <div
                                      css={`
                                        font-size: 12px;
                                        opacity: 0.8;
                                        margin-left: 3px;
                                      `}
                                    >
                                      Separate by comma
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Radio.Group>
                          </div>
                          <div
                            css={`
                              text-align: center;
                              margin-top: 50px;
                            `}
                          >
                            <Button type={'primary'} onClick={onClickStreamingSet}>
                              {isStreaming ? 'Set and Continue' : 'Set'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!showWizard && !showWizardStreaming && (
                      <div
                        css={`
                          position: absolute;
                          top: ${extraHH}px;
                          left: 10px;
                          height: ${filterHH - 10}px;
                          right: 10px;
                          display: flex;
                          align-items: center;
                        `}
                      >
                        {nestedData != null && (
                          <span
                            css={`
                              margin-right: 20px;
                              font-size: 18px;
                              display: flex;
                              align-items: center;
                              height: ${filterHH - 10}px;
                            `}
                          >
                            <span
                              css={`
                                white-space: nowrap;
                              `}
                            >
                              <TooltipExt title={'Go Back'}>
                                <span
                                  css={`
                                    margin-right: 8px;
                                    cursor: pointer;
                                    opacity: 0.7;
                                  `}
                                  onClick={onClickBackNested}
                                >
                                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowAltSquareLeft').faArrowAltSquareLeft} transform={{ size: 15, x: 0, y: 0 }} />
                                </span>
                                <span
                                  css={`
                                    white-space: nowrap;
                                    margin-right: 5px;
                                    cursor: pointer;
                                  `}
                                  onClick={onClickBackNested}
                                >
                                  Nested:
                                </span>
                              </TooltipExt>
                            </span>
                            <span>
                              <b>{nestedData?.name}</b>
                            </span>
                          </span>
                        )}
                        {pitGroupData != null && (
                          <span
                            css={`
                              margin-right: 20px;
                              font-size: 18px;
                              display: flex;
                              align-items: center;
                              height: ${filterHH - 10}px;
                            `}
                          >
                            <span
                              css={`
                                white-space: nowrap;
                              `}
                            >
                              <TooltipExt title={'Go Back'}>
                                <span
                                  css={`
                                    margin-right: 8px;
                                    cursor: pointer;
                                    opacity: 0.7;
                                  `}
                                  onClick={onClickBackNested}
                                >
                                  <FontAwesomeIcon className={sd.linkBlue} icon={require('@fortawesome/pro-regular-svg-icons/faArrowAltSquareLeft').faArrowAltSquareLeft} transform={{ size: 15, x: 0, y: 0 }} />
                                </span>
                                <span
                                  css={`
                                    white-space: nowrap;
                                    margin-right: 5px;
                                    cursor: pointer;
                                  `}
                                  className={sd.linkBlue}
                                  onClick={onClickBackNested}
                                >
                                  {featuresOne?.tableName ?? ''} Features&nbsp;
                                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowRight').faArrowRight} transform={{ size: 12, x: 0, y: 0 }} />
                                </span>
                                <span
                                  css={`
                                    white-space: nowrap;
                                    margin-right: 5px;
                                    cursor: pointer;
                                  `}
                                  onClick={onClickBackNested}
                                >
                                  PIT Group:
                                </span>
                              </TooltipExt>
                            </span>
                            <span>
                              <b>{pitGroupData?.name}</b>
                            </span>
                          </span>
                        )}

                        {pitGroupData == null && filterListElem}

                        <span
                          css={`
                            flex: 1;
                          `}
                        ></span>

                        {nestedData != null && (
                          <span
                            css={`
                              margin-left: 20px;
                            `}
                          >
                            <Link to={['/' + PartsLink.features_add_nested + '/' + (projectId ?? '-') + '/' + featureGroupId, 'isEditName=' + encodeURIComponent(nestedData?.name ?? '')]}>
                              <Button type={'primary'}>Edit</Button>
                            </Link>
                          </span>
                        )}
                        {pitGroupData != null && (
                          <span
                            css={`
                              margin-left: 20px;
                            `}
                          >
                            <Link to={['/' + PartsLink.features_add_point_in_time_group + '/' + (projectId ?? '-') + '/' + featureGroupId, 'isEditName=' + encodeURIComponent(pitGroupData?.name ?? '')]}>
                              <Button type={'primary'}>Edit Group</Button>
                            </Link>
                          </span>
                        )}
                      </div>
                    )}

                    {errMsg != null && !showExtraInputsTop && (
                      <div
                        css={`
                          background: rgba(0, 0, 0, 0.8);
                          border-radius: 4px;
                          padding: 7px 16px;
                          position: absolute;
                          top: ${extraHH + filterHH}px;
                          left: 10px;
                          height: ${errHH - 10}px;
                          right: 10px;
                          display: flex;
                          align-items: center;
                        `}
                      >
                        {errMsg}
                      </div>
                    )}

                    {pitGroupData != null && (
                      <div css={`position: absolute; top ${filterHH + extraHH + errHH}px; height: ${pitGroupDataHH}px; left: 0; right: 0;`}>
                        <FeaturesOneAddTimeTravelGroup isEditName={pitGroup} isInlineReadOnly asText />

                        <div
                          css={`
                            position: absolute;
                            left: 10px;
                            right: 10px;
                            top: 100%;
                            margin-top: -42px;
                            display: flex;
                            align-items: center;
                          `}
                        >
                          {pitGroupData == null && filterListElem}
                          {pitGroupData == null && (
                            <span
                              css={`
                                flex: 1;
                              `}
                            ></span>
                          )}
                          <Provider store={Utils.globalStore()}>
                            <FeaturesOneAddTimeTravelGroupFeature buttonProps={{ children: 'Add Features', type: 'primary', ghost: false }} />
                          </Provider>
                        </div>
                      </div>
                    )}

                    {!showWizardStreaming && (
                      <div css={`position: absolute; top ${filterHH + extraHH + errHH + pitGroupDataHH}px; bottom: 0; left: 0; right: 0;`}>
                        {/* eslint-disable-next-line */}
                        {showWizard && (
                          <>
                            <FeaturesOneWizard />
                          </>
                        )}
                        {!showWizard && !showWizardStreaming && (
                          <DndProvider backend={HTML5Backend}>
                            <TableExt
                              disableSort={true}
                              virtualFlexShrink={0}
                              isVirtual
                              height={height - filterHH - extraHH - errHH - pitGroupDataHH}
                              showEmptyIcon={true}
                              dataSource={dataListFiltered}
                              columns={columns}
                              calcKey={(r1) => r1.name}
                              calcLink={calcLink}
                              onClickCell={onClickRow}
                            />
                          </DndProvider>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            </AutoSizer>
          )}
        </div>
        <PITLineageDiagram selectedPITgroup={selectedPITGroupName} onClose={() => setPITGroupName('')} pitData={selectedPITGroupData?.[0]} />
      </RefreshAndProgress>
    </div>
  );
});

export default FeaturesOne;
