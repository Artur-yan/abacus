import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from 'antd/lib/alert';
import { Button } from '../../DesignSystem/Button/Button';
import Collapse from 'antd/lib/collapse';
import { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Menu from 'antd/lib/menu';
import Modal from 'antd/lib/modal';
import Immutable from 'immutable';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Provider } from 'react-redux';
import SplitPane from 'react-split-pane';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import defDatasets from '../../stores/reducers/defDatasets';
import featureGroups, { FeatureGroupVersionLifecycle } from '../../stores/reducers/featureGroups';
import projectDatasets from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import pythonFunctions from '../../stores/reducers/pythonFunctions';
import templates from '../../stores/reducers/templates';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import CopyText from '../CopyText/CopyText';
import CronOne from '../CronOne/CronOne';
import DateOld from '../DateOld/DateOld';
import DropdownExt from '../DropdownExt/DropdownExt';
import EditElemSpan from '../EditElemSpan/EditElemSpan';
import EditorElem from '../EditorElem/EditorElem';
import EditYesNoSpan from '../EditYesNoSpan/EditYesNoSpan';
import { calcLangType, FGLangType } from '../FeatureGroups/FGLangType';
import FGDuplicateWork from '../FGDuplicateWork/FGDuplicateWork';
import FGStreamingWork from '../FGStreamingWork/FGStreamingWork';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModalContent from '../ModalContent/ModalContent';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue, DetailValuePre } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import ResizeHeight from '../ResizeHeight/ResizeHeight';
import SelectExt from '../SelectExt/SelectExt';
import ShowMore from '../ShowMore/ShowMore';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import { toSpansFromConfig } from '../TemplateConfigEditor/TemplateConfigEditor';
import TextMax from '../TextMax/TextMax';
import TooltipExt from '../TooltipExt/TooltipExt';
import ViewLogs from '../ViewLogs/ViewLogs';
import styles from './FeatureGroupDetail.module.css';
import globalStyles from '../antdUseDark.module.css';

const { confirm } = Modal;
const { Panel } = Collapse;

const faNotebook = require('@fortawesome/pro-solid-svg-icons/faBug').faNotebook;

interface PythonFunctionData {
  codeSource?: {
    moduleDependencies: [];
    publishingMsg?: {
      warningInfo?: string;
    };
    sourceCode: string;
    sourceType: 'TEXT';
    status?: 'COMPLETE' | 'PUBLISHING' | 'PENDING';
  };
  createdAt: string; // eg. 2023-05-29T05:12:42+00:00
  functionName: string;
  functionType: 'FEATURE_GROUP';
  functionVariableMappings: [];
  name: string;
  notebookId: string;
  pythonFunctionId: string;
}

interface PythonFunctionWarningsProps {
  data?: PythonFunctionData;
}

function PythonFunctionWarnings(props: PythonFunctionWarningsProps) {
  if (['PUBLISHING', 'PENDING'].includes(props?.data?.codeSource?.status)) {
    return <div className={styles.checkingCode}>Checking code</div>;
  }

  if (props?.data?.codeSource?.status !== 'COMPLETE') {
    return;
  }

  const warningInfo = props?.data?.codeSource?.publishingMsg?.warningInfo;

  if (warningInfo) {
    return (
      <div>
        <div>Warnings:</div>
        <div className={styles.warning}>{warningInfo}</div>
      </div>
    );
  }

  return <div>Code Check Complete ✓</div>;
}

const maxDots = 2;

const AnalyzingText = () => {
  const [numberOfDots, setNumberOfDots] = React.useState(1);

  React.useEffect(() => {
    const id = setInterval(() => {
      setNumberOfDots((currentNumberOfDots) => (currentNumberOfDots + 1) % (maxDots + 1));
    }, 336);

    return () => clearInterval(id);
  }, []);
  const visibleDots = '.'.repeat(numberOfDots);
  const hiddenDots = '.'.repeat(maxDots - numberOfDots);

  return (
    <span className={styles.analyzingTextContainer}>
      <span>{`Analyzing code${visibleDots} `}</span>
      <span className={styles.hidden}>{hiddenDots}</span>
      🔍
    </span>
  );
};

interface IFeatureGroupDetailProps {
  paramsProp?: any;
  featureGroups?: any;
  useCases?: any;
  projects?: any;
  defDatasets?: any;
  projectDatasetsParam?: any;
  templates?: any;
  pythonFunctionsById: Immutable.Map<string, any>;
  projectId?: string;
  featureGroupId?: string;
  isSmall?: boolean;
}

interface IFeatureGroupDetailState {
  materializeIsRefreshing: boolean;
  isGeneratingExplanation: boolean;
  shortExplanation: JSX.Element;
  longExplanation: JSX.Element;
}

class FeatureGroupDetail extends React.PureComponent<IFeatureGroupDetailProps, IFeatureGroupDetailState> {
  private writeDeleteMeConfirm: any;
  private isM: boolean;
  private regenerateExplanation: boolean;
  confirmDsType: any;
  dsTypeChanged: string;
  dsTypeChangedLabel: string;
  confirmUsed: any;
  refDuplicateForm = React.createRef<FormInstance>();
  refDuplicateButton = React.createRef<HTMLButtonElement>();
  refSplitPane = React.createRef<HTMLDivElement>();

