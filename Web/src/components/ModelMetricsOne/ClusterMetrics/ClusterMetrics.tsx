import * as React from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils from '../../../../core/Utils';
import ChartOutliers from '../../ChartOutliers/ChartOutliers';
import RefreshAndProgress from '../../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../../TableExt/TableExt';
import TimeseriesChart from './TimeseriesChart';
import _ from 'lodash';

const styles = require('./ClusterMetrics.module.css');
const stylesDark = require('../../antdUseDark.module.css');

const ClusterMetrics = (props) => {
  let { metrics } = props;

  const aboveTableColumns = () => {
    let columns: ITableExtColumn[] = [
      {
        title: 'Cluster',
        field: 'cluster',
        render: (text, row, index) => {
          return <span>Cluster {text}</span>;
        },
        width: 200,
      },
      {
        title: '# OF POINTS',
        field: 'count',
        helpId: 'numClusters',
        width: 200,
      },
      {
        title: 'CLUSTER PREDICTION',
        field: 'prediction',
        helpId: 'clusterFractions',
        render: (text, row, index) => {
          return <span>{Utils.roundDefault(text * 100, 0)}%</span>;
        },
      },
      {
        title: 'SILHOUETTE COEFFICIENT',
        field: 'silhouetteScore',
        helpId: 'silhouetteScore',
        render: (text, row, index) => {
          return <span>{Utils.roundDefault(text, 2)}</span>;
        },
      },
    ];

    columns = columns.filter((c1) => !c1.hidden);

    return columns;
  };

  const aboveTableDataList = (metric) => {
    if (!metric?.rawMetricsForUi?.clusterCounts || !metric?.rawMetricsForUi?.clusterFractions || !metric?.rawMetricsForUi?.silhouetteScoreByCluster) {
      return null;
    }

    return metric?.rawMetricsForUi?.clusterCounts?.map((item) => {
      const cluster = item.cluster;
      const count = item.count;
      const prediction = metric?.rawMetricsForUi?.clusterFractions?.find((fraction) => fraction.cluster === cluster)?.fraction;
      const silhouetteScore = metric?.rawMetricsForUi?.silhouetteScoreByCluster?.find((silhouetteScore) => silhouetteScore.cluster === cluster)?.silhouetteScore;

      return { cluster, count, prediction, silhouetteScore };
    });
  };

  const belowTableColumns = () => {
    let columns: ITableExtColumn[] = [
      {
        title: 'Title',
        field: 'title',
        width: 200,
      },
      {
        title: '# OF CLUSTERS',
        field: 'numOfClusters',
        helpId: 'numClusters',
        width: 200,
      },
      {
        title: 'SILHOUETTE COEFFICIENT',
        field: 'silhouetteScore',
        helpId: 'silhouetteScore',
        render: (text, row, index) => {
          return <span>{Utils.roundDefault(text, 2)}</span>;
        },
      },
      {
        title: 'DAVIES BOULDIN',
        field: 'daviesBouldinScore',
        helpId: 'daviesBouldinScore',
        render: (text, row, index) => {
          return <span>{Utils.roundDefault(text, 2)}</span>;
        },
      },
    ];

    columns = columns.filter((c1) => !c1.hidden);

    return columns;
  };

  const belowTableDataList = (metric) => {
    if (!metric?.rawMetricsForUi?.daviesBouldinScore || !metric?.rawMetricsForUi?.numClusters || !metric?.rawMetricsForUi?.silhouetteScore) {
      return null;
    }

    return [
      {
        title: 'K-Means',
        numOfClusters: metric?.rawMetricsForUi?.numClusters,
        silhouetteScore: metric?.rawMetricsForUi?.silhouetteScore,
        daviesBouldinScore: metric?.rawMetricsForUi?.daviesBouldinScore,
      },
    ];
  };

  const clusterTsneChartData = (metric) => {
    if (!metric?.rawMetricsForUi?.tsneChart) {
      return null;
    }

    const traces = [];
    metric?.rawMetricsForUi?.tsneChart?.data?.cluster?.forEach((cluster, index) => {
      const name = `Cluster ${cluster}`;
      const findTrace = traces.find((trace) => trace.name === name);
      if (findTrace) {
        findTrace.x.push(metric?.rawMetricsForUi?.tsneChart?.data?.x?.[index]);
        findTrace.y.push(metric?.rawMetricsForUi?.tsneChart?.data?.y?.[index]);
      } else {
        traces.push({
          x: [metric?.rawMetricsForUi?.tsneChart?.data?.x?.[index]],
          y: [metric?.rawMetricsForUi?.tsneChart?.data?.y?.[index]],
          name,
          mode: 'markers',
          type: 'scatter',
          marker: { size: 12 },
        });
      }
    });

    return {
      title: metric?.rawMetricsForUi?.tsneChart?.title ?? '',
      data: traces,
    };
  };

  const clusterTimeseriesChartData = (metric) => {
    const sampleClustersData = metric?.rawMetricsForUi?.sampleClustersData;
    if (!sampleClustersData) {
      return null;
    }

    const chartData = sampleClustersData.map((item) => {
      const dataColumns = Object.keys(item.data?.[0] ?? {}) ?? [];
      const data = _.isArray(item.data) ? item.data : null;
      const mean = _.isArray(item.mean) ? item.mean : null;

      const sortData = (a, b) => {
        if (a?.['date'] > b?.['date']) return 1;
        if (a?.['date'] < b?.['date']) return -1;
        return 0;
      };

      data?.sort(sortData);
      mean?.sort(sortData);

      return {
        cluster: item.cluster,
        dataColumns,
        data,
        mean,
      };
    });

    return {
      xAxis: 'date',
      yAxis: sampleClustersData?.[0]?.targetCol ?? 'Target',
      chartData,
    };
  };

  return (
    <div>
      {metrics &&
        metrics?.map((metric) => {
          const tsneChartData = clusterTsneChartData(metric);
          const timeseriesChartData = clusterTimeseriesChartData(metric);

          return (
            <div key={metric.modelId + metric.modelVersion}>
              <div css={'margin-bottom: 20px'}>
                <TableExt showEmptyIcon={true} dataSource={aboveTableDataList(metric)} columns={aboveTableColumns()} />
              </div>
              {tsneChartData && (
                <div css={'margin-bottom: 20px; min-height: 500px;'}>
                  <AutoSizer>
                    {({ width, height }) => {
                      return (
                        <div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!tsneChartData} style={{ width: width }}>
                            <div>
                              <ChartOutliers
                                paperColor="#19232F"
                                width={width}
                                height={500}
                                marginTop={50}
                                marginLeft={50}
                                marginBottom={50}
                                type="scatters"
                                showAxis
                                showLegend
                                title={tsneChartData?.title}
                                chartData={tsneChartData?.data}
                              />
                            </div>
                          </RefreshAndProgress>
                        </div>
                      );
                    }}
                  </AutoSizer>
                </div>
              )}
              {timeseriesChartData && (
                <div css={'margin-bottom: 20px; min-height: 500px; background: #19232F;'}>
                  <AutoSizer>
                    {({ width, height }) => {
                      return <TimeseriesChart chartData={timeseriesChartData} width={width} />;
                    }}
                  </AutoSizer>
                </div>
              )}
              <div css={'margin-bottom: 20px;'}>
                <TableExt showEmptyIcon={true} dataSource={belowTableDataList(metric)} columns={belowTableColumns()} />
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default React.memo(ClusterMetrics);
