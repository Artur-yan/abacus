import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import * as uuid from 'uuid';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcModelAugmByModelId } from '../../stores/reducers/models';
import { memProjectById } from '../../stores/reducers/projects';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import NanoScroller from '../NanoScroller/NanoScroller';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';

const s = require('./ModelDataAugmentationOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelDataAugmentationOneProps {
  paramsProp?: any;
  projects?: any;
  models?: any;
}

interface IModelDataAugmentationOneState {
  chartsUuid?: string;
  variationId?: any;
}

export interface IListResChartsAugmentation {
  datasetId?: string;
  list?: any[];
  title?: any;
  is_synthetic?: boolean;
}

class ModelDataAugmentationOne extends React.PureComponent<IModelDataAugmentationOneProps, IModelDataAugmentationOneState> {
  private unDark: any;
  private isM: boolean;

  constructor(props) {
    super(props);

    this.state = {
      chartsUuid: null,
      variationId: 0,
    };
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

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let modelId = this.props.paramsProp?.get('modelId');

    let dataCompare = this.memDataAugm(true)(this.props.models, modelId, this.state.variationId ?? 0);
  };

  componentDidUpdate(prevProps: Readonly<IModelDataAugmentationOneProps>, prevState: Readonly<IModelDataAugmentationOneState>, snapshot?: any): void {
    this.doMem();
  }

