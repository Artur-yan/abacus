import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import eda, { EdaLifecycle } from '../../stores/reducers/eda';
import { memProjectById } from '../../stores/reducers/projects';
import ChartOutliers from '../ChartOutliers/ChartOutliers';
import HelpIcon from '../HelpIcon/HelpIcon';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';

const s = require('./EDACollinearity.module.css');
const sd = require('../antdUseDark.module.css');

interface IEDACollinearityProps {
  projects?: any;
  paramsProp?: any;
  eda?: any;
}

interface IEDACollinearityState {
  selectedColumn?: string;
  matrixPos?: any;
  histogramData?: any;
  associationData?: any;
  selectedVersion?: any;
  isHistogramRefreshing?: boolean;
  isAssociationRefreshing?: boolean;
  selectedReferenceFeatureName?: string;
  selectedTestFeatureName?: string;
}

const GroupColors = [
  [13, 110, 253], // blue
  [102, 16, 242], // indigo
  [111, 66, 193], // purple
  [214, 51, 132], // pink
  [220, 53, 69], // red
  [253, 126, 20], // orange
  [255, 193, 7], // yellow
  [25, 135, 84], // green
  [32, 201, 151], // teal
  [13, 202, 240], // cyan
];

class EDACollinearity extends React.PureComponent<IEDACollinearityProps, IEDACollinearityState> {
  private isMount: boolean;
  private edaId: string;
  private edaVersion: string;
  private uirevision: number;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isMount = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isMount = false;
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
    if (!this.isMount) {
      return;
    }

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    const edaId = this.calcEdaId();
    const edaOne = this.memEDAById(true)(this.props.eda, edaId);
    const edaVersion = this.calcEdaVersion();
    let curVersion = this.state.selectedVersion ?? edaVersion ?? edaOne?.latestEdaVersion?.edaVersion;

    let listEda = this.memEDAList(true)(this.props.eda, projectId);
    let edaVersions = this.memEdaVersions(true)(this.props.eda, edaId);

    let edaVersionOne = null;
    if (edaVersions) {
      edaVersionOne = edaVersions.find((p1) => p1.edaVersion === curVersion);
      if (!edaVersionOne && edaVersions.length > 0) {
        edaVersionOne = edaVersions[0];
        curVersion = edaVersions[0].edaVersion;
      }
    }

    const correlationData = this.memEDACollinearity(true)(this.props.eda, curVersion);

