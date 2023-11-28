import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import $ from 'jquery';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { useDebouncedCallback } from 'use-debounce';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { useProject } from '../../api/REUses';
import HelpBox from '../HelpBox/HelpBox';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
const s = require('./ModelPredictionsOptimization.module.css');
const sd = require('../antdUseDark.module.css');

interface IOptimizationForceOneProps {
  idValue?: string;
  num?: number;

  options?: any[];
  onChange?: (isValue, num) => void;
  onRemove?: (e) => void;
}

const OptimizationForceOne = React.memo((props: PropsWithChildren<IOptimizationForceOneProps>) => {
  const onChange = (option1) => {
    props.onChange?.(option1?.value, props.num);
  };

  const optionsTF = useMemo(() => {
    return [
      {
        label: 'True',
        value: 1,
      },
      {
        label: 'False',
        value: 0,
      },
    ];
  }, []);

  const onChangeNum = (option1) => {
    props.onChange?.(props.idValue, option1?.value);
  };

  return (
    <div
      css={`
        display: flex;
        align-items: center;
        padding-bottom: 5px;
        margin-bottom: 5px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      `}
    >
      <span
        css={`
          flex: 1;
        `}
      >
        <SelectExt autoSpeed options={props.options} value={props.options?.find((o1) => o1.value === props.idValue)} onChange={onChange} />
      </span>
      <span
        css={`
          width: 90px;
          margin-left: 5px;
        `}
      >
        <SelectExt autoSpeed options={optionsTF} value={optionsTF?.find((o1) => o1.value === props.num)} onChange={onChangeNum} />
      </span>
      {props.onRemove && (
        <span
          css={`
            width: 20px;
            margin-left: 5px;
          `}
        >
          <FontAwesomeIcon onClick={props.onRemove} icon={require('@fortawesome/pro-duotone-svg-icons/faTimesCircle').faTimesCircle} transform={{ size: 20, x: 0, y: 0 }} style={{ cursor: 'pointer' }} />
        </span>
      )}
    </div>
  );
});

interface IModelPredictionsOptimizationProps {
  selectedAlgoId?: any;
  optionsAlgo?: any;
  optionsTestDatasRes?: any;
}

