import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TableSortLabel from '@mui/material/TableSortLabel';
import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Popover from 'antd/lib/popover';
import Upload from 'antd/lib/upload';
import _ from 'lodash';
import * as moment from 'moment/moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils, { ColorsGradients } from '../../../core/Utils';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import { calcDocStoreDefFromProject } from '../../api/DocStoreInterfaces';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { memProjectById } from '../../stores/reducers/projects';
import requests from '../../stores/reducers/requests';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import { IModelPropsCommon } from '../ModelPredictionCommon/ModelPredictionCommon';
import { FilterOne } from '../ModelPredictionsRegressionOne/ModelPredictionsRegressionOne';
import { intRowIndex, isEqualAllSmart } from '../ModelPredictionsRegressionOne/PredEqualSmart';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const sd = require('../antdUseDark.module.css');
const s = require('./ModelPredictionsImageDescriptionOne.module.css');

const cellHH = 54;
const sepArray = '___###___';

interface IModelPredictionsImageDescriptionOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;
  deployments?: any;
  requests?: any;
  featureGroups?: any;

  projectId?: string;
  isVision?: boolean;
}

interface IModelPredictionsImageDescriptionOneState {
  predictData?: any;
  resultError?: any;
  sliceResultsCount?: any;
  resultActual?: any;
  resultPredicted?: any;
  resultPredictedClass?: any;
  isRefreshingResult?: boolean;

  predictedDocId?: any;
  dataGridList?: any;
  dataGridListFiltered?: any;
  sortByField?: any;
  sortOrderIsAsc?: any;
  selectedFieldValueId?: string;

  showGrid?: boolean;
  hoveredRowIndex?: number;

  imageDescriptionData?: any[];

  imgPreviewBase64?: string;
  selectedUploadFileList: any[];
  selectedUploadFileData: any;
  clickPredict?: boolean;
  filterValues?;
  filterValuesPopoverVisible?;
}