    if ((this.edaId !== edaId || this.edaVersion !== curVersion) && curVersion && correlationData) {
      this.edaId = edaId;
      this.edaVersion = curVersion;

      setTimeout(() => {
        if (!this.state.selectedColumn && curVersion && correlationData && correlationData?.y?.length > 0) {
          const columnsX = correlationData.x;
          const columnsY = correlationData.y;
          const selectedColumn = correlationData?.y[0];
          const rowIndex = columnsY.indexOf(selectedColumn);

          this.columnHistorgam(curVersion, selectedColumn, columnsX, columnsY, rowIndex, -1);
        }

        if (!this.state.selectedReferenceFeatureName && !this.state.selectedTestFeatureName && curVersion && correlationData && correlationData?.dataColumns?.length > 0) {
          this.setState({
            selectedVersion: curVersion,
            selectedReferenceFeatureName: correlationData?.dataColumns[0],
            selectedTestFeatureName: correlationData?.dataColumns?.length > 1 ? correlationData?.dataColumns[1] : correlationData?.dataColumns[0],
          });
          this.getFeatureAssociation(curVersion, correlationData?.dataColumns[0], correlationData?.dataColumns?.length > 1 ? correlationData?.dataColumns[1] : correlationData?.dataColumns[0]);
        }
      }, 0);
    }
  };

  componentDidUpdate(prevProps: Readonly<IEDACollinearityProps>, prevState: Readonly<IEDACollinearityState>, snapshot?: any): void {
    this.doMem();
  }

  calcEdaVersion = () => {
    let edaVersion = this.props.paramsProp?.get('edaVersion');
    if (edaVersion === '-') {
      return null;
    } else {
      return edaVersion;
    }
  };

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      return null;
    } else {
      return projectId;
    }
  };

  calcEdaId = () => {
    let edaId = this.props.paramsProp?.get('edaId');
    if (edaId === '-') {
      return null;
    } else {
      return edaId;
    }
  };

  memEdaVersions = memoizeOneCurry((doCall, edaParam, edaId) => {
    return eda.memEdaVersionsById(doCall, edaId);
  });

  memEDAList = memoizeOneCurry((doCall, edaParam, projectId) => {
    return eda.memEdasByProjectId(doCall, projectId);
  });

  memEdaOptions = memoizeOne((listEdas) => {
    return listEdas?.filter((item) => _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('COLLINEARITY'))?.map((f1) => ({ label: f1.name, value: f1.edaId })) ?? [];
  });

  memColumnOptions = memoizeOne((columns) => {
    return columns?.map((f1) => ({ label: f1, value: f1 })) ?? [];
  });

  memReferenceFeatureNameOptions = memoizeOne((columns) => {
    return columns?.map((f1) => ({ label: f1, value: f1 })) ?? [];
  });

  memTestFeatureNameOptions = memoizeOne((columns) => {
    return columns?.map((f1) => ({ label: f1, value: f1 })) ?? [];
  });

  memVersionOptions = memoizeOne((listVersions) => {
    return listVersions?.map((f1) => ({ label: f1.edaVersion, value: f1.edaVersion })) ?? [];
  });

  memEDAById = memoizeOneCurry((doCall, edaParam, edaId) => {
    return eda.memEdaById(doCall, edaId);
  });

  memEDACollinearity = memoizeOneCurry((doCall, edaParam, edaVersion) => {
    const edaCollinearity = eda.memEdaCollinearityByEdaVersion(doCall, edaVersion);

    if (edaCollinearity) {
      const columns = edaCollinearity.columnNames;
      const columnsX = edaCollinearity.columnNamesX;
      const matrix = edaCollinearity.collinearityMatrix;
      const groups = edaCollinearity.collinearityGroups;
      const groupDict = edaCollinearity.groupFeatureDict;

      const groupShapes = [];

      if (columns && matrix && _.isArray(columns)) {
        let matrixArray = [];
        columns.forEach((row, rowIndex) => {
          let rowArray = [];
          const rowData = matrix[row];
          if (rowData) {
            columns.forEach((col, colIndex) => {
              const pointValue = typeof rowData[col] === 'number' ? Math.round(rowData[col] * 1000) / 1000 : 0;
              rowArray.push(pointValue);

              let fillColor = `rgb(${Math.round(255 * pointValue)}, ${groups?.length > 0 ? Math.round(255 * pointValue) : 0}, ${groups?.length > 0 ? Math.round(255 * pointValue) : Math.round(255 * (1 - pointValue))})`;
              if (groupDict && row in groupDict && col in groupDict && groupDict[row] === groupDict[col]) {
                const groupIndex = groupDict[row] > 9 ? groupDict[row] % 10 : groupDict[row];
                const groupColor = GroupColors[groupIndex];
                fillColor = `rgb(${Math.floor(groupColor[0] * pointValue)}, ${Math.floor(groupColor[1] * pointValue)}, ${Math.floor(groupColor[2] * pointValue)})`;
              }

              const backShape = {
                type: 'rect',
                xref: 'x',
                yref: 'y',
                x0: colIndex - 0.5,
                y0: rowIndex - 0.5,
                x1: colIndex + 0.5,
                y1: rowIndex + 0.5,
                fillcolor: '#19232F',
                line: {
                  width: 1,
                  color: '#19232F',
                },
              };
              const shape = {
                type: 'circle',
                xref: 'x',
                yref: 'y',
                x0: colIndex - 0.4,
                y0: rowIndex - 0.4,
                x1: colIndex + 0.4,
                y1: rowIndex + 0.4,
                fillcolor: fillColor,
                line: {
                  width: 0,
                },
              };

              groupShapes.push(backShape, shape);
            });
            matrixArray.push(rowArray);
          }
        });

        groupShapes.push(
          {
            type: 'rect',
            xref: 'x',
            yref: 'y',
            x0: -0.5,
            y0: 0,
            x1: columns.length - 0.5,
            y1: 0,
            line: {
              width: 0,
              color: 'rgba(50, 171, 96, 1)',
            },
          },
          {
            type: 'rect',
            xref: 'x',
            yref: 'y',
            x0: 0,
            y0: -0.5,
            x1: 0,
            y1: columns.length - 0.5,
            line: {
              width: 0,
              color: 'rgba(50, 171, 96, 1)',
            },
          },
        );

        return {
          x: columns,
          y: columns,
          z: matrixArray,
          groups,
          groupShapes,
          dataColumns: columnsX,
        };
      } else {
        return {};
      }
    }

    return null;
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  columnHistorgam = (edaVersion, selectedColumn, columnsX, columnsY, rowIndex, colIndex) => {
    if (this.state.isHistogramRefreshing) {
      return;
    }

    if (rowIndex >= 0 || colIndex >= 0) {
      this.setState({
        isHistogramRefreshing: true,
        selectedColumn,
        histogramData: null,
        matrixPos: { x: colIndex, y: rowIndex },
      });

      REClient_.client_().getCollinearityForFeature(edaVersion, selectedColumn, (err, res) => {
        this.setState({ isHistogramRefreshing: false });

        if (!err && res && res?.success) {
          const sortedColumnNames = res?.result?.sortedColumnNames;
          const featureCollinearity = res?.result?.featureCollinearity;

          if (sortedColumnNames && featureCollinearity) {
            const histogramData = {
              data: sortedColumnNames?.map((col) => {
                const yValue = typeof featureCollinearity[col] === 'number' ? Math.round(featureCollinearity[col] * 1000) / 1000 : 0;
                return { x: col, y: yValue };
              }),
            };
            this.setState({ histogramData });
          }
        }
      });
    }
  };

  handleCorrelationClick = (correlationData, edaVersion, e) => {
    const point = e.points[0];
    if (correlationData) {
      const columnsX = correlationData.x;
      const columnsY = correlationData.y;
      const selectedColumn = point.y;
      const rowIndex = columnsY.indexOf(point.y);
      const colIndex = columnsX.indexOf(point.x);

      this.columnHistorgam(edaVersion, selectedColumn, columnsX, columnsY, rowIndex, colIndex);
    }
  };

  onChangeDropdownEDASel = (option1) => {
    const edaId = this.calcEdaId();
    if (edaId === option1?.value) {
      return;
    }
    this.setState({ selectedColumn: null, selectedReferenceFeatureName: null, selectedTestFeatureName: null, histogramData: null, associationData: null, matrixPos: null, selectedVersion: null });

    if (option1?.value) {
      let p1 = this.calcProjectId();
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '/-';
      }

      Location.push('/' + PartsLink.exploratory_data_analysis_collinearity + p1 + '/' + option1?.value);
    }
  };

  onChangeDropdownVersionSel = (option) => {
    if (this.state.selectedVersion === option?.value) {
      return;
    }

    this.setState({ histogramData: null, matrixPos: null, associationData: null, selectedColumn: null, selectedReferenceFeatureName: null, selectedTestFeatureName: null, selectedVersion: option?.value });

    if (option?.value) {
      const correlationData = this.memEDACollinearity(true)(this.props.eda, option?.value);
      if (correlationData && correlationData?.y?.length > 0) {
        const columnsX = correlationData.x;
        const columnsY = correlationData.y;
        const selectedColumn = correlationData?.y[0];
        const rowIndex = columnsY.indexOf(selectedColumn);

        this.columnHistorgam(option?.value, selectedColumn, columnsX, columnsY, rowIndex, -1);
      }
    }
  };

  onChangeDropdownColumnSel = (option, edaVersion, correlationData) => {
    if (this.state.selectedColumn === option?.value) {
      return;
    }

    if (correlationData) {
      const columnsX = correlationData.x;
      const columnsY = correlationData.y;
      const selectedColumn = option?.value;
      const rowIndex = columnsY.indexOf(selectedColumn);

      this.columnHistorgam(edaVersion, selectedColumn, columnsX, columnsY, rowIndex, -1);
    }
  };

  getFeatureAssociation = (edaVersion, referenceFeatureName, testFeatureName) => {
    if (!edaVersion || !referenceFeatureName || !testFeatureName) {
      return;
    }

    this.setState({
      isAssociationRefreshing: true,
      associationData: null,
    });

    REClient_.client_().getFeatureAssociation(edaVersion, referenceFeatureName, testFeatureName, (err, res) => {
      this.setState({
        isAssociationRefreshing: false,
      });

      if (!err && res && res?.success) {
        const associationData = {};

        associationData['marginLeft'] = 100;
        associationData['marginBottom'] = 100;

        if (res.result?.isScatter) {
          associationData['type'] = 'scatter';
          associationData['data'] = {
            x: res.result.data?.map((item) => item[res.result?.xAxis]),
            y: res.result.data?.map((item) => item[res.result?.yAxis]),
          };
        } else if (res.result?.isBoxWhisker) {
          associationData['type'] = 'box';

          if (res.result?.yAxisColumnValues && _.isArray(res.result?.yAxisColumnValues)) {
            let yAxisWidth = 50;
            if (res.result.yAxisColumnValues && _.isArray(res.result.yAxisColumnValues)) {
              const maxYItemLength = Math.max(...res.result.yAxisColumnValues.map((e1) => e1.length));
              yAxisWidth += maxYItemLength * 6;

              associationData['marginLeft'] = yAxisWidth;
            }

            associationData['data'] = res.result.data?.map((item, index) => {
              return {
                lowerWhisker: item['min'],
                q1: item['25%'],
                median: item['50%'],
                q3: item['75%'],
                upperWhisker: item['max'],
                titleY: res.result?.yAxisColumnValues[index],
              };
            });
          } else if (res.result?.xAxisColumnValues && _.isArray(res.result?.xAxisColumnValues)) {
            let xAxisWidth = 50;
            if (res.result.xAxisColumnValues && _.isArray(res.result.xAxisColumnValues)) {
              const maxXItemLength = Math.max(...res.result.xAxisColumnValues.map((e1) => e1.length));
              xAxisWidth += maxXItemLength * 5;

              associationData['marginBottom'] = xAxisWidth;
            }

            associationData['data'] = res.result.data?.map((item, index) => {
              return {
                lowerWhisker: item['min'],
                q1: item['25%'],
                median: item['50%'],
                q3: item['75%'],
                upperWhisker: item['max'],
                titleX: res.result?.xAxisColumnValues[index],
              };
            });
          }
        } else if (!res.result?.isScatter && !res.result?.isBoxWhisker) {
          associationData['type'] = 'bubble';
          const sizeColumn = res.result.dataColumns?.find((column) => column !== res.result?.xAxis && column !== res.result?.yAxis);
          const maxSize = res.result.data?.reduce((prev, cur) => (prev < cur[sizeColumn] ? cur[sizeColumn] : prev), 0);
          const sizeRatio = res.result.yAxisColumnValues?.length > 0 && maxSize > 0 ? 500.0 / res.result.yAxisColumnValues?.length / maxSize / 2 : 1;

          let xAxisWidth = 50;
          if (res.result.xAxisColumnValues && _.isArray(res.result.xAxisColumnValues)) {
            const maxXItemLength = Math.max(...res.result.xAxisColumnValues.map((e1) => e1.length));
            xAxisWidth += maxXItemLength * 5;

            associationData['marginBottom'] = xAxisWidth;
          }
          let yAxisWidth = 50;
          if (res.result.yAxisColumnValues && _.isArray(res.result.yAxisColumnValues)) {
            const maxYItemLength = Math.max(...res.result.yAxisColumnValues.map((e1) => e1.length));
            yAxisWidth += maxYItemLength * 6;

            associationData['marginLeft'] = yAxisWidth;
          }

          const x = [],
            y = [],
            size = [],
            text = [];
          const xAxis = res.result?.xAxis;
          const yAxis = res.result?.yAxis;
          res.result.data?.forEach((item) => {
            x.push(item[xAxis]);
            y.push(item[yAxis]);
            size.push(item[sizeColumn] * sizeRatio);
            text.push(`${sizeColumn}: ${item[sizeColumn]}`);
          });
          associationData['data'] = { x, y, size, text };
        }

        this.setState({
          associationData,
        });
      }
    });
  };

  onChangeReferenceFeatureName = (option, testFeatureName, edaVersion) => {
    if (option?.value === testFeatureName) {
      REActions.addNotificationError('X axis and Yaxis features cannot be the same.');
      return;
    }

    if (this.state.isAssociationRefreshing || option?.value === this.state.selectedReferenceFeatureName) {
      return;
    }

    this.setState({ selectedReferenceFeatureName: option?.value });
    this.getFeatureAssociation(edaVersion, option?.value, testFeatureName);
  };

  onChangeTestFeatureName = (option, referenceFeatureName, edaVersion) => {
    if (option?.value === referenceFeatureName) {
      REActions.addNotificationError('X axis and Yaxis features cannot be the same.');
      return;
    }

    if (this.state.isAssociationRefreshing || option?.value === this.state.selectedTestFeatureName) {
      return;
    }

    this.setState({ selectedTestFeatureName: option?.value });
    this.getFeatureAssociation(edaVersion, referenceFeatureName, option?.value);
  };

  render() {
    const edaId = this.calcEdaId();
    const edaOne = this.memEDAById(false)(this.props.eda, edaId);
    const edaVersion = this.calcEdaVersion();
    let curVersion = this.state.selectedVersion ?? edaVersion ?? edaOne?.latestEdaVersion?.edaVersion;

    let projectId = this.calcProjectId();

    let optionsEDASel = null;
    let optionsEDA = [];
    let listEdas = this.memEDAList(false)(this.props.eda, projectId);
    optionsEDA = this.memEdaOptions(listEdas);
    if (optionsEDA && edaId) {
      optionsEDASel = optionsEDA.find((p1) => p1.value === edaId);
    }

    let optionsVersionSel = null;
    let optionsVersion = [];
    let edaVersionOne = null;
    let listVersions = this.memEdaVersions(false)(this.props.eda, edaId);
    optionsVersion = this.memVersionOptions(listVersions);
    if (optionsVersion) {
      optionsVersionSel = optionsVersion.find((p1) => p1.value === curVersion);
      edaVersionOne = listVersions?.find((p1) => p1.edaVersion === curVersion);
      if (!optionsVersionSel && optionsVersion.length > 0) {
        edaVersionOne = listVersions?.[0];
        optionsVersionSel = optionsVersion[0];
        curVersion = optionsVersion[0].value;
      }
    }

    const correlationData = this.memEDACollinearity(false)(this.props.eda, curVersion);

    let optionsColumnSel = null;
    let optionsColumn = [];
    optionsColumn = this.memColumnOptions(correlationData?.y);
    if (optionsColumn) {
      optionsColumnSel = optionsColumn.find((p1) => p1.value === this.state.selectedColumn);
      if (!optionsColumnSel && optionsColumn.length > 0) {
        optionsColumnSel = optionsColumn[0];
      }
    }

    let optionsReferenceFeatureNameSel = null;
    let optionsReferenceFeatureName = [];
    optionsReferenceFeatureName = this.memReferenceFeatureNameOptions(correlationData?.dataColumns);
    if (optionsReferenceFeatureName) {
      optionsReferenceFeatureNameSel = optionsReferenceFeatureName.find((p1) => p1.value === this.state.selectedReferenceFeatureName);
      if (!optionsReferenceFeatureNameSel && optionsReferenceFeatureName.length > 0) {
        optionsReferenceFeatureNameSel = optionsReferenceFeatureName[0];
      }
    }

    let optionsTestFeatureNameSel = null;
    let optionsTestFeatureName = [];
    optionsTestFeatureName = this.memTestFeatureNameOptions(correlationData?.dataColumns);
    if (optionsTestFeatureName) {
      optionsTestFeatureNameSel = optionsTestFeatureName.find((p1) => p1.value === this.state.selectedTestFeatureName);
      if (!optionsTestFeatureNameSel && optionsTestFeatureName.length > 0) {
        optionsTestFeatureNameSel = optionsTestFeatureName.length > 1 ? optionsTestFeatureName[1] : optionsTestFeatureName[0];
      }
    }

    let yMatrixAxisWidth = 40,
      xMatrixAxisWidth = 30;
    if (correlationData?.x && _.isArray(correlationData?.x)) {
      const maxItemLength = Math.max(...correlationData?.x.map((e1) => e1.length));
      yMatrixAxisWidth += maxItemLength * 6;
      xMatrixAxisWidth += maxItemLength * 6;
    }

    let xHistoramAxisWidth = 50,
      yHistoramAxisWidth = 50;
    if (this.state.histogramData?.data && _.isArray(this.state.histogramData?.data)) {
      const maxXItemLength = Math.max(...this.state.histogramData?.data.map((e1) => String(e1.x).length));
      const maxYItemLength = Math.max(...this.state.histogramData?.data.map((e1) => String(e1.y).length));
      xHistoramAxisWidth += maxXItemLength * 6;
      yHistoramAxisWidth += maxYItemLength * 6;
    }

    const isRefreshing = [EdaLifecycle.MONITORING, EdaLifecycle.PENDING].includes(edaVersionOne?.status);

    const shapeData = correlationData?.groupShapes;
    this.uirevision = this.uirevision ?? 0;
    if (shapeData && shapeData?.length > 2) {
      const rowShape = shapeData[shapeData?.length - 1];
      const colShape = shapeData[shapeData?.length - 2];

      if ('line' in rowShape && 'line' in colShape) {
        rowShape['line']['width'] = 0;
        colShape['line']['width'] = 0;

        if (this.state.matrixPos) {
          if (this.state.matrixPos?.x >= 0) {
            rowShape['line']['width'] = 3;
            rowShape['x0'] = this.state.matrixPos?.x - 0.5;
            rowShape['x1'] = this.state.matrixPos?.x + 0.5;
          }

          if (this.state.matrixPos?.y >= 0) {
            colShape['line']['width'] = 3;
            colShape['y0'] = this.state.matrixPos?.y - 0.5;
            colShape['y1'] = this.state.matrixPos?.y + 0.5;
          }
        }

        this.uirevision = this.uirevision === 0 ? 1 : 0;
      }
    }

    return (
      <div
        css={`
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        <div css="display: flex; align-items: center; margin: 20px;">
          <span css="font-size: 14px">EDA:</span>
          <span style={{ marginLeft: '10px', marginRight: '20px', width: '300px', display: 'inline-block', fontSize: '12px' }}>
            <SelectExt value={optionsEDASel} options={optionsEDA} onChange={this.onChangeDropdownEDASel} />
          </span>
          <span css="font-size: 14px">Version:</span>
          <span style={{ marginLeft: '10px', marginRight: '20px', width: '200px', display: 'inline-block', fontSize: '12px' }}>
            <SelectExt value={optionsVersionSel} options={optionsVersion} onChange={this.onChangeDropdownVersionSel} />
          </span>
        </div>
        <div
          css={`
            position: absolute;
            top: ${80}px;
            left: 0;
            right: 0;
            bottom: 0;
          `}
        >
          <RefreshAndProgress isMsgAnimRefresh={isRefreshing} msgMsg={isRefreshing ? 'Processing...' : undefined} isDim={isRefreshing}>
            <AutoSizer>
              {({ width, height }) => {
                const widthFull = width - 80;
                const heightFull = height - 40;

                return (
                  <div
                    css={`
                      width: ${widthFull}px;
                      height: ${heightFull}px;
                    `}
                  >
                    <NanoScroller>
                      <div className={sd.table} style={{ position: 'relative', marginLeft: '40px' }}>
                        <div className={sd.titleTopHeaderAfter} style={{ marginBottom: '15px' }}>
                          <span>Feature Relationships</span>
                        </div>

                        <div css="display: flex; align-items: center; margin-bottom: 15px;">
                          <span css="font-size: 14px">Column:</span>
                          <span style={{ marginLeft: '10px', marginRight: '50px', width: '300px', display: 'inline-block', fontSize: '12px' }}>
                            <SelectExt
                              value={optionsColumnSel}
                              options={optionsColumn}
                              onChange={(option) => {
                                this.onChangeDropdownColumnSel(option, curVersion, correlationData);
                              }}
                            />
                          </span>
                        </div>

                        <div
                          css={`
                            min-height: ${250 + xHistoramAxisWidth}px;
                          `}
                        >
                          {this.state.selectedColumn && (
                            <div
                              css={`
                                font-family: Matter;
                                display: flex;
                                font-size: 18px;
                                font-weight: 500;
                                line-height: 1.78;
                                margin-bottom: 10px;
                              `}
                            >
                              <span>
                                {`Collinearity between ${this.state.selectedColumn} and all other features`} <HelpIcon id={'eda_feature_collinearity_histogram'} style={{ marginLeft: '4px' }} />
                              </span>
                            </div>
                          )}
                          <RefreshAndProgress isRelative={true} isRefreshing={this.state.isHistogramRefreshing} style={{ width: widthFull }}>
                            {this.state.histogramData && (
                              <div>
                                <ChartOutliers
                                  paperColor="#19232F"
                                  width={widthFull}
                                  height={200 + xHistoramAxisWidth}
                                  marginLeft={yHistoramAxisWidth}
                                  marginBottom={xHistoramAxisWidth}
                                  marginRight={120}
                                  xTicketAngle={45}
                                  type="bar"
                                  showAxis
                                  chartData={this.state.histogramData}
                                />
                              </div>
                            )}
                          </RefreshAndProgress>
                        </div>

                        <div
                          css={`
                            margin-top: 15px;
                            display: flex;
                            gap: 20px;
                            min-height: ${(widthFull * 2) / 3}px;
                          `}
                        >
                          <div
                            css={`
                              width: ${(widthFull * 2) / 3}px;
                            `}
                          >
                            <div
                              css={`
                                font-family: Matter;
                                display: flex;
                                font-size: 18px;
                                font-weight: 500;
                                line-height: 1.78;
                                margin-bottom: 10px;
                              `}
                            >
                              <span>
                                Correlation Matrix <HelpIcon id={'eda_collinearity_correlation_matrix'} style={{ marginLeft: '4px' }} />
                              </span>
                            </div>
                            <RefreshAndProgress isRelative={true} isRefreshing={!correlationData}>
                              <div>
                                {correlationData && Object.keys(correlationData)?.length > 0 && (
                                  <ChartOutliers
                                    paperColor="#19232F"
                                    onClick={this.handleCorrelationClick.bind(this, correlationData, curVersion)}
                                    width={(widthFull * 2) / 3}
                                    height={(widthFull * 2) / 3 - 60}
                                    type="heatmap"
                                    uiRevision={this.uirevision}
                                    marginLeft={yMatrixAxisWidth}
                                    marginBottom={xMatrixAxisWidth}
                                    showAxis
                                    shapes={shapeData}
                                    chartData={correlationData}
                                    colorScale={
                                      correlationData.groups?.length > 0
                                        ? [
                                            [0, 'rgb(0, 0, 0'],
                                            [1, 'rgb(255, 255, 255'],
                                          ]
                                        : [
                                            [0, 'rgb(0, 0, 255'],
                                            [1, 'rgb(255, 0, 0'],
                                          ]
                                    }
                                  />
                                )}
                              </div>
                            </RefreshAndProgress>
                          </div>
                          {correlationData && correlationData.groups?.length > 0 && (
                            <div css={'flex: 1'}>
                              <div
                                css={`
                                  font-family: Matter;
                                  display: flex;
                                  font-size: 18px;
                                  font-weight: 500;
                                  line-height: 1.78;
                                  margin-bottom: 10px;
                                `}
                              >
                                <span>
                                  Correlated Feature Clusters <HelpIcon id={'eda_grouped_features'} style={{ marginLeft: '4px' }} />
                                </span>
                              </div>
                              <div css={'background: #19232F; padding: 20px 10px;'}>
                                {correlationData.groups?.map((item, index) => {
                                  const groupIndex = index > 9 ? index % 10 : index;
                                  const groupColor = GroupColors[groupIndex];
                                  const groupColorText = `rgb(${groupColor[0]}, ${groupColor[1]}, ${groupColor[2]})`;
                                  const groupText = item.join(', ');

                                  return (
                                    <div css={'font-size: 14px; display: flex; align-items: center'} key={groupText}>
                                      <div className={s.Circle} style={{ backgroundColor: groupColorText }} />
                                      <span>{groupText}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div
                          css={`
                            margin-top: 15px;
                            min-height: 600px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              display: flex;
                              font-size: 18px;
                              font-weight: 500;
                              line-height: 1.78;
                              margin-bottom: 10px;
                            `}
                          >
                            <span>
                              Feature Associations <HelpIcon id={'eda_feature_associations'} style={{ marginLeft: '4px' }} />
                            </span>
                          </div>
                          <div css={'margin-bottom: 10px;'}>
                            <span css="font-size: 14px">X-Axis</span>
                            <span style={{ marginLeft: '10px', marginRight: '50px', width: '300px', display: 'inline-block', fontSize: '12px' }}>
                              <SelectExt
                                value={optionsReferenceFeatureNameSel}
                                options={optionsReferenceFeatureName}
                                onChange={(option) => {
                                  this.onChangeReferenceFeatureName(option, optionsTestFeatureNameSel?.value, curVersion);
                                }}
                              />
                            </span>
                            <span css="font-size: 14px">Y-Axis</span>
                            <span style={{ marginLeft: '10px', width: '200px', display: 'inline-block', fontSize: '12px' }}>
                              <SelectExt
                                value={optionsTestFeatureNameSel}
                                options={optionsTestFeatureName}
                                onChange={(option) => {
                                  this.onChangeTestFeatureName(option, optionsReferenceFeatureNameSel?.value, curVersion);
                                }}
                              />
                            </span>
                          </div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!this.state.associationData && correlationData && Object.keys(correlationData)?.length > 0} style={{ width: width - 80 }}>
                            {this.state.associationData && (
                              <div>
                                <ChartOutliers
                                  paperColor="#19232F"
                                  width={width - 80}
                                  height={500}
                                  type={this.state.associationData?.type}
                                  showAxis
                                  marginRight={100}
                                  marginLeft={this.state.associationData?.marginLeft ?? 30}
                                  marginBottom={this.state.associationData?.marginBottom ?? 30}
                                  chartData={this.state.associationData}
                                />
                              </div>
                            )}
                          </RefreshAndProgress>
                        </div>
                      </div>
                    </NanoScroller>
                  </div>
                );
              }}
            </AutoSizer>
          </RefreshAndProgress>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    eda: state.eda,
  }),
  null,
)(EDACollinearity);