const ModelPredictionsOptimization = React.memo((props: PropsWithChildren<IModelPredictionsOptimizationProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredPredict, forceUpdatePredict] = useReducer((x) => x + 1, 0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingTable, setIsRefreshingTable] = useState(false);
  const [selectedFieldValueId, setSelectedFieldValueId] = useState(null);
  const [dataTable, setDataTable] = useState([]);
  const [filterKeys, setFilterKeys] = useState(null as { [key: string]: { [subkey: string]: any } });
  const [filterKeysList, setFilterKeysList] = useState(null as string[]);
  const [filterValues, setFilterValues] = useState(null as { [key: string]: any });
  const [predStatus, setPredStatus] = useState(null);
  const [heightTop, setHeightTop] = useState(null);

  const [forcedAssignmentsList, setForcedAssignmentsList] = useState([] as { idValue?: string; num?: number }[]);

  const projectId = paramsProp?.get('projectId');

  const foundProject1 = useProject(projectId);

  let optionsTestDatasRes = props.optionsTestDatasRes;
  let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
  let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
  let testIdName = optionsTestDatasRes?.testIdName;

  const forcedAssignmentsListUsedRef = useRef(null);
  const forcedAssignmentsListUsed = useMemo(() => {
    let res = forcedAssignmentsList?.filter((f1) => !Utils.isNullOrEmpty(f1.idValue));

    if (forcedAssignmentsListUsedRef.current == null || !_.isEqual(forcedAssignmentsListUsedRef.current, res)) {
      forcedAssignmentsListUsedRef.current = res;
      return res;
    }

    return forcedAssignmentsListUsedRef.current;
  }, [forcedAssignmentsList]);

  useEffect(() => {
    if (optionsTestDatasRes?.optionsTestDatas == null) {
      setFilterKeys(null);
      setFilterKeysList(null);
      setFilterValues(null);
    } else {
      let filterKeysRes: any = {};
      optionsTestDatasRes?.optionsTestDatas?.some((i1, i1ind) => {
        let k1 = i1?.value;

        let data1 = optionsTestDatasRes?.rangeDateByTestDataId?.[k1]?.dataInternal?.data;
        let kk = Object.keys(data1 ?? {});
        kk.some((kData) => {
          if (kData === testIdName) {
            return;
          }

          //
          let v1 = data1?.[kData];

          filterKeysRes[kData] = filterKeysRes[kData] ?? {};
          filterKeysRes[kData][v1] = true;
        });
      });

      setFilterKeys(filterKeysRes);

      let filterKeysResList = Object.keys(filterKeysRes ?? {}).sort();
      setFilterKeysList(filterKeysResList);

      setFilterValues(null);
    }

    let v1 = optionsTestDatasRes?.optionsTestDatas?.[0]?.value;
    setSelectedFieldValueId((s1) => {
      if (s1 == null && v1 != null) {
        s1 = v1;
        setTimeout(() => {
          forceUpdatePredict();
        }, 100);
      }

      return s1;
    });
  }, [optionsTestDatasRes, testIdName]);

  const onChangeSelectDeployment = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let deployId = optionSel?.value;
    if (projectId && deployId) {
      Location.push('/' + PartsLink.model_predictions + '/' + projectId + '/' + deployId);
    }
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  let optionsAlgo = props.optionsAlgo;
  let optionsDeploys = props.optionsAlgo;
  let optionsDeploysSel = null;
  if (props.selectedAlgoId) {
    optionsDeploysSel = optionsAlgo?.find((o1) => o1.value === props.selectedAlgoId);
  }
  let deploymentSelect = (
    <span style={{ width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
      <SelectExt value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
    </span>
  );

  let testDatasSelectValue = optionsTestDatas && optionsTestDatas.find((o1) => o1.value === selectedFieldValueId);
  let menuPortalTarget = popupContainerForMenu(null);

  const onChangeSelectFieldValue = (option1) => {
    setSelectedFieldValueId(option1?.value);
    setFilterValues(null);
  };

  useEffect(() => {
    if (Utils.isNullOrEmpty(testIdName) || Utils.isNullOrEmpty(props.selectedAlgoId)) {
      return;
    }

    let data1: any = Utils.isNullOrEmpty(selectedFieldValueId) ? null : { [testIdName]: selectedFieldValueId };

    let kk = Object.keys(filterValues ?? {}).filter((k1) => filterValues?.[k1] != null);
    if (kk.length > 0) {
      data1 = {};
      kk.some((k1) => {
        data1[k1] = filterValues[k1];
      });
    }

    if (data1 == null) {
      return;
    }

    let dataParams: any = {};
    dataParams.data = JSON.stringify({});
    dataParams.listAssignments = JSON.stringify(data1);
    // dataParams.forcedAssignments

    if (forcedAssignmentsListUsed != null) {
      let forcedAssignments: any = {};
      forcedAssignmentsListUsed.some((f1) => {
        forcedAssignments['' + f1.idValue] = f1.num;
      });

      if (Object.keys(forcedAssignments ?? {}).length > 0) {
        dataParams.forcedAssignments = JSON.stringify(forcedAssignments);
      }
    }

    setIsRefreshingTable(true);
    REClient_.client_()._predictForUI(props.selectedAlgoId, dataParams, null, null, (err, res) => {
      setIsRefreshingTable(false);

      // console.warn(res);
      if (res?.result?.predicted != null) {
        let pred1 = res?.result?.predicted;
        setPredStatus(pred1?.status);
        setDataTable(pred1?.assignments ?? []);
      }
    });
  }, [ignoredPredict]);
  //props.selectedAlgoId, selectedFieldValueId, optionsTestDatasRes, filterValues, filterKeysList, filterKeys, forcedAssignmentsListUsed

  const columnsTable = useMemo(() => {
    let kk = Object.keys(dataTable?.[0] ?? {}).sort();
    let res = kk.map((k1) => ({ title: k1, field: k1, noAutoTooltip: true } as ITableExtColumn));

    if (res == null || res.length === 0) {
      res = [
        {
          title: '',
        },
      ] as ITableExtColumn[];
    }

    return res;
  }, [dataTable]);

  const dropdownList = useMemo(() => {
    return filterKeysList?.map((k1, k1ind) => {
      let options = Object.keys(filterKeys?.[k1] ?? {})
        .sort()
        .map((s1) => ({ label: s1, value: s1 }));
      options.unshift({ label: '(None)', value: null });

      const onChange = (option1) => {
        setFilterValues((vv) => {
          vv = { ...(vv ?? {}) };
          let v1 = option1?.value ?? null;
          if (v1 == null) {
            delete vv[k1];
          } else {
            vv[k1] = v1;
          }

          if (option1?.value != null) {
            setSelectedFieldValueId(null);
          }

          return vv;
        });
      };

      return (
        <span
          key={'dd_' + k1}
          css={`
            display: inline-block;
            margin: 5px 0 5px 20px;
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
            {k1}
          </span>
          <span
            css={`
              width: 200px;
              display: inline-block;
              margin-left: 5px;
            `}
          >
            <SelectExt options={options} value={options?.find((o1) => o1.value === (filterValues?.[k1] ?? null))} onChange={onChange} />
          </span>
        </span>
      );
    });
  }, [filterKeysList, filterKeys, filterValues]);

  const onClickAddForce = (e) => {
    setForcedAssignmentsList((list) => {
      list = [...(list ?? [])];

      list.push({
        idValue: null,
        num: 1,
      });

      return list;
    });
  };

  const onRemoveForcedOne = (f1) => {
    setForcedAssignmentsList((list) => {
      let ind1 = _.findIndex(list, (f2) => f2 === f1);
      if (ind1 > -1) {
        list = [...(list ?? [])];
        list.splice(ind1, 1);
      }

      return list;
    });
  };

  const onChangeForcedOne = (f1, idValue, num) => {
    setForcedAssignmentsList((list) => {
      let ind1 = _.findIndex(list, (f2) => f2 === f1);
      if (ind1 > -1) {
        list = [...(list ?? [])];
        list[ind1] = { ...list[ind1] };

        list[ind1].idValue = idValue;
        list[ind1].num = num;
      }

      return list;
    });
  };

  const onClickPredict = (e) => {
    forceUpdatePredict();
  };

  const topRef = useRef(null);
  const onChangeSizeWidth = useDebouncedCallback(
    (ww) => {
      setHeightTop($(topRef.current).height() + 15);
    },
    300,
    { leading: true },
  );

  return (
    <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <WindowSizeSmart onChangeSize={onChangeSizeWidth} />
      <RefreshAndProgress errorMsg={errorMsg}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <div style={{ height: height + 'px', position: 'relative' }}>
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
                <div style={{ flex: 1 }}>{deploymentSelect}</div>

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
                <div
                  css={`
                    position: absolute;
                    top: 70px;
                    left: 0;
                    right: 0;
                    height: ${height - topAfterHeaderHH}px;
                  `}
                >
                  <AutoSizer disableWidth>
                    {({ height }) => (
                      <div
                        css={`
                          height: ${height}px;
                        `}
                      >
                        <div ref={topRef} style={{ position: 'relative', textAlign: 'center', paddingTop: '10px', marginBottom: '10px' }}>
                          <div
                            css={`
                              margin-top: 14px;
                              margin-bottom: 10px;
                            `}
                          >
                            <span
                              css={`
                                margin-right: 20px;
                              `}
                            >
                              <Button onClick={onClickPredict} type={'primary'}>
                                Predict
                              </Button>
                            </span>

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
                              {optionsTestDatasRes?.testIdName || (foundProject1 ? foundProject1.name : null) || 'Item ID'}
                            </span>
                            <span style={{ width: '300px', display: 'inline-block' }}>
                              <SelectExt allowCreate={true} value={testDatasSelectValue} options={optionsTestDatas} onChange={onChangeSelectFieldValue} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                            </span>

                            {dropdownList}
                          </div>
                        </div>

                        <div
                          css={`
                            position: absolute;
                            top: ${10 + (heightTop ?? 100)}px;
                            left: 0;
                            right: 0;
                          `}
                        >
                          <div
                            css={`
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              font-size: 15px;
                              padding-top: 9px;
                            `}
                          >
                            <span>Predicted Status:</span>
                            <span
                              css={`
                                margin-left: 5px;
                              `}
                            >
                              {predStatus ?? '-'}
                            </span>
                          </div>
                        </div>

                        <div
                          css={`
                            position: absolute;
                            top: ${50 + 10 + (heightTop ?? 100)}px;
                            left: 0;
                            right: 0;
                            bottom: 0;
                          `}
                        >
                          <AutoSizer disableWidth>
                            {({ height }) => (
                              <div
                                css={`
                                  height: ${height}px;
                                  position: relative;
                                `}
                              >
                                <RefreshAndProgress msgMsg={isRefreshingTable ? 'Processing...' : undefined} msgTop={10} isDim={isRefreshingTable ? true : undefined}>
                                  {/*// @ts-ignore */}
                                  <SplitPane
                                    primary={'second'}
                                    split={'vertical'}
                                    minSize={200}
                                    defaultSize={Utils.dataNum('optimization_preddash_force', 300)}
                                    onChange={(v1) => {
                                      Utils.dataNum('optimization_preddash_force', undefined, v1);
                                    }}
                                  >
                                    <div
                                      css={`
                                        margin-right: 18px;
                                      `}
                                    >
                                      <TableExt height={height} dataSource={dataTable} columns={columnsTable} />
                                    </div>
                                    <div css={``}>
                                      <NanoScroller onlyVertical>
                                        <div
                                          css={`
                                            font-size: 15px;
                                            text-align: center;
                                            margin-bottom: 10px;
                                          `}
                                        >
                                          Forced Assignments
                                        </div>

                                        <div
                                          css={`
                                            text-align: center;
                                            margin-top: 10px;
                                          `}
                                        >
                                          {forcedAssignmentsList?.map((f1, f1ind) => {
                                            return (
                                              <OptimizationForceOne options={optionsTestDatas} key={'f' + f1ind} idValue={f1.idValue} num={f1.num} onChange={onChangeForcedOne.bind(null, f1)} onRemove={onRemoveForcedOne.bind(null, f1)} />
                                            );
                                          })}
                                          <Button onClick={onClickAddForce} type={'primary'}>
                                            Add
                                          </Button>
                                        </div>
                                      </NanoScroller>
                                    </div>
                                  </SplitPane>
                                </RefreshAndProgress>
                              </div>
                            )}
                          </AutoSizer>
                        </div>
                      </div>
                    )}
                  </AutoSizer>
                </div>
              )}
            </div>
          )}
        </AutoSizer>
      </RefreshAndProgress>
    </div>
  );
});

export default ModelPredictionsOptimization;
