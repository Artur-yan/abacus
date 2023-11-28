import _ from 'lodash';
import * as moment from 'moment-timezone';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { ModelLifecycle } from '../../stores/reducers/models';
import { calcErrorFieldValuesByDeployId, calcFieldValuesByDeployId, memProjectById } from '../../stores/reducers/projects';
import requests from '../../stores/reducers/requests';
import ModelPredictionTextClassification from '../ModelPredictionTextClassification/ModelPredictionTextClassification';
import ModelPredictionsAnomalyTableOne from '../ModelPredictionsAnomalyTableOne/ModelPredictionsAnomalyTableOne';
import ModelPredictionsChartTableOne from '../ModelPredictionsChartTableOne/ModelPredictionsChartTableOne';
import ModelPredictionsClusteringOne from '../ModelPredictionsClusteringOne/ModelPredictionsClusteringOne';
import ModelPredictionsClusteringTimeseriesOne from '../ModelPredictionsClusteringTimeseriesOne/ModelPredictionsClusteringTimeseriesOne';
import ModelPredictionsEntitiesOne from '../ModelPredictionsEntitiesOne/ModelPredictionsEntitiesOne';
import ModelPredictionsHistogramTableOne from '../ModelPredictionsHistogramTableOne/ModelPredictionsHistogramTableOne';
import ModelPredictionsHistogramTimeseriesOne from '../ModelPredictionsHistogramTimeseriesOne/ModelPredictionsHistogramTimeseriesOne';
import ModelPredictionsImageDescriptionOne from '../ModelPredictionsImageDescriptionOne/ModelPredictionsImageDescriptionOne';
import ModelPredictionsImageEditing from '../ModelPredictionsImageEditing/ModelPredictionsImageEditing';
import ModelPredictionsListsOne from '../ModelPredictionsListsOne/ModelPredictionsListsOne';
import ModelPredictionsOne from '../ModelPredictionsOne/ModelPredictionsOne';
import ModelPredictionsOptimization from '../ModelPredictionsOptimization/ModelPredictionsOptimization';
import ModelPredictionsPersonalizationOne from '../ModelPredictionsPersonalizationOne/ModelPredictionsPersonalizationOne';
import ModelPredictionsRegressionOne from '../ModelPredictionsRegressionOne/ModelPredictionsRegressionOne';
import ModelPredictionsSentimentOne from '../ModelPredictionsSentimentOne/ModelPredictionsSentimentOne';
import ModelPredictionsStableDiffusionOne from '../ModelPredictionsStableDiffusionOne/ModelPredictionsStableDiffusionOne';
import ModelPredictionsStyleTransferOne from '../ModelPredictionsStyleTransferOne/ModelPredictionsStyleTransferOne';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import { ModelPredictionConversationPage } from '../ModelPredictionsChatOne/ModelPredictionsConversationPage';
const s = require('./ModelPredictionCommon.module.css');
const sd = require('../antdUseDark.module.css');

export enum PredictionDisplayType {
  two_tables = 'two_tables',
  two_tables_with_header = 'two_tables_with_header',
  table_with_result = 'table_with_result',
  chart = 'chart',
  chart_table = 'chart_table',
  list_and_table = 'list_and_table',
  histogram_table = 'histogram_table',
  histogram_timeseries_windows = 'histogram_timeseries_windows',
  anomaly_timeseries_table = 'anomaly_timeseries_table',
  entities = 'entities',
  search = 'search',
  languageDetection = 'languageDetection',
  sentiment = 'sentiment',
  optimization = 'optimization',
  image_description = 'image_description',
  style_transfer = 'style_transfer',
  text_to_image_generation = 'text_to_image_generation',
  vision = 'vision',
  chat = 'chat',
  sequence_classification = 'sequence_classification',
  text_classification = 'text_classification',
  clustering = 'clustering',
  text_guided_image_editing = 'text_guided_image_editing',
  clustering_timeseries = 'clustering_timeseries',
  ai_agent = 'ai_agent',
}

export interface IModelPropsCommon {
  optionsAlgo?: any;
  optionsTestDatasRes?: {
    metricName: any;
    testDatasList: any;
    errorLastCall: any;
    sendParams: any;
    optionsTestDatas: any;
    rangeDateByTestDataId: any;
    resultColumns: any;
    filters: any;
    resultTestDatas: any;
    columns: any;
    testIdName: string;
    displayType: string;
  };

  selectedAlgoId?: string;
  onChangeAlgoId?: (value: any, cbFinish: () => void) => void;