  constructor(props) {
    super(props);

    this.regenerateExplanation = false;

    this.state = {
      materializeIsRefreshing: false,
      isGeneratingExplanation: false,
      shortExplanation: null,
      longExplanation: null,
    };
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;

    if (this.confirmUsed != null) {
      this.confirmUsed.destroy();
      this.confirmUsed = null;
    }
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

  calcFeatureGroupId = () => {
    if (!Utils.isNullOrEmpty(this.props.featureGroupId)) {
      return this.props.featureGroupId;
    } else {
      return this.props.paramsProp?.get('featureGroupId');
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let showThreshold = this.props.paramsProp?.get('showThreshold');

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let featureGroupId = this.calcFeatureGroupId();

    const fgTypesList = this.memFGTypes(true)(this.props.featureGroups);
    let listFGs = this.memFGList(true)(this.props.featureGroups, projectId);
    let featureOne = this.memFeatureGroupOne(true)(this.props.featureGroups, projectId, featureGroupId);

    let featureGroupTemplateId = featureOne?.featureGroupTemplate?.featureGroupTemplateId;
    let templateOne = this.memTemplateOne(true)(this.props.templates, featureGroupTemplateId);

    let schemaInfo = this.memUseCaseSchemas(true)(this.props.useCases, foundProject1?.useCase);
    let validateData = this.memValidate(true)(this.props.defDatasets, projectId);

    let featuresGroupsVersionsList = this.memFGVersions(true)(this.props.featureGroups, featureGroupId);

    let featureGroupRefreshScheduleList = this.memFGRefreshSchedules(true)(this.props.featureGroups, featureGroupId);

    let datasetsList = this.memDatasetsProject(true)(projectId, this.props.projectDatasetsParam);
    let fgProjectCount = this.memFGAllProjects(true)(this.props.featureGroups, null, featureGroupId);

    let isSampling = featureOne?.featureGroupSourceType?.toUpperCase() === 'sampling'.toUpperCase();
    let samplingConfigOptions = this.memSamplingConfigOptions(isSampling)(this.props.featureGroups, featureGroupId);

    this.memFGNone(featureGroupId);
    this.memPythonFunctionsById(true)(featureOne?.pythonFunctionName);

    const shouldGenerateExplanation = ['PYTHON', 'SQL', 'TEMPLATE'].includes(featureOne?.featureGroupSourceType?.toUpperCase);
    const regenerateExlanationParam = this.props.paramsProp?.get?.('regenerateExplanation');
    if (shouldGenerateExplanation && regenerateExlanationParam && !this.regenerateExplanation) {
      this.regenerateExplanation = true;
      this.onClickGenerateExplanation(featureGroupId, projectId, () => {});
    }
  };

  memFGNone = memoizeOne((featureGroupId) => {
    if (featureGroupId) {
      StoreActions.featureGroupsDescribe_(null, featureGroupId);
    }
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  componentDidUpdate(prevProps: Readonly<IFeatureGroupDetailProps>, prevState: Readonly<IFeatureGroupDetailState>, snapshot?: any): void {
    this.doMem();
  }

  onClickRemove = (featureGroupId) => {
    let projectId = this.calcProjectId();
    if (featureGroupId && projectId) {
      REClient_.client_().removeFeatureGroupFromProject(featureGroupId, projectId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Done!');
          let projectId = this.calcProjectId();
          if (projectId == null) {
            Location.push('/' + PartsLink.featuregroups_list);
          } else {
            StoreActions.validateProjectDatasetsReset_();
            StoreActions.getProjectsById_(projectId);
            StoreActions.getProjectDatasets_(projectId, (res, ids) => {
              StoreActions.listDatasets_(ids);
            });
            StoreActions.featureExportsList_(featureGroupId);
            StoreActions.featureGroupsGetByProject_(projectId);
            Location.push('/' + PartsLink.feature_groups + '/' + projectId);
          }
        }
      });
    }
  };

  onClickRenameFeatureGroup = (featureGroupId, featureGroupName, param1) => {
    let editNameValue = featureGroupName;

    if (this.confirmUsed != null) {
      this.confirmUsed.destroy();
      this.confirmUsed = null;
    }

    this.confirmUsed = confirm({
      title: 'Rename Feature Group',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + featureGroupName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={featureGroupName}
            defaultValue={featureGroupName}
            onChange={(e) => {
              editNameValue = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (editNameValue != featureGroupName) {
          //delete it
          REActions.addNotification('Renaming feature group to "' + editNameValue + '"');

          REClient_.client_().updateFeatureGroup(featureGroupId, editNameValue, null, null, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Feature Group Renamed!');

              let r1 = featureGroups.memFeatureGroupsForId(false, null, featureGroupId);
              if (r1 != null) {
                StoreActions.featureGroupsDescribe_(null, featureGroupId);
              }

              REClient_.client_()._getFeatureGroupProjects(featureGroupId, (err, res) => {
                StoreActions.featureExportsList_(featureGroupId);
                let ids = res?.result;
                if (ids != null && _.isArray(ids)) {
                  ids.some((id1) => {
                    let p1 = memProjectById(id1, false);
                    if (p1 != null) {
                      StoreActions.getProjectsById_(id1);
                      StoreActions.getProjectDatasets_(id1, (res, ids) => {
                        StoreActions.listDatasets_(ids);
                      });
                      StoreActions.featureGroupsGetByProject_(id1);
                    }

                    let r1 = featureGroups.memFeatureGroupsForId(false, id1, featureGroupId);
                    if (r1 != null) {
                      REClient_.client_().listBatchPredictions(id1, null, (err, res) => {
                        let ids = res?.result?.map((r1) => r1?.batchPredictionId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
                        if (ids != null && ids.length > 0) {
                          ids.some((id1) => {
                            StoreActions.batchDescribeById_(id1);
                          });
                        }
                      });

                      StoreActions.featureExportsList_(featureGroupId);
                      StoreActions.featureGroupsDescribe_(id1, featureGroupId);
                    }
                  });
                }
              });
            }
          });
        }
      },
      onCancel: () => {},
    });
  };

  onClickDelete = (featureGroupId) => {
    if (featureGroupId) {
      let projectId = this.calcProjectId();
      let featureOne = this.memFeatureGroupOne(false)(this.props.featureGroups, projectId, featureGroupId);
      let sourceTables = featureOne?.sourceTables;

      REClient_.client_().deleteFeatureGroup(featureGroupId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Done!');
          if (projectId == null) {
            StoreActions.featureGroupsDescribeReset_();
            Location.push('/' + PartsLink.featuregroups_list);
          } else {
            StoreActions.getProjectsById_(projectId);
            StoreActions.getProjectDatasets_(projectId, (res, ids) => {
              StoreActions.listDatasets_(ids);
            });
            StoreActions.featureExportsList_(featureGroupId);
            StoreActions.featureGroupsGetByProject_(projectId);

            StoreActions.featureGroupsGetByTemplateId_(featureOne?.featureGroupTemplateId);
            StoreActions.describeTemplate_(featureOne?.featureGroupTemplateId);
            StoreActions.featureGroupsDescribeReset_();

            let r1 = featureGroups.memFeatureGroupsForId(false, null, featureGroupId);
            if (r1 != null) {
              StoreActions.featureGroupsDescribe_(null, featureGroupId);
            }

            if (sourceTables != null) {
              sourceTables?.some((t1) => {
                if (t1 == null || t1 === '' /* || _.startsWith(t1, 'datasets_')*/) {
                  return;
                }

                REClient_.client_().describeFeatureGroupByTableName(t1, null, (err, res) => {
                  let featureGroupId = res?.result?.featureGroupId;
                  let pp = res?.result?.projects?.map((p1) => p1?.projectId);

                  StoreActions.featureGroupsDescribe_(null, featureGroupId);
                  pp?.some((id1) => {
                    StoreActions.featureGroupsDescribe_(id1, featureGroupId);
                  });
                });
              });
            }

            REClient_.client_()._getFeatureGroupProjects(featureGroupId, (err, res) => {
              let ids = res?.result;
              if (ids != null && _.isArray(ids)) {
                ids.some((id1) => {
                  let p1 = memProjectById(id1, false);
                  if (p1 != null) {
                    StoreActions.getProjectsById_(id1);
                    StoreActions.getProjectDatasets_(id1, (res, ids) => {
                      StoreActions.listDatasets_(ids);
                    });
                    StoreActions.featureGroupsGetByProject_(id1);
                  }

                  let r1 = featureGroups.memFeatureGroupsForId(false, id1, featureGroupId);
                  if (r1 != null) {
                    REClient_.client_().listBatchPredictions(id1, null, (err, res) => {
                      let ids = res?.result?.map((r1) => r1?.batchPredictionId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
                      if (ids != null && ids.length > 0) {
                        ids.some((id1) => {
                          StoreActions.batchDescribeById_(id1);
                        });
                      }
                    });

                    StoreActions.featureExportsList_(featureGroupId);
                    StoreActions.featureGroupsDescribe_(id1, featureGroupId);
                  }
                });
              }
            });

            Location.push('/' + PartsLink.feature_groups + '/' + projectId);
          }
        }
      });
    }
  };

  onChangeProjectUsed = (option1) => {
    let pId = option1?.value;
    let featureGroupId = this.calcFeatureGroupId();
    if (pId && featureGroupId) {
      Location.push('/' + this.props.paramsProp?.get('mode') + '/' + pId + '/' + featureGroupId);
    }
  };

  onChangePermLock = (v1) => {
    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();

    REClient_.client_().setFeatureGroupModifierLock(featureGroupId, v1 === true, (err, res) => {
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

  onChangeUseForTraining = (v1) => {
    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();
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

  memFGAllProjects = memoizeOneCurry((doCall, featureGroupsParam, projectId, featureGroupId) => {
    return featureGroups.memFeatureGroupsForId(doCall, null, featureGroupId);
  });

  memFeatureGroupOne = memoizeOneCurry((doCall, featureGroupsParam, projectId, featureGroupId) => {
    return featureGroups.memFeatureGroupsForId(doCall, projectId, featureGroupId);
  });

  memSamplingConfigOptions = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupSamplingConfigOptions(doCall, featureGroupId);
  });

  memTemplateOne = memoizeOneCurry((doCall, templatesParam, featureGroupTemplateId) => {
    return templates.memDetailById(doCall, featureGroupTemplateId);
  });

  memValidate = memoizeOneCurry((doCall, defDatasetsParam, projectId) => {
    return defDatasets.memValidationForProjectId(doCall, projectId);
  });

  memValidateError = memoizeOne((validateData, featureGroupId) => {
    if (validateData && featureGroupId) {
      let errMsgObj = null;
      validateData?.datasetErrors?.some((e1, e1ind) => {
        if (e1?.featureGroupId === featureGroupId) {
          errMsgObj = e1;
          return true;
        }
      });
      return errMsgObj;
    }
  });

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (!Utils.isNullOrEmpty(this.props.projectId)) {
      projectId = this.props.projectId;
    }

    if (Utils.isNullOrEmpty(projectId) || projectId === '-') {
      projectId = null;
    }
    return projectId;
  };

  memOptionsDsTypes = memoizeOne((schemaInfo) => {
    let list = schemaInfo?.list
      ?.map((s1) => {
        let name1 = s1;

        let n1 = schemaInfo?.[s1]?.title;
        if (!Utils.isNullOrEmpty(n1)) {
          name1 = n1;
        }

        let v1 = schemaInfo?.[s1]?.dataset_type ?? schemaInfo?.[s1]?.datasetType ?? s1;

        if (v1?.toUpperCase() === Constants.custom_table) {
          return null;
        }

        return {
          label: name1,
          value: v1,
        };
      })
      ?.filter((v1) => v1 != null);
    if (list?.find((o1) => o1.value?.toUpperCase() === Constants.custom_table) == null) {
      list?.unshift({
        label: Constants.custom_table_desc,
        value: Constants.custom_table,
      });
    }

    return list;
  });

  onEditChangeDsType = (option1) => {
    this.dsTypeChangedLabel = option1?.label;
    this.dsTypeChanged = option1?.value;
    this.forceUpdate();
  };

  onCancelChangedsType = () => {
    this.dsTypeChanged = undefined;
    this.dsTypeChangedLabel = undefined;
    this.forceUpdate();
  };

  onSetChangeDsType = () => {
    if (this.confirmDsType != null) {
      this.confirmDsType.destroy();
      this.confirmDsType = null;
    }

    this.confirmDsType = confirm({
      title: 'Do you want to change the Feature Group Type to ' + (this.dsTypeChangedLabel ?? '(None)'),
      okText: 'Change',
      maskClosable: true,
      content: <div></div>,
      onOk: () => {
        let ds1 = this.dsTypeChanged;
        this.dsTypeChanged = undefined;
        this.dsTypeChangedLabel = undefined;

        const projectId = this.calcProjectId();
        let featureGroupId = this.calcFeatureGroupId();
        REClient_.client_().updateFeatureGroupDatasetType(projectId, featureGroupId, ds1?.toUpperCase(), (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.featureGroupsGetByProject_(projectId, (list) => {
              list?.some((f1) => {
                StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
              });
            });
            StoreActions.getProjectsById_(projectId);
          }
        });

        if (this.confirmDsType != null) {
          this.confirmDsType.destroy();
          this.confirmDsType = null;
        }
        this.forceUpdate();
      },
      onCancel: () => {
        this.dsTypeChanged = undefined;
        this.dsTypeChangedLabel = undefined;

        if (this.confirmDsType != null) {
          this.confirmDsType.destroy();
          this.confirmDsType = null;
        }

        this.forceUpdate();
      },
    });
  };

  onChangeDsType = (option1) => {
    this.dsTypeChangedLabel = option1?.label;
    this.dsTypeChanged = option1?.value;
    this.forceUpdate();
  };

  memFGList = memoizeOneCurry((doCall, featureGroupsParam, projectId) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

  onChangeDropdownFGSel = (option1) => {
    if (option1?.value) {
      Location.push('/' + this.props.paramsProp?.get('mode') + '/' + this.props.paramsProp?.get('projectId') + '/' + option1?.value);
    }
  };

  memFGOptions = memoizeOne((listFGs) => {
    return listFGs?.map((f1) => ({ label: f1.tableName ?? f1.name, value: f1.featureGroupId })) ?? [];
  });

  memFGVersionsSlice = memoizeOne((featuresGroupsVersionsList) => {
    if (featuresGroupsVersionsList && _.isArray(featuresGroupsVersionsList)) {
      return featuresGroupsVersionsList.slice(0, 30);
    }
  });

  memFGVersions = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupsVersionsForFeatureGroupId(doCall, featureGroupId);
  });

