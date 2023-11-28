import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils, { ColorsGradients } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_light from '@amcharts/amcharts4/themes/moonrisekingdom';
import am4themes_dark from '@amcharts/amcharts4/themes/dark';
import HelpBox from '../HelpBox/HelpBox';
import { memProjectById } from '../../stores/reducers/projects';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as moment from 'moment-timezone';
import CopyText from '../CopyText/CopyText';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import StoreActions from '../../stores/actions/StoreActions';
import { calcDeploymentsTokensByProjectId } from '../../stores/reducers/deploymentsTokens';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import HelpIcon from '../HelpIcon/HelpIcon';

const s = require('./ModelPredictionsClusteringTimeseriesOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelPredictionsClusteringTimeseriesOneProps {
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
  deploymentsTokens?: any;
}

const TOKEN_NO_TOKEN = 'DEPLOYMENT_AUTH_TOKEN';

const colorSet = [
  '#007B7B', // cyan
  '#FF8C00', // orange
  '#1E90FF', // blue
  '#DB2032', // red
  '#32CD32', // green
  '#009090', // teal
  '#FF69B4', // pink
  '#802080', // purple
  '#EFd700', // yellow
];

const ModelPredictionsClusteringTimeseriesOne = React.memo((props: PropsWithChildren<IModelPredictionsClusteringTimeseriesOneProps>) => {
  const { paramsProp, projects, defDatasets, deploymentsTokens, deployments } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    defDatasets: state.defDatasets,
    deploymentsTokens: state.deploymentsTokens,
    deployments: state.deployments,
  }));

  const [predLenSel, setPredLenSel] = useState(undefined);
  const [selectedFieldId, setSelectedFieldId] = useState(undefined);
  const [selectedFieldValueId, setSelectedFieldValueId] = useState(undefined);
  const [selectedFieldValueId2, setSelectedFieldValueId2] = useState(undefined);
  const [selectedToken, setSelectedToken] = useState(undefined);
  const [inputData, setInputData] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState(null);
  const [predictedChartData, setPredictedChartData] = useState(null);
  const [clusterMeansData, setClusterMeansData] = useState(null);
  const [isRefreshingResult, setIsRefreshingResult] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedClusterData, setSelectedClusterData] = React.useState(null);

  const timeseriesChart = React.useRef(null);

  const projectId = paramsProp.get('projectId');

  useEffect(() => {
    am4core.options.commercialLicense = true;
    am4core.unuseAllThemes();
    am4core.useTheme(Utils.isDark() ? am4themes_dark : am4themes_light);
  }, []);

  React.useLayoutEffect(() => {
    if (!timeseriesData) return;

    let chart = am4core.create('timeseriesChartDiv', am4charts.XYChart);

    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());

    dateAxis.baseInterval = {
      timeUnit: 'minute',
      count: 1,
    };
    dateAxis.tooltipDateFormat = 'HH:mm, d MMMM';
    dateAxis.dateFormatter.utc = true;

    dateAxis.showOnInit = false;
    dateAxis.keepSelection = true;

    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    valueAxis.tooltip.disabled = true;
    valueAxis.title.text = timeseriesData.yAxis || '';

    valueAxis.showOnInit = false;
    valueAxis.min = 0;
    valueAxis.strictMinMax = true;

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    chart.scrollbarX = new am4charts.XYChartScrollbar();

    timeseriesData.dataColumns?.forEach((column, index) => {
      if (column === timeseriesData.xAxis) {
        return;
      }

      let series = chart.series.push(new am4charts.LineSeries());

      series.showOnInit = false;
      series.name = column === 'mean' ? `Cluster ${selectedCluster}` : column;

      series.dataFields.dateX = timeseriesData.xAxis;
      series.dataFields.valueY = column;
      series.fillOpacity = 0;

      series.tooltip.numberFormatter = new am4core.NumberFormatter();
      series.tooltip.numberFormatter.numberFormat = '#.00';
      series.tooltipText = '{name}: {valueY}';

      const colorIndex = index > colorSet.length - 1 ? index % colorSet.length : index;
      const c1 = am4core.color(colorSet[colorIndex]);
      series.stroke = c1;
      series.fill = c1;
      series.strokeWidth = 2;

      // @ts-ignore
      chart.scrollbarX.series.push(series);
    });

    chart.legend = new am4charts.Legend();

    chart.data = timeseriesData.chartData;

    chart.events.on('ready', function () {
      // @ts-ignore
      chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
      // @ts-ignore
      chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;
    });

    chart.events.on('datavalidated', function () {
      const chartDataLen = timeseriesData.chartData?.length;
      if (chartDataLen === 0) {
        return;
      }
      let zoomStart = timeseriesData.chartData?.[0]?.[timeseriesData.xAxis];
      let zoomEnd = timeseriesData.chartData?.[chartDataLen - 1]?.[timeseriesData.xAxis];
      if (chartDataLen > 30) {
        zoomStart = timeseriesData.chartData?.[chartDataLen - 30]?.[timeseriesData.xAxis];
      }

      dateAxis.zoomToDates(zoomStart, zoomEnd, false, true);
    });

    timeseriesChart.current = chart;

    return () => {
      chart.dispose();
    };
  }, [timeseriesData]);

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projects, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projects, projectId]);

  useEffect(() => {
    let isMounted = true;

    const deploymentList = calcDeploymentsByProjectId(undefined, projectId);
    const deploymentOne = deploymentList.find((item) => item.deploymentId === props.selectedAlgoId);

    if (deploymentOne) {
      REClient_.client_()._getMetricsDataByModelVersion(deploymentOne.modelVersion, null, undefined, undefined, undefined, null, (err, res) => {
        if (err || !res || !res.result) {
        } else {
          const sampleClustersData = res.result?.rawMetricsForUi?.sampleClustersData;
          if (!sampleClustersData) {
            return null;
          }

          const chartData = sampleClustersData.map((item) => {
            const mean = _.isArray(item.mean) ? item.mean : null;

            mean?.sort((a, b) => {
              if (a?.['date'] > b?.['date']) return 1;
              if (a?.['date'] < b?.['date']) return -1;
              return 0;
            });

            return {
              cluster: item.cluster,
              mean,
              target: item.targetCol,
            };
          });

          if (isMounted) {
            setClusterMeansData(chartData);
          }
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [projectId, deployments, props.selectedAlgoId]);

  const optionsCluster = useMemo(() => {
    setSelectedCluster(clusterMeansData?.[0]?.cluster);

    return clusterMeansData?.map((item) => ({ label: item.cluster, value: item.cluster }));
  }, [clusterMeansData]);

  const onChangeCluster = (options) => {
    setSelectedCluster(options?.value);
  };

  React.useEffect(() => {
    setSelectedClusterData(clusterMeansData?.find((item) => item.cluster === selectedCluster));
  }, [selectedCluster, clusterMeansData]);

  const optionsDeploysSel = useMemo(() => {
    if (props.selectedAlgoId && props.optionsAlgo) {
      return props.optionsAlgo?.find((o1) => o1.value === props.selectedAlgoId);
    }

    return null;
  }, [props.selectedAlgoId, props.optionsAlgo]);

  const isRefreshing = useMemo(() => {
    let refreshing = false;
    if (projects) {
      refreshing = projects.get('isRefreshing');
    }
    if (!foundProject1) {
      refreshing = true;
    }
    return refreshing;
  }, [projects, foundProject1]);

  const calcParam = (name, isDate = false) => {
    let res = paramsProp ? paramsProp.get(name) : null;
    if (isDate && res != null) {
      res = moment.unix(res).tz('UTC', false);
    }
    return res;
  };

  const calcRequestId = () => {
    let requestId = paramsProp?.get('requestId');
    if (requestId === '') {
      requestId = null;
    }
    return requestId;
  };

  useEffect(() => {
    setPredLenSel(Utils.tryParseInt(calcParam('predLenSel')) ?? undefined);
  }, [paramsProp]);

  useEffect(() => {
    let isMounted = true;

    getClusterAndGo(selectedFieldValueId, isMounted);

    return () => {
      isMounted = false;
    };
  }, [selectedToken, props.selectedAlgoId, selectedFieldValueId]);

  useEffect(() => {
    if (!inputData && !selectedClusterData) {
      setTimeseriesData(null);
      return;
    }

    const itemId = props.optionsTestDatasRes?.testIdName ?? 'Item';

    let chartData = null;
    let dataColumns = ['date'];
    if (inputData) {
      dataColumns.push(itemId);

      if (selectedClusterData) {
        dataColumns.push('mean');

        chartData = selectedClusterData.mean?.map((item) => {
          const itemValue = inputData?.[item.date];
          return {
            date: item.date,
            mean: item.mean,
            [itemId]: itemValue,
          };
        });
      } else {
        chartData = Object.entries(inputData)
          .filter((item) => item[0] !== itemId)
          .map((item) => ({ date: item[0], [itemId]: item[1] }));

        chartData.sort((a, b) => {
          if (a?.['date'] > b?.['date']) return 1;
          if (a?.['date'] < b?.['date']) return -1;
          return 0;
        });
      }
    } else {
      dataColumns.push('mean');

      chartData = selectedClusterData.mean;
    }

    setTimeseriesData({
      xAxis: 'date',
      yAxis: selectedClusterData?.target ?? 'Target',
      dataColumns,
      chartData,
    });
  }, [inputData, selectedClusterData, foundProject1]);

  const getClusterAndGo = (filedValueId, isMounted?) => {
    if (!filedValueId || !props.selectedAlgoId) {
      return;
    }

    setIsRefreshingResult(true);
    setPredictedChartData(null);
    setInputData(null);

    const itemId = props.optionsTestDatasRes?.testIdName;
    const queryData = { [itemId]: filedValueId };

    let dataParams: any = {};
    if (itemId) {
      dataParams.data = JSON.stringify(queryData);
    } else {
      let optionsTestDatasRes = props.optionsTestDatasRes;
      let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
      let itemIdUsed = filedValueId;
      let dataFromItemId = null;
      if (!Utils.isNullOrEmpty(itemIdUsed) && rangeDateByTestDataId) {
        const ch = (v1) => {
          if (v1 == null) {
            return v1;
          }
          if (_.isNumber(v1)) {
            return '' + v1;
          }
          return v1;
        };

        itemIdUsed = ch(itemIdUsed);

        let kk = Object.keys(rangeDateByTestDataId);
        kk.some((k1) => {
          let all1 = rangeDateByTestDataId[k1];
          if (all1) {
            if (all1 && ch(all1.id) == itemIdUsed) {
              dataFromItemId = all1;
              return true;
            }
          }
        });
      }

      const kk = Object.keys(dataFromItemId);
      kk.some((k1) => {
        let v1 = dataFromItemId[k1];
        if (_.isObject(v1)) {
          v1 = JSON.stringify(v1);
        }
        if (k1 === 'extra' && Utils.isNullOrEmpty(dataFromItemId.data)) {
          //TODO //** temp fix
          k1 = 'data';
        }
        dataParams[k1] = v1;
      });
    }

    REClient_.client_()._predictForUI(props.selectedAlgoId, dataParams, null, calcRequestId(), (err, res) => {
      if (isMounted === false) return;

      setIsRefreshingResult(false);
      if (err || !res || !res.result) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        const input = res.result?.input;
        const predicted = res.result?.predicted;

        setPredictedChartData(predicted);
        setInputData(input);
      }
    });
  };

  const deploymentTokensList = useMemo(() => {
    if (!projectId) {
      return null;
    }

    if (deploymentsTokens) {
      if (deploymentsTokens.get('isRefreshing')) {
        return null;
      }
      //
      let res = calcDeploymentsTokensByProjectId(undefined, projectId);
      if (res == null) {
        StoreActions.deployTokensList_(projectId);
      } else {
        return res;
      }
    }
  }, [deploymentsTokens, projectId]);

  const optionsToken = useMemo(() => {
    let options = deploymentTokensList?.map((t1) => ({ label: t1.deploymentToken, value: t1.deploymentToken }));
    if (options?.length === 0) {
      options.unshift({ label: TOKEN_NO_TOKEN, value: TOKEN_NO_TOKEN });
    }
    setSelectedToken(options?.[0]?.value);
    return options;
  }, [deploymentTokensList]);

  const onChangeToken = (options) => {
    setSelectedToken(options?.value);
  };

  const optionsPredLen = useMemo(() => {
    let res: any[] = [{ label: 'Configured', value: undefined }];
    for (let i = 1; i <= (predLenSel ?? 0) + 100; i++) {
      res.push({ label: '' + i, value: i });
    }
    return res;
  }, [predLenSel]);

  const onChangePredLen = (option1) => {
    setPredLenSel(option1?.value ?? undefined);
  };

  const onChangeSelectDeployment = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let deployId = optionSel?.value;
    if (projectId && deployId) {
      Location.push('/' + PartsLink.model_predictions + '/' + projectId + '/' + deployId);
    }
  };

  const popupContainerForMenu = (node) => document.getElementById('body2');

  const optionsField = useMemo(() => {
    if (foundProject1 && defDatasets) {
      let datasetThis = null;
      if (foundProject1) {
        if (foundProject1.allProjectDatasets) {
          datasetThis = foundProject1.allProjectDatasets[0];
        }
      }

      if (defDatasets) {
        let datasetThisId = datasetThis && datasetThis.dataset && datasetThis.dataset.datasetId;

        const fileSchema_byDatasetId = defDatasets.get('fileDataUse_byDatasetIdProjectId');
        if (fileSchema_byDatasetId && datasetThisId) {
          let optionsField = [];
          const fileSchema = fileSchema_byDatasetId.get(datasetThisId + foundProject1.projectId);
          if (fileSchema && fileSchema.get('schema')) {
            fileSchema.get('schema').some((f1) => {
              let obj1: any = {
                value: f1.get('name'),
                label: f1.get('name'),
              };
              optionsField.push(obj1);
            });

            if (selectedFieldId == null && optionsField && optionsField.length > 0) {
              setSelectedFieldId(optionsField[0].value);
            }

            return optionsField;
          } else {
            if (fileSchema == null && datasetThisId) {
              //never retrieved
              if (defDatasets && !defDatasets.get('isRefreshing')) {
                StoreActions.schemaGetFileDataUse_(foundProject1.projectId, datasetThisId);
                return null;
              }
            }
          }
        }
      }
    }
  }, [foundProject1, defDatasets]);

  const onChangeSelectField = (optionSel) => {
    setSelectedFieldId(optionSel ? optionSel.value : null);
  };

  const onChangeSelectFieldValue = (optionSel) => {
    setSelectedFieldValueId(optionSel ? optionSel.value : null);
    setSelectedCluster(optionsCluster ? optionsCluster?.[0].value : null);
    setSelectedFieldValueId2(null);
  };

  const optionsTestDatas = useMemo(() => {
    const options = props.optionsTestDatasRes ? props.optionsTestDatasRes.optionsTestDatas : null;
    setSelectedFieldValueId(options?.[0]?.value);

    return options;
  }, [props.optionsTestDatasRes]);

  const testDatasSelectValue = useMemo(() => optionsTestDatas?.find((o1) => o1.value === selectedFieldValueId) ?? null, [optionsTestDatas, selectedFieldValueId]);

  const onKeyPressId2 = (e) => {
    if (e.key?.toLowerCase() === 'enter') {
      onClickSelectedFieldValueId2(e);
    }
  };

  const onClickSelectedFieldValueId2 = (e) => {
    getClusterAndGo(selectedFieldValueId2);
  };

  const onChangeSelectedFieldValueId2 = (e) => {
    setSelectedFieldValueId(null);
    setSelectedFieldValueId2(e.target.value);
  };

  const renderPredicted = useMemo(() => {
    if (!predictedChartData) {
      return null;
    }

    let dataListChart = [],
      labels = [];

    predictedChartData?.cluster_distances?.forEach((item) => {
      labels.push(item.cluster);
      dataListChart.push({ x: item.cluster, y: item.cluster_distance });
    });

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
      titleY: 'Distance',
      titleX: 'Cluster',
      tooltips: true,
      data: dataListChart,
      labels,
      axis1Gap: 15,
    };

    const distance = predictedChartData?.cluster_distances?.find((item) => item.cluster === predictedChartData?.cluster)?.cluster_distance ?? '';

    let histogram = (
      <div style={{ position: 'relative', color: 'white', marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ height: hHH + 'px', position: 'relative', width: '100%' }}>
          <div css={'font-family: Roboto; font-size: 18px; font-weight: bold; text-align: left;'}>
            Predicted: Cluster {predictedChartData?.cluster ?? ''} <HelpIcon id={'predictedClusterDistance'} style={{ marginLeft: '4px' }} />
          </div>
          <div style={{ margin: '0 10px', zIndex: 2, height: hHH + 'px', position: 'relative' }}>
            <ChartXYExt axisYMin={0} noMax useEC colorIndex={0} height={hHH} colorFixed={ColorsGradients} data={data1} type={'bar'} />
          </div>
        </div>
      </div>
    );

    const res = (
      <div style={{ color: Utils.colorAall(1), marginTop: '10px' }}>
        <div>{histogram}</div>
      </div>
    );

    return res;
  }, [predictedChartData]);

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 25px;
      `}
    >
      <AutoSizer disableWidth>
        {({ height }) => {
          return (
            <div style={{ height: height + 'px' }}>
              <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <span style={{ whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
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
                <div style={{ flex: 1 }}>
                  <span style={{ width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
                    <SelectExt value={optionsDeploysSel} options={props.optionsAlgo} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
                  </span>
                </div>

                {foundProject1 != null && (
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
              {isRefreshing === true && (
                <div style={{ textAlign: 'center', margin: '40px auto', fontSize: '12px', color: Utils.colorA(0.7) }}>
                  <FontAwesomeIcon icon={'sync'} transform={{ size: 15 }} spin style={{ marginRight: '8px', opacity: 0.8 }} />
                  Retrieving Project Details...
                </div>
              )}
              {isRefreshing !== true && foundProject1 && (
                <div style={{ minHeight: '600px', padding: '25px 30px', marginBottom: '20px' }} className={sd.grayPanel}>
                  <div style={{ position: 'relative', textAlign: 'center', marginBottom: '10px' }}>
                    <div>
                      {/* <span style={{ marginRight: '50px', }}>
                      <span css={`font-family: Roboto; font-size: 12px; font-weight: bold; color: #d1e4f5; text-transform: uppercase;`} style={{ marginRight: '5px', }}>Prediction Length:</span>
                      <span style={{ display: 'inline-block', width: '120px', }}>
                        <SelectExt options={optionsPredLen} value={optionsPredLen?.find(o1 => o1.value===predLenSel)} onChange={onChangePredLen} />
                      </span>
                    </span> */}
                      {/* <span style={{ marginRight: '50px', }}>
                      <span css={`font-family: Roboto; font-size: 12px; font-weight: bold; color: #d1e4f5; text-transform: uppercase;`} style={{ marginRight: '5px', }}>Token:</span>
                      <span style={{ display: 'inline-block', width: '300px', }}>
                        <SelectExt options={optionsToken} value={optionsToken?.find(o1 => o1.value===selectedToken)} onChange={onChangeToken} />
                      </span>
                    </span> */}
                    </div>
                    <div
                      css={`
                        margin-top: 14px;
                        margin-bottom: 10px;
                      `}
                    >
                      <span
                        css={`
                          font-family: Roboto;
                          font-size: 12px;
                          font-weight: bold;
                          color: #d1e4f5;
                          text-transform: uppercase;
                        `}
                        style={{ marginRight: '5px' }}
                      >
                        {props.optionsTestDatasRes?.testIdName ? props.optionsTestDatasRes?.testIdName + ':' : 'ITEM INDEX:'}
                      </span>
                      <span style={{ display: 'none', width: '200px' }}>
                        <SelectExt value={optionsField?.find((o1) => o1.value === selectedFieldId)} options={optionsField} onChange={onChangeSelectField} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                      </span>

                      <span style={{ width: '300px', display: 'inline-block' }}>
                        <SelectExt value={testDatasSelectValue} options={optionsTestDatas} onChange={onChangeSelectFieldValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                      </span>
                      <span
                        css={`
                          margin-left: 5px;
                        `}
                      >
                        <CopyText iconColor={'white'} opacitySecond={0.6} noText>
                          {testDatasSelectValue?.value}
                        </CopyText>
                      </span>
                      <span style={{ width: '200px', display: 'inline-block', marginLeft: '10px' }}>
                        <Input onKeyPress={onKeyPressId2} placeholder={'Enter an ITEM_ID'} style={{ height: '35px', borderRadius: 0 }} value={selectedFieldValueId2} onChange={onChangeSelectedFieldValueId2} />
                      </span>
                      <Button className={sd.detailbuttonblueBorder} style={{ height: '35px', marginLeft: '5px' }} ghost onClick={onClickSelectedFieldValueId2}>
                        Go
                      </Button>
                    </div>
                    <div css={'padding: 10px;'}>
                      <RefreshAndProgress isRelative errorMsg={null} isRefreshing={isRefreshingResult}>
                        {!isRefreshingResult && (
                          <div css={'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;'}>
                            <div css={'font-family: Roboto; font-size: 18px; font-weight: bold; text-align: left; margin-bottom: 10px;'}>Prediction Dashboard</div>
                            <div
                              css={`
                                display: flex;
                                align-items: center;
                              `}
                            >
                              <div>COMPARE WITH</div>
                              <SelectExt css={'width: 150px; margin-left: 10px;'} value={optionsCluster?.find((v1) => v1.value === selectedCluster)} options={optionsCluster} onChange={onChangeCluster} />
                            </div>
                          </div>
                        )}
                        {!isRefreshingResult && <div id="timeseriesChartDiv" style={{ width: '100%', height: '400px', background: '#19232F' }}></div>}
                        {renderPredicted}
                      </RefreshAndProgress>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </AutoSizer>
    </div>
  );
});

export default ModelPredictionsClusteringTimeseriesOne;
