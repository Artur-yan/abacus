import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import * as Immutable from 'immutable';
import $ from 'jquery';
import * as _ from 'lodash';
import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import styled, { css } from 'styled-components';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcDatasetById, calcDataset_datasetType, DatasetLifecycle, DatasetLifecycleDesc, default as datasets, default as datasetsReq } from '../../stores/reducers/datasets';
import defDatasets, {
  calcFileDataUseByDatasetIdProjectId,
  calcFileSchemaByDatasetId,
  calcFileSchemaByDatasetVersion,
  calcReqFeaturesByUseCase,
  calcReqFeaturesByUseCaseError,
  calcReqFeaturesByUseCaseFindDatasetType,
} from '../../stores/reducers/defDatasets';
import { calcModelListByProjectId, ModelLifecycle } from '../../stores/reducers/models';
import projectDatasetsReq, { calcDatasetForProjectId } from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import DashboardStepRect from '../DashboardStepRect/DashboardStepRect';
import DateOld from '../DateOld/DateOld';
import HelpBox from '../HelpBox/HelpBox';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const { confirm } = Modal;

const s = require('./DatasetSchema.module.css');
const sd = require('../antdUseDark.module.css');

export const DragFieldTarget = 'drag_field_target';
export const dataWizardStateSavedLocally = 'pred_wizard_saved_state';

enum WizardSteps {
  Target,
  Information,
}

interface IDatasetSchemaProps {
  datasets?: any;
  models?: any;
  projectDatasets?: any;
  projects?: any;
  paramsProp?: any;
  defDatasets?: any;
  useCases?: any;
  authUser?: any;
  isWizard?: boolean;
  isFilters?: boolean;
}

interface IDatasetSchemaState {
  dataList?: any[];
  columnHints?: any;
  isRefreshing?: boolean;
  columnFilterText?: string;
  columnFilterOnlyNonIgnored?: boolean;
  listShownAtLeastOnce?: boolean;
  listShownAtLeastOnceFordatasetType?: string;
  validationHH?: any;
  modelVersion?: any;
  readOnly?: boolean;

  confirmedMapping?: string[];
  wizardSelectedOption?: any;
  wizardSelectedOptionColFound?: any;

  wizardStepActual?: WizardSteps;
  wizardState?: any;
  editorColumnName?: string;
  editorColumnNameBefore?: string;
  editorValue?: string;
  editorIsEdit?: boolean;
  filters?: { name?; join?; isInclude?; content?; error? }[];

  isRefreshingEditorFilter?: boolean;
  isRefreshingEditorCustom?: boolean;
  editIsInclude?: any;
  isValidatingSql?: boolean;
}

const PredBoxName = styled.div`
  font-family: Matter;
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  color: #6d8293;
`;
const PredBoxValue = styled.div`
  font-family: Matter;
  font-size: 16px;
  line-height: 22px;
  color: #ffffff;
  margin-bottom: 8px;
`;

class DatasetSchema extends React.PureComponent<IDatasetSchemaProps, IDatasetSchemaState> {
  private usedSchemaForDatasetId: any;
  private usedSchemaForDatasetVersion: any;
  private reqFieldsList: any[];
  private usedSchemaForInvalidColumns: any;
  private actualColNameWizard: any;
  private memNewOneUsed: boolean;
  private isM: boolean;
  private refTopMsg;
  private usedModelVersionFistTime: any;
  notWizardGo: boolean;
  datasetOneFGid: any;

  constructor(props) {
    super(props);

    let lastSavedState = Utils.dataNum(dataWizardStateSavedLocally);
    if (lastSavedState == null || _.isEmpty(lastSavedState)) {
      lastSavedState = null;
    }

    this.state = {
      isRefreshing: false,
      wizardStepActual: lastSavedState == null ? WizardSteps.Target : lastSavedState.wizardStepActual,
      wizardState:
        lastSavedState == null
          ? {
              step2count: 2,
            }
          : lastSavedState.wizardState,
    };

    this.memNewOneUsed = false;
  }

