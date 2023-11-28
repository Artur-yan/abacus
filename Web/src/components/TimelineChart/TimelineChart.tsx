import Radio from 'antd/lib/radio';
import * as moment from 'moment';
import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import Utils, { ColorsGradients } from '../../../core/Utils';
import ChartMetricsFull from '../ChartMetricsFull/ChartMetricsFull';
import InputDateExt from '../InputDateExt/InputDateExt';
import SelectExt from '../SelectExt/SelectExt';

interface TimeLineInterface {
  timeSeries: any;
  chartListOptions?: any;
  title?: string;
  defaultFeaturedIndex?: string;
  yTitle?: string;
}

const TimelineChart = React.memo((props: PropsWithChildren<TimeLineInterface>) => {
  const chartHH = 300;
  const [dates, setDates] = useState<{ before?: any; after?: any }>(null);
  const [activeFrequency, setActiveFrequency] = useState<'day' | 'month' | 'week'>('month');
  const [modelData, setModelData] = useState(null);
  const [disableAfter, setDisableAfter] = useState<number>(null);
  const [disableBefore, setDisableBefore] = useState<number>(null);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(props?.defaultFeaturedIndex || null);

  const onChangeChartOption = (value, activeFrequency) => {
    const key = value;
    setActiveFeaturedIndex(key);
    let featureIndex = props?.timeSeries?.[activeFrequency];
    let checkTitle = props?.chartListOptions?.some((item) => item.title === key);
    if (!checkTitle || !featureIndex) {
      return null;
    }

    let data = [];
    Object.keys(featureIndex)?.forEach((item, index) => {
      data.push([item, featureIndex?.[item]?.[key]]);
    });

    doWorkHistograms(data);
  };
  const generateChartData = (data, seriesY = null) => {
    return {
      chart: {
        data: {
          data: data?.data,
          titleY: data?.yTitle,
          titleX: ' ',
          fieldNameTooltip: seriesY?.map((item) => {
            let title = item?.replace(/[A-Z]/g, ' $&')?.trim();
            return title?.[0]?.toUpperCase() + title?.slice(1);
          }),
          tooltipRender: (params) => {
            let tooltips = '';
            if (params && params?.length > 0) {
              params.forEach((item, index) => {
                tooltips += `${!tooltips?.includes(item?.data[0]) ? `Date: ${item?.data[0]}<br/>${props.yTitle ?? 'Accuracy'}: ${Utils.decimals(item?.data[1], 3)}` : ''}
                             ${
                               !item?.seriesName?.includes('series')
                                 ? `<div style="display: flex; padding-bottom: 10px; position: relative; min-width: 160px">
                                <span style="height: 10px; width: 10px; background-color: ${typeof item.color === 'object' ? `${item?.color?.colorStops?.[0]?.color}` : `${item?.color}`}; border-radius: 50%"/>
                                <span style="position: absolute; left: 20px; top: -5px">${item?.seriesName}: ${Utils.decimals(item?.data[1], 3)}</span>
                              </div>`
                                 : ''
                             }`;
              });
            }
            return tooltips;
          },
          useTitles: true,
          tooltips: true,
          axisYdecimals: data?.yTitle === 'Violations' ? 0 : 3,
          downloadIgnoreX: true,
          seriesY: seriesY ?? ['y'],
          dateX: true,
          seriesYlines: ['y'],
          symbolSizeAll: 12,
          useLegend: true,
          maxDecimalsTooltip: 3,
          dateOnTooltip: true,
          dateOnTooltipDiv: 1000,
          type: 'ec',
        },
        title: 'title1',
        removeTitle: true,
        beforeTitle: 'Before',
        type: 'histogram',
      },
    };
  };

  const doWorkHistograms = (chartsData) => {
    if (!chartsData) {
      return;
    }
    let data: any = {};
    let getData = [];

    if (!chartsData?.length) {
      chartsData = Object.keys(chartsData)
        ?.sort()
        ?.reduce((obj, key) => {
          obj[key] = chartsData[key];
          return obj;
        }, {});

      Object.keys(chartsData).forEach((chartsDataItem) => {
        if (chartsData?.[chartsDataItem]) {
          let milliseconds = moment(chartsDataItem).unix();

          if (dates?.before && !dates?.after) {
            if (milliseconds >= dates?.before) {
              getData.push({ x: chartsDataItem, ...chartsData[chartsDataItem] });
            }
          } else if (!dates?.before && dates?.after) {
            if (milliseconds <= dates?.after) {
              getData.push({ x: chartsDataItem, ...chartsData[chartsDataItem] });
            }
          } else if (dates?.before && dates?.after) {
            if (milliseconds <= dates?.after && milliseconds >= dates?.before) {
              getData.push({ x: chartsDataItem, ...chartsData[chartsDataItem] });
            }
          } else {
            getData.push({ x: chartsDataItem, ...chartsData[chartsDataItem] });
          }
          if (getData?.length > 0) {
            data = { ...data, biasViolations: generateChartData({ data: getData, yTitle: 'Violations' }, Object.keys(chartsData[chartsDataItem])) };
          }
        }
      });
    } else if (chartsData?.length > 0) {
      chartsData = chartsData?.sort((a, b) => {
        return moment(a[0])?.unix() - moment(b[0])?.unix();
      });
      let chartsDataSec = chartsData.map((item) => moment(item[0])?.unix());

      if (chartsData?.[chartsData?.length - 1]?.[0] != null) {
        setDisableAfter(moment(chartsData?.[chartsData?.length - 1]?.[0])?.unix());
      }
      let before = chartsData?.[0]?.[0] ? moment(chartsData?.[0]?.[0])?.unix() : null;

      if (dates?.before) {
        before = chartsDataSec?.find((item) => item > dates?.before);
      }
      setDisableBefore(before);
      chartsData?.forEach((item) => {
        let x = item[0];
        let y = item[1];
        if (x && y) {
          let before = dates?.before;
          let after = dates?.after;
          let milliseconds = moment(x).unix();

          if (before && !after) {
            if (milliseconds >= dates?.before) {
              getData.push({ x: x, y });
            }
          } else if (!before && after) {
            if (milliseconds <= dates?.after) {
              getData.push({ x: x, y });
            }
          } else if (before && after) {
            if (milliseconds <= after && milliseconds >= before) {
              getData.push({ x: x, y });
            }
          } else {
            getData.push({ x: x, y });
          }
          if (getData?.length > 0) {
            data = {
              ...data,
              biasViolations: generateChartData(
                {
                  data: getData,
                  yTitle: props.yTitle ?? 'Accuracy',
                },
                null,
              ),
            };
          }
        }
      });
    }

    setModelData(data);
  };

  const optionsTimeLine = useMemo(() => {
    let timeLines = [];
    if (props?.timeSeries) {
      Object.keys(props?.timeSeries).map((s1) => {
        if (Object.keys(props?.timeSeries?.[s1])?.length > 0) {
          timeLines.push({ label: s1, value: s1 });
        }
      });
    }
    return timeLines;
  }, [props?.timeSeries]);

  const handleChangeDate = (date) => {
    if (date?.isBefore) {
      setDates({ ...dates, before: date?.value });
    } else {
      setDates({ ...dates, after: date?.value });
    }
  };

  useEffect(() => {
    if (dates != null || props?.timeSeries != null) {
      if (!activeFeaturedIndex) {
        doWorkHistograms(props?.timeSeries?.[activeFrequency]);
      } else {
        onChangeChartOption(activeFeaturedIndex, activeFrequency);
      }
    }
  }, [dates, props?.timeSeries, activeFrequency, activeFeaturedIndex]);

  const onChangeTimeline = (option1) => {
    setActiveFrequency(option1?.value);
    if (activeFeaturedIndex) {
      onChangeChartOption(activeFeaturedIndex, option1?.value);
    } else {
      doWorkHistograms(props?.timeSeries?.[option1?.value]);
    }
  };

  return (
    optionsTimeLine?.length > 0 && (
      <div
        css={`
          display: flex;
        `}
      >
        <div
          css={`
            flex: 1;
          `}
        >
          <div
            css={`
              margin-bottom: 20px;
            `}
          >
            <div
              css={`
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              <span
                css={`
                  margin-right: 5px;
                `}
              >
                TIME RANGE:
              </span>
              <span
                css={`
                  width: 200px;
                  margin-right: 20px;
                `}
              >
                <InputDateExt
                  disableAfter={disableAfter}
                  showAfterBefore={false}
                  onChange={(data) => {
                    handleChangeDate(data);
                  }}
                  value={{ isBefore: true, value: dates?.before }}
                />
              </span>
              <span
                css={`
                  width: 200px;
                `}
              >
                <InputDateExt
                  disableBefore={disableBefore}
                  showAfterBefore={false}
                  onChange={(data) => {
                    handleChangeDate(data);
                  }}
                  value={{ isBefore: false, value: dates?.after }}
                />
              </span>
              <span
                css={`
                  margin-right: 5px;
                  margin-left: 15px;
                `}
              >
                FREQUENCY:
              </span>
              <span
                css={`
                  width: 200px;
                `}
              >
                <SelectExt options={optionsTimeLine} value={optionsTimeLine?.find((o1) => o1?.value === activeFrequency)} onChange={onChangeTimeline} />
              </span>
            </div>
            {props?.title && (
              <div style={{ whiteSpace: 'nowrap', fontSize: '16px', marginBottom: '15px' }}>
                <span>{props?.title}</span>
              </div>
            )}
            <div
              css={`
                margin-top: 20px;
              `}
            >
              {props?.chartListOptions && (
                <Radio.Group
                  css={`
                    display: flex;
                    margin-bottom: 10px;
                  `}
                  onChange={(e) => onChangeChartOption(e?.target?.value, activeFrequency)}
                  value={activeFeaturedIndex}
                >
                  {props?.chartListOptions?.map((item, index) => {
                    return (
                      props?.timeSeries?.[activeFrequency]?.[Object.keys(props?.timeSeries?.[activeFrequency])[0]]?.[item?.title] && (
                        <Radio value={item?.title} key={index}>
                          <span
                            css={`
                              color: white;
                              font-size: 18px;
                              text-transform: capitalize;
                            `}
                          >
                            {item.field}
                          </span>
                        </Radio>
                      )
                    );
                  })}
                </Radio.Group>
              )}

              <div
                css={`
                  .ct-series-a .ct-circle.circleFeatures {
                    fill: #57c0a1 !important;
                  }
                `}
              >
                <ChartMetricsFull backNormal forceColor={ColorsGradients} forMetrics noMax data={modelData?.biasViolations} height={chartHH} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
});

export default TimelineChart;
