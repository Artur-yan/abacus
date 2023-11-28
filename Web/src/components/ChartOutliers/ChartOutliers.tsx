import _ from 'lodash';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

interface IChartOutliersProps {
  width: number | string;
  height: number | string;
  type: 'bar' | 'box' | 'heatmap' | 'scatter' | 'bubble' | 'lines' | 'scatters';
  chartData: any;
  showAxis: boolean;
  paperColor?: string;
  xAxisPos?: string;
  yAxisPos?: string;
  marginTop?: number;
  marginBottom?: number;
  marginRight?: number;
  marginLeft?: number;
  onClick?: (e) => void;
  shapes?: any[];
  xTicketAngle?: number | string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  markerSize?: number;
  markerColor?: string;
  fillColor?: string;
  colorScale?: any[];
  uiRevision?: number | string;
  legend?: any;
  title?: string;
  showLegend?: boolean;
}

const ChartOutliers = React.memo(
  ({
    type,
    chartData,
    showAxis,
    width,
    height,
    paperColor = 'transparent',
    xAxisPos = 'bottom',
    yAxisPos = 'left',
    marginTop = 30,
    marginBottom = 30,
    marginRight = 30,
    marginLeft = 30,
    xTicketAngle = 'auto',
    shapes,
    onClick,
    uiRevision,
    title,
    showLegend = false,
    xAxisLabel = '',
    yAxisLabel = '',
    markerSize = 12,
    markerColor = '#03AD9D',
    fillColor = '#03AD9D',
    colorScale = undefined,
    legend = undefined,
  }: PropsWithChildren<IChartOutliersProps>) => {
    const [data, setData] = useState(null);
    const [layout, setLayout] = useState(null);
    const [config, setConfig] = useState(null);

    useEffect(() => {
      if (chartData) {
        let cData = null;
        if (type === 'bar') {
          cData = [
            {
              type: 'bar',
              x: chartData.data?.map((item) => item.x),
              y: chartData.data?.map((item) => item.y),
              marker: {
                color: 'rgb(105, 210, 231)',
                width: 2,
              },
            },
          ];
        } else if (type === 'lines') {
          cData = chartData;
        } else if (type === 'scatters') {
          cData = chartData;
        } else if (type === 'heatmap') {
          cData = [
            {
              z: chartData.z,
              x: chartData.x,
              y: chartData.y,
              type: 'heatmap',
              ...(colorScale && { colorscale: colorScale }),
              hoverongaps: false,
            },
          ];
        } else if (type === 'scatter') {
          cData = [
            {
              x: chartData.data?.x,
              y: chartData.data?.y,
              type: 'scatter',
              mode: 'markers',
              marker: { size: markerSize },
            },
          ];
        } else if (type === 'bubble') {
          cData = [
            {
              x: chartData.data?.x,
              y: chartData.data?.y,
              ...(chartData.data?.text && { text: chartData.data?.text }),
              mode: 'markers',
              marker: {
                size: chartData.data?.size,
              },
            },
          ];
        } else if (type === 'box') {
          if (_.isArray(chartData.data)) {
            cData = [];
            chartData.data?.forEach((data) => {
              cData.push({
                name: '',
                type: 'box',
                lowerfence: [data?.lowerWhisker],
                q1: [data?.q1],
                median: [data?.median],
                q3: [data?.q3],
                upperfence: [data?.upperWhisker],
                ...(data?.titleX && { x: [data?.titleX] }),
                ...(data?.titleY && { y: [data?.titleY] }),
                line: {
                  color: 'white',
                  width: showAxis ? 2 : 1,
                },
                fillcolor: fillColor,
                showlegend: false,
                // hoverinfo: 'skip'
              });
              if (data?.outliers) {
                cData.push({
                  name: '',
                  mode: 'markers',
                  ...(data?.titleX && { x: data?.outliers?.map(() => data.titleX), y: data?.outliers }),
                  ...(data?.titleY && { y: data?.outliers?.map(() => data.titleY), x: data?.outliers }),
                  hoverlabel: {
                    bgcolor: 'white',
                  },
                  marker: {
                    color: markerColor,
                    line: {
                      color: 'white',
                      width: showAxis ? 2 : 1,
                    },
                    size: showAxis ? 10 : 4,
                  },
                  showlegend: false,
                  hoverinfo: 'y',
                });
              }
            });
          } else {
            cData = [
              {
                name: '',
                type: 'box',
                lowerfence: [chartData.data?.lowerWhisker],
                q1: [chartData.data?.q1],
                median: [chartData.data?.median],
                q3: [chartData.data?.q3],
                upperfence: [chartData.data?.upperWhisker],
                x: [chartData.titleX],
                line: {
                  color: 'white',
                  width: showAxis ? 2 : 1,
                },
                fillcolor: fillColor,
                showlegend: false,
                hoverinfo: 'skip',
              },
              {
                name: '',
                mode: 'markers',
                x: chartData.data?.outliers?.map(() => chartData.titleX),
                y: chartData.data?.outliers,
                hoverlabel: {
                  bgcolor: 'white',
                },
                marker: {
                  color: markerColor,
                  line: {
                    color: 'white',
                    width: showAxis ? 2 : 1,
                  },
                  size: showAxis ? 10 : 4,
                },
                showlegend: false,
                hoverinfo: 'y',
              },
            ];
          }
        }
        setData(cData);
      }
    }, [chartData, showAxis, type]);

    useEffect(() => {
      let cLayout: any = {
        ...(uiRevision && { uirevision: uiRevision }),
        ...(legend && { legend }),
        ...(title && { title }),
        showlegend: showLegend,
        autosize: false,
        width,
        height,
        margin: {
          l: showAxis ? marginLeft : 0,
          r: showAxis ? marginRight : 0,
          b: showAxis ? marginBottom : 0,
          t: showAxis ? marginTop : 0,
        },
        dragmode: false,
        font: { color: 'white' },
        xaxis: {
          autotypenumbers: 'strict',
          fixedrange: true,
          side: xAxisPos,
          tickangle: xTicketAngle,
          title: {
            text: xAxisLabel,
          },
        },
        yaxis: {
          autotypenumbers: 'strict',
          fixedrange: true,
          side: yAxisPos,
          title: {
            text: yAxisLabel,
          },
          griddash: 'line',
          gridcolor: '#707070',
        },
        plot_bgcolor: 'transparent',
        paper_bgcolor: paperColor,
      };

      if (type === 'bar') {
      } else if (type === 'heatmap') {
      } else if (type === 'box') {
      }

      if (shapes) {
        cLayout = {
          ...cLayout,
          shapes,
        };
      }
      setLayout(cLayout);
    }, [type, width, height, showAxis, paperColor, xAxisPos, yAxisPos, shapes, uiRevision]);

    useEffect(() => {
      setConfig({ displayModeBar: false });
    }, []);

    const handleClick = (e) => {
      if (onClick) {
        onClick(e);
      }
    };

    return <div>{data && <Plot data={data} layout={layout} config={config} onClick={handleClick} />}</div>;
  },
);

export default ChartOutliers;
