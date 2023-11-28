import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import ModalConfirm from '../ModalConfirm/ModalConfirm';

import { useEdaGraphOne, useEdaGraphsListAll } from '../../api/REUses';
import Link from '../Link/Link';
import ModalContent from '../ModalContent/ModalContent';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./EDAGraphsOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IEDAGraphsOneIFrameProps {
  plotReferenceId?: any;
  frameWW?: number | string;
  frameHH?: number;
  label?: string;
  topHH?: number;
  onChange?: () => void;
}

const EDAGraphsOneIFrame = React.memo((props: PropsWithChildren<IEDAGraphsOneIFrameProps>) => {
  const [hwRatio, setHwRatio] = useState(null);
  const [content, setContent] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const refIFrame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (Utils.isNullOrEmpty(props.plotReferenceId)) {
      setIsProcessing(false);
      setContent(null);
      setHwRatio(null);
      return;
    }

    setIsProcessing(true);
    REClient_.client_()._pythonGraphDataForDashboard(props.plotReferenceId, (err, res) => {
      setIsProcessing(false);
      if (err || !res?.success || res?.result?.isUserError) {
        setIsError(true);
        setContent(
          <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ maxWidth: '75%', color: 'red', textAlign: 'center' }}>{err || res?.error || res?.result?.error || ''}</span>
          </div>,
        );
        setHwRatio(null);
      } else {
        setContent(res?.result?.graphHtml ?? null);
        setHwRatio(res?.result?.hwRatio ?? null);
      }
    });
  }, [props.plotReferenceId]);

  const wwCalc = useMemo(() => {
    if (props.frameWW != null) {
      return props.frameWW;
    }

    let v1 = hwRatio ?? 1;
    if (!_.isNumber(v1)) {
      v1 = 1;
    }
    if (v1 === 0) {
      v1 = 1;
    }
    return Math.trunc((props.frameHH ?? 0) * v1);
  }, [props.frameHH, hwRatio, props.frameWW]);

  const onLoadIFrame = (e) => {
    if (props.onChange != null) {
      setTimeout(() => {
        props.onChange?.();
      }, 0);
    }
  };

  const wwCalcUse = useCallback(
    (n = null) => {
      if (wwCalc == null) {
        return null;
      } else if (_.isString(wwCalc)) {
        return wwCalc;
      } else {
        return wwCalc + (n ?? 0) + 'px';
      }
    },
    [wwCalc],
  );

  return (
    <div
      css={`
        position: relative;
        width: ${wwCalcUse()};
        top: 0;
        left: 0;
        height: ${props.frameHH}px;
        z-index: 100;
      `}
    >
      <div
        css={`
          padding-top: 3px;
          font-size: 13px;
          text-align: center;
          height: ${props.topHH ?? 0}px;
        `}
      >
        {props.label || '-'}
      </div>
      <div
        css={`
          width: ${wwCalcUse(2)};
          top: 0;
          left: 0;
          height: ${props.frameHH - props.topHH - 2}px;
          z-index: 100;
          position: relative;
        `}
      >
        <RefreshAndProgress
          isMsgAnimRefresh={true}
          hideCircularImage
          msgMsg={
            isProcessing
              ? ((
                  <span
                    css={`
                      font-size: 13px;
                    `}
                  >
                    Loading...
                  </span>
                ) as any)
              : null
          }
          isDim={isProcessing}
        >
          {isError && content}
          {!isError && (
            <iframe
              onLoad={onLoadIFrame}
              ref={refIFrame}
              srcDoc={content ?? ''}
              frameBorder={0}
              title={'Abacus'}
              css={`
                width: ${wwCalcUse(2)};
                top: 0;
                left: 0;
                height: ${props.frameHH - props.topHH - 2}px;
                z-index: 100;
              `}
            />
          )}
        </RefreshAndProgress>
      </div>
    </div>
  );
});

interface IEDAGraphsOneProps {}