const ImageTypes = ['image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];

class ModelPredictionsImageDescriptionOne extends React.PureComponent<IModelPredictionsImageDescriptionOneProps & IModelPropsCommon, IModelPredictionsImageDescriptionOneState> {
  private unDark: any;
  private isM: boolean;
  private lastCallPredictData: any;
  formRef = React.createRef<FormInstance>();
  formPredicted = React.createRef<FormInstance>();
  formActual = React.createRef<FormInstance>();
  lastProjectId: any;

  constructor(props) {
    super(props);
    this.state = {
      isRefreshingResult: false,
      showGrid: false,
      selectedUploadFileList: [],
      imgPreviewBase64: null,
      selectedUploadFileData: null,
      clickPredict: false,
    };
  }

  onDarkModeChanged = (isDark) => {
    if (!this.isM) {
      return;
    }

    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);

    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;

    this.unDark();
  }

  componentDidUpdate(prevProps: Readonly<IModelPredictionsImageDescriptionOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsImageDescriptionOneState>, snapshot?: any) {
    this.doMem();
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

  memChangeRefresh = memoizeOne((selectedAlgoId) => {
    this.lastProjectId = undefined;
    this.lastCallPredictData = undefined;
    this.lastSelectedAlgoId = undefined;
    this.lastUsedPredRow = undefined;
    this.lastReqOneUsed = undefined;

    this.setState({
      predictData: null,
      resultActual: null,
      resultPredicted: null,
      // resultPredictedClass: null,
      // resultExplanations: null,
      // resultExplanationsText: null,
      // resultExplanationsNested: null,
      // resultExplanationsTextNested: null,
      // isShowNested: false,
      // nestedColSel: null,
      resultError: null,
      // resultPredictedFieldsSel: null,
      // fixedFeatures: null,
    });
  });

  lastReqOneUsed = null;
  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let { projects, projectId } = this.props;

    let foundProject1 = this.memProjectId(true)(projectId, projects);

    this.memChangeRefresh(this.props.selectedAlgoId);

    this.memModelChanged(this.props.selectedAlgoId);

    let reqOne = this.memRequestOne(true)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
    if (this.calcRequestId() && this.state.predictData == null && this.lastReqOneUsed !== reqOne) {
      if (reqOne?.query?.data != null) {
        this.lastReqOneUsed = reqOne;
        let data1 = /*Utils.tryJsonParse*/ reqOne?.query?.data;
        if (data1 != null) {
          this.showPrediction(data1);
        }
      }
    }

    let reqOneBP = this.memBPData(true)(this.props.requests, this.calcRequestBPId(), this.calcRequestBPIdVersion());
    if (this.calcRequestBPId() != null && this.state.predictData == null && this.lastReqOneUsed !== reqOneBP) {
      this.lastReqOneUsed = reqOneBP;
      let data1 = /*Utils.tryJsonParse*/ reqOneBP?.input;
      if (data1 != null) {
        this.showPrediction(data1);
      }
    }
  };

  memBPData = memoizeOneCurry((doCall, requestsParam, requestBPId, batchPredictionVersion) => {
    return requests.memRequestBPById(doCall, undefined, batchPredictionVersion, requestBPId ?? 0);
  });

  calcRequestId = () => {
    let requestId = this.props.paramsProp?.get('requestId');
    if (requestId === '') {
      requestId = null;
    }
    return requestId;
  };

  calcRequestBPId = () => {
    return Utils.tryParseInt(this.props.paramsProp?.get('requestBPId')?.split('_')?.[0]);
  };

  calcRequestBPIdVersion = () => {
    return this.props.paramsProp?.get('requestBPId')?.split('_')?.[1];
  };

  memRequestOne = memoizeOneCurry((doCall, requestsParam, deployId, requestId) => {
    return requests.memRequestById(doCall, undefined, deployId, requestId);
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  refreshUrlWithParams = () => {
    //TODO
  };

  doPredictResult = (e) => {
    this.formRef?.current?.submit();
  };

  onClickExperimentClose = (e) => {
    this.setState({
      showGrid: false,
      hoveredRowIndex: null,
    });
  };

  onClickExperiment = (e) => {
    this.setState({
      showGrid: true,
      hoveredRowIndex: null,
    });
  };

  processValues = (values) => {
    let vv = _.assign({}, values);
    let kk = Object.keys(vv);
    kk.some((k1) => {
      if (k1.indexOf(sepArray) > -1) {
        let ss = k1.split(sepArray);
        let values0 = vv;
        ss.some((s1, s1ind) => {
          let isArray = false;
          if (_.startsWith(s1, '[-[')) {
            s1 = s1.substring('[-['.length);
            isArray = true;
          }
          if (_.startsWith(s1, '[[[')) {
            s1 = s1.substring('[[['.length);
            let arrInd = Utils.tryParseInt(s1);
            values0[arrInd] = values0[arrInd] ?? {};
            values0 = values0[arrInd];
            return false;
          }

          if (s1ind === ss.length - 1) {
            values0[s1] = vv[k1];
          } else {
            if (values0[s1] == null) {
              values0[s1] = isArray ? [] : {};
            }
            values0 = values0[s1];
          }
        });
        delete vv[k1];
      }
    });

    return vv;
  };

  calcDataFromListTestDatas: () => { vv; useDataId } = () => {
    let values = this.formRef.current?.getFieldsValue();
    let vv = this.processValues(values);

    let useDataId = null;
    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;
    if (testDatasList && columnsDisplay) {
      let kk = Object.keys(rangeDateByTestDataId);
      kk.some((k1) => {
        let all1 = rangeDateByTestDataId[k1];
        let data1 = all1.data;
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            if (all1 && vv && isEqualAllSmart(data1, vv)) {
              useDataId = all1.id;
              return true;
            }
          }
        }
      });
    }

    return { vv, useDataId };
  };

  renderObjectToFields: (list, nameForm, dataClass?) => { dataList?; list; initialValues } = (list, nameForm = '', dataClass = null) => {
    let res = [],
      initialValues = {};

    if (list != null && !_.isArray(list) && _.isObject(list)) {
      list = [list];
    }

    let dataList = [],
      labels = [];

    if (list && _.isArray(list)) {
      list.some((data) => {
        let kk = Object.keys(data);
        kk.some((k1) => {
          let v1 = data[k1];
          if (_.isNaN(v1)) {
            v1 = null;
          }

          let input = null;
          if (_.isObject(v1)) {
            let vv = [];
            let v1kk = Object.keys(v1);
            v1kk.some((v1k1) => {
              if (v1[v1k1] != null) {
                vv.push({ value: v1[v1k1], name: v1k1 });
              }
            });
            vv.sort((a, b) => {
              if (a.value === b.value) {
                return 0;
              } else if (a.value < b.value) {
                return 1;
              } else {
                return -1;
              }
            });

            //move resultPredictedClass value to the left of chart
            let classV = this.state.resultPredictedClass;
            let classVvalue = classV?.[Object.keys(classV ?? {})?.[0]];
            if (classVvalue != null) {
              let ind1 = _.findIndex(vv ?? [], (s1) => s1.name === classVvalue);
              if (ind1 > -1 && vv != null) {
                let o2 = vv[ind1];
                if (o2 != null) {
                  vv.splice(ind1, 1);
                  vv.unshift(o2);
                }
              }
            }

            vv?.slice(0, 5)?.some((v1) => {
              labels.push(v1.name);
              dataList.push({ meta: v1.name, value: v1.value });
            });

            let dataClassV = null;
            if (dataClass != null) {
              dataClassV = Object.values(dataClass)?.[0];
            }

            let maxV = null,
              maxName = null,
              dataListChart = [],
              maxClassV = null,
              maxClassName = null;
            dataList?.some((d1) => {
              if (!Utils.isNullOrEmpty(dataClassV)) {
                if (('' + dataClassV)?.toLowerCase() === ('' + d1.meta)?.toLowerCase()) {
                  maxClassV = d1.value;
                  maxClassName = d1.meta;
                }
              }
              if (maxV == null || d1.value > maxV) {
                maxV = d1.value;
                maxName = d1.meta;
              }

              dataListChart.push({
                x: d1.meta,
                y: d1.value,
              });
            });

            input = maxClassName ?? maxName;
            let input2 = maxClassV ?? maxV;

            const hHH = 260;
            let data1: any = {
              useSmallBars: true,
              roundBars: true,
              maxDecimalsTooltip: 3,
              labelMaxChars: 40,
              gridColor: '#4c5b92',
              labelColor: '#8798ad',
              titleStyle: {
                color: '#d1e4f5',
                fontFamily: 'Matter',
                fontSize: 13,
                fontWeight: 'bold',
              },
              doRotate: true,
              forceToPrintAllLabels: true,
              divisorX: null,
              useTitles: true,
              titleY: 'Probability of Value',
              titleX: k1,
              tooltips: true,
              data: dataListChart,
              labels: labels,
            };

            let histogram = (
              <div style={{ position: 'relative', color: 'white', marginTop: '20px' }}>
                <div style={{ height: hHH + 'px', position: 'relative', width: '100%' }}>
                  <div style={{ margin: '0 10px', zIndex: 2, height: hHH + 'px', position: 'relative' }}>
                    <ChartXYExt axisYMin={0} useEC colorIndex={0} height={hHH} colorFixed={ColorsGradients} data={data1} type={'bar'} />
                  </div>
                </div>
              </div>
            );

            res.push(
              <div key={'v1ch' + k1 + input + '_' + input2} style={{ color: Utils.colorAall(1), marginTop: '10px' }}>
                <div>
                  {k1}:&nbsp;{input}
                </div>
                <div style={{ marginTop: '4px' }}>Probability:&nbsp;{Utils.decimals(input2, 6)}</div>
                <div>{histogram}</div>
              </div>,
            );
          } else {
            if (_.isNumber(v1)) {
              v1 = Utils.decimals(v1, 2);
            }

            // let inputName = this.dontusePrefix + nameForm + k1.replace(/[^a-zA-Z0-9]/, '');
            // initialValues[inputName] = v1;
            // initialValues[inputName] = v1;

            res.push(
              <div key={'v1ch' + k1 + v1} style={{ color: Utils.colorAall(1), marginTop: '10px' }}>
                <div>
                  {k1}:&nbsp;{v1}
                </div>
              </div>,
            );
          }
        });
      });
    }

    return { list: res.length === 0 ? null : res, initialValues, dataList };
  };

  memRenderPredicted = memoizeOne((data, dataClass) => {
    return this.renderObjectToFields(data, 'predicted', dataClass);
  });

  lastUsedPredRow = null;
  showPrediction = (row) => {
    if (row == null) {
      return;
    }

    if (this.lastUsedPredRow != null && _.isEqual(this.lastUsedPredRow, row)) {
      return;
    }
    this.lastUsedPredRow = row;

    const categoriesList = row?.categoriesList;

    let colIMAGE = null;
    if (this.props.isVision) {
      let projectId = this.calcProjectId();
      let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
      const docStoreDef = calcDocStoreDefFromProject(foundProject1);
      colIMAGE = this.memVisionColIMAGE(docStoreDef, this.props.optionsTestDatasRes);
      if (row != null) {
        if (colIMAGE !== 'docId' && !Utils.isNullOrEmpty(row[colIMAGE])) {
          row.docId = row[colIMAGE];
        }
      }
    }

    this.setState({
      predictedDocId: null,
    });

    if (this.formRef?.current != null) {
      let currentDocId = this.formRef?.current?.getFieldValue('doc_id');
      let newDocId = row?.docId || '';
      if (currentDocId != newDocId) {
        this.formRef?.current?.setFieldsValue({ doc_id: newDocId });
      }

      this.setState({
        predictedDocId: newDocId,
      });
    }

    //
    if (row != null) {
      row = { ...row };
      delete row[intRowIndex];
    }

    this.setState({
      predictData: row,
      isRefreshingResult: true,
      resultActual: null,
      resultPredicted: null,
      // resultPredictedClass: null,
      // resultExplanations: null,
      // resultExplanationsText: null,
      // resultExplanationsNested: null,
      // resultExplanationsTextNested: null,
      // isShowNested: false,
      // nestedColSel: null,
      resultError: null,
      // resultPredictedFieldsSel: null,
      // fixedFeatures: null,
    });

    this.lastCallPredictData = uuid.v1();

    if (row != null) {
      row = { ...row };
      const kk = Object.keys(row ?? {});
      kk.some((k1) => {
        if (row[k1] === '') {
          delete row[k1];
        }
      });
    }

    let uuid1 = this.lastCallPredictData;
    // let dataParams: any = { queryData: JSON.stringify(row) };

    // let extraParams: any = null;
    // if(this.calcRequestId()==null && this.calcRequestBPId()==null) {
    //   extraParams = extraParams || {};
    //   extraParams.explainPredictions = false;
    // }

    const cb1 = (err, res) => {
      if (this.lastCallPredictData !== uuid1) {
        return;
      }

      this.setState({
        isRefreshingResult: false,
      });

      if (err || !res || !res.result) {
        if (err === 'Requested deployment is not active') {
          StoreActions.deployList_(this.props.paramsProp?.get('projectId'));
        }
        if (res?.errorType !== 'DataNotFoundError') {
          REActions.addNotificationError(err || Constants.errorDefault);
        }
        this.setState({
          imageDescriptionData: null,
          isRefreshingResult: false,
          resultError: err || Constants.errorDefault,
        });
      } else {
        let actual = null;

        let optionsTestDatasRes = this.props.optionsTestDatasRes;
        let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
        let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
        let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;
        if (testDatasList && columnsDisplay) {
          // let isEqualAll = (data1, data2) => {
          //   let kk = columnsDisplay.map(c1 => c1.key);
          //   if('id' in kk) {
          //     // @ts-ignore
          //     kk.unshift('id');
          //   }
          //   if('Id' in kk) {
          //     // @ts-ignore
          //     kk.unshift('Id');
          //   }
          //   if('ID' in kk) {
          //     // @ts-ignore
          //     kk.unshift('ID');
          //   }
          //
          //   let res = true;
          //   kk.some(k1 => {
          //     if(!Utils.isNullOrEmpty(data1[k1]) || !Utils.isNullOrEmpty(data2[k1])) {
          //       res = data1[k1]===data2[k1];
          //       if(!res) {
          //         return true;
          //       }
          //     }
          //   });
          //   return res;
          // };
          // let kk = Object.keys(rangeDateByTestDataId);
          // kk.some(k1 => {
          //   let all1 = rangeDateByTestDataId[k1];
          //   let data1 = all1.data;
          //   if (data1) {
          //     if(_.isArray(data1)) {
          //       data1 = data1[0];
          //     }
          //     if(data1) {
          //       if(all1 && this.state.predictData && isEqualAllSmart(data1, this.state.predictData)) {
          //         actual = all1.actual;
          //         if(actual!=null) {
          //           let predictedOne = res?.result?.predicted;
          //           if(predictedOne?.result!=null && predictedOne?.all_labels!=null) {
          //             predictedOne = predictedOne?.result;
          //           }
          //
          //           let key1 = 'value';
          //           if(predictedOne && _.isArray(predictedOne) && predictedOne.length>0) {
          //             let kk = Object.keys(predictedOne[0]);
          //             if(kk && kk.length>0) {
          //               key1 = kk[0];
          //             }
          //           } else if(predictedOne && _.isObject(predictedOne) && !_.isEmpty(predictedOne)) {
          //             let kk = Object.keys(predictedOne);
          //             if(kk && kk.length>0) {
          //               key1 = kk[0];
          //             }
          //           }
          //
          //           actual = [{ [key1]: actual }];
          //         }
          //         return true;
          //       }
          //     }
          //   }
          // });
        }

        let predictedOne = res?.result?.predicted;
        let predictedClass1 = null;
        if (predictedOne?.result != null && predictedOne?.all_labels != null) {
          predictedClass1 = predictedOne?.result_class;
          predictedOne = predictedOne?.result;
        }

        let data1 = res?.result?.predicted;
        if (this.props.isVision) {
          data1 = data1?.label;
        }

        this.setState({
          imageDescriptionData: data1,
          isRefreshingResult: false,

          resultActual: actual,
          resultPredicted: predictedOne,
          // resultPredictedClass: predictedClass1,
          resultError: null,
          sliceResultsCount: this.props.isVision ? null : categoriesList?.length > 10 ? 10 : null,
        });
      }
    };

    if (this.props.isVision) {
      // (err, res) => {
      //   if(res?.success && _.isArray(res?.result?.predicted)) {
      //     this.setState({
      //       imageDescriptionData: res?.result?.predicted,
      //       isRefreshingResult: false,
      //     });
      //
      //   } else {
      //     this.setState({
      //       imageDescriptionData: null,
      //       isRefreshingResult: false
      //     });
      //   }
      // }
      if (!Utils.isNullOrEmpty(row?.docId)) {
        let dataParams: any = { [colIMAGE]: row?.docId };
        dataParams = { data: JSON.stringify(dataParams) };

        REClient_.client_()._predictForUI(this.props.selectedAlgoId, dataParams, null, this.calcRequestId(), cb1);
      } else {
        REClient_.client_()._predictForUI_binaryData(this.props.selectedAlgoId, this.state.selectedUploadFileData, null, {}, cb1);
      }
    } else {
      let extraParams = this.props.isVision ? {} : { categories: categoriesList == null ? undefined : JSON.stringify(categoriesList) };
      REClient_.client_()._predictForUI_binaryData(this.props.selectedAlgoId, this.state.selectedUploadFileData, 'image', extraParams, cb1);
    }

    // REClient_.client_()._predictForUI_predictClass(this.props.selectedAlgoId, dataParams, extraParams, this.calcRequestId(), );
  };

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      return null;
    } else {
      return projectId;
    }
  };

  doPredictAPI = (e) => {
    let { vv, useDataId } = this.calcDataFromListTestDatas();

    if (useDataId == null) {
      REClient_.dataForPredAPI = vv;
    }

    let projectId = this.calcProjectId();
    let deployId = this.props.paramsProp?.get('deployId');
    Location.push('/' + PartsLink.deploy_predictions_api + '/' + projectId + '/' + deployId, undefined, 'fromPredDash=true&useDataId=' + encodeURIComponent(useDataId ?? ''));
  };

  handleSubmitForm = (values) => {
    this.setState({
      clickPredict: true,
    });

    if (!this.state.selectedUploadFileData && !this.props.isVision) {
      return;
    }

    const { projectId } = this.props;

    // this.setState({ isRefreshingResult: true });

    const categoriesList = (values.labels ?? '').trim().split(',');
    const docId = this.props.isVision ? values.doc_id : undefined;

    this.showPrediction({
      file: this.state.selectedUploadFileData,
      categoriesList,
      docId,
    });
  };

  memInitValues = memoizeOne((initActual, initPredicted) => {
    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      if (initPredicted) {
        this.formPredicted?.current?.setFieldsValue(initPredicted);
      }
      if (initActual) {
        this.formActual?.current?.setFieldsValue(initActual);
      }
    }, 0);
  });

  renderPredicted = memoizeOne((sliceResultsCount, imageDescriptionData) => {
    if (!imageDescriptionData) {
      return <></>;
    }

    let dataList = sliceResultsCount == null ? imageDescriptionData : [...(imageDescriptionData ?? [])]?.slice(0, sliceResultsCount);

    const hHH = 260;
    let data1: any = {
      useSmallBars: true,
      roundBars: true,
      maxDecimalsTooltip: 3,
      labelMaxChars: 40,
      gridColor: '#4c5b92',
      labelColor: '#8798ad',
      titleStyle: {
        color: '#d1e4f5',
        fontFamily: 'Matter',
        fontSize: 13,
        fontWeight: 'bold',
      },
      doRotate: true,
      forceToPrintAllLabels: true,
      divisorX: null,
      useTitles: true,
      titleY: 'Probability of Value',
      titleX: 'Labels',
      tooltips: true,
      data: dataList?.map((item) => ({ x: item.category, y: item.score })),
    };

    let chart = (
      <div style={{ position: 'relative', color: 'white', marginTop: '20px' }}>
        <div style={{ height: hHH + 'px', position: 'relative', width: '100%' }}>
          <div style={{ margin: '0 10px', zIndex: 2, height: hHH + 'px', position: 'relative' }}>
            <ChartXYExt axisYMin={0} useEC colorIndex={0} height={hHH} colorFixed={ColorsGradients} data={data1} type={'bar'} />
          </div>
        </div>
      </div>
    );

    return chart;
  });

  selectedUploadFile = (info) => {
    this.setState({
      selectedUploadFileList: info?.fileList?.slice(-1),
    });
  };

  selectedUploadFileData = (file) => {
    this.setState({
      clickPredict: true,
      imgPreviewBase64: null,
    });

    const isImageFile = ImageTypes.includes(file.type);
    if (!isImageFile) {
      this.setState({
        selectedUploadFileData: null,
        selectedUploadFileList: [],
      });

      return Upload.LIST_IGNORE;
    }

    this.setState({
      selectedUploadFileData: file,
    });

    UtilsWeb.blobToBase64(file)
      .then((res) => {
        this.setState({
          imgPreviewBase64: res,
        });
      })
      .catch((err) => {
        //
      });

    return false;
  };

  renderForm = () => {
    const imgWW = 327;
    return (
      <FormExt layout={'vertical'} key={uuid.v1()} ref={this.formRef} onFinish={this.handleSubmitForm} style={{ color: Utils.colorAall(1) }}>
        <Form.Item key={'image_upload'} style={{ marginBottom: '15px', marginTop: 0 }} label={<span style={{ color: Utils.colorAall(1) }}>Image Upload</span>}>
          <Upload fileList={this.state.selectedUploadFileList} beforeUpload={this.selectedUploadFileData} onChange={this.selectedUploadFile}>
            <Button type={'primary'}>Upload</Button>
          </Upload>
          {!this.props.isVision && this.state.clickPredict && !this.state.selectedUploadFileData && <span css="color: red;">Please select image</span>}
          {this.state.imgPreviewBase64 != null && (
            <div
              css={`
                margin-top: 15px;
                margin-bottom: 15px;
              `}
            >
              <img
                src={`` + this.state.imgPreviewBase64}
                width={imgWW + 'px'}
                height={imgWW + 'px'}
                css={`
                  object-fit: contain;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  border-radius: 2px;
                `}
              />
            </div>
          )}
        </Form.Item>
        {this.props.isVision && (
          <Form.Item
            rules={null /*[{ required: true, message: 'Required!' }]*/}
            name="doc_id"
            key={'doc_id'}
            style={{ marginBottom: '15px', marginTop: 0 }}
            label={
              <span style={{ color: Utils.colorAall(1) }}>
                doc_id
                <HelpIcon id={'image_text_doc_id'} style={{ marginLeft: '4px' }} />{' '}
              </span>
            }
          >
            <Input />
          </Form.Item>
        )}

        {!this.props.isVision && (
          <Form.Item
            rules={[{ required: true, message: 'Required!' }]}
            name="labels"
            key={'labels'}
            style={{ marginBottom: '15px', marginTop: 0 }}
            label={
              <span style={{ color: Utils.colorAall(1) }}>
                Labels (comma-separated)
                <HelpIcon id={'image_text_labels'} style={{ marginLeft: '4px' }} />{' '}
              </span>
            }
          >
            <Input />
          </Form.Item>
        )}
      </FormExt>
    );
  };

  onChangeResultsSlice = (option1) => {
    this.setState({
      sliceResultsCount: option1?.value,
    });
  };

  memOptionsSliceResults = memoizeOne((data) => {
    let max = data?.length ?? 0;
    if (max === 0) {
      return null;
    }

    let res = [];
    for (let i = 5; i < max; i += 5) {
      res.push({ label: '' + i, value: i });
    }
    res.push({ label: '' + max + ' (all)', value: null });

    return res;
  });

  onRowMouseChangeIndex = (rowIndex) => {
    if (this.state.hoveredRowIndex !== rowIndex) {
      this.setState({
        hoveredRowIndex: rowIndex,
      });
    }
  };

  onRowMouseEnter = (rowIndex, e) => {
    this.onRowMouseChangeIndex(rowIndex);
  };

  onRowMouseLeave = (e) => {
    this.onRowMouseChangeIndex(null);
  };

  memPredProb = memoizeOne((data1) => {
    let isPredProb = null;

    let probKK = Object.keys(data1 ?? {});
    if (probKK.includes('predicted')) {
      isPredProb = ['predicted'];
      probKK.sort().some((k1) => {
        if (_.startsWith(k1, 'predicted_prob_')) {
          isPredProb.push(k1);
        }
      });
    }

    if (isPredProb != null && isPredProb.length <= 1) {
      isPredProb = null;
    }

    return isPredProb;
  });

  calcTypeFromField = (field1) => {
    if (field1) {
      let dataType = field1.dataType;
      if (dataType != null) {
        return dataType;
      }
    }
    return null;
  };

  getFieldFromIndex = (index) => {
    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;

    if (columnsDisplay) {
      return columnsDisplay[index];
    }
  };

  onClickSetFilter = (columnIndex, value, e) => {
    let ff = [...(this.state.filterValues ?? [])];

    let f1 = ff.find((v1) => v1.fieldIndex === columnIndex);
    if (f1 == null) {
      ff.push({
        fieldIndex: columnIndex,
        value: value,
      });
    } else {
      f1.value = value;
    }
    ff = ff.filter((v1) => !Utils.isNullOrEmpty(v1.value));

    let notFilters = (ff?.length ?? 0) === 0;

    let dataGridListFiltered = null;
    if (!notFilters) {
      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
      let list = testDatasList;
      if (this.state.dataGridList) {
        list = this.state.dataGridList;
      }
      list.some((d1, d1ind) => {
        if (d1[intRowIndex] == null) {
          d1[intRowIndex] = d1ind;
        }
      });
      dataGridListFiltered = list.filter((v1) => {
        let res = true;
        ff?.some((f1) => {
          let value;
          if (f1.fieldIndex === 1) {
            value = optionsTestDatasRes.resultTestDatas?.ids?.[v1[intRowIndex]]?.actual;
          } else {
            let field1 = this.getFieldFromIndex(f1.fieldIndex - 2);
            if (field1?.key) {
              value = v1?.[field1.key];
            }
          }

          if (_.isNumber(value)) {
            let n1 = _.isNumber(f1.value) ? f1.value : Utils.tryParseFloat(f1.value);
            if (n1 != null) {
              if (value !== n1) {
                res = false;
              }
            }
          } else {
            value = '' + value;
            value = value.toLowerCase();
            if (value.indexOf(('' + f1.value).toLowerCase()) === -1) {
              res = false;
            }
          }
        });
        return res;
      });
    }

    this.setState({
      filterValues: ff,
      filterValuesPopoverVisible: null,
      dataGridListFiltered,
    });
  };

  onSortHeaderClick = (columnIndex, isPredProb, e) => {
    let sortOrderIsAsc = this.state.sortOrderIsAsc;
    if (columnIndex === this.state.sortByField) {
      sortOrderIsAsc = !sortOrderIsAsc;
    } else {
      sortOrderIsAsc = true;
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    if (testDatasList) {
      const getValue = (row?, columnIndex?) => {
        let data1 = row;
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            if (columnIndex === 1 + (isPredProb == null ? 0 : isPredProb.length)) {
              let actual1 = optionsTestDatasRes.resultTestDatas?.ids?.[row[intRowIndex]]?.actual;
              return { value: actual1, data1, actual: actual1 };
            } else {
              if (isPredProb != null) {
                if (columnIndex < isPredProb.length) {
                  let data2 = optionsTestDatasRes.resultTestDatas?.ids?.[data1?.[intRowIndex] ?? row] ?? {};
                  return { value: data2?.[isPredProb[columnIndex]] };
                } else {
                  columnIndex -= isPredProb?.length ?? 0;
                }
              }

              let field1 = this.getFieldFromIndex(columnIndex - 2);
              return { value: field1 ? data1[field1.key] : null, data1 };
            }
          }
        }
      };

      testDatasList = testDatasList.map((d1, d1ind) => {
        d1[intRowIndex] = d1ind;
        return d1;
      });

      const sortDo = (list) => {
        return list?.sort((a, b) => {
          let va = getValue(a, columnIndex)?.value;
          let vb = getValue(b, columnIndex)?.value;

          if (_.isString(va) || _.isString(vb)) {
            va = va == null ? '' : '' + va;
            vb = vb == null ? '' : '' + vb;
          } else if (_.isNumber(va) || _.isNumber(vb)) {
            va = va == null ? 0 : va;
            vb = vb == null ? 0 : vb;
          }

          let asc1 = sortOrderIsAsc ? 1 : -1;
          if (va == null || vb == null) {
            return 0;
          } else if (_.isNumber(va) && _.isNumber(vb)) {
            if (va === vb) {
              return 0;
            } else if (va < vb) {
              return -1 * asc1;
            } else {
              return asc1;
            }
          } else {
            let va2 = _.trim('' + va).toLowerCase();
            let vb2 = _.trim('' + vb).toLowerCase();
            if (va2 === vb2) {
              return 0;
            } else {
              return va2.localeCompare(vb2) * asc1;
            }
          }
        });
      };

      let listSorted = sortDo(testDatasList);
      let dataGridListFiltered = sortDo(this.state.dataGridListFiltered);

      this.setState({
        sortByField: columnIndex,
        sortOrderIsAsc,
        dataGridList: listSorted,
        dataGridListFiltered: dataGridListFiltered,
      });

      this.forceUpdate();
    }
  };

  cellRenderer = (
    isPredProb,
    {
      columnIndex, // Horizontal (column) index of cell
      isScrolling, // The Grid is currently being scrolled
      isVisible, // This cell is visible within the grid (eg it is not an overscanned cell)
      key, // Unique key within array of cells
      parent, // Reference to the parent Grid (instance)
      rowIndex, // Vertical (row) index of cell
      style, // Style object to be applied to cell (to position it);
      // This must be passed through to the rendered cell element.
    },
  ) => {
    let content: any = '';

    let getValue = (row, col) => {
      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];

      if (this.state.dataGridList != null) {
        testDatasList = this.state.dataGridList;
      }
      if (this.state.dataGridListFiltered != null) {
        testDatasList = this.state.dataGridListFiltered;
      }

      if (testDatasList) {
        let data1 = testDatasList[row];
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            if (col == null) {
              let actual1 = optionsTestDatasRes.resultTestDatas?.ids?.[data1?.[intRowIndex] ?? row]?.actual;
              return { value: '', data1, actual: actual1 };
            } else {
              if (isPredProb != null) {
                if (col < isPredProb.length) {
                  let data2 = optionsTestDatasRes.resultTestDatas?.ids?.[data1?.[intRowIndex] ?? row] ?? {};
                  return { value: data2?.[isPredProb[col]], data1 };
                } else {
                  col -= isPredProb?.length ?? 0;
                }
              }

              let field1 = this.getFieldFromIndex(col);
              return { value: field1 ? data1[field1.key] : null, data1 };
            }
          }
        }
      }
      return { value: '', data1: null };
    };

    let isSortType = false;
    let data1 = null;
    if (rowIndex === 0) {
      if (columnIndex === 0) {
        content = '';
      } else if (isPredProb != null && columnIndex - 1 < isPredProb.length) {
        content = isPredProb?.[columnIndex - 1];
      } else if (columnIndex === 1 + (isPredProb == null ? 0 : isPredProb.length)) {
        content = 'Target';

        let pred1 = this.state.resultPredicted;
        if (pred1 != null) {
          if (_.isArray(pred1)) {
            pred1 = pred1[0];
          }
          if (_.isObject(pred1)) {
            let kk = Object.keys(pred1);
            if (kk != null && kk.length > 0) {
              content = kk[0];
            }
          }
        }
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 2 - (isPredProb == null ? 0 : isPredProb.length));
        content = 'Col: ' + columnIndex;
        if (field1) {
          if (field1) {
            content = field1.key || '-';
            // if(_.isString(content)) {
            //   content = Utils.prepareHeaderString(content);
            // }
          }
        }
      }

      if (columnIndex > 0) {
        if (content != null && content !== '') {
          let alreadyFilter = false;
          if (this.state.filterValues != null && !Utils.isNullOrEmpty(this.state.filterValues.find((v1) => v1.fieldIndex === columnIndex - (isPredProb?.length ?? 0))?.value)) {
            alreadyFilter = true;
          }

          let overlayFilter = (
            <div>
              <FilterOne
                defaultValue={() => {
                  let res = '';

                  let ff = this.state.filterValues;
                  if (ff != null) {
                    let f1 = ff.find((v1) => v1.fieldIndex === columnIndex - (isPredProb?.length ?? 0));
                    if (f1 != null) {
                      res = f1.value ?? '';
                    }
                  }

                  return res;
                }}
                onClear={this.onClickSetFilter.bind(this, columnIndex - (isPredProb?.length ?? 0), '')}
                onCancel={() => {
                  this.setState({ filterValuesPopoverVisible: null });
                }}
                onSet={this.onClickSetFilter.bind(this, columnIndex - (isPredProb?.length ?? 0))}
              />
            </div>
          );

          const popupContainerForMenu = (node) => document.getElementById('body2');
          let filter1 = (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <TooltipExt title={'Attribute Search'}>
                <Popover
                  destroyTooltipOnHide={true}
                  open={this.state.filterValuesPopoverVisible === columnIndex}
                  onOpenChange={(isV) => {
                    this.setState({ filterValuesPopoverVisible: isV ? columnIndex : null });
                  }}
                  placement={'bottom'}
                  overlayClassName={sd.popback}
                  getPopupContainer={popupContainerForMenu}
                  content={overlayFilter}
                  trigger={['click']}
                >
                  <span
                    css={`
                      opacity: 0.64;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                  >
                    <FontAwesomeIcon
                      icon={require('@fortawesome/pro-solid-svg-icons/faFilter').faFilter}
                      transform={{ size: 18, x: 0, y: 0 }}
                      style={{ marginLeft: '7px', cursor: 'pointer', color: alreadyFilter ? Constants.blue : 'white' }}
                    />
                  </span>
                </Popover>
              </TooltipExt>
            </span>
          );
          if (isPredProb != null && columnIndex <= isPredProb.length) {
            filter1 = null;
          }

          let sortByField = this.state.sortByField;
          isSortType = true;
          content = (
            <TableSortLabel
              disabled={isPredProb == null ? undefined : columnIndex <= isPredProb.length}
              active={sortByField === columnIndex}
              direction={this.state.sortOrderIsAsc ? 'asc' : 'desc'}
              onClick={this.onSortHeaderClick.bind(this, columnIndex, isPredProb)}
            >
              {content}
              {filter1}
            </TableSortLabel>
          );
        }
      }
    } else {
      if (columnIndex === 0) {
        content = '' + rowIndex;
        let v1 = getValue(rowIndex - 1, 1);
        if (v1) {
          data1 = v1.data1;
        }
      } else if (columnIndex === 1 + (isPredProb == null ? 0 : isPredProb.length)) {
        let vdata = getValue(rowIndex - 1, 1);
        if (vdata) {
          data1 = vdata.data1;
        }
        let v1 = getValue(rowIndex - 1, null);
        content = v1?.actual ?? '';
      } else {
        let v1 = getValue(rowIndex - 1, columnIndex - 2 + (isPredProb != null && columnIndex - 2 < isPredProb.length ? 1 : 0));
        content = '';
        if (v1) {
          content = v1.value;
          data1 = v1.data1;
        }

        if (content == null) {
          if (isScrolling) {
            content = '...';
          }
        } else {
          let field1 = this.getFieldFromIndex(columnIndex - 1);
          if (field1) {
            let dataType = this.calcTypeFromField(field1);
            if (dataType === 'TIMESTAMP') {
              let dt1 = moment(content);
              if (dt1.isValid()) {
                content = dt1.format('YYYY-MM-DD HH:mm:ss');
              }
            } else if (['number', 'float', 'numeric', 'NUMERICAL', 'numerical'].includes(dataType)) {
              content = Utils.roundDefault(content);
            }
          }
        }
      }
    }

    let styleF = _.assign({}, style || {}, { overflow: 'hidden', padding: '0 3px', cursor: rowIndex === 0 ? '' : 'pointer' } as CSSProperties);
    styleF.backgroundColor = rowIndex === 0 ? '#23305e' : '#19232f';
    styleF.borderBottom = '1px solid #0b121b';
    if (this.state.hoveredRowIndex === rowIndex) {
      styleF.backgroundColor = '#284192';
      styleF.cursor = 'pointer';
    }

    if (_.isString(content) || _.isNumber(content)) {
      content = <div className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}>{content}</div>;
    } else if (_.isArray(content) || _.isObject(content)) {
      if (!Utils.isElement(content)) {
        content = '[Object]';
      }
    }

    return (
      <div key={key} style={styleF} className={s.Cell + ' '} onClick={isSortType ? null : this.onRowClick.bind(this, data1)} onMouseEnter={this.onRowMouseEnter.bind(this, rowIndex === 0 ? null : rowIndex)}>
        {content}
      </div>
    );
  };

  onRowClick = (row) => {
    this.setState({
      showGrid: false,
      hoveredRowIndex: null,
    });
    this.showPrediction(row);
  };

  gridColumnWidth = (isPredProb, { index }) => {
    if (isPredProb != null) {
      if (index < isPredProb.length) {
        return 110;
      } else {
        index -= (isPredProb?.length ?? 0) + 1;
      }
    }

    if (index === 0) {
      return 80;
    }
    if (index === 1) {
      return 240;
    }

    let field1 = this.getFieldFromIndex(index - 2);
    if (field1) {
      let type1 = this.calcTypeFromField(field1);

      if (type1 === 'array') {
        return 200;
      } else if (type1 === 'string' || type1 === 'CATEGORICAL') {
        return 240;
      } else if (type1 === 'number' || type1 === 'numeric' || type1?.toUpperCase() === 'NUMERICAL') {
        return 160;
      } else if (type1 === 'TIMESTAMP') {
        return 200;
      } else {
        return 240;
      }
    }

    return 240;
  };

  memColumns = memoizeOne((isPredProb, columnsDisplay: { key: string; dataType: string; expand?: boolean }[]) => {
    if (columnsDisplay && columnsDisplay.length > 0) {
      let fields = columnsDisplay;
      let res = [];

      fields &&
        fields.some((f1, k1ind) => {
          let colIndex = k1ind;
          let field1 = f1;
          res.push({
            title: f1.key,
            field: f1.key,
            width: this.gridColumnWidth(isPredProb, { index: colIndex }),
            dataType: f1.dataType,
            expand: f1.expand,
          } as ITableExtColumn);
        });

      return res;
    }
  });

  lastSelectedAlgoId = null;
  memModelChanged = memoizeOne((selectedAlgoId) => {
    if (selectedAlgoId && this.lastSelectedAlgoId !== selectedAlgoId) {
      this.setState({
        predictData: null,
        // resultActual: null,
        resultPredicted: null,
        // resultPredictedClass: null,
        // resultExplanations: null,
        // resultExplanationsText: null,
        // resultExplanationsNested: null,
        // resultExplanationsTextNested: null,
        // isShowNested: false,
        // nestedColSel: null,
        // resultError: null,
        // resultPredictedFieldsSel: null,
        // fixedFeatures: null,
      });
    }
    this.lastSelectedAlgoId = selectedAlgoId;
  });

  memTestDatas = memoizeOne((optionsTestDatasRes, lastSelectedAlgoId) => {
    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
    if (this.state.selectedFieldValueId == null || (optionsTestDatas && optionsTestDatas.length > 0 && optionsTestDatas.find((o1) => o1.value === this.state.selectedFieldValueId) == null)) {
      if (optionsTestDatas && optionsTestDatas.length > 0) {
        setTimeout(() => {
          this.setState(
            {
              sortByField: null,
              sortOrderIsAsc: false,
              dataGridList: null,
              selectedFieldValueId: optionsTestDatas[0].value,
            },
            () => {
              this.refreshUrlWithParams();
            },
          );
        }, 0);
      }
    }

    if (this.state.predictData == null || _.isEmpty(this.state.predictData)) {
      if (this.calcRequestId() == null && this.calcRequestBPId() == null) {
        let optionsTestDatasRes = this.props.optionsTestDatasRes;
        let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
        if (testDatasList) {
          let data1 = testDatasList[0];
          if (data1) {
            if (_.isArray(data1)) {
              data1 = data1[0];
            }
            if (data1) {
              setTimeout(() => {
                this.showPrediction(data1);
              }, 0);
            }
          }
        }
      }
    }
  });

  onClickClearFilters = (e) => {
    this.setState({
      filterValues: [],
      dataGridListFiltered: null,
    });
  };

  // memFeatureGroupOne = memoizeOneCurry((doCall, featureGroupsParam, projectId, featureGroupId) => {
  //   return featureGroups.memFeatureGroupsForId(doCall, projectId, featureGroupId);
  // });

  memVisionColIMAGE = memoizeOne((docStoreDef, optionsTestDatasRes) => {
    let featuresIMAGEList = optionsTestDatasRes?.columns;
    const colIMAGE = featuresIMAGEList?.find((f1) => f1?.dataType?.toLowerCase() === 'objectreference'.toLowerCase())?.key;
    return colIMAGE;
  });

  render() {
    let { projects, projectId } = this.props;

    const requestId = this.calcRequestId();
    const requestBPId = this.calcRequestBPId();

    let foundProject1 = this.memProjectId(false)(projectId, projects);

    const docStoreDef = calcDocStoreDefFromProject(foundProject1);

    let isRefreshing = false;
    if (projects) {
      isRefreshing = projects.get('isRefreshing');
    }
    if (!foundProject1) {
      isRefreshing = true;
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let optionsAlgo = this.props.optionsAlgo;
    let algoSelectValue = null;
    if (this.props.selectedAlgoId) {
      algoSelectValue = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;

    let isPredProb = this.memPredProb(optionsTestDatasRes?.resultTestDatas?.ids?.[0]);

    this.memTestDatas(optionsTestDatasRes, this.lastSelectedAlgoId);

    const topHH = 50;

    let columns = this.memColumns(isPredProb, columnsDisplay);

    const borderAAA = Constants.lineColor(); //Utils.colorA(0.3);
    const STYLE = {
      backgroundColor: Constants.navBackDarkColor(),
      // border: '1px solid '+Utils.colorA(0.2),
      outline: 'none',
      overflow: 'hidden',
      fontSize: '14px',
      fontFamily: 'Matter',
    };
    const STYLE_BOTTOM_LEFT_GRID = {
      // borderRight: '1px solid '+borderAAA,
    };
    const STYLE_TOP_LEFT_GRID = {
      borderBottom: '1px solid ' + borderAAA,
      // borderRight: '1px solid '+borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    const STYLE_TOP_RIGHT_GRID = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      // textTransform: 'uppercase',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    const STYLE_BOTTOM_RIGHT_GRID = {
      outline: 'none',
      backgroundColor: '#19232f',
    };

    let renderForm = this.renderForm();
    let renderPredicted = null;
    let renderPredictedDataList = null;
    if (this.props.isVision) {
      let renderPredictedRes = this.memRenderPredicted(this.state.resultPredicted, this.state.resultPredictedClass);
      renderPredicted = renderPredictedRes?.list;
      renderPredictedDataList = renderPredictedRes?.dataList;
    } else {
      renderPredicted = this.renderPredicted(this.state.sliceResultsCount, this.state.imageDescriptionData);
    }

    const centerWW = 180;

    const onChangeSelectDeployment = (optionSel) => {
      if (!optionSel) {
        return;
      }

      this.setState({
        showGrid: false,
      });

      let projectId = this.props.paramsProp?.get('projectId');
      let deployId = optionSel?.value;
      if (projectId && deployId) {
        Location.push('/' + PartsLink.model_predictions + '/' + projectId + '/' + deployId);
      }
    };
    let optionsDeploys = this.props.optionsAlgo;
    let optionsDeploysSel = null;
    if (this.props.selectedAlgoId) {
      optionsDeploysSel = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }
    let deploymentSelect = (
      <span style={{ width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt isDisabled={requestId != null || requestBPId != null} value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    const leftWidth = 367;
    const marginGrid = 30;

    let optionsSliceResults = this.memOptionsSliceResults(this.state.imageDescriptionData);

    let renderImagePred = null;
    if (this.props.isVision && !Utils.isNullOrEmpty(this.state.predictedDocId)) {
      let colIMAGE = this.memVisionColIMAGE(docStoreDef, this.props.optionsTestDatasRes);

      renderImagePred = (
        <div
          css={`
            margin: 10px 0;
            display: flex;
            justify-content: center;
          `}
        >
          {docStoreDef?.renderOne?.(this.state.predictedDocId, [colIMAGE])}
        </div>
      );
    }

    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <RefreshAndProgress errorMsg={null} isRefreshing={isRefreshing}>
          <AutoSizer>
            {({ height, width }) => {
              return (
                <div style={{ height: height + 'px', width: width + 'px' }}>
                  <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <span onClick={this.onClickExperimentClose} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
                      Predictions{' '}
                      <span
                        css={`
                          @media screen and (max-width: 1400px) {
                            display: none;
                          }
                        `}
                      >
                        Dashboard for Deployment
                      </span>
                      :
                    </span>
                    <div style={{ flex: 1 }}>{deploymentSelect}</div>

                    {false && foundProject1 != null && (
                      <div
                        style={{ marginLeft: '10px', verticalAlign: 'top', marginTop: '5px' }}
                        css={`
                          @media screen and (max-width: 1050px) {
                            display: none;
                          }
                        `}
                      >
                        <HelpBox beforeText={' analyzing predictions'} name={'model eval'} linkTo={'/help/useCases/' + foundProject1?.useCase + '/evaluating'} />
                      </div>
                    )}
                  </div>

                  {isRefreshing !== true && (
                    <div style={{ display: this.state.showGrid ? 'block' : 'none', zIndex: 3, position: 'absolute', top: topAfterHeaderHH + 'px', left: 0, right: 0, bottom: 0, padding: '0 0 0 0' }} className={sd.grayPanel}>
                      <div style={{ textAlign: 'center', paddingTop: '20px', height: topHH + 'px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ opacity: 0.8, fontSize: '21px' }}>Click a test row to generate predictions</span>
                        <span
                          css={`
                            font-size: 21px;
                            cursor: pointer;
                            margin-left: 15px;
                            color: ${Constants.blue};
                          `}
                          onClick={this.onClickClearFilters}
                        >
                          (Clear all filters)
                        </span>
                      </div>

                      <div
                        onMouseLeave={this.onRowMouseLeave}
                        style={{ position: 'absolute', top: topHH + marginGrid + 'px', left: marginGrid + 'px', right: marginGrid + 'px', height: height - topAfterHeaderHH - topHH - marginGrid * 2 + 'px' }}
                      >
                        <MultiGrid
                          ref={'gridRef'}
                          cellRenderer={this.cellRenderer.bind(this, isPredProb)}
                          className={s.gridAfter}
                          classNameTopRightGrid={sd.hideScrollbar}
                          classNameTopLeftGrid={sd.hideScrollbar}
                          classNameBottomLeftGrid={sd.hideScrollbar}
                          classNameBottomRightGrid={sd.hideScrollbarY}
                          enableFixedColumnScroll
                          enableFixedRowScroll
                          hideTopRightGridScrollbar
                          hideBottomLeftGridScrollbar
                          fixedRowCount={1}
                          fixedColumnCount={1}
                          overscanRowCount={40}
                          overscanColumnCount={5}
                          style={STYLE}
                          styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                          styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                          styleTopRightGrid={STYLE_TOP_RIGHT_GRID}
                          styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRID}
                          columnCount={(columns ? columns.length : 0) + 1 + 1 + (isPredProb == null ? 0 : isPredProb?.length ?? 0)}
                          columnWidth={this.gridColumnWidth.bind(this, isPredProb)}
                          height={height - topAfterHeaderHH - topHH - marginGrid * 2}
                          rowCount={(this.state.dataGridListFiltered?.length ?? (testDatasList ? testDatasList.length : 0)) + 1}
                          rowHeight={cellHH}
                          width={width - marginGrid * 2}
                        />
                      </div>
                    </div>
                  )}

                  {isRefreshing !== true && (
                    <div style={{ display: !this.state.showGrid ? 'block' : 'none', position: 'absolute', top: topHH + 'px', left: 0, right: 0, bottom: 0 }}>
                      <div className={sd.classGrayPanel} style={{ position: 'absolute', top: '15px', left: '10px', width: leftWidth + 'px', height: height - topAfterHeaderHH - 10 + 'px' }}>
                        <div style={{ position: 'absolute', top: 0 /*topHH*/ + 'px', left: '10px', right: '10px', height: height - topAfterHeaderHH - 5 - 10 + 'px' }}>
                          <NanoScroller onlyVertical>
                            <div style={{ padding: '10px' }}>{renderForm}</div>
                          </NanoScroller>
                        </div>
                      </div>

                      <div style={{ position: 'absolute', bottom: '10px', top: 10 + 'px', left: leftWidth + 'px', width: centerWW + 'px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          {requestBPId == null && requestId == null && (
                            <Button
                              css={`
                                display: inline-block;
                              `}
                              type={'primary'}
                              onClick={this.doPredictResult}
                              style={{}}
                            >
                              Predict
                            </Button>
                          )}
                          {this.props.isVision && requestBPId == null && requestId == null && (
                            <Button
                              css={`
                                display: inline-block;
                                margin-bottom: 10px;
                              `}
                              type={'primary'}
                              onClick={this.onClickExperiment}
                              style={{ marginLeft: '5px', height: '50px', marginTop: '15px' }}
                            >
                              Experiment
                              <br />
                              with Test Data
                            </Button>
                          )}
                          {this.props.isVision && requestBPId == null && requestId == null && (
                            <div
                              css={`
                                border-top: 1px solid rgba(255, 255, 255, 0.16);
                                padding-top: 20px;
                                margin: 10px 30px 0;
                              `}
                            >
                              <Button
                                css={`
                                  display: inline-block;
                                  height: 50px;
                                `}
                                type={'primary'}
                                onClick={this.doPredictAPI}
                                style={{}}
                              >
                                Prediction
                                <br />
                                API
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ position: 'absolute', top: '10px', left: leftWidth + centerWW + 'px', right: '10px', bottom: '10px' }}>
                        <RefreshAndProgress errorMsg={null} isRefreshing={this.state.isRefreshingResult}>
                          <NanoScroller onlyVertical>
                            <div style={{}}>
                              <div className={sd.classGrayPanel} style={{ marginTop: '10px', padding: '17px 20px' }}>
                                <div
                                  css={`
                                    font-family: Matter;
                                    font-size: 16px;
                                    font-weight: bold;
                                    line-height: 1.38;
                                    color: #d1e4f5;
                                  `}
                                  style={{}}
                                >
                                  Prediction
                                </div>
                                {optionsSliceResults != null && (
                                  <div
                                    css={`
                                      margin-top: 20px;
                                      display: flex;
                                      align-items: center;
                                    `}
                                  >
                                    <span>Top N:</span>
                                    <span
                                      css={`
                                        flex: 1;
                                        margin-left: 8px;
                                      `}
                                    >
                                      <SelectExt options={optionsSliceResults} value={optionsSliceResults?.find((o1) => o1.value == this.state.sliceResultsCount)} onChange={this.onChangeResultsSlice} />
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <FormExt layout={'vertical'} ref={this.formPredicted}>
                                    {renderImagePred}
                                    {renderPredicted}
                                  </FormExt>
                                </div>
                              </div>
                            </div>
                          </NanoScroller>
                        </RefreshAndProgress>
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          </AutoSizer>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    algorithms: state.algorithms,
    defDatasets: state.defDatasets,
    schemaPredictions: state.schemaPredictions,
    deployments: state.deployments,
    requests: state.requests,
    featureGroups: state.featureGroups,
  }),
  null,
)(ModelPredictionsImageDescriptionOne);