  filterValues?: object;
  onChangeFilterValues?: (value: any, cbFinish: () => void) => void;
}

interface IModelPredictionCommonProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  deployments?: any;
  models?: any;
  useCases?: any;
  requests?: any;

  isDeployDetail?: boolean;
  calcContent?: (params) => any;
  optionsAlgo?: any;
  content?: any;
  needDeploy?: any;
}

interface IModelPredictionCommonState {
  selectedAlgoId?: string;
  filterValues?: object;
  displayTypeOver?: PredictionDisplayType;
}

class ModelPredictionCommon extends React.PureComponent<IModelPredictionCommonProps, IModelPredictionCommonState> {
  private isM: boolean;
  projectUseCasesUsed: any;

  constructor(props) {
    super(props);

    let { paramsProp } = props;
    let useTimezoneForAPI = 'UTC';

    let calcParam = (name, isDate = false) => {
      let res = paramsProp ? paramsProp.get(name) : null;
      if (isDate && res != null) {
        res = moment.unix(res).tz(useTimezoneForAPI || 'UTC', false);
      }
      return res;
    };

    let selectedAlgoId = calcParam('selectedAlgoId');
    if (this.props.paramsProp?.get('useDataId') && !selectedAlgoId) {
      selectedAlgoId = calcParam('deployId');
    }

    this.state = {
      selectedAlgoId: selectedAlgoId,
      filterValues: {},
    };
  }

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

  calcRequestBPId = () => {
    return Utils.tryParseInt(this.props.paramsProp?.get('requestBPId')?.split('_')?.[0]);
  };

  calcRequestBPIdVersion = () => {
    return this.props.paramsProp?.get('requestBPId')?.split('_')?.[1];
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let optionsAlgo = this.props.optionsAlgo;

    let algoSelectValue = null;
    if (this.state.selectedAlgoId) {
      algoSelectValue = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.state.selectedAlgoId);
    }

    let bpData = this.memBPData(true)(this.props.requests, this.calcRequestBPId(), this.calcRequestBPIdVersion());

    let deploymentId1 = this.props.isDeployDetail ? this.props.paramsProp?.get('deployId') : algoSelectValue?.value;
    if (this.calcRequestBPId() != null && !deploymentId1) {
      deploymentId1 = this.props.paramsProp?.get('deployId');
    }
    let optionsTestDatasRes = this.memOptionsTestDatas(true)(this.props.projects, deploymentId1, this.calcRequestBPId(), bpData);

