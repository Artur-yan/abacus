import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import Input from 'antd/lib/input';
import FormExt from '../FormExt/FormExt';
import Utils from '../../../core/Utils';
import HelpIcon from '../HelpIcon/HelpIcon';
import classNames from 'classnames';
import NanoScroller from '../NanoScroller/NanoScroller';
import REClient_ from '../../api/REClient';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
const styles = require('./ModelPredictionTextClassification.module.css');
const theme = require('../antdUseDark.module.css');
export const ColorsGradients = [
  { from: '#9137ff', to: '#4b00a7' },
  { from: '#245bff', to: '#002bc9' },
  { from: '#ff5bf4', to: '#7e05b1' },
  { from: '#06edbd', to: '#006870' },
  { from: '#ffc443', to: '#db5704' },
  { from: '#0995ff', to: '#00497e' },
  { from: '#ff603a', to: '#cc2100' },
  { from: '#ffeb3a', to: '#ba9400' },
  { from: '#09daff', to: '#00687a' },
  { from: '#c4ff3a', to: '#638e00' },
  { from: '#09ff9c', to: '#008e51' },
  { from: '#3aff40', to: '#008801' },
  { from: '#6041ff', to: '#2800a4' },
  { from: '#ff415e', to: '#b20023' },
  { from: '#ff8f5c', to: '#cb3d00' },
  { from: '#c76c43', to: '#792600' },
  { from: '#aeacba', to: '#838292' },
  { from: '#26c363', to: '#16763d' },
  { from: '#edbd42', to: '#a17c0f' },
  { from: '#f15e9b', to: '#9e2756' },
];

const CONTAINER_WIDTH = {
  INPUT: 500,
  ACTION: 200,
};

const ModelPredictionTextClassification = (props) => {
  const formRef = useRef<FormInstance>();
  const [chartData, setChartData] = useState([]);
  const [isDataLoading, setDataLoading] = useState(false);
  const { requests, paramsProp, projects } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    requests: state.requests,
  }));
  const isRefreshing = projects.get('isRefreshing');
  const selectedDeploymentId = paramsProp.get('deployId');
  const requestId = paramsProp?.get('requestId') || null;

  if (!selectedDeploymentId) return <span>Deployment is not available</span>;

  const onPredictiontrigger = async ({ text = '', labels = '' }) => {
    setDataLoading(true);
    const candidate_labels = labels.replace(/,$/, '');
    const queryData = { text, candidate_labels: candidate_labels.split(',') };
    const reqObj = { data: JSON.stringify(queryData) };
    const chartDataPoints = [];
    try {
      const response = await REClient_.promises_()._predictForUI(selectedDeploymentId, reqObj, {}, requestId);

      if (!response?.success) {
        REActions.addNotificationError(Constants.errorDefault);
      }
      const predictedData = response?.result?.predicted;
      predictedData?.labels?.forEach((label, index) => {
        chartDataPoints.push({ x: label, y: predictedData?.scores?.[index] });
      });
      setChartData(chartDataPoints);
      setDataLoading(false);
    } catch (err) {
      setDataLoading(false);
      REActions.addNotificationError(Constants.errorDefault);
    }
  };

  return (
    <div
      className={styles.rootContainer}
      // style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, }}
    >
      <RefreshAndProgress isRefreshing={isRefreshing}>
        <AutoSizer>
          {({ height, width }) => (
            <div style={{ height: height + 'px', width: width + 'px' }}>
              <div className={theme.titleTopHeaderAfter} style={{ height: topAfterHeaderHH, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <span style={{ whiteSpace: 'nowrap' }} className={theme.classScreenTitle}>
                  Predictions{' '}
                  <span
                    css={`
                      @media screen and (max-width: 1400px) {
                        display: none;
                      }
                    `}
                  >
                    Dashboard
                  </span>
                  :
                </span>
              </div>
              <div style={{ zIndex: 3, position: 'absolute', top: topAfterHeaderHH + 'px', left: 0, right: 0, bottom: 0 }}>
                <div
                  className={styles.container}
                  css={`
                    height: ${height - 60}px;
                  `}
                >
                  <div
                    className={classNames(styles.inputContainer, theme.classGrayPanel)}
                    css={`
                      width: ${CONTAINER_WIDTH.INPUT};
                    `}
                  >
                    <FormExt ref={formRef} onFinish={onPredictiontrigger}>
                      <Form.Item
                        name="text"
                        key="text"
                        className={styles.formItem}
                        rules={[{ required: true, message: 'Text is Required!' }]}
                        label={
                          <span style={{ color: Utils.colorAall(1) }}>
                            Text
                            <HelpIcon id={'sequence_classification_text'} />
                          </span>
                        }
                      >
                        <Input.TextArea rows={5} className={styles.textarea} />
                      </Form.Item>
                      <Form.Item
                        name="labels"
                        key={'labels'}
                        className={styles.formItem}
                        rules={[{ required: true, message: 'Label Required!' }]}
                        label={
                          <span style={{ color: Utils.colorAall(1) }}>
                            Labels (comma-separated)
                            <HelpIcon id={'sequence_classification_labels'} />
                          </span>
                        }
                      >
                        <Input />
                      </Form.Item>
                    </FormExt>
                  </div>
                  <div
                    className={styles.actionContainer}
                    css={`
                      width: ${CONTAINER_WIDTH.ACTION};
                    `}
                  >
                    <Button type="primary" onClick={formRef?.current?.submit} loading={isDataLoading}>
                      Predict
                    </Button>
                  </div>
                  <div
                    className={classNames(styles.chartContainer, theme.classGrayPanel)}
                    css={`
                      width: ${width - (CONTAINER_WIDTH.INPUT + CONTAINER_WIDTH.ACTION)}px;
                    `}
                  >
                    {chartData.length ? (
                      <ChartXYExt
                        useEC
                        colorFixed={ColorsGradients}
                        colorIndex={0}
                        width={width - (CONTAINER_WIDTH.INPUT + CONTAINER_WIDTH.ACTION)}
                        height={350}
                        data={{
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
                          aadrawLineX: 10, // comes from API response
                          forceToPrintAllLabels: true,
                          divisorX: null,
                          useTitles: true,
                          titleY: 'Probability',
                          titleX: 'Label',
                          tooltips: true,
                          data: chartData,
                          labels: [],
                        }}
                        type={'bar'}
                      />
                    ) : (
                      <span>Predication data not available, Run prediction to see prediction results</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </AutoSizer>
      </RefreshAndProgress>
    </div>
  );
};

export default ModelPredictionTextClassification;