const EDAGraphsOne = React.memo((props: PropsWithChildren<IEDAGraphsOneProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));

  const [plots, setPlots] = useState([]);
  const [ignoredRefreshList, forceUpdateRefreshList] = useReducer((x) => x + 1, 0);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-' || projectId === '') {
    projectId = null;
  }

  let graphDashboardId = paramsProp?.get('graphDashboardId');
  if (graphDashboardId === '-' || graphDashboardId === '') {
    graphDashboardId = null;
  }

  const graphOne = useEdaGraphOne(graphDashboardId, ignoredRefreshList);
  const graphsInProject = useEdaGraphsListAll(projectId);
  const optionsGraphsList = useMemo(() => {
    return graphsInProject?.map((g1) => ({ label: g1?.name, value: g1?.graphDashboardId }));
  }, [graphsInProject]);

  const onChangeGraphSelectTop = (option) => {
    if (graphOne?.graphDashboardId === option.value) {
      return;
    }
    setPlots([]);
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId, undefined, Utils.processParamsAsQuery({ graphDashboardId: option?.value }, window.location.search));
  };

  useEffect(() => {
    if (graphOne == null) {
      return;
    }
    const plots =
      graphOne?.plotReferenceIds?.map?.((plotReferenceId, index) => ({
        plotReferenceId,
        pythonFunctionId: graphOne?.pythonFunctionIds?.[index],
        name: graphOne?.pythonFunctionNames?.[index],
      })) || [];
    setPlots(plots);
  }, [graphOne]);

  const bodyStyleModal = useRef({ height: '80vh', width: '80vw' } as { width?; height? });

  const onDeletePlot = async (plotReferenceId) => {
    try {
      const response = await REClient_.promises_().deleteGraphFromDashboard(plotReferenceId);
      if (!response?.success || response?.error) {
        throw new Error(response?.error);
      }
      forceUpdateRefreshList();
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  const emptyMessage = <div style={{ fontFamily: 'Matter', fontSize: 18, padding: 180 }}>No Plots added, please add a plot to get started</div>;
  return (
    <div className={sd.absolute}>
      <AutoSizer>
        {({ width, height }) => {
          const widthFull = width - 160;
          const heightFull = height - 160;
          if (bodyStyleModal.current != null) {
            if (bodyStyleModal.current?.height !== heightFull + 'px') {
              bodyStyleModal.current = { height: heightFull + 'px' };
            }
          }
          return (
            <div
              css={`
                width: ${widthFull}px;
                height: ${heightFull}px;
              `}
              key={'927849389'}
            >
              <NanoScroller>
                <div
                  css={`
                    display: flex;
                    align-items: stretch;
                    justify-content: center;
                    flex-direction: column;
                  `}
                >
                  <div
                    css={`
                      display: flex;
                      justify-content: space-between;
                    `}
                  >
                    <div style={{ width: 140 }} />
                    <div
                      css={`
                        margin-top: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        max-width: 1000px;
                      `}
                    >
                      <div
                        css={`
                          font-size: 14px;
                        `}
                      >
                        Plots:
                      </div>
                      <div
                        css={`
                          margin-left: 5px;
                          width: 400px;
                        `}
                      >
                        <SelectExt options={optionsGraphsList} value={optionsGraphsList?.find((o1) => o1.value === graphDashboardId)} onChange={onChangeGraphSelectTop} />
                      </div>
                    </div>
                    <Link style={{ alignSelf: 'flex-end' }} usePointer to={[`/${PartsLink.exploratory_data_analysis_graphs_one_add_function}/${projectId}`, `isAdd=1&graphDashboardId=${encodeURIComponent(graphDashboardId || '')}`]}>
                      <Button style={{ marginRight: 64 }} type="primary">
                        Add Plot
                      </Button>
                    </Link>
                  </div>
                  <div
                    css={`
                      position: relative;
                      display: flex;
                      flex-direction: column;
                    `}
                  >
                    <div
                      css={`
                        padding: 30px;
                        position: relative;
                        display: flex;
                        gap: 20px;
                        flex-wrap: wrap;
                        justify-content: center;
                      `}
                    >
                      {graphOne && !plots?.length && emptyMessage}
                      {plots?.map?.((plot, index) => {
                        let topHH = 26;
                        let frameHH = 500;
                        let frameWW = null;
                        let showZoomButton = true;
                        if (plots?.length === 1) {
                          frameWW = widthFull - 2 * 20;
                          frameHH = heightFull - 2 * 20;
                          showZoomButton = false;
                        }
                        const frameLabel = Utils.upperFirst(plot?.name, true);
                        const calcChart = (isModal) => (
                          <EDAGraphsOneIFrame
                            key={`iframe_plots_graphs_${isModal ? 'modal_' : ''}${plot?.plotReferenceId}`}
                            plotReferenceId={plot?.plotReferenceId}
                            frameHH={isModal ? heightFull - 120 : frameHH}
                            frameWW={isModal ? '100%' : frameWW}
                            topHH={topHH}
                            label={frameLabel}
                          />
                        );

                        return (
                          <div key={`plot-${plot?.plotReferenceId}`}>
                            {calcChart(false)}
                            <div
                              css={`
                                margin-top: 3px;
                                display: flex;
                                justify-content: center;
                              `}
                            >
                              {showZoomButton && (
                                <ModalContent bodyStyle={bodyStyleModal.current} width={'80vw'} title={'Plot'} content={calcChart(true)} okText={'Close'} okType={'primary'} cancelText={null}>
                                  <Button style={{ marginRight: 4 }} type={'primary'} ghost size={'small'}>
                                    Zoom
                                  </Button>
                                </ModalContent>
                              )}
                              <Link
                                style={{ marginRight: 4 }}
                                forceSpanUse
                                usePointer
                                to={[
                                  `/${PartsLink.exploratory_data_analysis_graphs_one_add_function}/${projectId}`,
                                  `graphDashboardId=${encodeURIComponent(graphDashboardId || '')}&plotReferenceId=${encodeURIComponent(plot?.plotReferenceId || '')}&pythonFunctionId=${encodeURIComponent(plot?.pythonFunctionId || '')}`,
                                ]}
                              >
                                <Button type={'primary'} ghost size={'small'}>
                                  Edit
                                </Button>
                              </Link>
                              <ModalConfirm
                                onConfirm={() => onDeletePlot(plot?.plotReferenceId)}
                                title={`Do you want to delete this plot?`}
                                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                                okText={'Delete'}
                                cancelText={'Cancel'}
                                okType={'danger'}
                              >
                                <Button type={'primary'} ghost size={'small'}>
                                  Delete
                                </Button>
                              </ModalConfirm>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </NanoScroller>
            </div>
          );
        }}
      </AutoSizer>
    </div>
  );
});

export default EDAGraphsOne;