  onDarkModeChanged = (isDark) => {
    setTimeout(() => {
      this.setState({
        chartsUuid: uuid.v1(),
      });
    }, 0);

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

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memCharts = memoizeOne((dataCompare) => {
    const calcList = (data1, keyName) => {
      if (!data1) {
        return { list: [] };
      }

      let res = [];
      data1 &&
        data1.charts &&
        data1.charts.some((chart1, chart1ind) => {
          let div1 = <ChartXYExt key={'chart_' + keyName + '_' + chart1ind} index={chart1ind} data={chart1} />;
          res.push(div1);
        });
      return {
        list: res,
        title: data1 && <div style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600 }}>{data1.name}</div>,
        is_synthetic: data1 && data1.isSynthetic,
        datasetId: data1 && data1.datasetId,
      } as IListResChartsAugmentation;
    };

    if (dataCompare) {
      let list1 = calcList(dataCompare[0], 'list1');
      let list2 = calcList(dataCompare[1] || dataCompare[0], 'list2');

      return { list1, list2 };
    }
  });

  memDataAugm = memoizeOneCurry((doCall, models, modelId, variationId) => {
    if (models && modelId) {
      let res = calcModelAugmByModelId(undefined, modelId, variationId);
      if (res != null) {
        return res;
      } else {
        if (models.get('isRefreshing')) {
          return null;
        } else {
          if (doCall) {
            StoreActions.augmModelById_(modelId, variationId);
          }
        }
      }
    }
  });

  onChangeVariationOption = (option1) => {
    this.setState({
      variationId: option1?.value ?? 0,
    });
  };

  render() {
    let { paramsProp, projects } = this.props;

    let projectId = paramsProp && paramsProp.get('projectId');
    let modelId = paramsProp && paramsProp.get('modelId');

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let dataCompare = this.memDataAugm(false)(this.props.models, modelId, this.state.variationId ?? 0);

    let isRefreshing = false;
    if (projects) {
      isRefreshing = projects.get('isRefreshing');
    }
    if (!foundProject1) {
      isRefreshing = true;
    }

    let isRefreshingCharts = false;
    if (this.props.models?.get('isRefreshing')) {
      isRefreshingCharts = true;
    }

    //
    const topHH = 60;

    let chartsList1: IListResChartsAugmentation = null,
      chartsList2: IListResChartsAugmentation = null,
      chartsTitle1 = null,
      chartsTitle2 = null;
    if (dataCompare) {
      let resCharts = this.memCharts(dataCompare);
      if (resCharts) {
        chartsList1 = resCharts.list1;
        chartsList2 = resCharts.list2;

        const styleTitle: CSSProperties = {
          margin: '8px 0',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        };

        const titleSynth = <div style={styleTitle}>Synthetic Data Plots</div>;
        const titleNonSynth = <div style={styleTitle}>Raw Data Plots</div>;

        chartsTitle1 = chartsList1.is_synthetic ? titleSynth : titleNonSynth;
        chartsTitle2 = chartsList2.is_synthetic ? titleSynth : titleNonSynth;
      }
    }

    const nodataDiv = <div style={{ fontSize: '13px', opacity: 0.8, margin: '50px 0', textAlign: 'center' }}>No data</div>;

    let popupContainerForMenu = (node) => document.getElementById('body2');
    const variationOptions = [
      {
        label: 0,
        value: 0,
      },
      {
        label: 1,
        value: 1,
      },
      {
        label: 2,
        value: 2,
      },
      {
        label: 3,
        value: 3,
      },
    ];
    let variationOption1 = variationOptions.find((v1) => v1.value === (this.state.variationId ?? 0));

    return (
      <div style={{ margin: '0 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <RefreshAndProgress errorButtonText={null} errorMsg={null} isRefreshing={isRefreshing}>
          <AutoSizer ref={'sizer'}>
            {({ width, height }) => (
              <div style={{ opacity: isRefreshing !== true && foundProject1 ? 1 : 0, height: height + 'px', width: width + 'px' }}>
                <div style={{ minHeight: '600px', padding: '25px 30px' }} className={sd.aagrayPanel}>
                  <div style={{ marginBottom: '10px', height: '40px', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
                    <span style={{ flex: '0', whiteSpace: 'nowrap' }}>
                      <span style={{ opacity: 0.8, marginRight: '5px' }}>Variation:</span>
                      <span style={{ width: '220px', display: 'inline-block' }}>
                        <SelectExt value={variationOption1} options={variationOptions} onChange={this.onChangeVariationOption} menuPortalTarget={popupContainerForMenu(null)} />
                      </span>
                      <HelpIcon id={'models_augm_top'} style={{ marginLeft: '4px' }} />
                    </span>
                  </div>

                  <div className={sd.table} style={{ position: 'relative', textAlign: 'left', borderTop: '1px solid ' + Constants.lineColor(), height: height - topHH - 50 + 'px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, textAlign: 'left', borderLeft: '1px solid ' + Constants.lineColor() }}>
                      <RefreshAndProgress msgMsg={isRefreshingCharts ? 'Refreshing Charts...' : null} isMsgAnimRefresh={isRefreshingCharts} isDim={isRefreshingCharts}>
                        <NanoScroller onlyVertical style={{}}>
                          <div style={{}}>
                            <div style={{ textAlign: 'center', padding: '14px 0 15px', backgroundColor: Constants.backBlueDark(), borderBottom: '1px solid ' + Constants.lineColor() }}>
                              <div style={{ display: 'flex', flexFlow: 'row', width: '100%' }}>
                                <div style={{ flex: 1, display: 'flex', flexFlow: 'column wrap', justifyContent: 'center' }}>
                                  {chartsList1 && chartsList1.title}
                                  {chartsTitle1}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexFlow: 'column wrap', justifyContent: 'center', borderLeft: '1px solid' + Constants.lineColor() }}>
                                  {chartsList2 && chartsList2.title}
                                  {chartsTitle2}
                                </div>
                              </div>
                            </div>
                            <div ref={'chartsDiv'} style={{ padding: '0 15px' }}>
                              <div style={{ display: 'flex', flexFlow: 'row', width: '100%' }}>
                                <div style={{ flex: 1, flexFlow: 'row wrap', justifyContent: 'center' }}>
                                  {chartsList1 && chartsList1.list}
                                  {(chartsList1 == null || chartsList1.list == null || chartsList1.list.length === 0) && nodataDiv}
                                </div>
                                <div style={{ flex: 1, flexFlow: 'row wrap', justifyContent: 'center', borderLeft: '1px solid' + Constants.lineColor() }}>
                                  {chartsList2 && chartsList2.list}
                                  {(chartsList2 == null || chartsList2.list == null || chartsList2.list.length === 0) && nodataDiv}
                                </div>
                              </div>
                            </div>
                          </div>
                        </NanoScroller>
                      </RefreshAndProgress>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
    models: state.models,
  }),
  null,
)(ModelDataAugmentationOne);