  memFGRefreshSchedules = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureRefreshForFeatureGroupId(doCall, featureGroupId);
  });

  memMater = memoizeOne((featuresGroupsVersionsList) => {
    return [FeatureGroupVersionLifecycle.PENDING, FeatureGroupVersionLifecycle.GENERATING].includes(featuresGroupsVersionsList?.[0]?.status ?? '-');
  });

  memFGVersionsColumns = memoizeOne((projectId, featureGroupId, isSmall, useCase, isPythonFG) => {
    let res = [
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld date={text} always />;
        },
        width: 200,
        helpId: 'fg_detail_table_header_createdAt',
      },
      {
        title: 'Feature Group Version',
        field: 'featureGroupVersion',
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
        width: 220,
        helpId: 'fg_detail_table_header_featureGroupVersion',
      },
      {
        title: 'Status',
        field: 'status',
        helpId: 'fg_detail_table_header_status',
        render: (text, row, index) => {
          if ([FeatureGroupVersionLifecycle.PENDING, FeatureGroupVersionLifecycle.GENERATING].includes(row.status || '')) {
            StoreActions.refreshDoFGVersionsAll_(this.calcProjectId(), featureGroupId, row.featureGroupVersion);
          }

          let isUploading = row.featureGroupVersion && StoreActions.refreshFGVersionsUntilStateIsUploading_(row.featureGroupVersion);

          if (isUploading) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(row.lifecycle ?? '')}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(text)}</span>;
            if ((text || '').toLowerCase() === 'failed') {
              res = <span className={globalStyles.red}>{res}</span>;
            }
            return res;
          }
        },
        width: 160,

        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ((text || '').toLowerCase() === 'failed') {
            if (row.error) {
              let m1 = row.error;
              if (m1?.indexOf('\n') > -1) {
                let mm = m1.split('\n');
                m1 = mm.map((m1, ind) => <div key={'m' + ind}>{m1}</div>);
              }

              res = (
                <span
                  css={`
                    display: flex;
                    align-items: center;
                  `}
                >
                  <span
                    css={`
                      margin-right: 5px;
                      white-space: nowrap;
                    `}
                  >
                    Error:
                  </span>
                  <span
                    css={`
                      color: #bf2c2c;
                      display: inline-block;
                    `}
                  >
                    {m1}
                  </span>
                </span>
              );
            }
          }
          return res;
        },
      },
      {
        title: 'Explore',
        helpId: 'fg_detail_table_header_explore',
        field: null,
        width: 80,
        render: (text, row, index) => {
          if (![FeatureGroupVersionLifecycle.COMPLETE].includes(row.status?.toUpperCase())) {
            return null;
          }
          return (
            <Link
              usePointer
              className={globalStyles.styleTextBlue}
              forceSpanUse
              to={['/' + PartsLink.feature_groups_data_explorer + '/' + (projectId ?? '-') + '/' + featureGroupId, 'featureGroupVersion=' + encodeURIComponent(row.featureGroupVersion)]}
            >
              View
            </Link>
          );
        },
      },
      {
        title: 'Data',
        helpId: 'fg_detail_table_header_data',
        field: null,
        width: 80,
        render: (text, row, index) => {
          if (![FeatureGroupVersionLifecycle.COMPLETE].includes(row.status?.toUpperCase())) {
            return null;
          }
          return (
            <Link
              usePointer
              className={globalStyles.styleTextBlue}
              forceSpanUse
              to={['/' + PartsLink.features_rawdata + '/' + (projectId ?? '-') + '/' + featureGroupId, 'featureGroupVersion=' + encodeURIComponent(row.featureGroupVersion)]}
            >
              View
            </Link>
          );
        },
      },
      {
        title: '',
      },
      {
        title: 'Actions',
        helpId: 'fg_detail_table_header_actions',
        noAutoTooltip: true,
        noLink: true,
        field: null,
        render: (text, row, index) => {
          return (
            <span>
              {(Constants.isShowViewLogs(useCase) || isPythonFG) && [FeatureGroupVersionLifecycle.COMPLETE, FeatureGroupVersionLifecycle.FAILED].includes(row?.status) && (
                <ModalConfirm
                  width={900}
                  title={
                    <Provider store={Utils.globalStore()}>
                      <div className={'useDark'}>
                        <ViewLogs featureGroupVersion={row.featureGroupVersion} />
                      </div>
                    </Provider>
                  }
                  okText="Close"
                  cancelText={null}
                  okType="primary"
                >
                  <Button className={styles.actionsButton} ghost>
                    Logs
                  </Button>
                </ModalConfirm>
              )}
              {[FeatureGroupVersionLifecycle.COMPLETE].includes(row.status?.toUpperCase()) && (
                <Link to={['/' + PartsLink.feature_groups_export_add + '/' + (projectId ?? '-') + '/' + featureGroupId, 'useVersion=' + encodeURIComponent(row.featureGroupVersion ?? '')]}>
                  <Button className={styles.actionsButton} type="primary" ghost>
                    Export
                  </Button>
                </Link>
              )}
              {[FeatureGroupVersionLifecycle.COMPLETE].includes(row.status?.toUpperCase()) && (
                <Link to={['/' + PartsLink.feature_groups_snapshot + '/' + (projectId ?? '-') + '/' + featureGroupId, 'useVersion=' + encodeURIComponent(row.featureGroupVersion ?? '')]}>
                  <Button className={styles.actionsButton} type="primary" ghost>
                    Snapshot
                  </Button>
                </Link>
              )}
              {Constants.flags.show_log_links && (
                <span>
                  <br />
                  <Link newWindow to={'/api/v0/_getPipelineStageLogHtml?resourceId=' + encodeURIComponent(row.featureGroupVersion ?? '')} noApp style={{ cursor: 'pointer' }}>
                    <Button customType="internal" className={styles.actionsButton}>
                      Internal: View Logs
                    </Button>
                  </Link>
                  <Link newWindow to={'/api/v0/_getPipelineStageLog?resourceId=' + encodeURIComponent(row.featureGroupVersion ?? '')} noApp style={{ cursor: 'pointer' }}>
                    <Button className={styles.actionsButton} customType="internal">
                      Internal: Download Logs
                    </Button>
                  </Link>
                </span>
              )}
            </span>
          );
        },
        width: 290,
        hidden: isSmall,
      },
    ] as ITableExtColumn[];

    res = res.filter((r1) => !r1?.hidden);

    if (isSmall) {
      res = res.filter((r1) => !['Explore', 'Data'].includes(r1.title));
    }

    return res;
  });

  onClickCreateNewVersionOnClick = () => {
    return new Promise((resolve) => {
      this.setState({
        materializeIsRefreshing: true,
      });
      REClient_.client_().listFeatureGroupVersions(this.calcFeatureGroupId(), 10, null, (err, res) => {
        this.setState({
          materializeIsRefreshing: false,
        });

        let res1 = res?.result;

        if (res1 == null || res1?.length === 0) {
          this.onClickCreateNewVersion(null);
          resolve(false);
          return;
        }

        if (res1?.some((r1) => [FeatureGroupVersionLifecycle.COMPLETE, FeatureGroupVersionLifecycle.GENERATING, FeatureGroupVersionLifecycle.PENDING].includes(r1?.status))) {
          resolve(true);
          return;
        }

        this.onClickCreateNewVersion(null);
        resolve(false);
      });
    });
  };

  onClickCreateNewVersion = (e) => {
    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();

    REClient_.client_().createFeatureGroupSnapshot(projectId, featureGroupId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.featureGroupsVersionsList_(featureGroupId);
      }
    });
  };

  onClickTablename = (tablename, featureGroupId, e, openNewWindow = false) => {
    REClient_.client_().describeFeatureGroupByTableName(tablename, this.calcProjectId(), (err, res) => {
      let featureGroupId = res?.result?.featureGroupId;
      if (err || !res?.success || featureGroupId == null) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let pp = res?.result?.projects?.map((p1) => p1?.projectId);
        let p1 = '-';
        if (pp != null) {
          if (pp.includes(this.calcProjectId())) {
            p1 = '' + this.calcProjectId();
          } else if (pp.length === 1) {
            p1 = pp[0];
          }
        }
        Location.push('/' + PartsLink.feature_group_detail + '/' + p1 + '/' + featureGroupId, undefined, undefined, undefined, openNewWindow);
      }
    });
  };

  onClickTablenameDataset = (datasetId, featureOne, e, openNewWindow = false) => {
    let p1 = this.calcProjectId() == null ? '' : '/' + this.calcProjectId();
    Location.push('/' + PartsLink.dataset_detail + '/' + datasetId + p1, undefined, undefined, undefined, openNewWindow);
  };

  getHighlightedText = (text) => {
    const regexWithDelimiter = /(`[^`]*`)/g;
    const regexWithoutDelimiter = /`([^`]*)`/g;

    const splitText = text.split(regexWithDelimiter);
    return (
      <div>
        {splitText.map((segment, index) => {
          if (regexWithDelimiter.test(segment)) {
            return (
              <span key={index} className={styles.codeInExplanation}>
                {segment.replace(regexWithoutDelimiter, '$1')}
              </span>
            );
          } else {
            return <span key={index}>{segment}</span>;
          }
        })}
      </div>
    );
  };

  onClickGenerateExplanation = async (featureGroupId, projectId, cb?) => {
    if (this.state.isGeneratingExplanation) {
      return;
    }
    this.setState({ isGeneratingExplanation: true });
    try {
      const createRequest = await REClient_.promises_().createNaturalLanguageExplanationRequest(featureGroupId, null);
      if (!createRequest?.success || createRequest?.error) {
        throw new Error(createRequest?.error);
      }
      let requestId = createRequest?.requestId;
      let shortExplanation = '',
        longExplanation = '';
      let status = null;
      const delay = (ms) => new Promise((res) => setTimeout(res, ms));
      while (status != 'COMPLETED') {
        await delay(100);
        const currentState = await REClient_.promises_().getNaturalLanguageExplanationRequestStatus(requestId);
        if (!currentState?.success || currentState?.error) {
          throw new Error(currentState?.error);
        }
        status = currentState?.result?.status;

        if (!currentState?.result?.response?.short || !currentState?.result?.response?.long || !currentState?.result?.response?.short?.includes(shortExplanation) || !currentState?.result?.response?.long?.includes(longExplanation)) {
          continue;
        }

        shortExplanation = currentState?.result?.response?.short;
        longExplanation = currentState?.result?.response?.long;
        this.setState({ shortExplanation: this.getHighlightedText(shortExplanation), longExplanation: this.getHighlightedText(longExplanation) });
      }
      const updateResponse = await REClient_.promises_().setNaturalLanguageExplanation(shortExplanation, longExplanation, featureGroupId, null, null);
      if (!updateResponse?.success || updateResponse?.error) {
        throw new Error(updateResponse?.error);
      }
      StoreActions.featureGroupsDescribe_(projectId, featureGroupId, () => {
        this.setState({ isGeneratingExplanation: false });
        cb?.(false);
      });
      this.setState({ shortExplanation: null, longExplanation: null });
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
      this.setState({ isGeneratingExplanation: false });
      cb?.(true);
    }
  };

  onClickShowDoEdit = (e) => {
    if (this.props.isSmall) {
      return;
    }

    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();

    let featureOne = this.memFeatureGroupOne(false)(this.props.featureGroups, projectId, featureGroupId);
    let fgLang: FGLangType = calcLangType(featureOne?.featureGroupSourceType);

    REActions.addNotification(`Read-only, click 'Edit ${fgLang === FGLangType.Python ? 'Code' : 'SQL'} and Details' button to edit`);
  };

  memNestedCols = memoizeOne((featureOne) => {
    return featureOne?.projectFeatureGroupSchema?.schema?.filter((c1) => c1?.columns != null);
  });

  memPitCols = memoizeOne((featureOne) => {
    return featureOne?.projectFeatureGroupSchema?.schema?.filter((c1) => c1?.pointInTimeInfo != null);
  });

  onClickDeployFG = (projectId, featureOne, e) => {
    Location.push('/' + PartsLink.deploy_create_fg + '/' + featureOne?.featureGroupId + (projectId ? '/' + projectId : ''));
  };

  onClickConnectFGRemove = (projectId, featureOne, e) => {
    let featureGroupId = featureOne?.featureGroupId;

    REClient_.client_().removeConcatenationConfig(featureGroupId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.featureGroupsGetByProject_(projectId);
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId);

        StoreActions.featureGroupsDescribe_(null, featureGroupId, (res) => {
          let pIds = res?.projects?.map((p1) => p1?.projectId);
          if (pIds && pIds.length > 0) {
            pIds.some((id1) => {
              StoreActions.featureGroupsDescribe_(id1, featureGroupId);
            });
          }
        });
      }
    });
  };

  onClickConnectFG = (projectId, featureOne, e) => {
    let isStreamingFG = featureOne?.streamingEnabled == true;
    Location.push(
      '/' + PartsLink.feature_groups_add + '/' + projectId,
      undefined,
      'useType=' + encodeURIComponent(FGLangType.Streaming) + '&' + (isStreamingFG ? 'fromStreamingFeatureGroup' : 'fromFeatureGroup') + '=' + encodeURIComponent(this.calcFeatureGroupId() ?? ''),
    );
  };

  onClickStarred = (featureGroupId, projectId, starred, e) => {
    REClient_.client_()._starFeatureGroup(featureGroupId, starred, (err, res) => {
      StoreActions.featureGroupsGetByProject_(projectId);
      StoreActions.featureGroupsDescribe_(projectId, featureGroupId);

      StoreActions.featureGroupsDescribe_(null, featureGroupId, (res) => {
        let pIds = res?.projects?.map((p1) => p1?.projectId);
        if (pIds && pIds.length > 0) {
          pIds.some((id1) => {
            StoreActions.featureGroupsDescribe_(id1, featureGroupId);
          });
        }
      });
    });
  };

  memDatasetsProject = memoizeOneCurry((doCall, projectId, projectDatasetsParam) => {
    return projectDatasets.memDatasetsByProjectId(doCall, undefined, projectId);
  });

  memFGTypes = memoizeOneCurry((doCall, featureGroupsParam) => {
    return featureGroups.memFeatureGroupTypes(doCall);
  });

  memPythonFunctionsById = memoizeOneCurry((doCall, name) => {
    return pythonFunctions.memPythonFunctionsByIdTillCodeCheckComplete(doCall, name);
  });

  memFGTypesOptions = memoizeOne((fgTypesList) => {
    return fgTypesList?.map((t1) => ({ label: t1.label, value: t1.name, data: t1 }));
  });

  onClickActionLink = (link1, e) => {
    Link.doGotoLink(link1, e);
  };

  doDownloadRawData = (e) => {
    window.open('/api/v0/_downloadSmallFeatureGroupCSV?featureGroupId=' + this.calcFeatureGroupId() /*+'&columnFilters='*/, '_blank');
  };

  onClickUnlinkTemplate = (featureGroupId, featureGroupTemplateId, e) => {
    REClient_.client_().detachFeatureGroupFromTemplate(featureGroupId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let projectId = this.calcProjectId();

        StoreActions.featureGroupsGetByProject_(projectId);
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        StoreActions.featureGroupsDescribeReset_();

        StoreActions.featureGroupsDescribe_(null, featureGroupId, (res) => {
          let pIds = res?.projects?.map((p1) => p1?.projectId);
          if (pIds && pIds.length > 0) {
            pIds.some((id1) => {
              StoreActions.featureGroupsDescribe_(id1, featureGroupId);
            });
          }
        });
      }
    });
  };

  onClickGoEditTemplate = (featureGroupId, featureGroupTemplateId, isEditTemplate, e) => {
    if (isEditTemplate) {
      Location.push(
        '/' + PartsLink.template_one + '/' + featureGroupTemplateId,
        undefined,
        'isEdit=1&fullEdit=1&fromFeatureGroupId=' + encodeURIComponent(featureGroupId) + '&fromProjectId=' + encodeURIComponent(this.props.paramsProp?.get('projectId')),
      );
    } else {
      Location.push(
        '/' + PartsLink.feature_groups_edit + '/' + (this.calcProjectId() ?? '-') + '/' + featureGroupId,
        undefined,
        'useType=sql&useTemplateId=' + encodeURIComponent(featureGroupTemplateId) + (isEditTemplate ? '&fullEdit=1' : ''),
      );
    }
  };

  onClickCreateTemplate = (featureGroupId) => {
    Location.push('/' + PartsLink.feature_groups_template_add + '/' + (this.calcProjectId() ?? '-') + '/' + featureGroupId, undefined, 'featureGroupId=' + encodeURIComponent(featureGroupId));
  };

  onRefreshSchedule = () => {
    let featureGroupId = this.calcFeatureGroupId();

    if (featureGroupId) {
      StoreActions.featureRefreshPolicieList(featureGroupId);
    }
  };

  onEditRefreshSchedule = (projectId, featureGroupId, refreshPolicyId) => {
    Location.push('/' + PartsLink.feature_groups_schedule_add + '/' + projectId + '/' + featureGroupId + `?refreshPolicyId=${refreshPolicyId}`);
  };

  render() {
    let { paramsProp, isSmall } = this.props;
    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    const isFeatureStore = foundProject1?.isFeatureStore;
    let featureGroupId = this.calcFeatureGroupId();
    const isDrift = foundProject1?.isDrift;

    let dataList = [];

    let featureOne = this.memFeatureGroupOne(false)(this.props.featureGroups, projectId, featureGroupId);
    const pythonFunctionOne = this.props.pythonFunctionsById.get(featureOne?.pythonFunctionName);
    const pythonFunctionURL = ['/' + PartsLink.feature_groups_edit + '/' + (projectId ?? '-') + '/' + featureGroupId];
    let featureGroupTemplateId = featureOne?.featureGroupTemplate?.featureGroupTemplateId;
    let templateVariables = featureOne?.templateBindings;
    if (templateVariables?.templateBindings != null) {
      templateVariables = templateVariables?.templateBindings; //TODO remove
    }
    let templateOne = this.memTemplateOne(false)(this.props.templates, featureGroupTemplateId);

    let isTemplate = featureOne?.featureGroupSourceType?.toUpperCase() === 'TEMPLATE';

    let validateData = this.memValidate(false)(this.props.defDatasets, projectId);
    let validateErrObj = this.memValidateError(validateData, featureGroupId);
    const fgTypesList = this.memFGTypes(false)(this.props.featureGroups);
    const optionsFGTypes = this.memFGTypesOptions(fgTypesList);

    let schemaInfo = this.memUseCaseSchemas(false)(this.props.useCases, foundProject1?.useCase);
    const optionsDsTypes = this.memOptionsDsTypes(schemaInfo);

    let ds1 = featureOne?.datasetType;
    if (this.dsTypeChanged !== undefined) {
      ds1 = this.dsTypeChanged;
    }
    const optionsDsTypesSel = optionsDsTypes?.find((o1) => o1.value?.toLowerCase() == ds1?.toLowerCase());

    let fgTypeElemEdit = (
      <span
        css={`
          width: 240px;
          font-size: 14px;
          display: inline-block;
        `}
      >
        <SelectExt isDisabled={isSmall} value={optionsDsTypesSel ?? { label: Constants.custom_table_desc, value: Constants.custom_table_desc }} onChange={this.onChangeDsType} options={optionsDsTypes} />
      </span>
    );
    let fgTypeElem = isSmall ? (
      fgTypeElemEdit
    ) : (
      <span>
        <EditElemSpan value={optionsDsTypesSel?.label ?? Constants.custom_table_desc} onSet={this.onSetChangeDsType} onCancel={this.onCancelChangedsType} onEdit={this.onEditChangeDsType.bind(this, optionsDsTypesSel)}>
          {fgTypeElemEdit}
        </EditElemSpan>
      </span>
    );
    if (optionsDsTypes?.length === 1) {
      fgTypeElem = <span>{optionsDsTypesSel?.label ?? Constants.custom_table_desc}</span>;
    }

    let useForTrainingElem = isSmall ? null : <EditYesNoSpan value={featureOne?.useForTraining === true} onChange={this.onChangeUseForTraining} />;
    if (featureOne?.useForTraining === true && isSmall) {
      useForTrainingElem = <span>{featureOne?.useForTraining === true ? 'Yes' : 'No'}</span>;
    }

    let samplingConfigOptions = this.memSamplingConfigOptions(false)(this.props.featureGroups, featureGroupId);

    let nestedFGElem = null;
    const nestedCols = this.memNestedCols(featureOne);
    const hasNestedCols = nestedCols != null && nestedCols.length > 0;
    const hasNestedPitCols = hasNestedCols || (this.memPitCols(featureOne) != null && this.memPitCols(featureOne).length > 0);
    if (hasNestedCols) {
      nestedFGElem = (
        <span>
          {nestedCols.map((n1, n1ind) => {
            let el1;
            if (isSmall) {
              el1 = <span>{n1.name}</span>;
            } else {
              el1 = (
                <Link to={['/' + PartsLink.features_list + '/' + projectId + '/' + featureGroupId, 'nested=' + encodeURIComponent(n1.name ?? '') + '&featureGroupIdOri=' + encodeURIComponent(n1.featureGroupId ?? '')]}>
                  <span className={globalStyles.styleTextBlueBrightColor} style={{ cursor: 'pointer' }}>
                    {n1.name}
                  </span>
                </Link>
              );
            }

            return (
              <span key={'nes' + n1ind}>
                {n1ind > 0 ? <span key={'ne_sep' + n1ind}>, </span> : null}
                {el1}
              </span>
            );
          })}
        </span>
      );
    }

    let projectsElem = null;
    let tablenameProjects = featureOne?.projects;
    if (projectId == null && tablenameProjects != null && tablenameProjects?.length > 0) {
      const optionsPP = tablenameProjects?.map((p1) => ({ label: p1?.name, value: p1?.projectId }));
      projectsElem = (
        <span
          css={`
            width: 240px;
            font-size: 14px;
            display: inline-block;
          `}
        >
          <SelectExt value={{ label: '(Go to project)', value: null }} onChange={this.onChangeProjectUsed} options={optionsPP} />
        </span>
      );
    }

    let errorElem = null;
    if (!Utils.isNullOrEmpty(validateErrObj?.message)) {
      errorElem = <span className={globalStyles.styleTextRedColor}>{validateErrObj?.message}</span>;
    }

    let fgLang: FGLangType = calcLangType(featureOne?.featureGroupSourceType);

    const stringify = (value) => {
      if (_.isArray(value) || _.isObject(value)) {
        return JSON.stringify(value);
      } else {
        return value;
      }
    };

    const getSamplingConfigOptionLabel = (key) => {
      const curSamplingConfigOptions = samplingConfigOptions?.find((option) => option.value === featureOne?.samplingConfig?.samplingMethod);
      if (curSamplingConfigOptions) {
        return curSamplingConfigOptions.form[key].name;
      }

      return key;
    };

    let nameDetail = featureOne?.tableName;
    if (featureOne) {
      if (featureOne?.codeSource?.status != null && !['FAILED', 'COMPLETE'].includes(featureOne?.codeSource?.status)) {
        StoreActions.refreshDoFGAllAndCodeStatus_(projectId, featureGroupId);
      }

      dataList = [
        {
          id: 1111,
          name: (
            <span>
              Feature Group Source Type:
              <HelpIcon id={'FeatureGroupDetail_fgsource'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: <span>{Utils.upperFirst(featureOne?.featureGroupSourceType)}</span>,
          hidden: !['MERGE', 'TRANSFORM', 'SNAPSHOT'].includes(featureOne?.featureGroupSourceType?.toUpperCase()),
        },
        {
          id: 1110,
          name: 'Project Used In:',
          value: projectsElem,
          hidden: projectsElem == null || isSmall,
        },
        {
          id: 113,
          name: 'Concatenated Feature Group:',
          value: (
            <span
              className={isSmall ? '' : globalStyles.styleTextBlueBrightColor}
              css={`
                ${isSmall ? '' : 'cursor: pointer;'}
              `}
              onClick={isSmall ? null : this.onClickTablename.bind(this, featureOne?.concatenationConfig?.concatenatedTable, null, true)}
            >
              {featureOne?.concatenationConfig?.concatenatedTable}
            </span>
          ),
          marginBottom: 12,
          hidden: featureOne == null || featureOne?.concatenationConfig?.concatenatedTable == null,
        },
        {
          id: 112,
          name: 'Dataset ID:',
          value: (
            <CopyText>
              <span className={globalStyles.styleTextBlueBrightColor} css={'cursor: pointer;'} onClick={this.onClickTablenameDataset.bind(this, featureOne?.datasetId, featureOne)}>
                {featureOne?.datasetId}
              </span>
            </CopyText>
          ),
          marginBottom: 12,
          hidden: !featureOne.datasetId,
        },
        {
          id: 3,
          name: 'Source Feature Groups:',
          value: (
            <span>
              {featureOne?.sourceTables
                ?.filter((table) => featureOne?.sourceTableInfos?.find((s1) => s1.sourceTable === table)?.featureGroupId != null)
                ?.map((table, ind) => (
                  <span key={'a' + ind}>
                    {ind > 0 ? <span>, </span> : null}
                    <span
                      className={isSmall ? '' : globalStyles.styleTextBlueBrightColor}
                      css={`
                        ${isSmall ? '' : 'cursor: pointer;'}
                      `}
                      onClick={isSmall ? null : this.onClickTablename.bind(this, table, featureOne?.sourceTableInfos?.find((s1) => s1.sourceTable === table)?.featureGroupId, true)}
                    >
                      {table}
                    </span>
                  </span>
                ))}
            </span>
          ),
          hidden: featureOne == null || featureOne?.sourceTables?.filter((table) => featureOne?.sourceTableInfos?.find((s1) => s1.sourceTable === table)?.featureGroupId != null)?.length === 0,
        },
        {
          id: 44,
          name: (
            <span>
              Feature Group Type:
              <HelpIcon id={'FeatureGroupDetail_fgtype'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: fgTypeElem,
          hidden: projectId == null,
        },
        {
          id: 45,
          name: 'Tags:',
          value: (
            <span>
              {featureOne?.tags?.map((t1, t1ind) => {
                return (
                  <span key={'t' + t1ind}>
                    {t1ind > 0 ? <span>, </span> : null}
                    {t1}
                  </span>
                );
              })}
              {!isSmall && !isSmall && (
                <Link to={['/' + PartsLink.feature_groups_edit + '/' + (projectId ?? '-') + '/' + featureGroupId, Utils.isNullOrEmpty(featureOne?.functionSourceCode) && Utils.isNullOrEmpty(featureOne?.sql) ? 'onlyTags=1' : '']}>
                  <TooltipExt title={'Edit'}>
                    <FontAwesomeIcon
                      css={`
                        opacity: 0.4;
                        &:hover {
                          opacity: 1;
                        }
                      `}
                      icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit}
                      transform={{ size: 15, x: -3, y: 0 }}
                      style={{ color: 'white', cursor: 'pointer', marginLeft: '10px' }}
                    />
                  </TooltipExt>
                </Link>
              )}
            </span>
          ),
        },
        {
          id: 46,
          name: 'Description:',
          value: (
            <span>
              <TextMax max={100}>{featureOne?.description}</TextMax>
            </span>
          ),
          hidden: Utils.isNullOrEmpty(featureOne?.description),
          marginBottom: [FGLangType.Python].includes(fgLang) ? 15 : null,
        },
        {
          id: 50,
          name: 'Function Language:',
          value: Utils.upperFirst(fgLang),
          hidden: ![FGLangType.Python].includes(fgLang),
        },
        {
          id: 55555,
          name: 'Function Code - Status:',
          value: Utils.upperFirst(featureOne?.codeSource?.status || ''),
          hidden: featureOne?.codeSource?.status == null,
        },
        {
          id: 54,
          name: 'Python Function Name:',
          value: (
            <Link
              className={isSmall ? '' : globalStyles.styleTextBlueBrightColor}
              css={`
                ${isSmall ? '' : 'cursor: pointer;'}
              `}
              to={'/' + PartsLink.python_function_detail + '/' + /*projectId ?? */ '-' + '/' + encodeURIComponent(featureOne?.pythonFunctionName)}
            >
              {featureOne?.pythonFunctionName}
            </Link>
          ),
          hidden: fgLang !== FGLangType.Python || featureOne?.pythonFunctionName == null,
        },
        {
          id: 55,
          name: 'Python Function Arguments:',
          value: (
            <>
              <Link to={'/' + PartsLink.feature_groups_edit + '/' + (projectId ?? '-') + '/' + featureGroupId}>
                <TooltipExt title={'Edit'}>
                  <FontAwesomeIcon
                    css={`
                      opacity: 0.4;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                    icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit}
                    transform={{ size: 15, x: -3, y: 0 }}
                    style={{ color: 'white', cursor: 'pointer', marginLeft: '10px' }}
                  />
                </TooltipExt>
              </Link>
              {featureOne?.pythonFunctionBindings
                ?.filter?.((binding) => binding?.value)
                ?.map?.((binding, index) => {
                  const isJson = binding.variableType === 'JSON';
                  const getJson = () => {
                    let parsed = Utils.tryJsonParse(binding.value);
                    return parsed ? JSON.stringify(parsed, null, 4) : 'Invalid Object';
                  };
                  const value = isJson ? getJson() : binding.value;
                  return <DetailValuePre key={`binding-${index}`}>{`${binding.name}: ${binding.variableType} = ${value}`}</DetailValuePre>;
                })}
            </>
          ),
          hidden: fgLang !== FGLangType.Python || featureOne == null || featureOne?.pythonFunctionName == null,
        },
        {
          id: 51,
          name: 'Function Name:',
          value: featureOne?.functionName,
          hidden: fgLang !== FGLangType.Python,
        },
        {
          id: 52,
          name: 'Python Package Requirements:',
          value: (
            <div>
              {featureOne?.codeSource?.packageRequirements?.map?.((requirement: string) => (
                <DetailValuePre>{requirement}</DetailValuePre>
              ))}
            </div>
          ),
          hidden: fgLang !== FGLangType.Python || !featureOne?.codeSource?.packageRequirements?.length,
        },
        {
          id: 100,
          name: 'Python Error: ',
          value: (
            <span className={globalStyles.styleTextRedColor}>
              <TextMax doLess doMore max={130}>
                {featureOne?.codeSource?.error}
              </TextMax>
            </span>
          ),
          hidden: featureOne?.codeSource?.status !== 'FAILED',
        },
        {
          id: 53,
          name: 'Memory:',
          value: (
            <span>
              {/*<span><CpuAndMemoryOptions showClosestValue asText isOnlyMemory memoryValue={featureOne?.memory} name={'PythonFG'} readonly /></span>*/}
              {featureOne?.memory + ' GB'}
              {!isSmall && (
                <Link to={'/' + PartsLink.feature_groups_edit + '/' + (projectId ?? '-') + '/' + featureGroupId}>
                  <TooltipExt title={'Edit'}>
                    <FontAwesomeIcon
                      css={`
                        opacity: 0.4;
                        &:hover {
                          opacity: 1;
                        }
                      `}
                      icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit}
                      transform={{ size: 15, x: -3, y: 0 }}
                      style={{ color: 'white', cursor: 'pointer', marginLeft: '10px' }}
                    />
                  </TooltipExt>
                </Link>
              )}
            </span>
          ),
          hidden: fgLang !== FGLangType.Python,
        },
        {
          id: 54,
          name: 'CPU Size:',
          value: (
            <span>
              {featureOne?.cpuSize}
              {!isSmall && (
                <Link to={'/' + PartsLink.feature_groups_edit + '/' + (projectId ?? '-') + '/' + featureGroupId}>
                  <TooltipExt title={'Edit'}>
                    <FontAwesomeIcon
                      css={`
                        opacity: 0.4;
                        &:hover {
                          opacity: 1;
                        }
                      `}
                      icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit}
                      transform={{ size: 15, x: -3, y: 0 }}
                      style={{ color: 'white', cursor: 'pointer', marginLeft: '10px' }}
                    />
                  </TooltipExt>
                </Link>
              )}
            </span>
          ),
          // Hide cpu size since we currently not show it when create feature group
          hidden: fgLang !== FGLangType.Python || true,
          marginBottom: 15,
        },
        {
          id: 212,
          name: (
            <span>
              Nested Feature Groups:
              <HelpIcon id={'FeatureGroupDetail_nestedFG'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: nestedFGElem,
          hidden: nestedFGElem == null,
        },
        {
          id: 303,
          name: <span>Used In:</span>,
          value: featureOne?.referencedFeatureGroups?.map((s1, s1ind) => (
            <span key={'reffg' + s1ind}>
              {s1ind > 0 ? <span>, </span> : null}
              <span
                className={isSmall ? '' : globalStyles.styleTextBlueBrightColor}
                css={`
                  ${isSmall ? '' : 'cursor: pointer;'}
                `}
                onClick={isSmall ? null : _.startsWith(s1, 'datasets_') ? this.onClickTablenameDataset.bind(this, null, featureOne, true) : this.onClickTablename.bind(this, s1, null, true)}
              >
                {s1}
              </span>
            </span>
          )),
          hidden: featureOne?.referencedFeatureGroups == null || featureOne?.referencedFeatureGroups?.length === 0,
        },
        {
          id: 900,
          name: (
            <span>
              Error:
              <HelpIcon id={'FeatureGroupDetail_error'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: errorElem,
          hidden: errorElem == null,
        },
        {
          id: 901,
          name: 'Latest Version Error:',
          value: <span className={globalStyles.styleTextRedColor}>{featureOne?.latestFeatureGroupVersion?.error}</span>,
          hidden: !featureOne?.latestFeatureGroupVersion?.error,
        },
        {
          id: 1000,
          name: 'SQL Error:',
          value: (
            <span className={globalStyles.styleTextRedColor}>
              <TextMax doLess doMore max={130}>
                {featureOne?.sqlError}
              </TextMax>
            </span>
          ),
          hidden: !featureOne?.sqlError,
        },

        {
          id: 1500,
          name: (
            <span>
              Sampling Parameters:
              <HelpIcon id={'FeatureGroupDetail_samplingparams'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <span>
              {featureOne?.samplingConfig &&
                Object.keys(featureOne?.samplingConfig)
                  .map((key) => '' + getSamplingConfigOptionLabel(key) + ': ' + stringify(featureOne?.samplingConfig[key]))
                  .join(', ')
                  .toUpperCase()}
              <Link to={['/' + PartsLink.feature_groups_sampling + '/' + (projectId ?? '-') + '/' + featureGroupId, 'editConfig=1']}>
                <TooltipExt title={'Edit'}>
                  <FontAwesomeIcon
                    css={`
                      opacity: 0.4;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                    icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit}
                    transform={{ size: 15, x: -3, y: 0 }}
                    style={{ color: 'white', cursor: 'pointer', marginLeft: '10px' }}
                  />
                </TooltipExt>
              </Link>
            </span>
          ),
          hidden: !['SAMPLING'].includes(featureOne?.featureGroupSourceType?.toUpperCase()),
        },

        {
          id: 2000,
          name: (
            <span>
              Modification Lock:
              <HelpIcon id={'FeatureGroupDetail_permlock'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value:
            calcAuthUserIsLoggedIn()?.isPermManageLocks !== true ? (
              <EditYesNoSpan yesValue={'Locked'} noValue={'Unlocked'} value={featureOne?.modificationLock === true} onChange={this.onChangePermLock} />
            ) : featureOne?.modificationLock === true ? (
              'Locked'
            ) : (
              'Unlocked'
            ),
          hidden: featureOne?.modificationLock == null,
        },
        {
          id: 2001,
          name: 'Group' + (featureOne?.modifiers?.organizationGroups?.length === 1 ? '' : 's') + ' Allowed To Modify: ',
          value: (
            <span>
              {featureOne?.modifiers?.organizationGroups?.map((g1, g1ind) => (
                <span key={'g' + g1ind}>
                  {g1ind > 0 ? <span>, </span> : null}
                  {g1}
                </span>
              ))}
            </span>
          ),
          hidden: featureOne?.modifiers?.organizationGroups == null || featureOne?.modifiers?.organizationGroups?.length === 0,
        },
        {
          id: 2002,
          name: (
            <span>
              {'User' + (featureOne?.modifiers?.userEmails?.length === 1 ? '' : 's') + ' Allowed to Modify: '}
              <HelpIcon id={'FeatureGroupDetail_permuser'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <span>
              {featureOne?.modifiers?.userEmails?.map((g1, g1ind) => (
                <span key={'g' + g1ind}>
                  {g1ind > 0 ? <span>, </span> : null}
                  {g1}
                </span>
              ))}
            </span>
          ),
          hidden: featureOne?.modifiers?.userEmails == null || featureOne?.modifiers?.userEmails?.length === 0 || featureOne?.modificationLock === false,
        },

        {
          id: 2010,
          name: (
            <span>
              Linked Template:
              <HelpIcon id={'template_fg_detail_name'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <span>
              <Link to={featureGroupTemplateId ? '/' + PartsLink.template_detail + '/' + featureGroupTemplateId : null} showAsLinkBlue usePointer>
                {templateOne?.name ?? '-'}
              </Link>
              {false && !isSmall && (
                <TooltipExt title={'Edit Template'}>
                  <span
                    css={`
                      font-size: 14px;
                      cursor: pointer;
                      margin-left: 12px;
                      opacity: 0.8;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                    onClick={this.onClickGoEditTemplate.bind(this, featureGroupId, featureGroupTemplateId, true)}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 20, x: 0, y: -3 }} style={{ color: '#d1e4f5', marginRight: '8px' }} />
                  </span>
                </TooltipExt>
              )}
            </span>
          ),
          hidden: templateOne == null || templateOne?.name == null || !isTemplate,
        },
        {
          id: 2011,
          name: (
            <span>
              Variables:
              <HelpIcon id={'template_fg_detail_vars'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <span>
              {toSpansFromConfig(templateVariables)}
              {!isSmall && (
                <TooltipExt title={'Edit Template Variables'}>
                  <span
                    css={`
                      font-size: 14px;
                      cursor: pointer;
                      margin-left: 12px;
                      opacity: 0.8;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                    onClick={this.onClickGoEditTemplate.bind(this, featureGroupId, featureGroupTemplateId, false)}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 20, x: 0, y: -3 }} style={{ color: '#d1e4f5', marginRight: '8px' }} />
                  </span>
                </TooltipExt>
              )}
            </span>
          ),
          hidden: templateOne == null || templateVariables == null || !isTemplate,
        },
      ];

      dataList = dataList.filter((v1) => !v1.hidden);

      let refreshSchedules = this.memFGRefreshSchedules(false)(this.props.featureGroups, featureGroupId);

      dataList.push({
        id: 500,
        name: 'Refresh Schedules:',
        value: (
          <div>
            {refreshSchedules?.map((d1, d1ind) => {
              return (
                <div key={'cron_' + d1ind} style={{ margin: '3px 0 3px 30px' }}>
                  <CronOne
                    projectId={projectId}
                    featureGroupId={featureGroupId}
                    onPlayNow={this.onRefreshSchedule}
                    onDeleteDone={this.onRefreshSchedule}
                    onEdit={this.onEditRefreshSchedule.bind(this, projectId, featureGroupId, d1?.refreshPolicyId)}
                    refreshPolicyId={d1?.refresh_policy_id || d1?.refreshPolicyId}
                    cron={d1?.cron}
                    error={d1?.error}
                    nextRun={d1?.next_run_time || d1?.nextRunTime}
                    refreshType={d1?.refresh_type || d1?.refreshType}
                  />
                </div>
              );
            })}
            <Button
              size={'small'}
              onClick={() => {
                Location.push(`/${PartsLink.feature_groups_schedule_add}/${projectId || '-'}/${featureGroupId}`);
              }}
              type={'default'}
              ghost
              style={{ padding: '0 13px', height: '26px', marginLeft: '40px', marginTop: '5px', borderColor: 'rgba(255,255,255,0.6)' }}
            >
              <span className={globalStyles.styleTextGray}>Add new refresh schedule...</span>
            </Button>
          </div>
        ),
      });
    }

    let lifecycle = featureOne?.status;

    let createdAt = featureOne?.createdAt;
    if (isSmall) {
      createdAt = null;
    }
    if (createdAt != null) {
      createdAt = moment(createdAt);
      if (!createdAt.isValid()) {
        createdAt = null;
      }
    } else {
      createdAt = null;
    }

    const _createFeatureGroupFileInNotebook = async (projectId, featureGroupId) => {
      try {
        const response = await REClient_.promises_()._createFeatureGroupFileInNotebook(projectId, featureGroupId);
        if (!response?.success || response?.error || !response?.result?.notebookId) {
          throw new Error(response?.error);
        }
        window.open(`/app/${PartsLink.fast_notebook}/${projectId || '-'}/${response?.result?.notebookId}?selectedNbFile=Feature Group ${featureGroupId}.ipynb`, '_blank');
      } catch (e) {
        REActions.addNotificationError(e?.message || Constants.errorDefault);
      }
    };

    let isPythonFeatureGroup = featureOne?.featureGroupSourceType?.toUpperCase() === 'PYTHON';
    let isSqlFeatureGroup = featureOne?.featureGroupSourceType?.toUpperCase() === 'SQL';
    let isConstraints = featureOne?.featureGroupType?.toUpperCase() === 'CONSTRAINTS' && projectId;
    let featuresGroupsVersionsList = this.memFGVersions(false)(this.props.featureGroups, featureGroupId);
    let featuresGroupsVersionsListShow = this.memFGVersionsSlice(featuresGroupsVersionsList);
    let featuresGroupsVersionsColumns = this.memFGVersionsColumns(projectId, featureGroupId, isSmall, foundProject1?.useCase, isPythonFeatureGroup);
    let isMaterializing = this.memMater(featuresGroupsVersionsList);
    let lastFGVersion = featuresGroupsVersionsList?.[0]?.featureGroupVersion;
    let lastFGVersionIsComplete = featuresGroupsVersionsList?.[0]?.status?.toUpperCase() === FeatureGroupVersionLifecycle.COMPLETE;
    const shouldGenerateExplanation = (isPythonFeatureGroup || isSqlFeatureGroup || isTemplate) && !featureOne?.explanation;
    const shouldRegenerateExplanation = featureOne?.explanation?.isOutdated;

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let optionsFGSel = null;
    let optionsFG = [];
    let listFGs = this.memFGList(false)(this.props.featureGroups, projectId);
    optionsFG = this.memFGOptions(listFGs);
    if (optionsFG && featureGroupId) {
      optionsFGSel = optionsFG.find((p1) => p1.value === featureGroupId);
    }

    let datasetsList = this.memDatasetsProject(false)(projectId, this.props.projectDatasetsParam);
    let anyStreamingDataset = datasetsList?.some((d1) => d1?.streaming === true) ?? false;
    let isStreamingFG = featureOne?.streamingEnabled == true;
    let starred = !!featureOne?.starred;

    let fgProjectCountOne = this.memFGAllProjects(false)(this.props.featureGroups, null, featureGroupId);
    let fgProjectCount = fgProjectCountOne?.projects?.length ?? 0;
    let isSnapshot = featureOne?.featureGroupSourceType?.toUpperCase() === 'snapshot'.toUpperCase();

    let isRefreshingFG = featureOne == null;
    let isSampling = featureOne?.featureGroupSourceType?.toUpperCase() === 'sampling'.toUpperCase();

    let menuEdit;
    if (isTemplate) {
      menuEdit = (
        <Menu getPopupContainer={popupContainerForMenu}>
          {featureGroupTemplateId != null && <Menu.Item onClick={this.onClickGoEditTemplate.bind(this, featureGroupId, featureGroupTemplateId, false)}>You must edit Template Varaiables</Menu.Item>}
          <ModalConfirm
            onConfirm={this.onClickUnlinkTemplate.bind(this, featureGroupId, featureGroupTemplateId)}
            title={`Do you want to unlink this feature group from the template?`}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            okText={'Unlink'}
            cancelText={'Cancel'}
            okType={'danger'}
          >
            <div style={{ margin: '-6px -12px', padding: '6px 24px', color: 'red', cursor: 'pointer' }}>Or Unlink FG from Template</div>
          </ModalConfirm>
        </Menu>
      );
    }

    const menuActions = (
      <Menu getPopupContainer={popupContainerForMenu}>
        {featureOne?.featureGroupSourceType?.toUpperCase() !== 'MERGE' && (
          <Menu.Item onClick={this.onClickActionLink.bind(this, '/' + PartsLink.feature_groups_merge + '/' + (projectId ?? '-') + '/' + featureGroupId)}>Merge Versions</Menu.Item>
        )}
        {featureOne?.featureGroupSourceType?.toUpperCase() === 'MERGE' && (
          <Menu.Item onClick={this.onClickActionLink.bind(this, ['/' + PartsLink.feature_groups_merge + '/' + (projectId ?? '-') + '/' + featureGroupId, 'edit=true'])}>Edit Merge Config</Menu.Item>
        )}

        {!isSampling && <Menu.Item onClick={this.onClickActionLink.bind(this, '/' + PartsLink.feature_groups_sampling + '/' + (projectId ?? '-') + '/' + featureGroupId)}>Sample Feature Group</Menu.Item>}
        {isSampling && <Menu.Item onClick={this.onClickActionLink.bind(this, ['/' + PartsLink.feature_groups_sampling + '/' + (projectId ?? '-') + '/' + featureGroupId, 'editConfig=1'])}>Edit Sample Config</Menu.Item>}

        {featureOne?.featureGroupSourceType?.toUpperCase() !== 'TRANSFORM' && (
          <Menu.Item onClick={this.onClickActionLink.bind(this, '/' + PartsLink.feature_groups_transform + '/' + (projectId ?? '-') + '/' + featureGroupId)}>Transform Feature Group</Menu.Item>
        )}
        {featureOne?.featureGroupSourceType?.toUpperCase() === 'TRANSFORM' && (
          <Menu.Item
            onClick={this.onClickActionLink.bind(this, [
              '/' + PartsLink.feature_groups_transform + '/' + (projectId ?? '-') + '/' + featureGroupId,
              'edit=true&backToUrl=' + encodeURIComponent(window.location.pathname || '') + '&backToUrlParams=' + encodeURIComponent(window.location.search || ''),
            ])}
          >
            Edit Transpose Config
          </Menu.Item>
        )}

        {featureOne?.featureGroupSourceType?.toUpperCase() !== 'DATASET' && (
          <Menu.Item>
            <FGDuplicateWork projectId={projectId} featureGroupId={featureOne?.featureGroupId}>
              <div style={{ margin: '-6px -12px', padding: '6px 12px' }}>Duplicate Feature Group</div>
            </FGDuplicateWork>
          </Menu.Item>
        )}

        {Constants.flags.templates && ['SQL'].includes(featureOne?.featureGroupSourceType?.toUpperCase()) && !hasNestedPitCols && (
          <Menu.Item onClick={this.onClickActionLink.bind(this, ['/' + PartsLink.feature_groups_template_add + '/' + (projectId ?? '-') + '/' + featureGroupId, 'featureGroupId=' + encodeURIComponent(featureGroupId)])}>
            Create Template
          </Menu.Item>
        )}

        {calcAuthUserIsLoggedIn()?.isInternal === true && fgLang === FGLangType.SQL && <Menu.Item onClick={this.doDownloadRawData}>Download Raw Data</Menu.Item>}

        {!isStreamingFG && featureOne?.concatenationConfig?.concatenatedTable == null && (
          <Menu.Item>
            <FGStreamingWork projectId={projectId} featureGroupId={featureOne?.featureGroupId}>
              <div style={{ margin: '-6px -12px', padding: '6px 12px' }}>Add Streaming Feature Group</div>
            </FGStreamingWork>
          </Menu.Item>
        )}

        {featureOne?.concatenationConfig?.concatenatedTable != null && (
          <Menu.Item>
            <ModalConfirm
              onConfirm={this.onClickConnectFGRemove.bind(this, projectId, featureOne)}
              title={`Do you want to remove concatenated feature group?`}
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
              okText={'Remove'}
              cancelText={'Cancel'}
              okType={'danger'}
            >
              <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red' }}>Remove Concatenate Streaming FG</div>
            </ModalConfirm>
          </Menu.Item>
        )}
        {
          <Menu.Item>
            <div onClick={() => _createFeatureGroupFileInNotebook(projectId, featureGroupId)}>
              <FontAwesomeIcon icon={faNotebook} />
              <span>Open Feature group in Notebook</span>
            </div>
          </Menu.Item>
        }
        {anyStreamingDataset && <Menu.Item onClick={this.onClickConnectFG.bind(this, projectId, featureOne)}>{isStreamingFG ? 'Concatenate Batch FG' : 'Concatenate Streaming FG'}</Menu.Item>}
      </Menu>
    );

    let showAnnotations = true;
    if (Constants.flags.hide_annotations) {
      showAnnotations = false;
    }
    if (featureOne?.featureGroupType?.toUpperCase() !== Constants.ANNOTATING) {
      showAnnotations = false;
    }
    if (projectId == null) {
      showAnnotations = false;
    }
    if (showAnnotations) {
      let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
      if (foundProject1 == null || !_.isArray(Constants.flags.annotations_for_usecases_list) || !Constants.flags.annotations_for_usecases_list?.map((s1) => s1?.toLowerCase())?.includes(foundProject1?.useCase?.toLowerCase() || '---')) {
        showAnnotations = false;
      }
    }

    const deleteFeatureGroupButton = (
      <Button style={{ marginLeft: '8px', borderColor: 'transparent' }} danger ghost>
        <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faTrashAlt').faTrashAlt} transform={{ size: 20, x: 0, y: -3 }} style={{ color: '#ff4d4f', marginRight: '8px' }} /> Delete
      </Button>
    );
    let deleteFeatureGroupModal = (
      <ModalConfirm
        onConfirm={this.onClickDelete.bind(this, featureOne?.featureGroupId)}
        title={`Do you want to delete Feature Group (it is being used in ${fgProjectCount} project${fgProjectCount === 1 ? '' : 's'})?`}
        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
        okText={'Delete'}
        cancelText={'Cancel'}
        okType={'danger'}
      >
        {deleteFeatureGroupButton}
      </ModalConfirm>
    );
    const referencedFeatureGroups = featureOne?.referencedFeatureGroups;
    if (referencedFeatureGroups?.length) {
      const [first, ...rest] = referencedFeatureGroups;
      let referencedFeatureGroupsString = `${first} feature group`;
      let subMessage = 'Remove this dependency before deleting.';
      if (rest.length) {
        referencedFeatureGroupsString = `${rest.join(',')} and ${first} feature groups`;
        subMessage = 'Remove these dependencies before deleting.';
      }
      deleteFeatureGroupModal = (
        <ModalContent
          title="Cannot delete this feature group"
          cancelText={'Ok'}
          okButtonProps={{ style: { display: 'none' } }}
          content={
            <div>
              <div>This feature group is being referenced in {referencedFeatureGroupsString}.</div>
              <div>{subMessage}</div>
            </div>
          }
        >
          {deleteFeatureGroupButton}
        </ModalContent>
      );
    }

    return (
      <div className={globalStyles.absolute + ' ' + globalStyles.table} style={{ margin: (isSmall ? 10 : 25) + 'px' }}>
        <NanoScroller onlyVertical>
          <div
            className={globalStyles.titleTopHeaderAfter}
            style={{ height: topAfterHeaderHH, marginRight: '20px' }}
            css={`
              display: flex;
              align-items: center;
            `}
          >
            <span css={``}>{'Feature Group Detail'}</span>
            {projectId != null && (
              <span style={{ marginLeft: '16px', width: '440px', display: 'inline-block', fontSize: '12px' }}>
                <SelectExt value={optionsFGSel} options={optionsFG} onChange={this.onChangeDropdownFGSel} menuPortalTarget={popupContainerForMenu(null)} />
              </span>
            )}
            <span
              css={`
                flex: 1;
              `}
            ></span>

            {projectId != null && !isSmall && (
              <div
                css={`
                  margin-right: 10px;
                `}
              >
                {
                  <ModalConfirm
                    onConfirm={this.onClickRemove.bind(this, featureOne?.featureGroupId)}
                    title={`Do you want to detach Feature Group from project?`}
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    okText={'Detach'}
                    cancelText={'Cancel'}
                    okType={'danger'}
                  >
                    <Button style={{ marginLeft: '8px', borderColor: 'transparent' }} danger ghost>
                      Remove from Project
                    </Button>
                  </ModalConfirm>
                }
              </div>
            )}
            {!isSmall && (
              <div
                css={`
                  margin-right: 10px;
                `}
              >
                {deleteFeatureGroupModal}
              </div>
            )}
          </div>

          {paramsProp?.get('useFGadded') && <Alert style={{ marginBottom: '15px' }} message={'Feature Group "' + (paramsProp?.get('useFGadded') ?? '-') + '" created'} type={'success'} />}
          {paramsProp?.get('useFGupdated') && <Alert style={{ marginBottom: '15px' }} message={'Feature Group "' + (paramsProp?.get('useFGupdated') ?? '-') + '" updated'} type={'success'} />}

          {isMaterializing && <div className={styles.bannerContainer}>Materializing feature group - Scroll down to see status</div>}

          <div className={globalStyles.backdetail}>
            <div
              css={`
                border-radius: 8px;
                overflow: hidden;
              `}
            >
              <RefreshAndProgress msgTop={'10px'} isMsgAnimRefresh={isRefreshingFG ? true : undefined} msgMsg={isRefreshingFG ? 'Loading...' : undefined} isDim={isRefreshingFG ? true : undefined} isRelative>
                <div
                  style={{ display: 'flex' }}
                  css={`
                    min-height: 290px;
                  `}
                >
                  <div style={{ marginRight: '24px' }}>
                    <img src={calcImgSrc('/imgs/featureGroupIcon.png')} alt={''} style={{ width: '80px' }} />
                  </div>
                  <div style={{ flex: 1, fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ marginBottom: '10px' }}>
                          <span
                            css={`
                              margin-right: 7px;
                            `}
                          >
                            <StarredSpan name={'Feature Group'} isStarred={starred} onClick={this.onClickStarred.bind(this, featureOne?.featureGroupId, projectId)} size={19} y={-3} />
                          </span>
                          <DetailHeader>{nameDetail ?? '-'}</DetailHeader>
                        </div>
                        <div style={{ padding: '2px 0' }}>
                          <span className={globalStyles.textIndent20}>
                            <span
                              css={`
                                white-space: nowrap;
                              `}
                            >
                              <DetailName>Feature Group ID:</DetailName>
                            </span>
                            <DetailValue>
                              <CopyText>{featureOne?.featureGroupId}</CopyText>
                            </DetailValue>
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '10px' }}>
                        {createdAt != null && (
                          <div>
                            <DetailCreatedAt>Created: {createdAt?.format('LLL')}</DetailCreatedAt>
                          </div>
                        )}
                        {!this.props.isSmall && (
                          <div
                            css={`
                              margin-top: 10px;
                            `}
                          >
                            <DropdownExt overlay={menuActions} trigger={['click']}>
                              <Button type={'primary'}>
                                Actions
                                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faChevronDown').faChevronDown} transform={{ size: 14, x: 0, y: 1 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '4px' }} />
                              </Button>
                            </DropdownExt>
                          </div>
                        )}
                      </div>
                    </div>
                    {dataList.map((d1, d1ind) => (
                      <div key={'val_' + d1.id + d1ind} style={{ padding: '2px 0', marginBottom: (d1.marginBottom ?? 0) + 'px' }}>
                        <span className={globalStyles.textIndent20}>
                          <span
                            css={`
                              white-space: nowrap;
                            `}
                          >
                            <DetailName>{d1.name}</DetailName>
                          </span>
                          <DetailValue>{d1.value}</DetailValue>
                        </span>
                      </div>
                    ))}

                    <div
                      css={`
                        font-size: 18px;
                        margin-top: 15px;
                        font-family: Matter, sans-serif;
                        font-weight: 500;
                        line-height: 1.6;
                      `}
                    >
                      {isStreamingFG && featureOne?.datasetId && !Constants.disableAiFunctionalities && (
                        <div
                          css={`
                            margin-top: 10px;
                          `}
                        >
                          <Link to={['/' + PartsLink.dataset_streaming + '/' + featureOne?.datasetId + (projectId == null ? '' : '/' + projectId), 'fromFG=' + encodeURIComponent(featureGroupId)]}>
                            <span className={globalStyles.styleTextBlueBrightColor}>Streaming Console</span>
                          </Link>
                        </div>
                      )}

                      {!this.props.isSmall && (
                        <div
                          css={`
                            margin-top: 10px;
                          `}
                        >
                          <span css={``}>
                            <Link to={'/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId}>
                              <span
                                css={`
                                  cursor: pointer;
                                `}
                                className={globalStyles.styleTextBlueBrightColor}
                              >
                                Features
                              </span>
                            </Link>
                          </span>
                          <span
                            css={`
                              opacity: 0.7;
                              margin: 0 10px;
                            `}
                          >
                            -
                          </span>
                          <span css={``}>
                            <Link to={['/' + PartsLink.feature_groups_data_explorer + '/' + (projectId ?? '-') + '/' + featureGroupId, 'featureGroupVersion=' + encodeURIComponent(lastFGVersion ?? '')]}>
                              <span
                                css={`
                                  cursor: pointer;
                                `}
                                className={globalStyles.styleTextBlueBrightColor}
                              >
                                Explore
                              </span>
                            </Link>
                          </span>
                          <span
                            css={`
                              opacity: 0.7;
                              margin: 0 10px;
                            `}
                          >
                            -
                          </span>
                          <span css={``}>
                            <Link to={['/' + PartsLink.features_rawdata + '/' + (projectId ?? '-') + '/' + featureGroupId, !lastFGVersionIsComplete ? undefined : 'featureGroupVersion=' + encodeURIComponent(lastFGVersion ?? '')]}>
                              <span
                                css={`
                                  cursor: pointer;
                                `}
                                className={globalStyles.styleTextBlueBrightColor}
                              >
                                Materialized Data
                              </span>
                            </Link>
                          </span>
                          {isConstraints && (
                            <span css={``}>
                              <span
                                css={`
                                  opacity: 0.7;
                                  margin: 0 10px;
                                `}
                              >
                                -
                              </span>
                              <Link to={['/' + PartsLink.feature_groups_constraint + '/' + (projectId ?? '-') + '/' + featureGroupId, !lastFGVersionIsComplete ? undefined : 'featureGroupVersion=' + encodeURIComponent(lastFGVersion ?? '')]}>
                                <span
                                  css={`
                                    cursor: pointer;
                                  `}
                                  className={globalStyles.styleTextBlueBrightColor}
                                >
                                  Constraints
                                </span>
                              </Link>
                            </span>
                          )}
                          {showAnnotations && (
                            <span
                              css={`
                                opacity: 0.7;
                                margin: 0 10px;
                              `}
                            >
                              -
                            </span>
                          )}
                          {showAnnotations && (
                            <span css={``}>
                              <Link to={'/' + PartsLink.annotations_edit + '/' + (projectId ?? '-') + '/' + featureGroupId}>
                                <span
                                  css={`
                                    cursor: pointer;
                                  `}
                                  className={globalStyles.styleTextBlueBrightColor}
                                >
                                  Annotations
                                </span>
                              </Link>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </RefreshAndProgress>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            {isFeatureStore && (
              <Button
                className={globalStyles.detailbuttonblue}
                onClick={this.onClickDeployFG.bind(this, projectId, featureOne)}
                css={`
                  margin-left: 8px;
                  margin-right: 10px;
                `}
                ref={this.refDuplicateButton}
                type={'primary'}
              >
                Deploy Feature Group
              </Button>
            )}
          </div>

          {(!Utils.isNullOrEmpty(featureOne?.functionSourceCode) || !Utils.isNullOrEmpty(featureOne?.sql)) && (
            <div style={{ marginTop: '20px' }}>
              <div
                css={`
                  display: flex;
                  width: 100%;
                  flex-direction: row;
                  position: relative;
                `}
              >
                {fgLang === FGLangType.Python && (
                  <div
                    css={`
                      margin-bottom: 4px;
                      font-size: 17px;
                      white-space: nowrap;
                    `}
                  >
                    Python Function Code:
                  </div>
                )}
                {!isSmall && (
                  <div
                    css={`
                      position: absolute;
                      left: 0;
                      top: 100%;
                      margin-top: 4px;
                      z-index: 10;
                    `}
                  >
                    <CopyText noText tooltipText={'Copy to Clipboard'}>
                      {featureOne?.sql ?? featureOne?.functionSourceCode}
                    </CopyText>
                    {Constants.flags.templates && !isTemplate && featureOne?.featureGroupSourceType?.toUpperCase() === 'SQL' && !hasNestedPitCols && (
                      <span
                        css={`
                          margin-left: 10px;
                        `}
                      >
                        Create Template
                        <FontAwesomeIcon
                          onClick={this.onClickCreateTemplate.bind(this, featureOne?.featureGroupId)}
                          className={globalStyles.styleTextBlueBright}
                          icon={require('@fortawesome/pro-duotone-svg-icons/faPassport').faPassport}
                          transform={{ size: 16, x: 0, y: 1.5 }}
                          style={{ marginLeft: '5px', cursor: 'pointer' }}
                        />
                      </span>
                    )}
                  </div>
                )}
                <div
                  css={`
                    flex: 1;
                  `}
                ></div>
                {featuresGroupsVersionsListShow != null && featuresGroupsVersionsListShow.length > 1 && fgLang === FGLangType.SQL && (
                  <div css={``}>
                    <Link to={'/' + PartsLink.feature_groups_history + '/' + (projectId ?? '-') + '/' + featureGroupId}>
                      <Button
                        css={`
                          margin-left: 10px;
                        `}
                        ghost
                        type={'primary'}
                      >
                        Feature Group History
                      </Button>
                    </Link>
                  </div>
                )}
                {!isSmall && !Constants.disableAiFunctionalities && (
                  <div style={{ whiteSpace: 'nowrap', paddingLeft: 8, marginBottom: 8, marginLeft: 8 }}>
                    {shouldRegenerateExplanation && !this.state.isGeneratingExplanation && (
                      <span style={{ fontSize: 14, color: 'orange' }}>
                        <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faExclamationTriangle').faExclamationTriangle} transform={{ size: 18, x: 0, y: 0 }} style={{ marginRight: 4 }} />
                        This explanation might be outdated
                      </span>
                    )}
                    {(shouldGenerateExplanation || shouldRegenerateExplanation) &&
                      (this.state.isGeneratingExplanation ? (
                        <AnalyzingText />
                      ) : (
                        <Button className={styles.generateExplanationButton} onClick={() => this.onClickGenerateExplanation(featureGroupId, projectId, () => {})} type={'primary'}>
                          {shouldGenerateExplanation ? 'Explain this code ✨' : 'Regenerate Explanation'}
                        </Button>
                      ))}
                    {!isTemplate && (
                      <Link
                        to={
                          fgLang === FGLangType.Python && featureOne?.pythonFunctionBindings != null && featureOne?.pythonFunctionBindings.length !== 0
                            ? pythonFunctionURL
                            : '/' + PartsLink.feature_groups_edit + '/' + (projectId ?? '-') + '/' + featureGroupId
                        }
                      >
                        <Button style={{ marginLeft: 8 }} type={'primary'}>
                          Edit {fgLang === FGLangType.Python ? 'Code' : 'SQL'} and Details
                        </Button>
                      </Link>
                    )}
                    {isTemplate && (
                      <DropdownExt overlay={menuEdit} trigger={['click']}>
                        <Button style={{ marginLeft: 8 }} type={'primary'}>
                          Edit {fgLang === FGLangType.Python ? 'Code' : 'SQL'}
                        </Button>
                      </DropdownExt>
                    )}
                    {isTemplate && (
                      <Link to={['/' + PartsLink.feature_groups_edit + '/' + (projectId ?? '-') + '/' + featureGroupId, 'hideTemplate=1&useTemplateId=' + encodeURIComponent(featureGroupTemplateId)]}>
                        <Button
                          css={`
                            margin-left: 10px;
                          `}
                          type={'primary'}
                        >
                          Edit Details
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.codeExplanationContainer} ref={this.refSplitPane}>
                <ResizeHeight height={120} min={60} save={'fg_detail_editor_hh'}>
                  {(height, width) => (
                    <>
                      {/*// @ts-ignore */}
                      <SplitPane
                        split={'vertical'}
                        maxSize={width - 16}
                        style={{ width: '100%', overflow: 'visible', marginTop: 32, display: 'flex', height: height - 40, position: 'static' }}
                        defaultSize={this.state.shortExplanation || this.state.longExplanation || featureOne?.explanation ? Utils.dataNum(`feature_group_code_width-${featureGroupId}`, '60%') : '100%'}
                        onChange={(v1) => {
                          if (!this.refSplitPane.current) return;
                          const parentWidth = this.refSplitPane.current?.clientWidth;
                          Utils.dataNum(`feature_group_code_width-${featureGroupId}`, undefined, `${Math.floor((v1 * 100) / parentWidth)}%`);
                        }}
                      >
                        <div style={{ height: height - 40 }}>
                          <div onClick={this.onClickShowDoEdit} className={globalStyles.pointerEventsNone}>
                            <EditorElem lineNumbers={true} lang={fgLang === FGLangType.Python ? 'python' : null} validateOnCall readonly value={featureOne?.sql ?? featureOne?.functionSourceCode} height={height - 60} />
                          </div>
                        </div>
                        {!Constants.disableAiFunctionalities && (this.state.shortExplanation || this.state.longExplanation || featureOne?.explanation) ? (
                          <div className={styles.explanationContainer}>
                            <div className={styles.explanation}>
                              <span className={styles.explanationTitle}>Summary:</span>
                              <br />
                              {this.state.shortExplanation ?? this.getHighlightedText(featureOne?.explanation?.shortExplanation)}
                              <br />
                              <br />
                              <span className={styles.explanationTitle}>Explanation:</span>
                              <br />
                              {this.state.longExplanation ?? this.getHighlightedText(featureOne?.explanation?.longExplanation)}
                            </div>
                          </div>
                        ) : null}
                      </SplitPane>
                    </>
                  )}
                </ResizeHeight>
                {isPythonFeatureGroup && <PythonFunctionWarnings data={pythonFunctionOne} />}
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            {!isSnapshot && (
              <div>
                {!isSmall && !this.state.materializeIsRefreshing && (
                  <ModalConfirm
                    onClick={this.onClickCreateNewVersionOnClick}
                    onConfirm={this.onClickCreateNewVersion}
                    title={`Do you want to create a new version?`}
                    icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                    okText={'Create'}
                    cancelText={'Cancel'}
                    okType={'primary'}
                  >
                    <Button type={'primary'}>Materialize Latest Version</Button>
                  </ModalConfirm>
                )}
                {!isSmall && this.state.materializeIsRefreshing && (
                  <Button type={'primary'}>
                    Materialize Latest Version
                    <span
                      css={`
                        margin-left: 6px;
                      `}
                    >
                      <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} />
                    </span>
                  </Button>
                )}
                {featureOne?.latestVersionOutdated && !isSmall && (
                  <span
                    css={`
                      margin-left: 16px;
                      font-size: 14px;
                      color: red;
                    `}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faExclamationTriangle').faExclamationTriangle} transform={{ size: 18, x: 0, y: 0 }} style={{ marginRight: 4 }} />
                    Modified Since Last Version{' '}
                    {Utils.isNullOrEmpty(featureOne?.latestVersionDifference) ? null : (
                      <span>
                        (<ShowMore max={70} value={featureOne?.latestVersionDifference} />)
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
            {isSnapshot && !isSmall && (
              <Button type={'primary'} disabled={true}>
                Snapshot Materialization Disabled
              </Button>
            )}
            <div
              className={globalStyles.titleTopHeaderAfter}
              css={`
                margin-bottom: 20px;
                margin-top: 20px;
                display: flex;
                align-items: center;
              `}
            >
              <span>
                Feature Groups Versions
                <HelpIcon id={'featuregroupsversions_list_title'} style={{ marginLeft: '4px' }} />
              </span>
              <span
                css={`
                  flex: 1;
                `}
              ></span>
              {!this.props.isSmall && featuresGroupsVersionsList?.length > 0 && (
                <span
                  css={`
                    font-size: 18px;
                    margin-top: 15px;
                    font-family: Matter, sans-serif;
                    font-weight: 500;
                    line-height: 1.6;
                    margin-right: 10px;
                  `}
                >
                  <Link usePointer to={'/' + PartsLink.feature_groups_export + '/' + (projectId ?? '-') + '/' + featureGroupId}>
                    <span className={globalStyles.styleTextBlueBrightColor}>View Version Exports</span>
                  </Link>
                </span>
              )}
            </div>
            <TableExt showEmptyIcon={true} defaultSort={{ field: 'createdAt', isAsc: false }} dataSource={featuresGroupsVersionsListShow} columns={featuresGroupsVersionsColumns} calcKey={(r1) => r1.featureGroupVersion} noHover={true} />
          </div>

          <div style={{ height: '60px' }}>&nbsp;</div>
        </NanoScroller>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    featureGroups: state.featureGroups,
    useCases: state.useCases,
    projects: state.projects,
    defDatasets: state.defDatasets,
    projectDatasetsParam: state.projectDatasets,
    templates: state.templates,
    pythonFunctionsById: state.pythonFunctions.get('pythonFunctionsById'),
  }),
  null,
)(FeatureGroupDetail);