  isFeatureGroupSchema = () => {
    return true;
  };

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;
  }

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      projectId = null;
    }
    return projectId;
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let { isWizard, datasets } = this.props;

    const isFeatureGroupSchema = this.isFeatureGroupSchema();

    let projectId = this.calcProjectId();
    let datasetId = this.props.paramsProp?.get('datasetId');
    let batchPredId = this.props.paramsProp?.get('batchPredId');
    let datasetVersion = this.props.paramsProp?.get('datasetVersion');

    let datasetOne = this.memDatasetOne(true)(datasets, datasetId);
    this.datasetOneFGid = datasetOne?.get('featureGroupId');

    let fgVersionsList = this.memDatasetVersionsDataset(true)(this.props.datasets, datasetId);

    if (!isWizard) {
      if (!datasetId) {
        return;
      }

      let datasetLifecycle;
      if (Utils.isNullOrEmpty(datasetVersion)) {
        datasetLifecycle = datasetOne?.get('status');
      } else {
        let dsVersionOne = fgVersionsList?.find((d1) => d1.datasetVersion === datasetVersion);
        datasetLifecycle = dsVersionOne?.status;
      }

      if (datasetLifecycle == null) {
        return;
      }

      if ([DatasetLifecycle.COMPLETE].includes(datasetLifecycle)) {
        //
      } else if ([DatasetLifecycle.CANCELLED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED, DatasetLifecycle.FAILED].includes(datasetLifecycle)) {
        return;
      } else {
        return;
      }
    }

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let reqFieldsRes = this.memRequFeatures(true)(this.props.defDatasets, this.props.datasets, datasetId, this.props.projects, projectId, foundProject1, datasetOne);
    let reqFields = reqFieldsRes?.reqFields;
    let reqDatasetType = reqFields?.datasetType;

    let invalidColumns = this.props.paramsProp && this.memValidation(true)(this.props.defDatasets, projectId, isFeatureGroupSchema);
    let fileSchema =
      this.props.paramsProp && this.memDatasetIdProjectId(true)(reqDatasetType, invalidColumns, this.props.defDatasets, datasetId, projectId, datasetOne, this.state.modelVersion, batchPredId, isFeatureGroupSchema, datasetVersion);

    let useCase1 = this.memProjectUseCase(foundProject1);
    let schemaInfo = this.memUseCaseSchemas(true)(this.props.useCases, useCase1);

    let infoAll = this.memUseCaseSchemasAll(true)(this.props.useCases, 'predicting');

    this.memSetWizard(this.props.paramsProp?.get('stepByStep'));

    let listDatasetsProj = this.memProjectDatasets(true)(this.props.projectDatasets, projectId);
    let listDatasets = this.memDatasetsList(true)(this.props.datasets, listDatasetsProj);
    this.memFiltersDatasets(true)(this.props.projectDatasets, projectId, datasetId, this.state.filters == null);

    let modelList = this.memModelList(true)(this.props.models, projectId);

    let listDatasetVersions = this.memDatasetVersions(true)(this.props.datasets, projectId, datasetId);

    if (this.refTopMsg && !this.props.isWizard) {
      let hhTop = 0;
      if (this.state.readOnly) {
        hhTop = 0;
      } else {
        hhTop = $(this.refTopMsg).height();
      }
      if (hhTop != null && hhTop > 0) {
        hhTop += 10;
      }
      if (hhTop != null && this.state.validationHH !== hhTop) {
        this.setState({
          validationHH: hhTop,
        });
      }
    } else if (this.state.readOnly) {
      let hhTop = 60;
      if (hhTop != null && this.state.validationHH !== hhTop) {
        this.setState({
          validationHH: hhTop,
        });
      }
    }
  };

  memSetWizard = memoizeOne((stepByStep) => {
    if (stepByStep) {
      let wizardState = this.calcWizardStateForStepByStep();
      this.setState({
        wizardState,
      });
    }
  });

  componentDidUpdate(prevProps: Readonly<IDatasetSchemaProps>, prevState: Readonly<IDatasetSchemaState>, snapshot?: any): void {
    this.doMem();
  }

  onRefreshingChangeFilter = (isR) => {
    this.setState({
      isRefreshingEditorFilter: isR,
    });
  };

  onRefreshingChangeCustom = (isR) => {
    this.setState({
      isRefreshingEditorCustom: isR,
    });
  };

  memRequFeatures = memoizeOneCurry((doCall, defDatasets, datasets, datasetId, projects, projectId, projectFound1, datasetOne) => {
    if (projects && projectId && defDatasets && datasets && datasetId && datasetOne) {
      if (projectFound1) {
        let foundDataset1 = datasetOne;
        if (foundDataset1) {
          let useCase = projectFound1.useCase;
          if (!Utils.isNullOrEmpty(useCase)) {
            let reqFields = calcReqFeaturesByUseCase(undefined, useCase);
            let reqError = calcReqFeaturesByUseCaseError(undefined, useCase);
            if (reqFields) {
              let datasetType = calcDataset_datasetType(foundDataset1, projectId);
              if (datasetType && reqFields) {
                let rr = calcReqFeaturesByUseCaseFindDatasetType(reqFields, datasetType);
                if (rr) {
                  rr = rr.toJS();
                }
                reqFields = rr || [];
              } else {
                reqFields = [];
              }

              return { reqFields, reqError };
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
    }
  });

  memValidation = memoizeOneCurry((doCall, defDatasetsParam, projectId, isFeatureGroupSchema) => {
    if (isFeatureGroupSchema) {
      return null;
    }
    return defDatasets.memValidationForProjectId(doCall, projectId);
  });

  memDatasetIdProjectId = memoizeOneCurry((doCall, datasetType, validationData, defDatasets, datasetId, projectId, datasetOne, modelVersion, batchPredId, isFeatureGroupSchema, datasetVersion) => {
    if (datasetId || (datasetVersion && isFeatureGroupSchema)) {
      let dsSchema1 = null;
      if (!isFeatureGroupSchema) {
        dsSchema1 = projectId == null ? calcFileSchemaByDatasetId(undefined, datasetId) : calcFileDataUseByDatasetIdProjectId(undefined, datasetId, projectId, batchPredId, modelVersion);
        if (dsSchema1 == null) {
          if (defDatasets) {
            if (defDatasets.get('isRefreshing') === 0) {
              if (doCall) {
                if (projectId == null) {
                  StoreActions.schemaGetFileSchema_(datasetId);
                } else {
                  StoreActions.schemaGetFileDataUse_(projectId, datasetId, batchPredId, modelVersion);
                }
              }
            }
          }
        }
      } else if (datasetVersion && isFeatureGroupSchema) {
        dsSchema1 = calcFileSchemaByDatasetVersion(undefined, datasetVersion);
        if (dsSchema1 == null) {
          if (defDatasets) {
            if (defDatasets.get('isRefreshing') === 0) {
              if (doCall) {
                StoreActions.schemaGetFileSchemaVersion_(datasetVersion);
              }
            }
          }
        }
      }

      let invalidColumns = null;
      let columnHints = {};
      if (validationData && datasetType) {
        let list = (validationData?.requiredDatasets || []).concat(validationData?.optionalDatasets || []);
        if (list && list.length > 0) {
          let datasetInvalid = list.find((p1) => p1.datasetType?.toLowerCase() === datasetType?.toLowerCase());
          if (datasetInvalid) {
            invalidColumns = datasetInvalid.invalidColumns;
          }
          list.forEach((e) => {
            Object.assign(columnHints, e.columnHints ?? {});
          });
        }
      }

      if (dsSchema1?.get('schemaValidation')) {
        let list = (validationData?.requiredDatasets || []).concat(validationData?.optionalDatasets || []);
        if (list && list.length > 0) {
          let datasetInvalid = list.find((p1) => p1.datasetType?.toLowerCase() === datasetType?.toLowerCase());
          if (datasetInvalid) {
            invalidColumns = datasetInvalid.invalidColumns;
          }
        }
      }
      let doRefresh = (this.state.dataList || []).length === 0;
      if (this.usedSchemaForDatasetId !== datasetId) {
        doRefresh = true;
      }
      if (this.usedSchemaForDatasetVersion !== datasetVersion) {
        doRefresh = true;
      }
      if (invalidColumns && this.usedSchemaForInvalidColumns !== invalidColumns) {
        doRefresh = true;
      }

      let invalidColumnsOri = invalidColumns;
      if (invalidColumns == null) {
        invalidColumns = [];
      }

      //
      let dataList = [];
      let doSet = false;

      if (isFeatureGroupSchema && doRefresh && !datasetVersion) {
        if (datasetOne?.get('schema')) {
          datasetOne?.toJS()?.schema?.some((f1) => {
            dataList.push({
              columnName: f1.name,
              featureType: f1.featureType,
              dataType: f1.dataType,
              detectedDataType: f1.detectedDataType,
              detectedFeatureType: f1.detectedFeatureType,

              validDataTypes: f1.validDataTypes,
              timeFormat: f1.timeFormat,
              timestampFrequency: f1.timestampFrequency,
            });
          });

          doSet = true;
        }
      }

      if (dsSchema1 && doRefresh && ((!isFeatureGroupSchema && !datasetVersion) || (isFeatureGroupSchema && datasetVersion))) {
        if (dsSchema1.get('schema')) {
          dsSchema1.get('schema').some((f1) => {
            let errorMsg = invalidColumns
              .filter((err) => f1.get('name') in err)
              .map((err) => err[f1.get('name')])
              .join('\n');
            dataList.push({
              columnName: f1.get('name'),
              error: errorMsg,
              featureMapping: f1.get('featureMapping'),
              featureType: f1.get('featureType'),
              dataType: f1.get('dataType'),
              detectedDataType: f1.get('detectedDataType'),
              detectedFeatureType: f1.get('detectedFeatureType'),
              isCustom: f1.get('custom') === true,
              sql: f1.get('selectExpression'),

              validDataTypes: f1.get('validDataTypes')?.toJS(),
              timeFormat: f1.get('timeFormat'),
              timestampFrequency: f1.get('timestampFrequency'),
            });
          });

          doSet = true;
        }
      }

      if (doSet) {
        this.usedSchemaForDatasetId = datasetId;
        this.usedSchemaForDatasetVersion = datasetVersion;
        this.usedSchemaForInvalidColumns = invalidColumnsOri;
        setTimeout(() => {
          this.setState({
            dataList,
            columnHints,
          });
        });
      }

      return dsSchema1;
    }
  });

  memFeatureTypes = memoizeOne((projectId, fileSchema, datasetOne, isFeatureGroupSchema) => {
    if (isFeatureGroupSchema || projectId == null) {
      let res = [];
      datasetOne?.toJS()?.validDataTypes?.some((s1) => {
        let obj1 = {
          label: Utils.upperFirst(s1, true),
          value: s1,
        };

        res.push(obj1);
      });
      return res;
    }

    if (fileSchema) {
      const typeList = fileSchema.get('validFeatureTypes')?.toJS();
      let res = [],
        already = {};
      typeList &&
        typeList.some((k1) => {
          let v1 = k1;
          if (v1 && !already[v1]) {
            already[v1] = true;

            res.push({
              label: Utils.upperFirst(v1, true),
              value: v1,
            });
          }
        });
      return res;
    }
  });

  onCloseMenu = () => {
    this.setState((lastState) => {
      let dataList = lastState.dataList ? [...lastState.dataList] : [];
      dataList = dataList?.map((d1) => {
        d1.open = false;
        return d1;
      });

      return {
        dataList,
      };
    });
  };

  onChangeSelectOptionTarget = (row, index, newValue, e) => {
    this.notWizardGo = true;

    //
    let dataListFiltered = this.memFilterColumns(this.state.dataList, this.state.columnFilterText, this.state.columnFilterOnlyNonIgnored);
    let dF = dataListFiltered?.[index];
    index = this.state.dataList?.indexOf(dF);
    if (index === -1 || this.state.dataList == null || index == null) {
      return;
    }

    //
    if (newValue == null) {
      newValue = '';
    } else {
      newValue = newValue.value;
    }

    let doStateWork = (setFeatureType = null) => {
      this.setState((lastState) => {
        let dataList = lastState.dataList ? [...lastState.dataList] : [];
        let columnHints = lastState.columnHints ? { ...lastState.columnHints } : {};
        let data1 = dataList[index];
        if (data1) {
          data1 = { ...data1 };
          data1.featureMapping = newValue;
          if (setFeatureType != null) {
            data1.featureType = setFeatureType;
          }
          data1.open = false;
          dataList[index] = data1;

          let foundAllowMultiple = this.reqFieldsList && this.reqFieldsList.find((r1) => r1.value === newValue);
          let allowMultiple = false;
          if (foundAllowMultiple) {
            allowMultiple = foundAllowMultiple.allowMultiple;
          }

          if (!allowMultiple) {
            for (let i = 0; i < dataList.length; i++) {
              if (i != index) {
                data1 = dataList[i];
                if (data1.featureMapping === newValue) {
                  data1 = { ...data1 };
                  data1.featureMapping = '';
                  data1.open = false;
                  dataList[i] = data1;
                }
              }
            }
          }

          return {
            dataList,
            columnHints,
          };
        }
      });
    };

    let dataList = this.state.dataList ?? [];
    let columnHints = this.state.columnHints ?? {};
    let data1 = dataList[index];

    let { paramsProp } = this.props;
    let projectId = this.calcProjectId();
    let datasetId = paramsProp && paramsProp.get('datasetId');
    REClient_.client_().setProjectDatasetColumnMapping(true, projectId, datasetId, data1?.columnName, newValue, (err, res) => {
      if (err || !res || !res.result) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let columnFromRes = res?.result?.schema?.find((s1) => s1.name === data1?.columnName);
        if (columnFromRes) {
          if (REClient_.client_().calcSetProjectDatasetColumnMappingIsInTransaction() === 0) {
            setTimeout(() => {
              StoreActions.resetSchemaChanged_();
              StoreActions.listDatasets_([datasetId]);
            }, 0);
          }

          let setFeatureType = columnFromRes.featureType;
          doStateWork(setFeatureType);
        }
      }
    });
  };

  onChangeSelectOptionFeatureType = (row, index, option1, e) => {
    this.notWizardGo = true;

    if (!option1) {
      return;
    }

    let projectId = this.calcProjectId();

    let dataList = this.state.dataList ? [...this.state.dataList] : [];

    //
    let dataListFiltered = this.memFilterColumns(dataList, this.state.columnFilterText, this.state.columnFilterOnlyNonIgnored);
    let dF = dataListFiltered?.[index];
    index = dataList?.indexOf(dF);
    if (index === -1 || index == null) {
      return;
    }

    //
    let columnHints = this.state.columnHints ? { ...this.state.columnHints } : {};
    let data1 = dataList[index];
    if (data1) {
      data1 = { ...data1 };
      data1.dataType = option1.value;
      dataList[index] = data1;

      let { paramsProp } = this.props;
      let datasetId = paramsProp && paramsProp.get('datasetId');

      if (this.isFeatureGroupSchema() || projectId == null) {
        REClient_.client_().setDatasetColumnDataType(datasetId, data1.columnName, data1.dataType, (err, res) => {
          if (err || !res) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.listDatasets_([datasetId]);
            StoreActions.resetSchemaChanged_();
            if (this.datasetOneFGid) {
              if (projectId) {
                StoreActions.featureGroupsDescribe_(projectId, this.datasetOneFGid);
              }
              StoreActions.featureGroupsDescribe_(null, this.datasetOneFGid);
            }

            this.setState({
              dataList,
            });
          }
        });
      } else {
        REClient_.client_().setProjectDatasetColumnDataType(projectId, datasetId, data1.columnName, data1.dataType, (err, res) => {
          if (err || !res) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.resetSchemaChanged_();
            StoreActions.listDatasets_([datasetId]);
            if (this.datasetOneFGid) {
              StoreActions.featureGroupsDescribe_(projectId, this.datasetOneFGid);
              StoreActions.featureGroupsDescribe_(null, this.datasetOneFGid);
            }

            this.setState({
              dataList,
            });
          }
        });
      }
    }
  };

  memColumnTarget = memoizeOne((reqFields) => {
    if (reqFields) {
      let res: any[] = [
        {
          value: '',
          label: '(None)',
        },
      ];
      const procOptions = (list, isRequired) => {
        list &&
          list.some((v1) => {
            let find1 = res.find((r1) => r1.value === v1.value);
            if (find1) {
              if (isRequired) {
                find1.isRequired = isRequired;
              }
              return false;
            }

            res.push({
              value: v1.value,
              label: v1.name,
              isRequired,
            });
          });
      };
      procOptions(reqFields.possibleFeatureTypes, false);
      procOptions(reqFields.requiredFeatureTypes, true);
      return res;
    }
  });

  onClickResetToDetected = (e) => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    if (!datasetId) {
      return;
    }

    let projectId = this.calcProjectId();
    if (!projectId) {
      return;
    }

    REClient_.client_()._resetProjectDatasetDetectedSchema(projectId, datasetId, (err, res) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.schemaGetFileDataUse_(projectId, datasetId);
        StoreActions.validateProjectDatasets_(projectId);
      }
    });
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onClickSaveChanges = (doRemoveListShown, e) => {
    if (this.state.isRefreshing) {
      return;
    }

    const isFeatureGroupSchema = this.isFeatureGroupSchema();

    let { datasets, paramsProp, defDatasets, projects } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    if (!datasetId) {
      return;
    }

    let projectId = this.calcProjectId();
    if (!projectId) {
      return;
    }

    let batchPredId = paramsProp?.get('batchPredId');
    let datasetVersion = paramsProp?.get('datasetVersion');

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let datasetOne = this.memDatasetOne(false)(datasets, datasetId);

    let reqFieldsRes = this.memRequFeatures(false)(defDatasets, datasets, datasetId, projects, projectId, foundProject1, datasetOne);
    let reqFields = reqFieldsRes?.reqFields;
    let reqDatasetType = reqFields?.datasetType;

    let invalidColumns = paramsProp && this.memValidation(false)(defDatasets, paramsProp.get('projectId'), isFeatureGroupSchema);
    let fileSchema =
      paramsProp &&
      this.memDatasetIdProjectId(false)(reqDatasetType, invalidColumns, defDatasets, paramsProp.get('datasetId'), paramsProp.get('projectId'), datasetOne, this.state.modelVersion, batchPredId, isFeatureGroupSchema, datasetVersion);
    if (!fileSchema) {
      return;
    }

    let saveIsDisabled = this.memSaveDisabled(false, defDatasets, paramsProp && paramsProp.get('datasetId'), projectId, this.state.dataList, reqFields, datasets, projects, foundProject1, isFeatureGroupSchema);

    let doWorkAfter = () => {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_()._setUIWizardState(projectId, datasetId, 'confirm', false, (errC, resC) => {
        this.setState({
          isRefreshing: false,
        });
        // REActions.addNotification('Saved!');

        StoreActions.resetSchemaChanged_();

        StoreActions.schemaGetFileDataUse_(projectId, datasetId);
        StoreActions.validateProjectDatasets_(projectId);
        StoreActions.getProjectDatasets_(projectId);
        StoreActions.listModels_(projectId);
      });
    };

    // if(saveIsDisabled) {
    doWorkAfter();

    // } else {
    //   setTimeout(() => {
    //     StoreActions.resetSchemaChanged_();
    //   }, 0);
    // }
  };

  memDatasetsOptions = memoizeOne((listDatasets, projectId, hideStreaming) => {
    let optionsDatasets = [];
    if (listDatasets) {
      let streamingTypes = [];

      let list = listDatasets;
      Object.values(list).some((p1: Immutable.Map<string, any>) => {
        let datasetType = null;
        (p1.get('allProjectDatasets') || []).some((p1) => {
          if (p1.getIn(['project', 'projectId']) === projectId) {
            datasetType = p1.get('datasetType');
            return true;
          }
        });

        let isStreaming = (p1.getIn(['dataset', 'sourceType']) as any)?.toLowerCase() === 'streaming';
        if (isStreaming) {
          if (hideStreaming) {
            return;
          }
          streamingTypes.push(datasetType);
        }

        let obj1 = {
          datasetId: p1.getIn(['dataset', 'datasetId']),
          value: p1.getIn(['dataset', 'datasetId']),
          label: <span style={{ fontWeight: 600 }}>{p1.getIn(['dataset', 'name']) as any}</span>,
          name: p1.getIn(['dataset', 'name']),
          datasetType: datasetType,
          isStreaming,
        };
        optionsDatasets.push(obj1);
      });

      streamingTypes.some((sc1) => {
        let op1 = optionsDatasets.find((v1) => !v1.isStreaming && v1.datasetType === sc1);
        if (op1 != null) {
          op1.label = (
            <span>
              {op1.label}
              <span style={{ marginLeft: '5px' }}>(Batch)</span>
            </span>
          );
        }
        op1 = optionsDatasets.find((v1) => v1.isStreaming && v1.datasetType === sc1);
        if (op1 != null) {
          op1.label = (
            <span>
              {op1.label}
              <span style={{ marginLeft: '5px' }}>(Streaming)</span>
            </span>
          );
        }
      });
    }

    optionsDatasets &&
      optionsDatasets.sort((a, b) => {
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      });

    return optionsDatasets;
  });

  onChangeSelectURLDirectFromValueVersion = (option1) => {
    this.usedSchemaForDatasetId = null;
    this.usedSchemaForDatasetVersion = null;

    let v1 = option1?.value;
    this.setState({
      readOnly: option1?.isLast !== true,
    });

    let search1 = Utils.processParamsAsQuery({ datasetVersion: v1 }, window.location.search);
    let projectId = this.calcProjectId();
    Location.replace('/' + this.props.paramsProp?.get('mode') + '/' + this.props.paramsProp?.get('datasetId') + (projectId == null ? '' : '/' + projectId), undefined, search1);
  };

  onChangeSelectURLDirectFromValueFGVersion = (option1) => {
    this.usedSchemaForDatasetId = null;
    this.usedSchemaForDatasetVersion = null;
    this.setState({
      readOnly: option1?.isLast !== true,
    });

    let search1 = Utils.processParamsAsQuery({ datasetVersion: option1?.isLast ? null : option1?.value }, window.location.search);
    let projectId = this.calcProjectId();
    Location.replace('/' + this.props.paramsProp?.get('mode') + '/' + this.props.paramsProp?.get('datasetId') + (projectId == null ? '' : '/' + projectId), undefined, search1);
  };

  onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let { paramsProp } = this.props;

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let useFeatureGroupId = paramsProp && paramsProp.get('useFeatureGroupId');
      if (useFeatureGroupId) {
        useFeatureGroupId = 'useFeatureGroupId=' + useFeatureGroupId;
      } else {
        useFeatureGroupId = undefined;
      }

      let p1 = paramsProp && paramsProp.get('projectId');
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '';
      }
      Location.push('/' + mode + '/' + optionSel.value + p1, undefined, useFeatureGroupId);
    }
  };

  memTargetTags: (reqFields: any, datasetOne: any, isFeatureGroupSchema) => { optionsColumnTarget: any; optionsColumnTargetOnlyTimestamp: any } = memoizeOne((reqFields, datasetOne, isFeatureGroupSchema) => {
    if (reqFields) {
      this.reqFieldsList = null;

      let resList: any[] = [];
      let res: any[] = [],
        resOnlyTimestamp: any[] = [];
      const procOptions = (list) => {
        if (!list) {
          return;
        }

        let kk = Object.keys(list);
        kk.some((k1) => {
          let v1 = list[k1];
          let name = Utils.upperFirst(k1, true);

          let isRequired = !!v1.required;
          let allowMultiple = !!v1.multiple;

          let dataTypeOptions = v1.allowed_data_types?.map((data_type) => {
            return {
              label: data_type.charAt(0).toUpperCase() + data_type.substring(1).toLowerCase(),
              value: data_type.toUpperCase(),
            };
          });

          let find1 = resList.find((r1) => r1.value === k1);
          if (find1) {
            if (isRequired) {
              find1.isRequired = isRequired;
            }
            if (allowMultiple) {
              find1.allowMultiple = allowMultiple;
            }
            return false;
          }

          // @ts-ignore
          res.push({
            value: k1,
            label: name,
            // hideCross: isRequired,
            dataTypeOptions,
          });

          if (k1.toLowerCase() === 'TIMESTAMP'.toLowerCase()) {
            resOnlyTimestamp.push({
              value: k1,
              label: name,
              // hideCross: isRequired,
              dataTypeOptions,
            });
          }

          resList.push({
            value: k1,
            label: name,
            // hideCross: isRequired,
            isRequired,
            allowMultiple,
            dataTypeOptions,
          });
        });
      };

      procOptions(reqFields.allowedFeatureMappings);

      this.reqFieldsList = resList;
      return { optionsColumnTarget: res, optionsColumnTargetOnlyTimestamp: resOnlyTimestamp };
    }
  });

  calcFieldsWithOverrides = memoizeOne((schema1) => {
    if (schema1) {
      schema1 = schema1.toJS();

      let fields = schema1.schema;
      if (schema1.columnOverrides) {
        let kk = Object.keys(schema1.columnOverrides);
        kk.some((k1) => {
          let find1 = fields.find((f1) => f1.name === k1);
          if (find1) {
            let over1 = schema1.columnOverrides[k1];
            let kk2 = Object.keys(over1);
            kk2.some((k2) => {
              find1[k2] = over1[k2];
            });
          }
        });
      }
      return fields;
    }
  });

  memSaveDisabled = memoizeOne((isRefreshing, defDatasets, datasetId, projectId, dataList, reqFields, datasets, projects, foundProject1, datasetOne, batchPredId, isFeatureGroupSchema) => {
    if (dataList && reqFields) {
      if (isRefreshing) {
        return true;
      }

      if (!datasetId) {
        return true;
      }

      let reqFieldsRes = this.memRequFeatures(false)(defDatasets, datasets, datasetId, projects, projectId, foundProject1, datasetOne);
      let reqFields = reqFieldsRes?.reqFields;
      let reqError = reqFieldsRes?.reqError;
      let reqDatasetType = reqFields?.datasetType;

      let validationData = this.memValidation(false)(defDatasets, projectId, isFeatureGroupSchema);
      let fileSchema = this.memDatasetIdProjectId(false)(reqDatasetType, validationData, defDatasets, datasetId, projectId, datasetOne, this.state.modelVersion, batchPredId, isFeatureGroupSchema);
      if (!fileSchema) {
        return true;
      }

      let dataSendList: any[] = (dataList || []).map((d1) => {
        let obj1: any = {
          name: d1.columnName,
        };
        if (d1.featureMapping) {
          obj1.featureMapping = d1.featureMapping;
        }
        if (d1.featureType) {
          obj1.featureType = d1.featureType;
        }
        return obj1;
      });

      let isDiff = (v1, v2) => {
        if (v1 == null && v2 == null) {
          return false;
        } else {
          return v1 !== v2;
        }
      };

      let fields = this.calcFieldsWithOverrides(fileSchema);
      let anyDifference = false;
      let kk = Object.keys(fields ?? {});
      kk &&
        kk.some((k1) => {
          let o1 = fields[k1];
          let name1 = o1.name;
          let find1 = dataSendList.find((d1) => d1.name === name1);

          if (find1) {
            if (isDiff(find1.featureMapping, o1.featureMapping) || isDiff(find1.featureType, o1.featureType)) {
              anyDifference = true;
              return true;
            }
          } else {
            anyDifference = false; //force return disabled
            return true;
          }
        });
      if (anyDifference) {
        return false;
      }
    }

    return true;
  });

  renderReqFieldsStatus = memoizeOne((dataList, allowedFeatureMappings) => {
    let featureList = dataList ? dataList.map((col) => col?.featureMapping).filter((d1) => d1 != null) : [];
    let kk = Object.keys(allowedFeatureMappings ?? {});
    return (
      kk &&
      kk
        .filter((k1) => allowedFeatureMappings[k1]?.required)
        .map((k1, index) => {
          let name = Utils.upperFirst(k1, true);
          let value = k1;

          let color = 'red';
          let icon: IconProp = ['fas', 'times'];
          let name2 = null;

          let d1 = dataList?.find((v1) => v1?.featureMapping?.toLowerCase() === (value || '').toLowerCase());
          if (d1 != null) {
            color = 'green';
            icon = ['fas', 'check'];
            name2 = d1?.columnName;
          }

          return (
            <div key={'field_check_' + name + '_' + index} style={{ display: 'inline-block', marginRight: '23px' }}>
              <span style={{ fontSize: '14px' }}>{name}:</span>
              <span style={{ marginLeft: '6px' }}>
                <FontAwesomeIcon key={'icon_' + color} icon={icon} transform={{ size: 16, x: 0, y: 1 }} style={{ transition: 'all 0ms', opacity: 1, color: color, marginRight: '3px' }} />
              </span>
              {name2 && (
                <span
                  css={`
                    opacity: 0.8;
                    margin-left: 5px;
                    margin-right: 5px;
                    font-size: 14px;
                  `}
                >
                  ({name2})
                </span>
              )}
            </div>
          );
        })
    );
  });

  onChangeOptionWizard = (colFound1, option) => {
    this.setState({
      wizardSelectedOptionColFound: colFound1,
      wizardSelectedOption: option,
    });
  };

  memFixWizardRender = memoizeOne((wizardSelectedOptionColFound, saveIsDisabled, dataList, validationData, reqFields, optionsFields, wizardSelectedOption, fileSchema, confirmedMapping, datasetId, projectId, schemaInfo) => {
    let allowedFeatureMappings = reqFields?.allowedFeatureMappings;
    let columnHints = this.state.columnHints;

    if (dataList && reqFields && validationData && fileSchema && datasetId && projectId && allowedFeatureMappings) {
      if (confirmedMapping) {
        confirmedMapping = [...confirmedMapping];
      }

      let kk = Object.keys(allowedFeatureMappings);
      let columns = [];
      kk.some((k1) => {
        let obj1 = _.assign({}, allowedFeatureMappings[k1], {
          featureMapping: k1,
        });

        if (obj1.required && !obj1.multiple && obj1.featureMapping) {
          columns.push(obj1);
        }
      });
      let columnsAll = [...columns];

      let featureList = dataList ? dataList.map((col) => col?.featureMapping).filter((d1) => d1 != null) : [];
      let columnsToAsk =
        columns == null
          ? []
          : columns.filter((col1, index) => {
              return !featureList.find((f1) => f1?.toLowerCase() === col1?.featureMapping?.toLowerCase());
            });
      let columnsToAskErrors = [...columnsToAsk];

      let needConfirm = false;
      if (validationData) {
        let valAll = (validationData?.requiredDatasets || []).concat(validationData?.optionalDatasets || []);
        let valFound1 = valAll.find((d1) => d1.datasetType?.toLowerCase() === reqFields.datasetType?.toLowerCase());
        if (valFound1 && valFound1.confirmed === false) {
          needConfirm = true;
        }
      }
      if (!needConfirm) {
        // columnsToAsk = [];
      }

      let usedSchema = fileSchema ? this.calcFieldsWithOverrides(fileSchema) : null;
      if (needConfirm) {
        if (confirmedMapping) {
          //remove those who has errors
          columnsToAsk.some((c1) => {
            confirmedMapping = confirmedMapping.filter((v1) => v1 !== c1.featureMapping);
          });
        }

        if (usedSchema) {
          let typesNeeded = usedSchema.map((s1) => s1.featureMapping).filter((d1) => d1 != null);
          if (typesNeeded && typesNeeded.length > 0) {
            columnsToAsk = columns ?? [];
            typesNeeded.some((t1) => {
              if (columnsToAsk.find((c1) => c1?.featureMapping?.toLowerCase() === t1?.toLowerCase()) == null) {
                let c1 = columnsAll.find((c1) => c1?.featureMapping?.toLowerCase() === t1?.toLowerCase());
                if (c1) {
                  columnsToAsk.push(c1);
                }
              }
            });
          }
        }
      }

      let indThisAsk = 1;
      if (confirmedMapping != null && confirmedMapping.length > 0) {
        confirmedMapping.some((du1) => {
          columnsToAsk = columnsToAsk.filter((c1) => c1.featureMapping !== du1);
        });
        indThisAsk = confirmedMapping.length + 1;
      }

      let isConfirm = false;
      let colFound1 = columnsToAsk ? columnsToAsk[0] : null;
      if (colFound1 != null) {
        let schemaFound1 = null;
        if (usedSchema) {
          schemaFound1 = usedSchema?.find((s1) => s1.featureMapping === colFound1?.featureMapping);
          if (schemaFound1) {
            if (columnsToAskErrors.find((c1) => c1 === colFound1.featureMapping) == null) {
              isConfirm = true;
            }
          }
        }

        if (!_.isEqual(this.state.wizardSelectedOptionColFound, colFound1)) {
          let newState1: any = null;
          if (this.state.wizardSelectedOption) {
            newState1 = {
              wizardSelectedOption: null,
              wizardSelectedOptionColFound: null,
            };
          }

          if (usedSchema) {
            if (schemaFound1) {
              let f1 = optionsFields.find((o1) => o1.value?.toLowerCase() === schemaFound1.name?.toLowerCase());
              if (f1) {
                newState1 = {
                  wizardSelectedOption: f1,
                  wizardSelectedOptionColFound: colFound1,
                };
              }
            }
          }

          if (newState1 != null) {
            setTimeout(() => {
              this.setState(newState1);
            }, 0);
          }
        }

        let popupContainerForMenu = (node) => document.getElementById('body2');
        let menuPortalTarget = popupContainerForMenu(null);

        let descKey = colFound1?.description;

        optionsFields = optionsFields.filter(
          (col) => !(colFound1?.featureMapping in columnHints) || !columnHints || Object.entries(columnHints[colFound1?.featureMapping]).length == 0 || columnHints[colFound1?.featureMapping].includes(col.value),
        );
        return (
          <div style={{ display: 'block', marginTop: '20px' }}>
            <div style={{ maxWidth: '70%', minWidth: '480px', margin: '0 auto' }}>
              <div style={{ fontFamily: 'Matter', fontSize: '24px', lineHeight: 1.33, textAlign: 'center', color: '#ffffff', margin: '0 auto 20px auto' }}>Tell us which of your dataset{"'"}s columns map to our column types</div>
              <div style={{ margin: '18px auto 0 auto', fontSize: '15px', backgroundColor: '#0c121b', borderRadius: '1px', padding: '20px 20px' }}>
                <div style={{ margin: '8px 0', fontFamily: 'Matter', fontSize: '16px', fontWeight: 800, lineHeight: 1.38, letterSpacing: 'normal', textAlign: 'center', color: '#ffffff' }}>
                  <span className={sd.styleTextGreen} style={{ fontSize: '16px', fontFamily: 'Matter' }}>
                    {Utils.upperFirst(colFound1?.featureMapping ?? '', true)}
                  </span>
                  :&nbsp;{descKey}
                </div>
                <div style={{ margin: '14px 0 20px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span>
                      <div style={{ marginBottom: '5px', fontFamily: 'Roboto', fontSize: '12px', letterSpacing: '1.12px', color: '#ffffff', textTransform: 'uppercase' }}>
                        {Utils.upperFirst(colFound1?.featureMapping ?? '', true)} is equivalent to
                      </div>
                      <div>
                        <div style={{ width: '347px', marginRight: '10px', display: 'inline-block' }}>
                          <SelectExt value={this.state.wizardSelectedOption} style={{ width: '100%' }} options={optionsFields} onChange={this.onChangeOptionWizard.bind(this, colFound1)} menuPortalTarget={menuPortalTarget} />
                        </div>
                        {isConfirm === true && <span style={{ fontFamily: 'Matter', fontSize: '12px', fontWeight: 600, color: '#f1f1f1' }}>(Confirm)</span>}
                      </div>
                    </span>
                  </div>
                </div>
                <div style={{ margin: '8px 0', textAlign: 'center' }}>
                  <Button
                    style={{ maxWidth: '70%', minWidth: '480px' }}
                    disabled={this.state.wizardSelectedOption == null || this.state.wizardSelectedOptionColFound == null}
                    type={'primary'}
                    onClick={this.onClickNextWizard.bind(this, saveIsDisabled, isConfirm, columnsToAsk.length === 1, reqFields)}
                  >
                    {columnsToAsk.length === 1
                      ? saveIsDisabled
                        ? isConfirm
                          ? 'Confirm and continue'
                          : 'Continue'
                        : 'Set and save schema'
                      : (isConfirm ? 'Confirm' : 'Next') + ' (' + indThisAsk + '/' + ((columnsToAsk?.length ?? 0) + (confirmedMapping?.length ?? 0)) + ')'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  });

  onClickNextWizard = (saveIsDisabled, isConfirm, isLast, reqFields, e) => {
    let wizOption = this.state.wizardSelectedOption?.value;
    let wizOptionColFound = this.state.wizardSelectedOptionColFound;

    if (!wizOption || !wizOptionColFound) {
      REActions.addNotificationError(Constants.errorDefault);
      return;
    }

    let doStateChange = () => {
      this.setState(
        (lastState) => {
          let confirmedMapping = [...(lastState.confirmedMapping ?? [])];
          confirmedMapping.push(wizOptionColFound.featureMapping);

          let dataList = lastState.dataList ? [...lastState.dataList] : [];
          let index = dataList.findIndex((d1) => d1.columnName?.toLowerCase() === wizOption?.toLowerCase());
          if (index === -1) {
            if (confirmedMapping) {
              return {
                confirmedMapping: confirmedMapping,
              };
            } else {
              return {};
            }
          }

          let data1 = dataList[index];
          if (data1) {
            data1 = { ...data1 };
            let newValue = wizOptionColFound.featureMapping;
            data1.featureMapping = newValue;
            data1.open = false;
            dataList[index] = data1;

            let foundAllowMultiple = this.reqFieldsList && this.reqFieldsList.find((r1) => r1.value === newValue);
            let allowMultiple = false;
            if (foundAllowMultiple) {
              allowMultiple = foundAllowMultiple.allowMultiple;
            }

            if (!allowMultiple) {
              for (let i = 0; i < dataList.length; i++) {
                if (i != index) {
                  data1 = dataList[i];
                  if (data1.featureMapping === newValue) {
                    data1 = { ...data1 };
                    data1.featureMapping = '';
                    data1.open = false;
                    dataList[i] = data1;
                  }
                }
              }
            }

            let res1: any = {
              wizardSelectedOption: null,
              wizardSelectedOptionColFound: null,
              dataList,
            };
            if (confirmedMapping) {
              res1.confirmedMapping = confirmedMapping;
            }
            return res1;
          }
        },
        () => {
          if (isLast) {
            if (this.state.dataList && reqFields && reqFields.allowedFeatureMappings) {
              let kk = Object.keys(reqFields.allowedFeatureMappings);
              let columns = [];
              kk.some((k1) => {
                let obj1 = _.assign({}, reqFields.allowedFeatureMappings[k1], {
                  featureMapping: k1,
                });

                if (obj1.required && !obj1.multiple && obj1.featureMapping) {
                  columns.push(obj1);
                }
              });
              let didWork = false;
              if (columns.length > 0) {
                let featureList = this.state.dataList ? this.state.dataList.map((col) => col?.featureMapping).filter((d1) => d1 != null && d1 !== '') : [];
                let columnsToAsk = columns.filter((col_info, index) => {
                  const { name, featureMapping } = col_info;
                  return !featureList.find((f1) => f1?.toLowerCase() === featureMapping?.toLowerCase()) || featureMapping == null || featureMapping === '';
                });

                if (columnsToAsk && columnsToAsk.length === 0) {
                  this.onClickSaveChanges(false, null);
                  didWork = true;
                }
              }
              if (!didWork) {
                setTimeout(() => {
                  StoreActions.resetSchemaChanged_();
                }, 0);
              }
            }
          }
        },
      );
    };

    let { paramsProp } = this.props;

    let projectId = this.calcProjectId();
    let datasetId = paramsProp && paramsProp.get('datasetId');
    REClient_.client_().setProjectDatasetColumnMapping(false, projectId, datasetId, wizOption, wizOptionColFound?.featureMapping, (err, res) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        doStateChange();
        // StoreActions.schemaGetFileDataUse_(projectId, datasetId);
        // StoreActions.validateProjectDatasets_(projectId);
      }
    });
  };

  memOptionsFields = memoizeOne((dataList) => {
    if (dataList) {
      return dataList.map((d1) => ({
        label: d1.columnName,
        value: d1.columnName,
      }));
    }
  });

  memWizard = memoizeOne((wizardUseDisplayNot, validationData, optionsDatasets, datasetId, projectId, datasetType, listShownAtLeastOnceFordatasetType, dataListIsNull) => {
    if (this.notWizardGo === true) {
      return;
    }

    let isForced = false;
    if (listShownAtLeastOnceFordatasetType != null && datasetType === listShownAtLeastOnceFordatasetType) {
      wizardUseDisplayNot = true;
      isForced = true;
    }

    if (wizardUseDisplayNot === true && validationData != null && optionsDatasets != null && datasetId && projectId && datasetType) {
      //other confirm or errors dataset?
      let allDatasets = (validationData?.requiredDatasets || []).concat(validationData?.optionalDatasets || []);
      if (allDatasets && allDatasets.length > 0) {
        let doAny = false;
        allDatasets.some((d1) => {
          let needFix = false;
          if (d1.requiredColumns) {
            let kk = Object.keys(d1.requiredColumns);
            kk.some((k1) => {
              if (d1.requiredColumns[k1] === false) {
                needFix = true;
                return true;
              }
            });
          }
          if (needFix || d1.confirmed === false) {
            doAny = true;
            let dsFound1 = optionsDatasets.find((o1) => o1.datasetId === d1.datasetId);
            if (dsFound1) {
              setTimeout(() => {
                this.setState({
                  listShownAtLeastOnce: null,
                  listShownAtLeastOnceFordatasetType: null,
                });
                Location.push('/' + PartsLink.dataset_schema + '/' + dsFound1.datasetId + '/' + projectId);
              }, 0);
            }
            return true;
          }
        });
        if (doAny) {
          return;
        }
      }

      if (!isForced) {
        setTimeout(() => {
          this.setState({
            listShownAtLeastOnce: true,
            listShownAtLeastOnceFordatasetType: datasetType,
          });
        }, 0);
      }
    }
  });

  memNewOne = memoizeOne((projectId, datasetId) => {
    this.memNewOneUsed = true;
    setTimeout(() => {
      this.setState({
        listShownAtLeastOnce: null,
        listShownAtLeastOnceFordatasetType: null,
        dataList: null,
        columnHints: null,
        confirmedMapping: null,
        wizardSelectedOption: null,
        wizardSelectedOptionColFound: null,
        filters: null,
        editorColumnName: '',
        editorColumnNameBefore: '',
        editorValue: '',
        editorIsEdit: false,
      });
    }, 0);
  });

  calcParam = (name) => {
    let { paramsProp } = this.props;
    return paramsProp && paramsProp.get(name);
  };

  onClickNextWizardAsk = (e) => {
    if (this.state.wizardStepActual === WizardSteps.Target) {
      let actualValue = this.state.wizardState?.['target'];
      if (actualValue == null || _.trim(actualValue) === '') {
        REActions.addNotification('Enter a field name!');
        return;
      }
      this.setState({
        wizardStepActual: WizardSteps.Information,
      });
    } else if (this.state.wizardStepActual === WizardSteps.Information) {
      let { paramsProp } = this.props;

      let step2count = this.state.wizardState?.['step2count'] ?? 0;
      let usedCount = 0;
      for (let i = 0; i < step2count; i++) {
        let v1 = this.state.wizardState?.['value_' + i];
        if (v1 != null && _.trim(v1) !== '') {
          usedCount++;
        }
      }
      if (usedCount < 2) {
        REActions.addNotification('Enter at least two field names!');
        return;
      }

      let projectId = this.calcProjectId();

      let search = Utils.processParamsAsQuery({
        useCaseTag: true,
        useCase: this.calcParam('useCase'),
        stepByStep: this.calcParam('stepByStep'),
      });

      this.setState({
        isRefreshing: true,
      });

      let values: any = {};
      let state1 = this.state.wizardState;
      if (state1 != null && !_.isEmpty(state1)) {
        values.target = state1.target;

        let max = state1.step2count ?? 0;
        let ind = 0;
        for (let i = 0; i < max; i++) {
          let v1 = state1['value_' + i];
          if (v1 != null && _.trim(v1) !== '') {
            values['value_' + ind] = v1;
            ind++;
          }
        }
        values.valuesCount = ind;
      }

      StoreActions.setCreateActionState_(projectId, values ?? {});

      REClient_.client_()._setProjectWizardState(projectId, values, (err, res) => {
        if (err) {
          Utils.error(err);
        }
        this.setState(
          {
            isRefreshing: false,
          },
          () => {
            Location.push('/' + PartsLink.dataset_for_usecase + '/' + projectId, undefined, search);
          },
        );
      });
    }
  };

  onChangeInputWizardAsk = (stateVar, e) => {
    let v1 = e.target.value;

    this.setState((state) => {
      let w1 = { ...(state.wizardState ?? {}) };
      w1[stateVar] = v1;
      return {
        wizardState: w1,
      };
    });
  };

  onClickRemoveMoreVariableOne = (index, e) => {
    this.setState((state) => {
      let w1 = { ...(state.wizardState ?? {}) };
      let count = w1['step2count'] ?? 0;

      // if(count>2) {
      for (let i = index; i < count - 1; i++) {
        w1['value_' + i] = w1['value_' + (i + 1)];
      }
      delete w1['value_' + (count - 1)];

      w1['step2count'] = (w1['step2count'] ?? 0) - 1;

      // } else {
      //   w1['value_' + index] = '';
      // }

      return {
        wizardState: w1,
      };
    });
  };

  onClickAddMoreVariableOne = (e) => {
    this.setState((state) => {
      let w1 = { ...(state.wizardState ?? {}) };
      w1['step2count'] = (w1['step2count'] ?? 0) + 1;
      return {
        wizardState: w1,
      };
    });
  };

  onClickHideHelpStep1 = (e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    this.onClickNextWizardAsk(e);
  };

  onClickHideHelpStep3 = (e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    this.onClickNextWizardAsk(e);
  };

  calcWizardStateForStepByStep = () => {
    return {
      target: 'quality',
      step2count: 11,
      value_0: 'density',
      value_1: 'alcohol',
      value_2: 'fixed_acidity',
      value_3: 'volatile_acidity',
      value_4: 'citric_acid',
      value_5: 'residual_sugar',
      value_6: 'chlorides',
      value_7: 'free_sulfur_dioxide',
      value_8: 'total_sulfur_dioxide',
      value_9: 'pH',
      value_10: 'sulphates',
    };
  };

  useSampleDatasets = () => {
    let projectId = this.calcProjectId();
    if (!projectId) {
      return;
    }

    let wizardState = this.calcWizardStateForStepByStep();

    this.setState(
      {
        wizardState,
      },
      () => {
        let search = Utils.processParamsAsQuery({
          useCaseTag: this.calcParam('useCaseTag'),
          useCase: this.calcParam('useCase'),
          stepByStep: '1',
        });
        Location.push('/' + PartsLink.dataset_schema_wizard + '/' + projectId, undefined, search);
      },
    );
  };

  memUseCaseSchemasAll = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  memDescForUseCase = memoizeOne((infoAll) => {
    if (infoAll) {
      return infoAll?.example_datasets_description;
    }
  });

  onKeyDownTargetText = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.onClickNextWizardAsk(e);
    }
  };

  memAskWizard = memoizeOne((authUser, actualStep: WizardSteps, wizardState) => {
    let stateVar = null,
      title = null,
      nextString = 'Continue',
      step2count = 1;
    let askString0 = null,
      askString: any = '',
      askPlaceholder = null,
      showAddButton = false;
    if (actualStep === WizardSteps.Target) {
      title = 'Step 1 - Specify Target Variable';
      stateVar = 'target';
      askString =
        "Before we can train your predictive model, we have to define the variable you are trying to predict. For example, a model that predicts house prices will have as it's target variable - house price or a model that is predicting spam score will have it's target variable spam score.";
      askPlaceholder = ['e.g. House Price, Spam Score'];
    } else if (actualStep === WizardSteps.Information) {
      title = 'Step 2 - List Independent Variable';
      askString0 = 'Target Variable (Variable to predict): ' + (this.state.wizardState?.['target'] ?? '-');
      askString = (
        <div>
          What are the variables that determine the value of the target variable? For example, when determining the house price, number of bedrooms, bathrooms, and location determine the price of the house and are the independent variable.
          <br />
          <br />
          Note: The more independent variables you have the better
        </div>
      );
      askPlaceholder = ['e.g. Number of Bedrooms,  IP address', 'e.g. Number of bathroom, User Country'];

      let valueIndex = 0;
      if (wizardState?.valueIndex != null) {
        valueIndex = wizardState?.valueIndex;
      }
      step2count = wizardState?.step2count ?? 1;
      stateVar = 'value_' + valueIndex;
      nextString = 'Finish and upload data';

      let usedCount = 0;
      for (let i = 0; i < step2count; i++) {
        let v1 = wizardState?.['value_' + i];
        if (v1 != null && _.trim(v1) !== '') {
          usedCount++;
        }
      }

      showAddButton = true; //usedCount>=2;
    }

    let { paramsProp } = this.props;

    let projectId = this.calcProjectId();
    let search = Utils.processParamsAsQuery({
      useCaseTag: true,
      useCase: this.calcParam('useCase'),
    });
    let linkSkip = null;
    if (projectId) {
      linkSkip = ['/' + PartsLink.dataset_for_usecase + '/' + projectId, search];
    }

    let isWizardHelp = this.props.isWizard && !!paramsProp?.get('stepByStep');

    let infoAll = this.memUseCaseSchemasAll(false)(this.props.useCases, 'predicting');
    let descriptionUseCase = this.memDescForUseCase(infoAll);
    let titleConfirm = <span>Do you want to use the sample datasets?</span>;
    if (descriptionUseCase != null && descriptionUseCase !== '') {
      titleConfirm = (
        <div>
          <div>{titleConfirm}</div>
          <div style={{ margin: '14px 0', textAlign: 'left' }} className={sd.styleTextGray}>
            <div style={{ marginBottom: '5px' }} className={sd.styleTextGreen}>
              Description:
            </div>
            {descriptionUseCase}
          </div>
        </div>
      );
    }

    //save to disk
    if (!isWizardHelp) {
      let saveState: any = {
        url: window.location.href,
        wizardStepActual: this.state.wizardStepActual,
        wizardState: this.state.wizardState,
      };
      Utils.dataNum(dataWizardStateSavedLocally, undefined, saveState);
    } else {
      //clear it
      Utils.dataNum(dataWizardStateSavedLocally, undefined, null);
    }

    //
    const showPredHelpWizard2 = isWizardHelp && actualStep === WizardSteps.Information;
    const showPredHelpWizard3 = isWizardHelp && actualStep === WizardSteps.Information;

    return (
      <div style={{ display: 'block', marginTop: '40px', paddingLeft: '55px' }}>
        <div style={{ display: 'flex' }}>
          <div>
            <div style={{ fontSize: '15px', borderRadius: '1px', width: '555px', paddingRight: '20px' }}>
              {title != null && <div style={{ borderBottom: '1px solid white', paddingBottom: '9px', fontFamily: 'Matter', fontSize: '24px', lineHeight: 1.33, color: '#ffffff', marginBottom: '20px' }}>{title}</div>}
              <div style={{ margin: (askString0 ? 22 : 38) + 'px 0', backgroundColor: '#23305e', padding: '18px 22px', fontFamily: 'Roboto', fontSize: '18px', lineHeight: 1.33, letterSpacing: '0.38px', color: '#d1e4f5' }}>
                {askString0 != null && <div style={{ fontFamily: 'Roboto', fontSize: '18px', letterSpacing: '1.68px', color: '#ffffff', marginBottom: '25px' }}>{askString0}</div>}
                {askString}
              </div>
              <div style={{ margin: '14px 0 20px 0' }}>
                <div style={{}}>
                  <div>
                    {actualStep === WizardSteps.Target && (
                      <div style={{ position: 'relative', margin: '10px 0' }}>
                        <div style={{ fontFamily: 'Roboto', fontSize: '12px', lineHeight: 2.6, letterSpacing: '1.1px', color: '#ffffff', textTransform: 'uppercase' }}>What is your target variable?</div>
                        <Input
                          onKeyDown={this.onKeyDownTargetText}
                          placeholder={askPlaceholder}
                          onChange={isWizardHelp ? null : this.onChangeInputWizardAsk.bind(this, stateVar)}
                          value={wizardState?.[stateVar] ?? ''}
                          style={{ width: '100%' }}
                        />
                        <div style={{ lineHeight: 2.5, fontFamily: 'Matter', fontSize: '12px', color: '#d1e4f5' }}>( i ) This is the dependent feature you would like to predict.</div>
                      </div>
                    )}
                    {actualStep === WizardSteps.Information &&
                      new Array(step2count).fill(null).map((f1, ind) => {
                        return (
                          <div key={'fie_ind' + ind} style={{ margin: '10px 0' }}>
                            <div style={{ lineHeight: 2, whiteSpace: 'nowrap', fontFamily: 'Roboto', fontSize: '12px', letterSpacing: '1.12px', color: '#ffffff' }}>Independent Variable {ind + 1}:</div>
                            <div style={{ padding: '4px ' + (showAddButton ? 24 : 0) + 'px 0 0', position: 'relative' }}>
                              <Input
                                placeholder={askPlaceholder[ind % askPlaceholder.length]}
                                onChange={isWizardHelp ? null : this.onChangeInputWizardAsk.bind(this, 'value_' + ind)}
                                value={wizardState?.['value_' + ind] ?? ''}
                                style={{ width: '100%' }}
                              />

                              {showAddButton && (
                                <div style={{ position: 'absolute', right: 0, top: '6px', width: '26px', textAlign: 'right', userSelect: 'none' }}>
                                  <TooltipExt title={'Remove variables'}>
                                    <FontAwesomeIcon
                                      onClick={isWizardHelp ? null : this.onClickRemoveMoreVariableOne.bind(this, ind)}
                                      icon={require('@fortawesome/pro-duotone-svg-icons/faMinusCircle').faMinusCircle}
                                      transform={{ size: 20, y: 1 }}
                                      style={{ cursor: 'pointer', display: 'inline-block' }}
                                    />
                                  </TooltipExt>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {actualStep === WizardSteps.Information && showAddButton && (
                      <div style={{ padding: '24px 0 22px 0' }}>
                        <span onClick={isWizardHelp ? null : this.onClickAddMoreVariableOne} style={{ backgroundColor: '#2e384d', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>
                          <span style={{ marginRight: '9px', color: Utils.colorA(0.7) }}>Add independent variable</span>
                          <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faPlusCircle').faPlusCircle} transform={{ size: 20, y: 1 }} style={{ cursor: 'pointer', display: 'inline-block' }} />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                style={{
                  margin: '48px 0',
                  textAlign: 'center',
                  border: (isWizardHelp && actualStep === WizardSteps.Target) || showPredHelpWizard3 ? '3px solid #00f8c5' : '',
                  padding: (isWizardHelp && actualStep === WizardSteps.Target) || showPredHelpWizard3 ? '10px' : '',
                }}
              >
                <span style={{ position: 'relative' }}>
                  {showPredHelpWizard3 && (
                    <img src={calcImgSrc('/imgs/helpPredStep3.png')} alt={''} style={{ position: 'absolute', bottom: '-120px', right: '-100px', width: '334px', cursor: 'pointer' }} onClick={this.onClickHideHelpStep3} />
                  )}
                  {isWizardHelp && actualStep === WizardSteps.Target && (
                    <img src={calcImgSrc('/imgs/helpPredStep1.png')} alt={''} style={{ position: 'absolute', bottom: '-180px', right: '-300px', width: '390px', cursor: 'pointer' }} onClick={this.onClickHideHelpStep1} />
                  )}
                  <Button style={{ width: '100%' }} disabled={(!showAddButton || step2count < 2) && actualStep === WizardSteps.Information} type={'primary'} onClick={this.onClickNextWizardAsk}>
                    {nextString}
                  </Button>
                </span>
              </div>
            </div>
            <div style={{ margin: '44px 0', color: '#3391ed', fontFamily: 'Matter', fontSize: '14px' }}>
              {([WizardSteps.Target].includes(actualStep) || (showAddButton && [WizardSteps.Information].includes(actualStep))) && (
                <Link to={linkSkip}>
                  <span style={{ cursor: 'pointer' }}>{'>>>'}&nbsp;Skip this step and go to uploading data</span>
                </Link>
              )}
            </div>
          </div>

          <div style={{ marginLeft: '40px' }}>
            {!isWizardHelp && actualStep === WizardSteps.Target && (
              <div
                style={{
                  width: '180px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  fontFamily: 'Matter',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: 1.36,
                  color: '#d1e4f5',
                  textAlign: 'center',
                }}
                className={sd.useSampleDatasetBack}
              >
                <ModalConfirm onConfirm={this.useSampleDatasets} title={titleConfirm} icon={<QuestionCircleOutlined style={{ color: 'green' }} />} okText={'Use Sample - Step by Step'} cancelText={'Cancel'} okType={'primary'}>
                  <div style={{ textAlign: 'center', padding: '22px', position: 'relative' }}>
                    <div style={{ margin: '2px 0 18px 0', fontFamily: 'Matter', fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Try with sample</div>
                    <div style={{ backgroundColor: '#48a33c', borderRadius: '50%', width: '108px', margin: '0 auto', height: '108px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <div>
                        <div style={{ marginBottom: '11px' }}>
                          <FontAwesomeIcon icon={['fad', 'vials']} transform={{ size: 26, x: 0, y: 0 }} style={{}} />
                        </div>
                        <div style={{ fontFamily: 'Roboto', fontSize: '14px', fontWeight: 500, lineHeight: 1.14, color: '#ffffff' }}>
                          Sample
                          <br />
                          Datasets
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '17px' }}>Click here to use the sample dataset and walk through the wizard</div>
                  </div>
                </ModalConfirm>
              </div>
            )}
            {isWizardHelp && actualStep === WizardSteps.Information && (
              <div style={{ position: 'relative', border: showPredHelpWizard2 ? '3px solid #00f8c5' : 'none' }}>
                {showPredHelpWizard2 && <img src={calcImgSrc('/imgs/helpPredStep2.png')} alt={''} style={{ position: 'absolute', top: '95%', right: '-10px', width: '342px', cursor: 'pointer' }} />}
                <div
                  css={css`
                    font-family: Matter, sans-serif;
                    font-size: 24px;
                    line-height: 1.33;
                    color: #ffffff;
                    border-radius: 1px;
                    background-color: #23305e;
                    padding: 12px 0;
                    text-align: center;
                    width: 357px;
                  `}
                >
                  Schema For Predictive Model
                </div>
                <div
                  css={css`
                    width: 357px;
                    padding: 18px 20px;
                    border-radius: 1px;
                    background-color: #0c121b;
                  `}
                >
                  <PredBoxName>Target Variable</PredBoxName>
                  <PredBoxValue>{this.state.wizardState?.['target'] ?? '-'}</PredBoxValue>
                  {new Array(step2count).fill(null).map((s1, s1ind) => (
                    <div key={'step_ch_' + s1ind}>
                      <PredBoxName>Independent Variable {s1ind + 1}</PredBoxName>
                      <PredBoxValue>{this.state.wizardState?.['value_' + s1ind]}</PredBoxValue>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });

  memProjectUseCase = memoizeOne((foundProject1) => {
    return foundProject1?.useCase;
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  memDatasetOne = memoizeOneCurry((doCall, datasets, datasetId) => {
    let res = datasetsReq.memDatasetListCall(doCall, datasets, [datasetId]);
    if (res != null) {
      res = Object.values(res)[0];
    }
    return res;
  });

  memModelsSpans: (modelList: any) => { list: any; anyComplete: boolean; allCompleted: boolean; anyTraining: boolean; anyCompleteAnyVersion: boolean } = memoizeOne((modelList) => {
    if (modelList) {
      let anyTraining = false,
        allCompleted = true,
        anyComplete = false,
        anyCompleteAnyVersion = false;

      modelList.some((m1, m1ind) => {
        let modelId = m1.get('modelId');

        let isTraining = modelId && StoreActions.refreshModelUntilStateIsTraining_(modelId);
        if (
          isTraining ||
          ![ModelLifecycle.EVALUATING_FAILED.toLowerCase(), ModelLifecycle.UPLOADING_FAILED.toLowerCase(), ModelLifecycle.TRAINING_FAILED.toLowerCase(), ModelLifecycle.COMPLETE.toLowerCase()].includes(
            (m1.getIn(['latestModelVersion', 'status']) ?? '').toLowerCase(),
          )
        ) {
          anyTraining = true;
        }
        if (m1.getIn(['modelVersion', 'status']) && ModelLifecycle.COMPLETE !== m1.getIn(['latestModelVersion', 'status'])) {
          allCompleted = false;
        }
        if (ModelLifecycle.COMPLETE === m1.getIn(['latestModelVersion', 'status'])) {
          anyComplete = true;
        }
        if (m1.get('hasTrainedVersion') === true) {
          anyCompleteAnyVersion = true;
        }
      });

      return { anyTraining, allCompleted, anyComplete, anyCompleteAnyVersion };
    }
  });

  memModelList = memoizeOneCurry((doCall, models, projectId) => {
    if (models && !Utils.isNullOrEmpty(projectId)) {
      let listByProjectId = calcModelListByProjectId(undefined, projectId);
      if (listByProjectId == null) {
        if (models.get('isRefreshing')) {
          return;
        }

        if (doCall) {
          StoreActions.listModels_(projectId);
        }
      } else {
        return listByProjectId;
      }
    }
  });

  memDatasetErrors = memoizeOne((validationData) => {
    if (validationData?.datasetErrors && _.isArray(validationData?.datasetErrors) && validationData?.datasetErrors.length > 0) {
      return (
        <div style={{ margin: '15px 0', fontSize: '14px' }}>
          {validationData?.datasetErrors
            .map((e1, e1ind) => {
              if (!e1?.message) {
                return null;
              }
              return (
                <div key={'err_' + e1ind} style={{ margin: '4px 10px' }}>
                  Error&nbsp;({e1ind + 1})&nbsp;:&nbsp;<span className={sd.styleTextRedColor}>{e1?.message}</span>
                </div>
              );
            })
            .filter((e1) => e1 != null)}
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <span style={{ color: Utils.colorA(0.8) }}>
              Need help with this?{' '}
              <Link newWindow noApp to={'/?consaccess=1'} className={sd.styleTextBlueBrightColor}>
                Contact us
              </Link>
            </span>
          </div>
        </div>
      );
    }
  });

  memColumns = memoizeOne((projectId, optionsColumnTarget, optionsColumnTargetOnlyTimestamp, optionsFeatureTypes, readOnly, columnFilterText, columnFilterOnlyNonIgnored, isFeatureGroupSchema) => {
    let popupContainerForMenu = (node) => document.getElementById('body2');
    let menuPortalTarget = popupContainerForMenu(null);

    const columns: ITableExtColumn[] = [
      {
        title: 'Column Name',
        field: 'columnName',
        width: 300,
      },
      {
        field: 'error',
        width: 20,
        render: (text, row, index) => {
          return text ? (
            <TooltipExt placement="bottom" overlay={<span>{text}</span>}>
              <FontAwesomeIcon icon={['far', 'exclamation-circle']} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, color: 'red', marginRight: '3px' }} />
            </TooltipExt>
          ) : null;
        },
      },
      {
        title: '',
        field: '',
        width: 14,
        noAutoTooltip: true,
        render: (text, row, index) => {
          if (Utils.isNullOrEmpty(row?.detectedDataType) || row?.detectedDataType?.toUpperCase() === row?.dataType?.toUpperCase()) {
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
              <TooltipExt title={'Detected Type: ' + row?.detectedDataType}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faInfoCircle').faInfoCircle} transform={{ size: 15, x: 0, y: 0 }} />
              </TooltipExt>
            </span>
          );
        },
      },
      {
        title: '',
        render: (text, row, index) => {
          let s1 = null,
            s2 = null;
          if (!Utils.isNullOrEmpty(row.timeFormat)) {
            s1 = 'Datetime Format: ' + row.timeFormat;
          }
          if (!Utils.isNullOrEmpty(row.timestampFrequency)) {
            s2 = 'Frequency: ' + row.timestampFrequency;
          }
          if (row?.dataType != 'DATETIME' || (s1 == null && s2 == null)) {
            return null;
          }

          return (
            <span>
              <TooltipExt
                title={
                  <span>
                    {s1}
                    {s1 != null && s2 != null && <br />}
                    {s2}
                  </span>
                }
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faWaveformCircle').faWaveformCircle} transform={{ size: 15, x: 0, y: 0 }} />
              </TooltipExt>
            </span>
          );
        },
        width: 14 + 14 + 10,
        noAutoTooltip: true,
      },
      {
        title: 'Data Type',
        field: 'dataType',
        helpId: 'data_type',
        render: (text, row, index) => {
          let dataList = this.memFilterColumns(this.state.dataList, this.state.columnFilterText, this.state.columnFilterOnlyNonIgnored);

          let data1 = dataList?.[index];
          let v1 = data1 && data1['dataType'];

          let options = optionsColumnTarget;
          if (data1?.featureMapping?.toLowerCase() === 'TIMESTAMP'.toLowerCase()) {
            options = optionsColumnTargetOnlyTimestamp;
          }

          let forceOptions = false;
          if (data1?.validDataTypes != null && _.isArray(data1?.validDataTypes)) {
            forceOptions = true;
            options = data1?.validDataTypes?.map((s1) => ({ label: Utils.upperFirst(s1), value: s1 }));
          }

          let vMapping = data1 && data1.featureMapping;
          let optionMappingOne = options && options.find((o1) => o1.value === vMapping);
          let dataTypeOptions = forceOptions ? options : optionsFeatureTypes ? [...optionsFeatureTypes] : [];
          if (v1 == 'IDENTIFIER') {
            dataTypeOptions.push({ label: 'Identifier', value: 'IDENTIFIER' });
          }

          let selOption = dataTypeOptions ? dataTypeOptions.find((o1) => o1.value === v1) : null;
          if (this.state.readOnly) {
            selOption = selOption ?? { label: '', value: '' };
          }

          return (
            <SelectExt
              onClose={this.onCloseMenu}
              isDisabled={this.state.readOnly || (optionMappingOne == null || isFeatureGroupSchema ? false : (optionMappingOne?.dataTypeOptions?.length || 2) < 2)}
              value={selOption}
              options={optionMappingOne?.dataTypeOptions == null || isFeatureGroupSchema ? dataTypeOptions : optionMappingOne.dataTypeOptions}
              onChange={this.onChangeSelectOptionFeatureType.bind(this, row, index)}
              isSearchable={false}
              menuPortalTarget={menuPortalTarget}
            />
          );
        },
        width: 240,
        noAutoTooltip: true,
      },
    ];
    if (!isFeatureGroupSchema && projectId != null) {
      columns.push({
        title: 'Column Mapping',
        field: 'featureMapping',
        helpId: 'col_mapping',
        render: (text, row, index) => {
          let dataList = isFeatureGroupSchema ? [] : this.memFilterColumns(this.state.dataList, this.state.columnFilterText, this.state.columnFilterOnlyNonIgnored);

          let data1 = dataList?.[index];
          let columnHints1 = this.state.columnHints;
          let v1 = data1 && data1.featureMapping;
          let options = optionsColumnTarget;
          options = options?.filter((option) => !(option.value in columnHints1) || !columnHints1[option.value] || columnHints1[option.value].includes(row.columnName) || row.featureMapping === option.value);
          if (data1?.featureMapping?.toLowerCase() === 'TIMESTAMP'.toLowerCase()) {
            options = optionsColumnTargetOnlyTimestamp;
          }

          let value1 = options && options.find((o1) => o1.value === v1);
          if (this.state.readOnly || isFeatureGroupSchema) {
            value1 = value1 ?? { label: '', value: '' };
          }

          return (
            <SelectExt
              onClose={this.onCloseMenu}
              isDisabled={isFeatureGroupSchema || this.state.readOnly}
              dragItemName={this.state.readOnly || isFeatureGroupSchema ? undefined : DragFieldTarget}
              allowDrag={!this.state.readOnly && !isFeatureGroupSchema}
              value={value1}
              style={{ width: '100%' }}
              options={options}
              onChange={this.onChangeSelectOptionTarget.bind(this, row, index)}
              menuPortalTarget={menuPortalTarget}
            />
          );
        },
        width: 240,
        noAutoTooltip: true,
      });
    }

    return columns;
  });

  memFieldsList = memoizeOne((optionsFields) => {
    return optionsFields
      ?.map((f1) => {
        return f1?.value;
      })
      .filter((v1) => !Utils.isNullOrEmpty(v1));
  });

  onChangeEditorValue = (name, value) => {
    this.setState({
      editorColumnName: name,
      editorValue: value,
    });
  };

  memFiltersDatasets = memoizeOneCurry((doCall, projectDatasets, projectId, datasetId, emptyFilters) => {
    if (projectDatasets && projectId && datasetId) {
      let listByProjectId = calcDatasetForProjectId(undefined, projectId);
      if (listByProjectId == null) {
        if (projectDatasets.get('isRefreshing')) {
          return;
        }

        if (doCall) {
          StoreActions.getProjectDatasets_(projectId);
        }
      } else {
        let filters = listByProjectId?.find((v1) => v1?.dataset?.datasetId === datasetId)?.dataFilters;
        if (this.state.filters == null) {
          if (filters != null && filters.length > 0) {
            let filtersForState = filters.map((f1) => ({ isInclude: f1.type === 'INCLUDE', content: f1.whereExpression, join: f1.join }));

            setTimeout(() => {
              this.setState({
                filters: filtersForState,
              });
            }, 0);
          }
        }
        return filters;
      }
    }
  });

  memColumnSamples: (dataList) => { columnCategorical?; columnNumerical? } = memoizeOne((dataList) => {
    let columnCategorical = null,
      columnNumerical = null;
    dataList?.some((d1) => {
      if (d1.featureType?.toUpperCase() === 'CATEGORICAL' && !columnCategorical) {
        columnCategorical = d1.columnName;
      }
      if (d1.featureType?.toUpperCase() === 'NUMERICAL' && !columnNumerical) {
        columnNumerical = d1.columnName;
      }
      if (columnCategorical && columnNumerical) {
        return true;
      }
    });
    return { columnCategorical, columnNumerical };
  });

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, projectId) => {
    return projectDatasetsReq.memDatasetsByProjectId(doCall, projectDatasets, projectId);
  });

  lastDatasetIdUsedForDatasetVersions = null;
  memDatasetVersions = memoizeOneCurry((doCall, datasetsParam, projectId, datasetId) => {
    let res = datasets.memDatasetListVersions(doCall, datasetsParam, datasetId);
    if (doCall) {
      if (res != null && datasetId !== this.lastDatasetIdUsedForDatasetVersions) {
        this.lastDatasetIdUsedForDatasetVersions = datasetId;

        if (this.usedModelVersionFistTime) {
          return;
        }
        let mv1 = this.props.paramsProp?.get('datasetVersion');
        if (Utils.isNullOrEmpty(mv1)) {
          return;
        }

        if (res?.find((v1) => v1?.datasetVersion === mv1) == null) {
          return;
        }

        this.usedModelVersionFistTime = true;

        let search1 = Utils.processParamsAsQuery({ datasetVersion: mv1 }, window.location.search);
        let projectId = this.calcProjectId();
        Location.replace('/' + this.props.paramsProp?.get('mode') + '/' + this.props.paramsProp?.get('datasetId') + (projectId == null ? '' : '/' + projectId), undefined, search1);
      }
    }
    return res;

    // let res = datasets.memSchemaDatasetListVersions(doCall, undefined, projectId, datasetId);
    // if(doCall) {
    //   if(res!=null && datasetId!==this.lastDatasetIdUsedForDatasetVersions) {
    //     this.lastDatasetIdUsedForDatasetVersions = datasetId;
    //
    //     this.setState({
    //       modelVersion: null,
    //       readOnly: false,
    //
    //     }, () => {
    //       if(this.usedModelVersionFistTime) {
    //         return;
    //       }
    //       let mv1 = this.props.paramsProp?.get('modelVersion');
    //       if(Utils.isNullOrEmpty(mv1)) {
    //         return;
    //       }
    //
    //       if(res?.find(v1 => v1?.modelVersion===mv1)==null) {
    //         return;
    //       }
    //
    //       this.usedModelVersionFistTime = true;
    //       setTimeout(() => {
    //         this.setState({
    //           modelVersion: mv1,
    //           readOnly: true,
    //         });
    //       }, 0);
    //     });
    //   }
    // }
    // return res;
  });

  memDatasetVersionsOptions = memoizeOne((listDatasetVersions) => {
    let res = listDatasetVersions?.map((f1, d1ind) => ({
      count: listDatasetVersions.length - d1ind,
      label: (
        <span>
          <span>{f1?.datasetVersion}&nbsp;-&nbsp;</span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: f1.datasetVersion,
      data: f1,
    }));
    if (res?.[0] != null) {
      res[0].isLast = true;
    }
    return res;
  });

  memDatasetsList = memoizeOneCurry((doCall, datasets, listDatasets) => {
    if (listDatasets) {
      let ids = listDatasets.map((d1) => d1.dataset?.datasetId);
      return datasetsReq.memDatasetListCall(doCall, datasets, ids);
    }
  });

  memOptionsColumns: (dataList) => { optionsColumnNames; optionsColumnNamesTimestamps } = memoizeOne((dataList) => {
    let optionsColumnNamesTimestamps = [];

    let optionsColumnNames = dataList?.map((c1) => {
      if (c1.featureType?.toLowerCase() === 'timestamp') {
        optionsColumnNamesTimestamps.push({
          label: c1.columnName,
          value: c1.columnName,
        });
      }

      return {
        label: c1.columnName,
        value: c1.columnName,
      };
    });

    optionsColumnNames?.unshift({ label: '(None)', value: null });
    optionsColumnNamesTimestamps?.unshift({ label: '(None)', value: null });

    return { optionsColumnNames, optionsColumnNamesTimestamps };
  });

  memOptionRecordIdSel = memoizeOne((fileSchema, optionsColumnTarget) => {
    const v1 = fileSchema?.getIn(['featureColumns', 'recordId']);
    return v1 == null ? null : optionsColumnTarget?.find((o1) => o1.value === v1);
  });

  memOptionEventTimestampSel = memoizeOne((fileSchema, optionsColumnTarget) => {
    const v1 = fileSchema?.getIn(['featureColumns', 'timestamp']);
    return v1 == null ? null : optionsColumnTarget?.find((o1) => o1.value === v1);
  });

  onChangeRecordId = (option1) => {
    let projectId = this.props.paramsProp?.get('projectId');
    let datasetId = this.props.paramsProp?.get('datasetId');

    // REClient_.client_().setRecordIdentifier(projectId, datasetId, option1?.value, (err, res) => {
    //   if(err || !res?.success) {
    //     REActions.addNotificationError(err || Constants.errorDefault);
    //
    //   } else {
    //     StoreActions.schemaGetFileDataUse_(projectId, datasetId);
    //   }
    // });
  };

  onChangeEventTimestamp = (option1) => {
    let projectId = this.props.paramsProp?.get('projectId');
    let datasetId = this.props.paramsProp?.get('datasetId');

    // REClient_.client_().setEventTimestamp(projectId, datasetId, option1?.value, (err, res) => {
    //   if(err || !res?.success) {
    //     REActions.addNotificationError(err || Constants.errorDefault);
    //
    //   } else {
    //     StoreActions.schemaGetFileDataUse_(projectId, datasetId);
    //   }
    // });
  };

  onChangeColumnFilterText = (e) => {
    this.setState({
      columnFilterText: e.target.value,
    });
  };

  onChangeColumnFilterOnlyNonIgnored = (e) => {
    this.setState({
      columnFilterOnlyNonIgnored: e.target.checked,
    });
  };

  memFilterColumns = memoizeOne((dataList, columnFilterText, columnFilterOnlyNonIgnored) => {
    if (_.trim(columnFilterText || '') === '' || !dataList || dataList.length === 0) {
      if (columnFilterOnlyNonIgnored === true) {
        let list = [...(dataList ?? [])];
        list = list.filter((v1) => v1.featureMapping?.toLowerCase() !== 'ignore');
        return list;
      } else {
        return dataList;
      }
    } else {
      columnFilterText = columnFilterText?.toLowerCase() ?? '';

      let list = [...(dataList ?? [])];
      list = list.filter((v1) => v1.columnName?.toLowerCase().indexOf(columnFilterText) > -1);
      if (columnFilterOnlyNonIgnored === true) {
        list = list.filter((v1) => v1.featureMapping?.toLowerCase() !== 'ignore');
      }
      return list;
    }
  });

  memNonIgnoredColumns = memoizeOne((dataList) => {
    let res = 0;
    dataList?.some((d1) => {
      if (d1?.featureMapping?.toUpperCase() !== 'IGNORE') {
        res++;
      }
    });
    return res;
  });

  lastDatasetIdUsedForDatasetVersionsDataset = null;
  memDatasetVersionDatasetReadOnly = memoizeOne((datasetVersion, optionsFgVersion) => {
    if (optionsFgVersion != null && datasetVersion !== this.lastDatasetIdUsedForDatasetVersionsDataset) {
      this.lastDatasetIdUsedForDatasetVersionsDataset = datasetVersion;

      this.setState(
        {
          readOnly: false,
        },
        () => {
          let mv1 = datasetVersion;
          if (Utils.isNullOrEmpty(mv1)) {
            return;
          }

          if (optionsFgVersion?.find((v1) => v1?.value === mv1) == null) {
            return;
          }

          setTimeout(() => {
            this.setState({
              readOnly: optionsFgVersion?.find((v1) => v1?.value === mv1)?.isLast !== true,
            });
          }, 0);
        },
      );
    }
  });

  memDatasetVersionsDataset = memoizeOneCurry((doCall, datasetsParam, datasetId) => {
    return datasets.memDatasetListVersions(doCall, datasetsParam, datasetId);
  });

  memDatasetVersionsOptionsDataset = memoizeOne((fgVersionsList, datasetOne) => {
    return fgVersionsList?.map((f1, f1ind) => ({
      isLast: f1ind === 0,
      label: (
        <span>
          <span
            css={`
              display: none;
            `}
            className={'textVersion'}
          >
            {f1?.datasetVersion}&nbsp;-&nbsp;
          </span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: f1.datasetVersion,
      data: f1,
    }));
  });

  render() {
    let { isWizard, datasets, paramsProp, defDatasets, projects } = this.props;

    const isFeatureGroupSchema = this.isFeatureGroupSchema();

    const isTransactionNowForSetSchema = REClient_.client_().calcSetProjectDatasetColumnMappingIsInTransaction() > 0;

    let projectId = this.calcProjectId();
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let batchPredId = paramsProp?.get('batchPredId');
    let datasetVersion = paramsProp && paramsProp.get('datasetVersion');

    const showFilters = this.props.isFilters === true;

    let datasetOne = this.memDatasetOne(false)(datasets, datasetId);

    let fgVersionsList = this.memDatasetVersionsDataset(false)(this.props.datasets, datasetId);

    let datasetError;
    if (!isWizard) {
      if (!datasetId) {
        return <div></div>;
      }

      let datasetLifecycle;
      if (Utils.isNullOrEmpty(datasetVersion)) {
        datasetLifecycle = datasetOne?.get('status');
      } else {
        let dsVersionOne = fgVersionsList?.find((d1) => d1.datasetVersion === datasetVersion);
        datasetLifecycle = dsVersionOne?.status;
      }

      if (datasetLifecycle == null) {
        return <div></div>;
      }

      if ([DatasetLifecycle.COMPLETE].includes(datasetLifecycle)) {
        //
      } else if ([DatasetLifecycle.CANCELLED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED, DatasetLifecycle.FAILED].includes(datasetLifecycle)) {
        datasetError = (hh) => <RefreshAndProgress style={{ top: hh + 'px' }} errorMsg={'Dataset ' + DatasetLifecycleDesc[datasetLifecycle]}></RefreshAndProgress>;
      } else {
        datasetError = (hh) => <RefreshAndProgress style={{ top: hh + 'px' }} isMsgAnimRefresh={true} msgMsg={'Dataset is processing'}></RefreshAndProgress>;
      }
    }

    //
    let wizardProjectId = null;
    if (isWizard) {
      wizardProjectId = projectId;
      projectId = null;
    }

    let projectDatasetChanged = false;
    this.memNewOne(projectId, datasetId);
    if (this.memNewOneUsed) {
      this.memNewOneUsed = false;
      projectDatasetChanged = true;
    }

    let datasetFound = null,
      isStreaming = false;
    if (datasetId) {
      datasetFound = calcDatasetById(undefined, datasetId);
      isStreaming = datasetFound?.get('sourceType')?.toLowerCase() === 'streaming';
    }
    let datasetIsNotActive = false;
    if (datasetFound) {
      let dsLifecycle;
      if (Utils.isNullOrEmpty(datasetVersion)) {
        dsLifecycle = datasetOne?.get('status');
      } else {
        let dsVersionOne = fgVersionsList?.find((d1) => d1.datasetVersion === datasetVersion);
        dsLifecycle = dsVersionOne?.status;
      }
      if (![DatasetLifecycle.COMPLETE].includes(dsLifecycle)) {
        datasetIsNotActive = true;
      }
    } else {
      if (isWizard) {
        datasetIsNotActive = true;
      }
    }

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let isPnpPython = foundProject1?.isPnpPython === true;
    const isDrift = foundProject1?.isDrift;

    let useCase1 = this.memProjectUseCase(foundProject1);
    let schemaInfo = this.memUseCaseSchemas(false)(this.props.useCases, useCase1);

    let validationData = !datasetIsNotActive && paramsProp ? this.memValidation(false)(defDatasets, projectId, isFeatureGroupSchema) : null;
    let reqFieldsRes = !datasetIsNotActive && paramsProp ? this.memRequFeatures(false)(defDatasets, datasets, datasetId, projects, projectId, foundProject1, datasetOne) : null;
    let reqFields = reqFieldsRes?.reqFields;
    let reqError = reqFieldsRes?.reqError;

    let reqDatasetType = reqFields?.datasetType;

    let fileSchema = !datasetIsNotActive && paramsProp ? this.memDatasetIdProjectId(false)(reqDatasetType, validationData, defDatasets, datasetId, projectId, datasetOne, this.state.modelVersion, batchPredId, isFeatureGroupSchema) : null;

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let optionsFeatureTypes = this.memFeatureTypes(projectId, fileSchema, datasetOne, isFeatureGroupSchema);
    let optionsColumnTargetRes = this.memTargetTags(reqFields, datasetOne, isFeatureGroupSchema);
    let optionsColumnTarget = optionsColumnTargetRes && optionsColumnTargetRes.optionsColumnTarget;
    let optionsColumnTargetOnlyTimestamp = optionsColumnTargetRes && optionsColumnTargetRes.optionsColumnTargetOnlyTimestamp;

    const columns = this.memColumns(
      this.calcProjectId(),
      optionsColumnTarget,
      optionsColumnTargetOnlyTimestamp,
      optionsFeatureTypes,
      this.state.readOnly,
      this.state.columnFilterText,
      this.state.columnFilterOnlyNonIgnored,
      isFeatureGroupSchema,
    );

    let dataList = this.state.dataList;
    dataList = this.memFilterColumns(dataList, this.state.columnFilterText, this.state.columnFilterOnlyNonIgnored);

    let datasetSelectValue = null;
    let optionsDatasets = [];
    if (datasets) {
      let listDatasetsProj = this.memProjectDatasets(false)(this.props.projectDatasets, projectId);
      let listDatasets = this.memDatasetsList(false)(this.props.datasets, listDatasetsProj);
      optionsDatasets = this.memDatasetsOptions(listDatasets, projectId, false);
      if (projectId == null && (optionsDatasets == null || optionsDatasets.length === 0) && datasetFound) {
        optionsDatasets = [{ label: datasetFound.getIn(['dataset', 'name']), value: datasetFound.getIn(['dataset', 'datasetId']) }];
      }
      if (optionsDatasets && datasetFound) {
        datasetSelectValue = optionsDatasets.find((p1) => p1.value === datasetFound.getIn(['dataset', 'datasetId']));
      }
    }

    let listDatasetVersions = this.memDatasetVersions(false)(this.props.datasets, projectId, datasetId);
    let optionsDatasetsVersions = this.memDatasetVersionsOptions(listDatasetVersions);
    let datasetVersionsSelectValue = optionsDatasetsVersions?.find((v1) => v1.value === datasetVersion) ?? optionsDatasetsVersions?.[0];

    let saveIsDisabled = this.memSaveDisabled(this.state.isRefreshing, defDatasets, datasetId, projectId, dataList, reqFields, datasets, projects, foundProject1, datasetOne, batchPredId, isFeatureGroupSchema);

    let validationHH = this.state.validationHH ?? 120;
    let validationExtraHH = this.state.readOnly ? 0 : 70;
    if (isFeatureGroupSchema) {
      validationHH = 50;
    }

    let reqDatasetName = reqFields?.name;
    let reqFieldsList = reqFields && reqFields.allowedFeatureMappings && this.renderReqFieldsStatus(this.state.dataList, reqFields.allowedFeatureMappings);

    let optionsFields = this.memOptionsFields(dataList);
    let fieldsList = this.memFieldsList(optionsFields);
    let wizardFixRender = null;
    let wizardUseDisplayNot = false;
    if (!datasetIsNotActive && !showFilters && !this.state.editorIsEdit) {
      if (this.state.readOnly) {
        wizardFixRender = null;
      } else if (isTransactionNowForSetSchema) {
        wizardFixRender = null;
      } else if (this.state.listShownAtLeastOnce === true && this.state.listShownAtLeastOnceFordatasetType === reqFields?.datasetType) {
        wizardFixRender = null;
      } else {
        wizardFixRender = this.memFixWizardRender(
          this.state.wizardSelectedOptionColFound,
          saveIsDisabled,
          this.state.dataList,
          validationData,
          reqFields,
          optionsFields,
          this.state.wizardSelectedOption,
          fileSchema,
          this.state.confirmedMapping,
          datasetId,
          projectId,
          schemaInfo,
        );
      }
      wizardUseDisplayNot = !!(wizardFixRender == null && this.state.dataList && (reqFields || projectId == null) && optionsFields);
      if (!isTransactionNowForSetSchema) {
        this.memWizard(wizardUseDisplayNot, validationData, optionsDatasets, datasetId, projectId, reqFields?.datasetType, this.state.listShownAtLeastOnceFordatasetType, this.state.dataList == null);
      }
    }

    let wizardRender = isWizard && !isTransactionNowForSetSchema ? this.memAskWizard(this.props.authUser, this.state.wizardStepActual, this.state.wizardState) : null;

    let topAfterHeaderHH = 60;

    if (wizardRender != null || this.state.readOnly || isFeatureGroupSchema) {
      topAfterHeaderHH = 0;
    }

    let showTrainButton = false;
    let allOk = !isWizard && wizardFixRender == null;
    if (allOk) {
      let modelList = this.memModelList(false)(this.props.models, projectId);
      let modelSpansRes = this.memModelsSpans(modelList);
      let modelAnyTraining = modelSpansRes?.anyTraining ?? false;
      let modelAnyComplete = modelSpansRes?.anyComplete ?? false;

      showTrainButton = allOk && !showFilters && !modelAnyComplete && !modelAnyTraining;
    }

    if (this.state.readOnly || isFeatureGroupSchema || projectId == null) {
      showTrainButton = false;
    }

    if (showTrainButton) {
      topAfterHeaderHH += 50;
    }

    let datasetErrorsElem = null;
    if (!projectDatasetChanged && !isWizard) {
      datasetErrorsElem = this.memDatasetErrors(validationData);
    }

    const { optionsColumnNames, optionsColumnNamesTimestamps } = this.memOptionsColumns(dataList) ?? {};
    const optionRecordIdSel = this.memOptionRecordIdSel(fileSchema, optionsColumnNames);
    const optionEventTimestampSel = this.memOptionEventTimestampSel(fileSchema, optionsColumnNames);

    let showExtraInputsTop = false;
    // let extraUseCases = (Constants.flags.extra_inputs_schema_usecases ?? '')?.toUpperCase();
    // extraUseCases = ','+extraUseCases+',';
    // if(extraUseCases?.split(',')?.map(s1 => _.trim(s1))?.includes(useCase1?.toUpperCase())) {
    //   showExtraInputsTop = true;
    // }

    let modelVersionCount = datasetVersionsSelectValue?.count ?? 1;

    let nonIgnoredColumnsCount = this.memNonIgnoredColumns(dataList);

    let optionsFgVersion = this.memDatasetVersionsOptionsDataset(fgVersionsList, datasetOne);
    this.memDatasetVersionDatasetReadOnly(datasetVersion, optionsFgVersion);
    let fgVersionSelectValue;
    if (datasetVersion) {
      fgVersionSelectValue = optionsFgVersion?.find((d1) => d1?.value == datasetVersion);
    } else {
      fgVersionSelectValue = optionsFgVersion?.[0];
    }

    let errorMsg = reqError;
    return (
      <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px' }}>
        <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          <span style={{ display: 'none', float: 'right' /*display: wizardUseDisplayNot ? '' : 'none',*/ }}>
            <Button type={'primary'} disabled={saveIsDisabled} style={{ verticalAlign: 'top', marginTop: '3px' }} onClick={this.onClickSaveChanges.bind(this, true)}>
              Save Changes
            </Button>
          </span>
          {!isWizard && <span>{'Schemas'}</span>}
          {!isWizard && (
            <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '340px', display: 'inline-block', fontSize: '12px' }}>
              <SelectExt value={datasetSelectValue} options={optionsDatasets} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
            </span>
          )}

          {!isWizard && !isFeatureGroupSchema && (
            <span
              css={`
                margin-left: 10px;
              `}
            >
              Version
            </span>
          )}
          {!isWizard && !isFeatureGroupSchema && (
            <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '260px', display: 'inline-block', fontSize: '12px' }}>
              <SelectExt value={datasetVersionsSelectValue} options={optionsDatasetsVersions} onChange={this.onChangeSelectURLDirectFromValueVersion} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
            </span>
          )}

          {!isWizard && isFeatureGroupSchema && (
            <span
              css={`
                margin-left: 10px;
              `}
            >
              Version
            </span>
          )}
          {!isWizard && isFeatureGroupSchema && (
            <span
              css={`
                & .textVersion {
                  display: inline-block;
                }
                width: 200px;
                @media (max-width: 1540px) {
                  & .textVersion {
                    display: none;
                  }
                }
                @media (min-width: 1540px) {
                  width: 330px;
                }
              `}
              style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', display: 'inline-block', fontSize: '12px' }}
            >
              <SelectExt value={fgVersionSelectValue} options={optionsFgVersion ?? []} onChange={this.onChangeSelectURLDirectFromValueFGVersion} menuPortalTarget={popupContainerForMenu(null)} />
            </span>
          )}

          {!this.state.readOnly && !isFeatureGroupSchema && projectId != null && (
            <span style={{}}>
              {wizardUseDisplayNot && (
                <ModalConfirm
                  onConfirm={this.onClickResetToDetected}
                  title={`Are you sure? (You will need to click on "Save Changes" to save the changed schema)`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Reset'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  <Button type={'default'} ghost style={{ verticalAlign: 'top', marginTop: '3px', display: 'inline-block', marginLeft: '15px' }}>
                    Reset to Detected Schema
                  </Button>
                </ModalConfirm>
              )}
            </span>
          )}
          {showTrainButton && (
            <div
              style={{ textAlign: 'right', marginTop: '20px' }}
              css={`
                display: flex;
                align-items: center;
              `}
            >
              <div
                css={`
                  flex: 1;
                `}
              ></div>
              {showTrainButton && (
                <span>
                  <Link to={!projectId ? null : '/' + (isDrift ? PartsLink.model_create_drift : isPnpPython ? PartsLink.model_register : PartsLink.model_train) + '/' + projectId}>
                    <Button
                      css={`
                        vertical-align: top;
                        margin-top: 2px;
                      `}
                      type={'primary'}
                    >
                      Next Step -{'>'} {isPnpPython ? 'Register' : 'Train'} Model
                    </Button>
                  </Link>
                </span>
              )}
            </div>
          )}

          {false && useCase1 != null && (
            <div style={{ position: 'absolute', right: 0, top: 0 }}>
              <HelpBox name={'Schema'} linkTo={'/help/useCases/' + useCase1 + '/datasets'} />
            </div>
          )}
        </div>
        {!projectDatasetChanged && !isWizard && !isFeatureGroupSchema && !this.state.readOnly && (
          <div
            ref={(r1) => {
              this.refTopMsg = r1;
            }}
            style={{ display: 'flex', flexFlow: 'column' }}
            className={s.root}
          >
            <DashboardStepRect active={false} title={'Schema Validation'.toUpperCase()} style={{ flex: 1 }} isRelative>
              <div style={{ position: 'relative', display: 'block', height: '100%', padding: '17px 17px 17px 17px' }} className={sd.grayPanel}>
                <div>
                  <span style={{ position: 'relative', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    {reqDatasetName != null && (
                      <span style={{ marginLeft: '4px', cursor: 'pointer', fontFamily: 'Matter', fontSize: '16px', fontWeight: 500 }}>
                        <FontAwesomeIcon icon={['far', 'database']} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, marginRight: '3px' }} />
                        {reqDatasetName}&nbsp;<span style={{ color: Utils.colorA(0.8), fontWeight: 300 }}>(Required Columns)</span>
                      </span>
                    )}
                    <span style={{ marginLeft: '20px' }}>{reqFieldsList}</span>
                  </span>
                </div>
                {datasetErrorsElem}
              </div>
            </DashboardStepRect>

            {showExtraInputsTop && (
              <div
                css={`
                  margin-top: 10px;
                  height: 60px;
                  line-height: 1;
                  font-size: 14px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  flex-wrap: nowrap;
                `}
              >
                <div
                  css={`
                    font-family: Roboto;
                    font-size: 12px;
                    font-weight: bold;
                    color: #d1e4f5;
                    text-transform: uppercase;
                  `}
                >
                  Primary Key:
                </div>
                <div
                  css={`
                    width: 200px;
                    margin-left: 5px;
                    padding-bottom: 2px;
                  `}
                >
                  <SelectExt asText value={optionRecordIdSel ?? { label: '(Select)', value: null }} onChange={this.onChangeRecordId} options={optionsColumnNames} />
                </div>
                {optionsColumnNamesTimestamps?.length > 0 && (
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
                  </div>
                )}
                {optionsColumnNamesTimestamps?.length > 0 && (
                  <div
                    css={`
                      margin-left: 5px;
                      padding-bottom: 2px;
                      width: 200px;
                    `}
                  >
                    <SelectExt asText value={optionEventTimestampSel ?? { label: '(Select)', value: null }} onChange={this.onChangeEventTimestamp} options={optionsColumnNamesTimestamps} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {!projectDatasetChanged && isWizard && <div>{wizardRender}</div>}

        {!projectDatasetChanged && datasetError == null && !wizardFixRender && !showFilters && wizardUseDisplayNot && (
          <AutoSizer disableWidth>
            {({ height }) => {
              const filterHH = 50;
              return (
                <>
                  <div
                    css={`
                      position: absolute;
                      top: ${topAfterHeaderHH + validationHH}px;
                      left: 10px;
                      height: ${filterHH - 10}px;
                      right: 10px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span>Filter Columns By Name:</span>
                    <span
                      css={`
                        margin-left: 10px;
                        width: 200px;
                      `}
                    >
                      <Input value={this.state.columnFilterText ?? ''} onChange={this.onChangeColumnFilterText} allowClear={true} />
                    </span>
                  </div>
                  <RefreshAndProgress onClick={this.onCloseMenu} isRefreshing={this.state.isRefreshing} style={{ top: topAfterHeaderHH + validationHH + filterHH + 'px' }} errorMsg={errorMsg}>
                    <DndProvider backend={HTML5Backend}>
                      <TableExt isVirtual notsaveSortState={'dataset_schema_list'} height={height - topAfterHeaderHH - validationHH - filterHH} dataSource={dataList} columns={columns} calcKey={(r1) => r1.columnName} />
                    </DndProvider>
                  </RefreshAndProgress>
                </>
              );
            }}
          </AutoSizer>
        )}

        {datasetError?.(topAfterHeaderHH + validationHH + validationExtraHH)}

        {!projectDatasetChanged && datasetError == null && wizardFixRender && (
          <RefreshAndProgress isRefreshing={this.state.isRefreshing} style={{ top: topAfterHeaderHH + validationHH + validationExtraHH + 'px' }} errorMsg={errorMsg}>
            {wizardFixRender}
          </RefreshAndProgress>
        )}

        {!projectDatasetChanged && datasetError == null && datasetIsNotActive && !isWizard && <RefreshAndProgress isRefreshing={false} style={{ top: topAfterHeaderHH + 'px' }} errorMsg={'Dataset is not active'}></RefreshAndProgress>}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    datasets: state.datasets,
    defDatasets: state.defDatasets,
    projects: state.projects,
    useCases: state.useCases,
    authUser: state.authUser,
    models: state.models,
    projectDatasets: state.projectDatasets,
  }),
  null,
)(DatasetSchema);