    let selUseCase = this.memUseCaseSel(true)(this.props.useCases, foundProject1 && foundProject1.useCase);
  };

  componentDidUpdate(prevProps: Readonly<IModelPredictionCommonProps>, prevState: Readonly<IModelPredictionCommonState>, snapshot?: any): void {
    this.doMem();
  }

  memBPData = memoizeOneCurry((doCall, requestsParam, requestBPId, batchPredictionVersion) => {
    return requests.memRequestBPById(doCall, undefined, batchPredictionVersion, requestBPId ?? 0);
  });

  memOptionsTestDatas: (doCall: any) => (
    projects: any,
    deploymentId: string,
    requestBPId: any,
    bpData: any,
  ) => {
    errorMsg?;
    metricName: any;
    testDatasList: any;
    errorLastCall: any;
    sendParams: any;
    optionsTestDatasAll: any;
    optionsTestDatas: any;
    rangeDateByTestDataId: any;
    resultColumns: any;
    filters: any;
    resultTestDatas: any;
    columns: any;
    testIdName: string;
    displayType: string;
  } = memoizeOneCurry((doCall, projects, deploymentId, requestBPId, bpData) => {
    if (!projects || !deploymentId) {
      return null;
    }

    if (requestBPId && bpData?.input == null) {
      return;
    }

    let testDatasList = [];
    let optionsTestDatas = [];
    let rangeDateByTestDataId = {};
    let resultColumns = [];
    let filters = [];
    let columns = [];
    let testIdName = null;
    let displayType = null;
    let sendParams = null;
    let metricName = 'nrmse';
    let errorMsg = null;

    let testDatasValueList = calcFieldValuesByDeployId(undefined, deploymentId);
    let testIdName1 = testDatasValueList?.displayInfo?.testIdName;

    if (requestBPId != null) {
      let data1 = bpData?.rawInput;
      if (data1 == null || !_.isObject(data1)) {
        data1 = bpData?.input;
      }

      let id1 = bpData?.rawInput;
      if (_.isObject(id1)) {
        id1 = bpData?.rawInput?.[testIdName1] ?? bpData?.input?.[testIdName1];
      }

      if (Utils.isNullOrEmpty(id1) && !Utils.isNullOrEmpty(requestBPId)) {
        let id2 = '' + requestBPId;
        id1 = id2;
      }

      testDatasValueList = {};
      testDatasValueList.ids = [
        {
          data: data1 ?? {},
          id: id1,
        },
      ];
    }

    if (testDatasValueList != null) {
      errorMsg = testDatasValueList?.error;

      if (testDatasValueList?.ids != null) {
        if (this.projectUseCasesUsed === Constants.cumulative_usecase && testDatasValueList?.idsAlreadyProcessed == null) {
          testDatasValueList.idsAlreadyProcessed = true;
          testDatasValueList.ids = testDatasValueList?.ids?.map((i1: any, ind) => {
            return {
              id: i1?.[testIdName1],
              data: i1?.[testIdName1],
              dataInternal: i1,

              minTs: moment
                .unix(i1?.startTimestamp / 1000)
                .utc()
                .format(),
              maxTs: moment
                .unix(i1?.endTimestamp / 1000)
                .utc()
                .format(),
              maxPredictionTs: moment
                .unix(i1?.endTimestamp / 1000)
                .utc()
                .format(),
              testFoldStartTs: moment
                .unix(i1?.testStartTimstamp / 1000)
                .utc()
                .format(),
            };
          });
        }
        if (testDatasValueList?.displayInfo?.displayType?.toUpperCase() === PredictionDisplayType.optimization.toUpperCase() && testDatasValueList?.idsAlreadyProcessed == null) {
          testDatasValueList.idsAlreadyProcessed = true;
          testDatasValueList.ids = testDatasValueList?.ids?.map((i1: any, ind) => {
            return {
              id: i1?.[testIdName1],
              data: { [testIdName1]: i1?.[testIdName1] },
              dataInternal: i1,
            };
          });
        }

        displayType = testDatasValueList?.displayInfo?.displayType;
        testIdName = testDatasValueList?.displayInfo?.testIdName;

        let optionsTestDatasDict = {};
        testDatasValueList.ids.some((f1) => {
          let f1_id = null;
          f1_id = f1.id;
          if (f1_id == null) {
            return false;
          }

          let obj2 = {
            value: f1_id,
            label: f1_id,
            search: f1_id,
          };
          optionsTestDatas.push(obj2);
          optionsTestDatasDict['' + f1_id] = obj2;

          if (f1.data != null) {
            testDatasList.push(f1.data);
          }

          rangeDateByTestDataId[f1_id] = f1;
        });

        //
        let detailedMetrics = testDatasValueList?.metrics?.detailedMetrics;
        if (detailedMetrics?.itemsSortedByNrmse?.ids != null || detailedMetrics?.itemsSortedByMetric?.ids != null) {
          const idsSorted = detailedMetrics?.itemsSortedByMetric?.ids ?? detailedMetrics?.itemsSortedByNrmse?.ids;
          const errors = detailedMetrics?.itemsSortedByMetric?.metricValues ?? detailedMetrics?.itemsSortedByNrmse?.nrmses;
          metricName = detailedMetrics?.itemsSortedByMetric?.metricName ?? 'nrmse';
          const itemsSortedByMetric = detailedMetrics?.itemsSortedByMetric;

          let optionsTestDatasNew = [];
          idsSorted?.some((id1, idind) => {
            if (rangeDateByTestDataId[id1]) {
              let option1: any = optionsTestDatasDict['' + id1];
              const error1 = errors?.[idind];
              if (option1 != null && error1 != null) {
                delete optionsTestDatasDict['' + id1];

                option1.error = error1;
                if (option1.error != null) {
                  let decimals1 = 3;
                  let format1 = null;
                  if (itemsSortedByMetric != null) {
                    decimals1 = itemsSortedByMetric.decimals ?? decimals1;
                    format1 = itemsSortedByMetric.format;
                  }
                  let st1 = Utils.decimals(error1 ?? 0, decimals1);
                  if (!Utils.isNullOrEmpty(format1)) {
                    st1 += format1;
                  }

                  option1.label = (
                    <span>
                      {id1}: <span style={{ opacity: 0.8 }}>{st1}</span>
                    </span>
                  );
                }

                optionsTestDatasNew.push(option1);
              }
            }
          });

          let endList = optionsTestDatasNew ?? [];
          optionsTestDatas.some((o1) => {
            if (o1.value != null && optionsTestDatasDict['' + o1.value]) {
              endList.push(o1);
            }
          });

          optionsTestDatas = endList;
        }

        //
        sendParams = testDatasValueList?.formatKwargs;
        resultColumns = testDatasValueList?.formatKwargs?.resultColumns;
        filters = testDatasValueList?.displayInfo?.predictionParams;
        columns = testDatasValueList?.displayInfo?.columns;

        let filterValues = {};
        filters &&
          filters.some((f1) => {
            if (!Utils.isNullOrEmpty(f1.default_value || f1.defaultValue)) {
              filterValues[f1.send_field || f1.sendField] = f1.default_value || f1.defaultValue;
            }
          });
        if (!doCall) {
          if (!_.isEqual(filterValues, this.state.filterValues)) {
            setTimeout(() => {
              if (!this.isM) {
                return;
              }
              this.setState({
                filterValues,
              });
            }, 0);
          }
        }
      }
    } else {
      if (!projects.get('isRefreshing')) {
        if (doCall) {
          StoreActions.getFieldValuesForDeploymentId_(deploymentId);
        }
      }
      return null;
    }

    let errorLastCall = calcErrorFieldValuesByDeployId(undefined, deploymentId);
    let optionsTestDatasAll = optionsTestDatas;

    return { errorMsg, metricName, optionsTestDatasAll, optionsTestDatas, rangeDateByTestDataId, testDatasList, resultColumns, filters, resultTestDatas: testDatasValueList, columns, testIdName, displayType, sendParams, errorLastCall };
  });

  onChangeAlgoId = (value, cbFinish: () => void) => {
    this.setState(
      {
        selectedAlgoId: value,
      },
      () => {
        cbFinish && cbFinish();
      },
    );
  };

  onChangeFilterValues = (value, cbFinish: () => void) => {
    this.setState(
      {
        filterValues: value,
      },
      () => {
        cbFinish && cbFinish();
      },
    );
  };

  memModelAllowDeploy = memoizeOne((listModels) => {
    if (!listModels) {
      return null;
    }

    let res = null;
    listModels.some((m1) => {
      let allowDeploy = true;
      let lifecycle1 = m1.getIn(['latestModelVersion', 'status']);
      if ((lifecycle1 || '') !== ModelLifecycle.COMPLETE) {
        allowDeploy = false;
      }
      if (m1.get('baselineModel')) {
        allowDeploy = false;
      }

      if (allowDeploy) {
        res = m1.get('modelId');
        return true;
      }
    });

    return res;
  });

  memUseCaseSel = memoizeOneCurry((doCall, useCases, useCase) => {
    if (useCases && useCase) {
      if (useCases.get('isRefreshing')) {
        return;
      }

      if (useCases.get('neverDone')) {
        if (doCall) {
          StoreActions.getUseCases_();
        }
      } else {
        let list = useCases.get('list');
        if (list) {
          return list.find((u1) => u1.useCase === useCase);
        }
      }
    }
  });

  memUseCaseInfo = memoizeOne((selUseCase) => {
    if (selUseCase) {
      if (selUseCase.info) {
        let info = selUseCase.info;
        if (_.isString(info)) {
          info = Utils.tryJsonParse(info);
        }
        return info;
      }
    }
  });

  memAlgosParam = memoizeOne((deployId) => {
    if (deployId && this.state.selectedAlgoId !== deployId) {
      setTimeout(() => {
        this.setState({
          selectedAlgoId: deployId,
        });
      }, 0);
    }
  });

  memAlgos = memoizeOne((optionsAlgo) => {
    if (this.props.paramsProp?.get('deployId')) {
      return;
    }

    if (optionsAlgo && optionsAlgo.length > 0) {
      if (this.state.selectedAlgoId == null || this.state.selectedAlgoId === '' || optionsAlgo.find((o1) => o1.value === this.state.selectedAlgoId) == null) {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }

          this.setState({
            selectedAlgoId: optionsAlgo[0].value,
          });
        }, 0);
      }
    }
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onChangeDisplayType = (dt1) => {
    this.setState({
      displayTypeOver: dt1,
    });
  };

  render() {
    let { deployments, projects, paramsProp, models } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    //common
    let optionsAlgo = this.props.optionsAlgo;
    let needDeploy = this.props.needDeploy;

    let algoSelectValue = null;
    if (this.state.selectedAlgoId) {
      algoSelectValue = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.state.selectedAlgoId);
    }

    let bpData = this.memBPData(false)(this.props.requests, this.calcRequestBPId(), this.calcRequestBPIdVersion());
    this.projectUseCasesUsed = foundProject1?.useCase;

    let deploymentId1 = this.props.isDeployDetail ? this.props.paramsProp?.get('deployId') : algoSelectValue?.value;
    if (this.calcRequestBPId() != null && !deploymentId1) {
      deploymentId1 = this.props.paramsProp?.get('deployId');
    }
    let optionsTestDatasRes = this.memOptionsTestDatas(false)(projects, deploymentId1, this.calcRequestBPId(), bpData);
    let displayType = optionsTestDatasRes?.displayType;
    let resultTestDatas = optionsTestDatasRes?.resultTestDatas;

    if (resultTestDatas == null && projects?.get('isRefreshing')) {
      return (
        <RefreshAndProgress msgMsg={`Retrieving ${foundProject1?.useCase === 'CHAT_LLM' ? 'conversations' : 'Information'}...`} isMsgAnimRefresh={true}>
          &nbsp;
        </RefreshAndProgress>
      );
    }

    let errorLastCall = optionsTestDatasRes?.errorLastCall;
    if (!Utils.isNullOrEmpty(errorLastCall) && this.calcRequestBPId() == null) {
      return (
        <RefreshAndProgress
          errorMsg={errorLastCall}
          errorButtonText={'All projects'}
          onClickErrorButton={() => {
            Location.push('/' + PartsLink.project_list);
          }}
        >
          &nbsp;
        </RefreshAndProgress>
      );
    }

    //
    let projectFound1 = foundProject1;

    let content = null;
    if (projectId) {
      let pp: any = {};

      this.memAlgos(optionsAlgo);
      if (Utils.isNullOrEmpty(this.props.paramsProp?.get('selectedAlgoId'))) {
        this.memAlgosParam(this.props.paramsProp?.get('deployId'));
      }

      pp.optionsAlgo = optionsAlgo;
      pp.optionsTestDatasRes = optionsTestDatasRes;

      pp.selectedAlgoId = this.state.selectedAlgoId;
      pp.onChangeAlgoId = this.onChangeAlgoId;

      pp.filterValues = this.state.filterValues;
      pp.onChangeFilterValues = this.onChangeFilterValues;

      if (this.props.isDeployDetail) {
        content = this.props.calcContent?.({ optionsTestDatasRes });
      } else {
        let selUseCase = this.memUseCaseSel(false)(this.props.useCases, foundProject1 && foundProject1.useCase);
        if (selUseCase != null) {
          let useCaseInfo = this.memUseCaseInfo(selUseCase);
          pp.useCaseInfo = useCaseInfo;

          let displayTypeFromInfo = useCaseInfo?.prediction_ui_display_type;
          if (Utils.isNullOrEmpty(displayType) && optionsTestDatasRes != null && displayTypeFromInfo != null && displayTypeFromInfo !== '') {
            displayType = displayTypeFromInfo;
          }

          let displayTypeOri = displayType;
          if (this.state.displayTypeOver) {
            displayType = this.state.displayTypeOver;
          }

          if (foundProject1.useCase === Constants.cumulative_usecase) {
            displayType = PredictionDisplayType.chart_table;
          } else if (foundProject1.useCase === Constants.clustering_usecase) {
            displayType = PredictionDisplayType.clustering;
          } else if (foundProject1.useCase === Constants.clustering_timeseries_usecase) {
            displayType = PredictionDisplayType.clustering_timeseries;
          } else if (foundProject1.useCase === Constants.ai_agent) {
            displayType = PredictionDisplayType.ai_agent;
          }
          let isNlpTextClassification = foundProject1?.useCase?.toUpperCase() === 'nlp_classification'.toUpperCase();
          if (isNlpTextClassification) {
            displayType = PredictionDisplayType.sentiment;
          }
          if (foundProject1.useCase?.toLowerCase() === 'vision') {
            displayType = 'vision';
          }
          if (!Utils.isNullOrEmpty(optionsTestDatasRes?.errorMsg)) {
            //errorMsg
            content = <RefreshAndProgress errorMsg={optionsTestDatasRes?.errorMsg}>&nbsp;</RefreshAndProgress>;
          } else if (displayType === PredictionDisplayType.vision) {
            //docStore vision
            content = <ModelPredictionsImageDescriptionOne isVision projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.histogram_timeseries_windows) {
            //anomaly (requestId) //TODO test
            content = <ModelPredictionsHistogramTimeseriesOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.anomaly_timeseries_table) {
            //Anomaly New (requestId) //TODO 3 requests
            content = <ModelPredictionsAnomalyTableOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.histogram_table) {
            //Intelligent Threat Detection (requestId) //TODO test
            content = <ModelPredictionsHistogramTableOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.search) {
            //regression (requestId)
            content = <ModelPredictionsEntitiesOne isSearch saveName={'predDashSearch'} projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.languageDetection) {
            //regression (requestId)
            content = <ModelPredictionsEntitiesOne isNlpTextClassification={isNlpTextClassification} isLangDetection saveName={'predDashLanguageDetection'} projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.entities) {
            //NLP Entities
            content = <ModelPredictionsEntitiesOne saveName={'predDash'} projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.two_tables) {
            //personalization: Personalized Promotions / Personalized Recommendations (requestId)
            content = <ModelPredictionsPersonalizationOne allowChangeDisplayType={displayTypeOri === PredictionDisplayType.list_and_table} onChangeDisplayType={this.onChangeDisplayType} projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.two_tables_with_header) {
            //Related Items / PNP (requestId)
            content = <ModelPredictionsPersonalizationOne projectId={projectId} showItems={true} {...pp} />;
          } else if (displayType === PredictionDisplayType.table_with_result) {
            //regression (requestId)
            content = <ModelPredictionsRegressionOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.clustering) {
            //clustering
            content = <ModelPredictionsClusteringOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.chat || displayType === PredictionDisplayType.ai_agent) {
            //chat
            content = <ModelPredictionConversationPage {...pp} />;
          } else if (displayType === PredictionDisplayType.image_description) {
            //image_description
            content = <ModelPredictionsImageDescriptionOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.style_transfer) {
            //style_transfer
            content = <ModelPredictionsStyleTransferOne deploymentId={deploymentId1} />;
          } else if (displayType === PredictionDisplayType.text_to_image_generation) {
            //stable_diffusion
            content = <ModelPredictionsStableDiffusionOne deploymentId={deploymentId1} />;
          } else if (displayType === PredictionDisplayType.sentiment) {
            //sentiment
            content = <ModelPredictionsSentimentOne isNlpTextClassification={isNlpTextClassification} projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.chart) {
            //forecasting
            content = <ModelPredictionsOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.clustering_timeseries) {
            //clustering_timeseries
            content = <ModelPredictionsClusteringTimeseriesOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.chart_table) {
            //CUMULATIVE_SALES
            content = <ModelPredictionsChartTableOne projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.list_and_table) {
            //ReRank / affinity (requestId)
            content = <ModelPredictionsListsOne allowChangeDisplayType={displayTypeOri === PredictionDisplayType.list_and_table} onChangeDisplayType={this.onChangeDisplayType} projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.optimization) {
            //optimization
            content = <ModelPredictionsOptimization projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.text_classification || displayType === PredictionDisplayType.sequence_classification) {
            // backward compatible to allow two conditions
            content = <ModelPredictionTextClassification projectId={projectId} {...pp} />;
          } else if (displayType === PredictionDisplayType.text_guided_image_editing) {
            content = <ModelPredictionsImageEditing projectId={projectId} deploymentId={deploymentId1} {...pp} />;
          } else if (optionsTestDatasRes != null) {
            const isPretrained = foundProject1?.useCase?.toUpperCase()?.startsWith('PRETRAINED');
            let msg = isPretrained ? 'Dashboard is not available for this model yet, please contact us if you need it' : 'Display Type not supported';
            content = (
              <RefreshAndProgress
                errorMsg={msg}
                errorButtonText={'All projects'}
                onClickErrorButton={() => {
                  Location.push('/' + PartsLink.project_list);
                }}
              >
                &nbsp;
              </RefreshAndProgress>
            );
          } else if (projectId) {
            if (projectFound1 && !needDeploy) {
              content = null;
            }
          }
        }
      }
    }

    return <RefreshAndProgress isMsgAnimRefresh={Utils.isNullOrEmpty(displayType) || content == null || optionsTestDatasRes == null || _.isEmpty(optionsTestDatasRes)}>{content}</RefreshAndProgress>;
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    algorithms: state.algorithms,
    deployments: state.deployments,
    models: state.models,
    useCases: state.useCases,
    requests: state.requests,
  }),
  null,
)(ModelPredictionCommon);
