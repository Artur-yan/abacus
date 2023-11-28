import Button from 'antd/lib/button';
import Slider from 'antd/lib/slider';
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
import metrics from '../../stores/reducers/metrics';
import models from '../../stores/reducers/models';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ShowSetThreshold.module.css');
const sd = require('../antdUseDark.module.css');

interface IShowSetThresholdProps {}

const ShowSetThreshold = React.memo((props: PropsWithChildren<IShowSetThresholdProps>) => {
  const { paramsProp, authUser, modelsParam, metricsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    metricsParam: state.metrics,
    modelsParam: state.models,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [threshold, setThreshold] = useState(null);
  const [thresholdStatic, setThresholdStatic] = useState(null);
  const [thresholdDebounce, setThresholdDebounce] = useState(null);
  const [optimizeThresholdSel, setOptimizeThresholdSel] = useState(null);
  const [optionsClassesSelValue, setOptionsClassesSelValue] = useState(null);
  const [thresholdStep, setThresholdStep] = useState(null);
  const [refreshingPredictClass, setRefreshingPredictClass] = useState(null);
  const [optionsConfig, setOptionsConfig] = useState(null);
  const [optionsConfigValuesInit, setOptionsConfigValuesInit] = useState(null);

  let fromMetricsUrl = paramsProp?.get('fromMetricsUrl');
  if (fromMetricsUrl == null || fromMetricsUrl === '' || !_.startsWith(fromMetricsUrl, '/app/')) {
    fromMetricsUrl = null;
  }

  const projectId = paramsProp?.get('projectId');

  let classSel = optionsClassesSelValue;

  let modelId = paramsProp?.get('detailModelId');
  if (modelId === '') {
    modelId = null;
  }
  let modelVersion = paramsProp?.get('detailModelVersion');
  if (modelVersion === '') {
    modelVersion = null;
  }
  let algorithm = paramsProp?.get('algorithm');
  if (algorithm === '') {
    algorithm = null;
  }

  useEffect(() => {
    if (modelId) {
      models.memModelById(true, undefined, modelId);
    }
  }, [modelsParam, modelId]);
  const modelOne = useMemo(() => {
    if (modelId) {
      return models.memModelById(false, undefined, modelId)?.toJS();
    }
  }, [modelsParam, modelId]);

  useEffect(() => {
    if (modelId && modelOne != null) {
      setOptionsConfigValuesInit(null);
      REClient_.client_()._getModelPredictionConfigOptions(modelId, (err, res) => {
        let r1 = !err && res?.success ? res?.result : null;
        if (r1 != null) {
          const r2 = {
            model_threshold: r1?.modelThreshold?.default,
            model_threshold_class: r1?.modelThresholdClass?.default,
          };

          setOptionsConfigValuesInit(r2);
          setOptionsConfig(r1);
        } else {
          setOptionsConfig(null);
        }
      });
    }
  }, [modelId, modelOne]);

  useEffect(() => {
    metrics.memMetricVersionOne(undefined, modelVersion, algorithm, undefined, null, null, null, null, '', true);
  }, [metricsParam, modelVersion]);
  const predictClassMetrics = useMemo(() => {
    return metrics.memMetricVersionOne(undefined, modelVersion, algorithm, undefined, null, null, null, null, '', false);
  }, [metricsParam, modelVersion]);

  const thresholdClass1 = useMemo(() => {
    if (predictClassMetrics == null) {
      return;
    }

    let thresholdClass1 = modelOne?.modelPredictionConfig?.model_threshold_class;
    if (optionsConfig && thresholdClass1 == null) {
      let th1 = optionsConfig?.modelThresholdClass?.default;
      if (th1 != null) {
        thresholdClass1 = th1;
      }
    }
    setOptionsClassesSelValue(thresholdClass1);

    let step1 = 0.01;
    let res = modelOne?.modelPredictionConfig?.model_threshold;
    if (optionsConfig && res == null) {
      let th1 = optionsConfig?.modelThreshold?.default ?? optionsConfig?.modelThreshold?.defaultValue;
      if (th1 != null) {
        res = th1;
      }
    }
    if (optionsConfig != null) {
      let st1 = optionsConfig?.modelThreshold?.options?.step;
      if (st1 != null) {
        step1 = st1;
      }
    }

    if (res != null) {
      // let classNames = predictClassMetrics?.metrics?.className;
      // let rocCurve1 = predictClassMetrics?.metrics?.prCurvePerLabel;
      //
      // let dataPre = classNames?.[0];
      // let dataPre0 = classNames?.[1];
      //
      // if(dataPre0===thresholdClass1) {
      //   let t1 = dataPre;
      //   dataPre = dataPre0;
      //   dataPre0 = t1;
      // }
      //
      // let rocCurvePre = rocCurve1?.[_.findIndex(classNames ?? [], s1 => s1===dataPre)];
      //
      // let tt = rocCurvePre?.thresholds;
      // if(tt!=null) {
      //   let diffMin = null, th1 = null, th1ind = null;
      //   tt?.some((t1, t1ind) => {
      //     let diff1 = Math.abs(t1 - res);
      //     if (th1 == null || diffMin == null || diff1<diffMin) {
      //       diffMin = diff1;
      //       th1 = t1;
      //       th1ind = t1ind;
      //     }
      //   });
      //   if(th1ind!=null && tt?.length>0) {
      //     res = th1ind/tt.length;
      //   }
      // }

      setThreshold((th1) => {
        if (res !== th1) {
          th1 = res;
          setThresholdStep(step1);
          setThresholdStatic(th1);
          setThresholdDebounce(th1);
        }

        return th1;
      });
    }

    return thresholdClass1;
  }, [modelOne, optionsConfig, predictClassMetrics]);

  // memTestDatasSelect = memoizeOne((useDataId, optionsTestDatasRes) => {
  //   if(optionsTestDatasRes && useDataId) {
  //     let data1 = (Object.values(optionsTestDatasRes?.rangeDateByTestDataId)?.find((v1: any) => (''+v1?.id)===(''+useDataId)) as any)?.data;
  //     this.setState({
  //       dataForPredAPI: data1,
  //     });
  //   }
  // });

  // memDataFromMemory = memoizeOne((dataForPredAPI) => {
  //   let obj1: any = {};
  //   if(dataForPredAPI!=null) {
  //     obj1.dataForPredAPI = dataForPredAPI;
  //   }
  //
  //   REClient_.dataForPredAPI = null;
  //
  //   if(!_.isEmpty(obj1)) {
  //     this.setState(obj1);
  //   }
  // });

  // let useDataId = this.props.paramsProp?.get('useDataId');
  // if(useDataId) {
  //   this.memTestDatasSelect(useDataId, this.props.optionsTestDatasRes);
  //
  // } else {
  //   this.memDataFromMemory(REClient_.dataForPredAPI);
  // }

  const predictClassColumns = useMemo(() => {
    return [
      {
        title: 'Class Label',
        field: 'label',
      },
      {
        title: 'Support',
        field: 'support',
        render: (text, row, index) => {
          return Utils.decimals(text, 3);
        },
      },
      {
        title: 'Precision',
        field: 'precision',
        render: (text, row, index) => {
          return Utils.decimals(text, 3);
        },
      },
      {
        title: 'Recall',
        field: 'recall',
        render: (text, row, index) => {
          return Utils.decimals(text, 3);
        },
      },
      {
        title: 'F1',
        field: 'f1',
        render: (text, row, index) => {
          return Utils.decimals(text, 3);
        },
      },
    ] as ITableExtColumn[];
  }, []);

  const all_labels = useMemo(() => {
    return predictClassMetrics?.metrics?.className;
  }, [predictClassMetrics]);

  let optionsClasses = useMemo(() => {
    return (all_labels ?? []).map((v1) => ({
      label: v1,
      value: v1,
    }));
  }, [all_labels]);
  let optionsClassesSel = optionsClasses?.find((v1) => v1.value === optionsClassesSelValue);

  const { predictUsedScore, predictUsedThreshold, predictClassROCMetrics, predictClassROCCurve, predictAccValue } = useMemo(() => {
    let metrics: { [key: string]: { precision?; recall?; support?; acc?; f1? } } = {};

    let metrics1 = predictClassMetrics?.metrics;
    if (metrics1 != null) {
      metrics1?.className?.some((k1, k1ind) => {
        metrics[k1] = {
          precision: metrics1?.precision?.[k1ind],
          recall: metrics1?.recall?.[k1ind],
          support: metrics1?.support?.[k1ind],
          acc: null,
          f1: null,
        };
      });
    }

    let diffMin = null,
      th1 = null,
      th1ind = null;
    let diffMin0 = null,
      th10 = null,
      th1ind0 = null;
    let score1 = 0.5;

    let accValue = null;
    let rocCurve: any = null;
    let classNames = predictClassMetrics?.metrics?.className;
    let rocCurve1 = predictClassMetrics?.metrics?.prCurvePerLabel;
    if (rocCurve1 != null) {
      let dataPre = classNames?.[0];
      let dataPre0 = classNames?.[1];

      if (dataPre0 === thresholdClass1) {
        let t1 = dataPre;
        dataPre = dataPre0;
        dataPre0 = t1;
      }

      let rocCurvePre = rocCurve1?.[_.findIndex(classNames ?? [], (s1) => s1 === dataPre)];
      let rocCurvePre0 = rocCurve1?.[_.findIndex(classNames ?? [], (s1) => s1 === dataPre0)];

      if (threshold != null) {
        // th1ind = Math.round((rocCurvePre?.thresholds?.length ?? 0)*threshold);
        th1 = threshold; //rocCurvePre?.thresholds?.[th1ind];
        if (thresholdClass1 !== optionsClassesSelValue && th1 != null) {
          th1 = 1 - th1;
        }
        let thresholdUsed = th1;

        score1 = th1;

        rocCurvePre?.thresholds?.some((t1, t1ind) => {
          let diff1 = Math.abs(t1 - thresholdUsed);
          if (th1 == null || diffMin == null || diff1 < diffMin) {
            diffMin = diff1;
            th1 = t1;
            th1ind = t1ind;
          }
        });
        rocCurvePre0?.thresholds?.some((t1, t1ind) => {
          let diff10 = Math.abs(t1 - (1 - th1));
          if (th10 == null || diffMin0 == null || diff10 < diffMin0) {
            diffMin0 = diff10;
            th10 = t1;
            th1ind0 = t1ind;
          }
        });

        if (th1ind != null && th1ind0 != null && dataPre != null && dataPre0 != null) {
          metrics[dataPre] = metrics[dataPre] ?? {};
          metrics[dataPre].recall = rocCurvePre?.recall?.[th1ind];
          metrics[dataPre].precision = rocCurvePre?.precision?.[th1ind];
          // metrics[dataPre].support = rocCurvePre?.support?.[th1ind];
          metrics[dataPre].f1 = metrics[dataPre].precision + metrics[dataPre].recall === 0 ? 0 : (2 * (metrics[dataPre].precision * metrics[dataPre].recall)) / (metrics[dataPre].precision + metrics[dataPre].recall);

          metrics[dataPre0] = metrics[dataPre0] ?? {};
          metrics[dataPre0].recall = rocCurvePre0?.recall?.[th1ind0];
          metrics[dataPre0].precision = rocCurvePre0?.precision?.[th1ind0];
          // metrics[dataPre0].support = rocCurvePre0?.support?.[th1ind0];
          metrics[dataPre0].f1 = metrics[dataPre0].precision + metrics[dataPre0].recall === 0 ? 0 : (2 * (metrics[dataPre0].precision * metrics[dataPre0].recall)) / (metrics[dataPre0].precision + metrics[dataPre0].recall);

          let div1 = metrics[dataPre].support + metrics[dataPre0].support;
          accValue = div1 === 0 ? 0 : (metrics[dataPre].recall * metrics[dataPre].support + metrics[dataPre0].recall * metrics[dataPre0].support) / div1;
        }
      }
    }

    return { predictClassROCMetrics: metrics, predictClassROCCurve: rocCurve, predictAccValue: accValue, predictUsedThreshold: th1, predictUsedScore: score1 };
  }, [predictClassMetrics, modelVersion, threshold, thresholdClass1, optionsClassesSelValue, all_labels, optionsClassesSel]);

  const predictClassData = useMemo(() => {
    let data1 = all_labels;
    if (data1 == null || !_.isArray(data1)) {
      return [];
    }

    let kkMetrics = Object.keys(predictClassROCMetrics);

    let res = [];
    let kk = data1;
    kk.some((k1) => {
      let obj1: any = {
        label: k1,
      };

      let m1Name = kkMetrics.find((v1) => v1?.toLowerCase() === k1?.toLowerCase());
      let m1 = predictClassROCMetrics?.[m1Name];
      if (m1 != null) {
        obj1.precision = m1.precision;
        obj1.recall = m1.recall;
        obj1.support = m1.support;
        obj1.acc = m1.acc;
        obj1.f1 = m1.f1;
      }

      res.push(obj1);
    });

    return res;
  }, [predictClassROCMetrics, all_labels]);

  const predictClassOptimalThreshold = useMemo(() => {
    let v1 = predictClassMetrics?.metrics?.optimalThresholds;
    if (v1 != null && _.isArray(v1)) {
      let vc = optionsClassesSelValue;
      if (Utils.isNullOrEmpty(vc)) {
        return null;
      } else {
        let ind1 = _.findIndex(all_labels ?? [], (s1) => {
          if (_.isString(s1) && _.isString(vc)) {
            return (s1 as string)?.toUpperCase() === vc?.toUpperCase();
          } else {
            return s1 === vc;
          }
        });
        if (ind1 > -1) {
          return v1?.[ind1];
        } else {
          return null;
        }
      }
    } else if (v1 != null && _.isObject(v1)) {
      return v1;
    } else {
      return null;
    }
  }, [predictClassMetrics, all_labels, optionsClassesSelValue]);

  let thresholdStepUse = thresholdStep ?? 0.01;

  let optionsOptimize = useMemo(() => {
    if (predictClassOptimalThreshold == null) {
      return;
    }

    let optionsOptimize = [
      { label: 'Custom', value: null, data: thresholdStatic },
      { label: 'Accuracy', value: 'acc', data: predictClassOptimalThreshold?.acc },
      { label: 'F1 Score', value: 'f1', data: predictClassOptimalThreshold?.f1 },
    ];
    optionsOptimize = optionsOptimize.filter((o1) => o1.data !== undefined);
    return optionsOptimize;
  }, [predictClassOptimalThreshold, thresholdStatic]);
  let optionsOptimizeSel = useMemo(() => {
    if (predictClassOptimalThreshold == null) {
      return;
    }

    return optionsOptimize?.find((v1) => v1.value == optimizeThresholdSel);
  }, [optionsOptimize, predictClassOptimalThreshold, optimizeThresholdSel]);

  const onClickPredictClassCancel = (e) => {
    if (fromMetricsUrl) {
      Location.push(fromMetricsUrl);
    }
  };

  const onClickPredictClassSave = (e) => {
    if (optionsClassesSelValue == null || threshold == null) {
      REActions.addNotificationError('Invalid Data!');
      return;
    }

    let config1 = _.assign({}, optionsConfigValuesInit ?? {}, { model_threshold: /*predictUsedThreshold*/ thresholdDebounce, model_threshold_class: optionsClassesSelValue });

    REClient_.client_().setModelPredictionParams(modelId, config1, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.listModels_(projectId);
        StoreActions.modelsVersionsByModelId_(modelId);
        StoreActions.getModelDetail_(modelId);

        StoreActions.resetModelVersionsMetrics_();
        // StoreActions.getMetricsVersionOne_(modelVersion);

        // setTimeout(() => {
        onClickPredictClassCancel(e);
        // }, 200);
      }
    });
  };

  const styleMark1 = useMemo(() => {
    return { color: 'white', opacity: 0.8, fontSize: '12px' };
  }, []);

  const onChangeDropdownOptimizeSel = (optionsOptimize, option1) => {
    let v1 = option1?.value;

    let th1 = optionsOptimize?.find((o1) => o1.value == v1)?.data;
    setOptimizeThresholdSel(v1);

    if (th1 != null) {
      setThreshold(th1);
      setThresholdDebounce(th1);
    }
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const onChangeThresholdAfter = (v1) => {
    setThreshold(v1);
    setThresholdStatic(v1);
    setThresholdDebounce(v1);
  };

  const onChangeThresholdSlider = (v1) => {
    setThreshold(v1);
    setThresholdStatic(v1);
    setThresholdDebounce(v1);

    // setThresholdDebounce(v1);
  };

  const onChangeOptionsClasses = (option1) => {
    setOptionsClassesSelValue(option1?.value);
  };

  const thresholdUseLast = optimizeThresholdSel != null ? predictClassOptimalThreshold?.[optimizeThresholdSel] : thresholdDebounce;

  return (
    <div
      css={`
        position: relative;
        min-height: 540px;
        max-width: 1000px;
        margin: 20px auto;
        border-radius: 4px;
      `}
      className={sd.grayPanel}
    >
      <RefreshAndProgress msgTop={'80px'} isMsgAnimRefresh={true} msgMsg={refreshingPredictClass ? 'Processing' : null} isDim={refreshingPredictClass}>
        <div
          css={`
            position: relative;
            display: flex;
            max-width: 1000px;
            padding: 20px;
          `}
        >
          <div
            css={`
              flex: 1;
              margin: 0 20px;
            `}
          >
            <div
              css={`
                text-align: center;
                margin-bottom: 20px;
                font-size: 16px;
              `}
            >
              Set Predicted Class Threshold
            </div>

            {optionsOptimize != null && (
              <div
                css={`
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 10px;
                  padding-bottom: 10px;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                `}
              >
                <span
                  css={`
                    width: 120px;
                    text-align: right;
                    margin-right: 10px;
                    font-size: 14px;
                  `}
                >
                  Optimize:
                </span>
                <span
                  css={`
                    width: 200px;
                    display: inline-block;
                  `}
                >
                  <SelectExt value={optionsOptimizeSel} options={optionsOptimize} onChange={onChangeDropdownOptimizeSel.bind(null, optionsOptimize)} menuPortalTarget={popupContainerForMenu(null)} />
                </span>
                <span
                  css={`
                    width: 90px;
                    display: inline-flex;
                  `}
                ></span>
              </div>
            )}

            <div
              css={`
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 10px;
              `}
            >
              <span
                css={`
                  text-align: right;
                  width: 120px;
                  margin-right: 10px;
                  font-size: 14px;
                `}
              >
                Set threshold for:
              </span>
              <span
                css={`
                  width: 200px;
                  display: inline-block;
                `}
              >
                <SelectExt value={optionsClassesSel} options={optionsClasses} onChange={onChangeOptionsClasses} menuPortalTarget={popupContainerForMenu(null)} />
              </span>
              <span
                css={`
                  width: 90px;
                  display: inline-flex;
                `}
              ></span>
            </div>

            <div
              css={`
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              <span
                css={`
                  text-align: right;
                  width: 120px;
                  margin-right: 10px;
                  font-size: 14px;
                `}
              >
                Threshold:
              </span>
              <span
                css={`
                  width: 200px;
                  display: inline-block;
                `}
              >
                <Slider
                  tooltipVisible={false}
                  disabled={optimizeThresholdSel != null}
                  marks={{ 0: { label: '0', style: styleMark1 }, 1: { label: '1', style: styleMark1 } }}
                  min={0}
                  step={thresholdStep}
                  max={1}
                  value={thresholdUseLast}
                  onChange={onChangeThresholdSlider}
                  onAfterChange={onChangeThresholdAfter}
                />
              </span>
              <span
                css={`
                  padding-left: 8px;
                  width: 94px;
                  display: inline-flex;
                  opacity: 0.8;
                `}
              >
                {Utils.decimals(thresholdUseLast, 3)}
              </span>
            </div>

            <div
              css={`
                padding-top: 20px;
                border-top: 1px solid ${Utils.colorA(0.14)};
                margin-top: 20px;
              `}
            >
              <TableExt showEmptyIcon={true} defaultSort={{ field: 'value', isAsc: false }} dataSource={predictClassData} columns={predictClassColumns} />
            </div>

            {predictAccValue != null && (
              <div
                css={`
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-top: 10px;
                  font-size: 14px;
                  font-family: Matter;
                `}
              >
                <div
                  css={`
                    display: inline-flex;
                    border-radius: 6px;
                    overflow: hidden;
                  `}
                >
                  <div
                    css={`
                      color: #d1e4f5;
                      font-family: Roboto;
                      font-weight: 500;
                      text-transform: uppercase;
                      font-size: 12px;
                      background: #23305e;
                      padding: 8px 14px 8px;
                    `}
                  >
                    Accuracy
                  </div>
                  <div
                    css={`
                      padding: 6px 22px 5px 14px;
                      background: #19232f;
                      font-weight: 500;
                    `}
                  >
                    {Utils.decimals(predictAccValue, 2)}
                  </div>
                </div>
              </div>
            )}

            <div
              css={`
                text-align: center;
                margin-top: 20px;
              `}
            >
              <Button
                type={'default'}
                ghost
                css={`
                  margin-right: 10px;
                `}
                onClick={onClickPredictClassCancel}
              >
                Cancel
              </Button>
              <Button type={'primary'} onClick={onClickPredictClassSave}>
                Save
              </Button>
            </div>
          </div>
          <div
            css={`
              flex: 0;
            `}
          >
            <ChartXYExt useEC data={predictClassROCCurve} height={400} width={400} type={'line'} colorIndex={0} colorFixed={['#f08536', '#3a77b0'] as any} />
          </div>
        </div>
      </RefreshAndProgress>
    </div>
  );
});

export default ShowSetThreshold;
