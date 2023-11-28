import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import Popover from 'antd/lib/popover';
import * as Immutable from 'immutable';
import * as _ from 'lodash';
import * as React from 'react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import UtilsTS from '../../UtilsTS';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import defDatasets from '../../stores/reducers/defDatasets';
import featureGroups from '../../stores/reducers/featureGroups';
import projectDatasets from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import { EditorElemPreview, EditorElemPreviewGrid } from '../EditorElem/EditorElem';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import FeatureGroupSchema from '../FeatureGroupSchema/FeatureGroupSchema';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NanoScroller from '../NanoScroller/NanoScroller';
import { IconDatasets } from '../NavLeft/utils';
import PartsLink from '../NavLeft/PartsLink';
import TooltipExt from '../TooltipExt/TooltipExt';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
import FGLineageDiagram from './FGLineageDiagram/FGLineageDiagram';
const s = require('./FeatureGroupsExplorer.module.css');
const sd = require('../antdUseDark.module.css');

const FeatureGroupsExplorer = React.memo(() => {
  const { paramsProp, projectDatasetsParam, defDatasetsParam, datasetsParam, projectsParam, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    projectsParam: state.projects,
    featureGroupsParam: state.featureGroups,
    datasetsParam: state.datasets,
    projectDatasetsParam: state.projectDatasets,
    defDatasetsParam: state.defDatasets,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [winHH, setWinHH] = useState(null);
  const [itemSelFeatureGroupId, setItemSelFeatureGroupId] = useState(null);
  const [itemSelSql, setItemSelSql] = useState(null);
  const [itemSelSqlOri, setItemSelSqlOri] = useState(null);
  const [itemSelPreviewData, setItemSelPreviewData] = useState(null);
  const refEditorSql = useRef(null);
  const refDiagram = useRef(null);
  const [isDisableChange, setIsDisableChange] = useState(false);
  const [filterTableName, setFilterTableName] = useState('');
  const [tableName, setTableName] = useState('');

  const projectId = paramsProp?.get('projectId');
  const useFeatureGroupId = paramsProp?.get('useFeatureGroupId');
  const useDatasetId = paramsProp?.get('useDatasetId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const onChangeWinSize = (ww, hh) => {
    setWinHH(hh);
  };

  useEffect(() => {
    projectDatasets.memDatasetsByProjectId(true, undefined, projectId);
  }, [projectDatasetsParam, projectId]);
  const datasetsList = useMemo(() => {
    return projectDatasets.memDatasetsByProjectId(false, undefined, projectId);
  }, [projectDatasetsParam, projectId]);

  const datasetListIds = useMemo(() => {
    let res = datasetsList?.map((d1) => d1?.dataset?.datasetId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
    res = res?.sort((a, b) => {
      return (a?.dataset?.name || '').localeCompare(b?.dataset?.name || '');
    });
    return res;
  }, [datasetsList]);

  useEffect(() => {
    if (projectId && datasetListIds?.length > 0) {
      datasetListIds?.some((id1) => {
        defDatasets.memDatasetSchema(true, defDatasetsParam, projectId, id1);
      });
    }
  }, [datasetListIds, projectId, defDatasetsParam]);
  const schemaDatasetDict = useMemo(() => {
    if (projectId && datasetListIds?.length > 0) {
      let res = {};
      datasetListIds?.some((id1) => {
        let r1 = defDatasets.memDatasetSchema(false, defDatasetsParam, projectId, id1);
        if (r1 && Immutable.isImmutable(r1)) {
          r1 = r1.toJS();
        }
        res[id1] = r1;
      });
      return res;
    }
  }, [datasetListIds, projectId, defDatasetsParam]);

  const doSelFG = (fg1) => {
    setItemSelFeatureGroupId(fg1?.featureGroupId);
    setItemSelSql(fg1?.sql);
    setItemSelSqlOri(fg1?.sql);
    setItemSelPreviewData(null);
  };

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const featuresGroupLineageData = useMemo(() => {
    return featureGroups.memFeatureGroupLineageForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupLineageForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const onClickLeft = (fg1, e) => {
    if (fg1?.isFilter) {
      return;
    }

    if (fg1?.isDataset) {
      Location.push('/' + paramsProp?.get('mode') + '/' + projectId, undefined, 'useDatasetId=' + encodeURIComponent(fg1?.dataset?.datasetId ?? ''));
    } else {
      Location.push('/' + paramsProp?.get('mode') + '/' + projectId, undefined, 'useFeatureGroupId=' + encodeURIComponent(fg1?.featureGroupId ?? ''));
    }
  };

  useEffect(() => {
    const fg1 = Utils.isNullOrEmpty(useFeatureGroupId) ? null : featuresGroupsList?.find((f1) => f1?.featureGroupId === useFeatureGroupId);
    doSelFG(fg1);
  }, [useFeatureGroupId, featuresGroupsList]);

  const isDiagram = Utils.isNullOrEmpty(useFeatureGroupId) && Utils.isNullOrEmpty(useDatasetId);

  const selectedFG = isDiagram ? null : featuresGroupsList?.find((f1) => f1?.featureGroupId === useFeatureGroupId);
  const selectedDS = isDiagram ? null : datasetsList?.find((d1) => d1?.dataset?.datasetId === useDatasetId);

  const onClickDetachFG = (e) => {
    if (useFeatureGroupId) {
      REClient_.client_().removeFeatureGroupFromProject(useFeatureGroupId, projectId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.validateProjectDatasetsReset_();
          StoreActions.getProjectDatasets_(projectId, (res, ids) => {
            StoreActions.listDatasets_(ids);
          });
          StoreActions.featureGroupsGetByProject_(projectId, (list) => {
            list?.some((f1) => {
              StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
            });
          });

          Location.push('/' + paramsProp?.get('mode') + '/' + projectId);
        }
      });
    }
  };

  const onClickFormatSQL = (e) => {
    refEditorSql.current?.doFormat();
  };

  const onClickPreviewSQL = (e) => {
    if (refEditorSql.current == null) {
      return;
    }

    setIsDisableChange(true);
    refEditorSql.current
      ?.doPreview(undefined, (v1) => {
        if (v1) {
          setItemSelSql(v1);
        }
      })
      .then(() => {
        setIsDisableChange(false);
      });
  };

  const doSave = (cbFinish) => {
    REClient_.client_().updateFeatureGroupSqlDefinition(useFeatureGroupId, itemSelSql, (err, res) => {
      if (err || !res?.success) {
        if (res?.sqlError) {
          cbFinish?.(res?.sqlError);
        } else {
          cbFinish?.();
          REActions.addNotificationError(err || Constants.errorDefault);
        }
      } else {
        cbFinish?.();
        if (projectId == null) {
          //
        } else {
          StoreActions.getProjectDatasets_(projectId, (res, ids) => {
            StoreActions.listDatasets_(ids);
          });
          StoreActions.featureGroupsGetByProject_(projectId, (list) => {
            list?.some((f1) => {
              StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
            });
          });
        }
      }
    });
  };

  const onClickRevertSQL = (e) => {
    setItemSelSqlOri((v1) => {
      setItemSelSql(v1);

      return v1;
    });
  };

  const onClickValidateSQL = (e) => {
    if (refEditorSql.current == null) {
      return;
    }

    setIsDisableChange(true);
    refEditorSql.current?.doValidate().then((isOk) => {
      setIsDisableChange(false);
      if (isOk) {
        REActions.addNotification('Ok!');
      } else {
        REActions.addNotificationError('Error');
      }
    });
  };

  const onClickSaveSQL = (e) => {
    if (refEditorSql.current == null) {
      return;
    }

    setIsDisableChange(true);
    refEditorSql.current?.doProcessing('Saving...', () => {
      return new Promise((resolve) => {
        doSave((err) => {
          setIsDisableChange(false);
          resolve(err);
        });
      });
    });
  };

  const onChangeEditor = (value) => {
    setItemSelSql(value);
  };

  const onChangeFilterTableName = (e) => {
    setFilterTableName(e.target.value);
  };

  useEffect(() => {
    let ids = featuresGroupsList?.map((f1) => f1?.featureGroupId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
    if (ids == null || ids.length === 0 || !projectId) {
      return;
    }

    ids.some((id1) => {
      featureGroups.memFeatureGroupsForId(true, projectId, id1);
    });
  }, [featuresGroupsList, projectId]);
  const fgDict = useMemo(() => {
    let ids = featuresGroupsList?.map((f1) => f1?.featureGroupId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
    if (ids == null || ids.length === 0 || !projectId) {
      return {};
    }

    let res: any = {};
    ids.some((id1) => {
      let f1 = featureGroups.memFeatureGroupsForId(false, projectId, id1);
      if (f1 != null) {
        res[id1] = f1;
      }
    });
    return res;
  }, [featuresGroupsList, projectId]);

  const listLeft = useMemo(() => {
    let list = featuresGroupsList ?? [];

    list = list?.map((f1) => ({ ...f1, isFeatureGroup: true }));

    list = list.sort((a, b) => {
      return (a?.tableName || '').localeCompare(b?.tableName || '');
    });

    if (_.trim(filterTableName || '') !== '') {
      let listFG = list.filter((f1) => Utils.searchIsTextInside(f1?.tableName?.toLowerCase(), filterTableName));
      let listSchema =
        filterTableName?.length < 3
          ? null
          : _.flatten(
              list
                .map((f1) => {
                  let scheme1 = fgDict?.[f1?.featureGroupId ?? '-'];
                  if (scheme1) {
                    let cc = scheme1?.projectFeatureGroupSchema?.schema?.filter((s1) => Utils.searchIsTextInside(s1?.name?.toLowerCase(), filterTableName));
                    if (cc != null && cc.length > 0) {
                      return cc.slice(0, 10).map((c1) => {
                        f1 = { ...f1 };
                        f1.foundInColumn = c1;
                        return f1;
                      });
                    }
                  }
                  return null;
                })
                .filter((v1) => v1 != null),
            );

      let resList: any = [{ isFilter: true }];
      if (listFG != null && listFG.length > 0) {
        resList.push({ isSpace: true, name: 'Found In TableNames:' });
        resList = [...resList, ...listFG];
      }
      if (listSchema != null && listSchema.length > 0) {
        resList.push({ isSpace: true, name: 'Found In Columns:' });
        resList = [...resList, ...listSchema];
      } else if (filterTableName?.length < 3) {
        resList.push({ isSpace: true, name: 'For Columns search write more' });
      }
      return resList;
    }

    //Datasets
    let datasetsRes = [];
    if (datasetsList && datasetsList.length > 0) {
      datasetsRes = datasetsList.map((d1) => {
        return { ...d1, isDataset: true };
      });
    }

    //
    let res: any = [{ isFilter: true }, { isDiagram: true }];

    if (datasetsRes != null && datasetsRes.length > 0) {
      res.push({ isSpace: true, name: 'Datasets' });
      res = [...res, ...datasetsRes];
    }

    if (list != null && list.length > 0) {
      res.push({ isSpace: true, name: 'Feature Groups' });
      res = [...res, ...list];
    }

    return res;
  }, [featuresGroupsList, filterTableName, fgDict, datasetsList, schemaDatasetDict]);

  const onChangeTableNameNew = (e) => {
    setTableName(e.target.value);
  };

  const popupContainerForMenu = (node) => document.getElementById('body2');

  const onClickStop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const previewRef = useRef({
    previewData: itemSelPreviewData,
    setPreviewData: (newValue) => {
      previewRef.current = { ...previewRef.current };
      previewRef.current.previewData = newValue;
      setItemSelPreviewData(newValue);
    },
  });

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
      <WindowSizeSmart onChangeSizeBoth={onChangeWinSize} />

      {/*// @ts-ignore*/}
      <SplitPane
        split={'vertical'}
        minSize={80}
        defaultSize={Utils.dataNum('fge_left_ww', 300)}
        onChange={(v1) => {
          Utils.dataNum('fge_left_ww', undefined, v1);
        }}
      >
        <div
          css={`
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border-radius: 4px;
            overflow: hidden;
          `}
          className={sd.grayPanel + ' ' + (isDisableChange ? sd.pointerEventsNone : '')}
        >
          <NanoScroller onlyVertical>
            {listLeft?.map((f1, index) => {
              let countFrom = 0,
                countTo = 0;

              countFrom = f1?.sourceTableInfos?.length ?? 0;
              featuresGroupsList?.some((f2, f2ind) => {
                if (f2 === f1) {
                  return;
                }

                let tn1 = f1?.tableName;
                if (tn1) {
                  if (f2?.sourceTableInfos?.find((v1) => v1.sourceTable?.toLowerCase() === tn1?.toLowerCase())) {
                    countTo++;
                  }
                }
              });

              let isSelThis = false;
              if (f1?.isFeatureGroup) {
                isSelThis = f1?.featureGroupId === itemSelFeatureGroupId;
              }
              if (f1?.isDataset) {
                isSelThis = f1?.dataset?.datasetId === useDatasetId;
              }
              if (f1.isDiagram) {
                isSelThis = isDiagram;
              } else if (f1.isFilter || f1.isSpace) {
                isSelThis = false;
              }

              const isText = !f1.isSpace && !f1.isDiagram;

              let noSqlEdit = false;

              let sqlEditorFG1 = null,
                dataTypeEditorFG1 = null;
              if (isText) {
                dataTypeEditorFG1 = (
                  <div
                    css={`
                      width: 500px;
                      margin: 14px;
                    `}
                  >
                    <div
                      css={`
                        width: 500px;
                      `}
                      className={sd.grayPanel}
                    >
                      <FeatureGroupSchema datasetId={f1?.dataset?.datasetId} defaultFilter={f1.foundInColumn?.name} projectId={projectId} featureGroupId={f1?.featureGroupId} height={500} />
                    </div>
                  </div>
                );

                if (!Utils.isNullOrEmpty(f1?.sql)) {
                  sqlEditorFG1 = (
                    <div
                      css={`
                        width: 700px;
                        margin: 14px;
                      `}
                    >
                      <EditorElemPreview.Provider value={{ previewData: null, setPreviewData: (newValue) => {} }}>
                        <EditorElemForFeatureGroup key={'editor_in_' + (f1?.featureGroupId ?? '')} readonly useSameSpace value={f1?.sql} height={300} />
                      </EditorElemPreview.Provider>
                    </div>
                  );
                } else {
                  noSqlEdit = true;
                }
              }

              let tableName1 = f1?.tableName ?? f1?.name ?? f1?.dataset?.featureGroupTableName;

              let noSchemaEdit = true;
              if (countTo === 0 || f1.isDataset) {
                noSchemaEdit = false;
              }
              if (f1.isDataset) {
                noSqlEdit = true;
              }

              let res = (
                <div
                  key={'fgLeft_' + index}
                  onClick={f1.isSpace ? null : onClickLeft.bind(null, f1)}
                  css={`
                    ${f1.name == null && f1.isSpace ? 'line-height: 1px; ' : ''} border-bottom: 1px solid #333;
                    padding: ${f1.isSpace ? 3 : 8}px 8px;
                    cursor: ${f1.isSpace ? 'default' : 'pointer'};
                    background: ${isSelThis ? '#467a42' : f1.isDiagram ? 'rgba(255,255,255,0.1); ' : 'transparent'};
                    &:hover {
                      background: ${f1.isSpace ? 'transparent' : isSelThis ? '#467a42' : '#567255'};
                    }
                  `}
                  className={sd.ellipsis}
                >
                  {!f1.isFilter && (
                    <div
                      css={`
                        display: ${isText ? 'flex' : 'block; text-align: center;'};
                        align-items: center;
                      `}
                    >
                      {!f1.isDiagram && !f1.isFilter && !f1.isSpace && (
                        <span
                          css={`
                            margin-right: 8px;
                            opacity: 0.7;
                          `}
                        >
                          <TooltipExt title={'From Tables: ' + countFrom}>
                            <span
                              css={`
                                margin-right: 5px;
                                width: 7px;
                                display: inline-block;
                                text-align: center;
                              `}
                            >
                              {f1.isDataset ? '' : countFrom ?? 0}
                            </span>
                          </TooltipExt>
                          <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowCircleRight').faArrowCircleRight} transform={{ size: 16, x: -1, y: 0 }} style={{ opacity: 0.6 }} />
                          <TooltipExt title={'To Tables: ' + countTo}>
                            <span
                              css={`
                                margin-left: 4px;
                                width: 7px;
                                display: inline-block;
                                text-align: center;
                              `}
                            >
                              {countTo ?? 0}
                            </span>
                          </TooltipExt>
                        </span>
                      )}
                      {!f1.isSpace && !isText && (
                        <div
                          css={`
                            flex: 1;
                          `}
                          className={sd.ellipsis}
                        >
                          {tableName1}
                        </div>
                      )}
                      {isText && (
                        <div
                          css={`
                            flex: 1;
                            display: flex;
                            align-items: center;
                            overflow: hidden;
                          `}
                        >
                          <div
                            css={`
                              flex: 1;
                              margin-right: 6px;
                            `}
                            className={sd.ellipsis}
                          >
                            {UtilsTS.highlightIsTextInside(tableName1, filterTableName)}
                          </div>
                          <div
                            css={`
                              display: flex;
                              align-items: center;
                              justify-content: center;
                            `}
                            onMouseDown={onClickStop}
                            onClick={onClickStop}
                          >
                            <TooltipExt title={null /*'Schema'*/}>
                              <Popover getPopupContainer={popupContainerForMenu} overlayClassName={sd.popback} placement="right" title={(tableName1 ?? '') + ' - Schema'} content={dataTypeEditorFG1} trigger={noSchemaEdit ? '' : 'click'}>
                                <span
                                  onMouseDown={onClickStop}
                                  onClick={onClickStop}
                                  css={`
                                    opacity: ${noSchemaEdit ? 0.3 : 1};
                                    border-radius: 50%;
                                    cursor: ${noSchemaEdit ? '' : 'pointer'};
                                    width: 22px;
                                    height: 22px;
                                    padding: 4px;
                                    border: 1px solid #ccc;
                                    &:hover {
                                      background: rgba(255, 255, 255, 0.2);
                                    }
                                  `}
                                >
                                  <FontAwesomeIcon
                                    css={`
                                      ${noSchemaEdit ? 'cursor: no-drop;' : ''}
                                    `}
                                    icon={IconDatasets}
                                    transform={{ size: 14, x: 0.5, y: -1 }}
                                  />
                                </span>
                              </Popover>
                            </TooltipExt>
                          </div>
                          <div
                            css={`
                              margin-left: 6px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                            `}
                            onMouseDown={onClickStop}
                            onClick={onClickStop}
                          >
                            <TooltipExt title={null /*'SQL'*/}>
                              <Popover getPopupContainer={popupContainerForMenu} overlayClassName={sd.popback} placement="right" title={(tableName1 ?? '') + ' - SQL'} content={sqlEditorFG1} trigger={noSqlEdit ? '' : 'click'}>
                                <span
                                  onMouseDown={onClickStop}
                                  onClick={onClickStop}
                                  css={`
                                    opacity: ${noSqlEdit ? 0.3 : 1};
                                    border-radius: 50%;
                                    cursor: ${noSqlEdit ? '' : 'pointer'};
                                    width: 22px;
                                    height: 22px;
                                    padding: 4px;
                                    border: 1px solid #ccc;
                                    &:hover {
                                      background: rgba(255, 255, 255, 0.2);
                                    }
                                  `}
                                >
                                  <FontAwesomeIcon
                                    css={`
                                      ${noSqlEdit ? 'cursor: no-drop;' : ''}
                                    `}
                                    icon={require('@fortawesome/pro-regular-svg-icons/faCode').faCode}
                                    transform={{ size: 14, x: -0.5, y: -1 }}
                                  />
                                </span>
                              </Popover>
                            </TooltipExt>
                          </div>
                        </div>
                      )}
                      {f1.isSpace && (
                        <span
                          css={`
                            display: inline-block;
                            padding: 2px 0 3px;
                            font-size: 10px;
                            color: rgba(255, 255, 255, 0.8);
                          `}
                        >
                          {f1.name}
                        </span>
                      )}
                      {f1.isDiagram && (
                        <span>
                          <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faProjectDiagram').faProjectDiagram} transform={{ size: 16, x: 0, y: 0 }} style={{ opacity: 0.6, marginRight: '5px' }} />
                          View Diagram
                        </span>
                      )}
                    </div>
                  )}
                  {f1.foundInColumn != null && (
                    <div
                      css={`
                        font-size: 12px;
                        text-align: center;
                        opacity: 0.8;
                      `}
                    >
                      Col:&nbsp;{UtilsTS.highlightIsTextInside(f1.foundInColumn?.name, filterTableName)}
                    </div>
                  )}
                  {f1.isFilter && (
                    <div>
                      <div>
                        <Input placeholder={'Filter by table or columns'} value={filterTableName} onChange={onChangeFilterTableName} allowClear={true} />
                      </div>
                      <div
                        css={`
                          font-size: 10px;
                          text-align: center;
                          opacity: 0.7;
                          margin-top: 2px;
                        `}
                      >
                        Separate words by spaces
                      </div>
                    </div>
                  )}
                </div>
              );
              return res;
            })}
          </NanoScroller>
        </div>
        <div>
          {isDiagram && <FGLineageDiagram featuresGroupLineageData={featuresGroupLineageData} projectId={projectId} />}
          {!isDiagram && (
            <div
              css={`
                position: absolute;
                top: 0;
                left: 0;
                right: 10px;
                bottom: 0;
              `}
            >
              <AutoSizer disableWidth>
                {({ height }) => {
                  const topHH = 70,
                    bottomHH = 70;

                  let countFrom = [],
                    countTo = [];

                  featuresGroupsList?.some((f2, f2ind) => {
                    if (f2 === selectedFG) {
                      return;
                    }
                    if (!selectedFG?.sourceTableInfos.find((v1) => v1?.sourceTable?.toLowerCase() === (f2.tableName ?? '-')?.toLowerCase())) {
                      return;
                    }

                    countFrom.push({ name: f2?.tableName, id: f2?.featureGroupId });
                  });
                  datasetsList?.some((d1) => {
                    if (!selectedFG?.sourceTableInfos.find((v1) => v1?.sourceTable?.toLowerCase() === (d1.dataset?.featureGroupTableName ?? '-')?.toLowerCase())) {
                      return;
                    }

                    countFrom.push({ name: d1.dataset?.featureGroupTableName, id: d1?.dataset?.datasetId, isDataset: true });
                  });

                  featuresGroupsList?.some((f2, f2ind) => {
                    if (f2 === selectedFG) {
                      return;
                    }

                    let tn1 = selectedFG?.tableName;
                    if (tn1) {
                      if (f2?.sourceTableInfos?.find((v1) => v1?.sourceTable?.toLowerCase() === tn1?.toLowerCase()) && f2?.tableName) {
                        countTo.push({ name: f2?.tableName, id: f2?.featureGroupId });
                      }
                    }
                  });

                  if (countFrom?.length === 0) {
                    countFrom = null;
                  }
                  if (countTo?.length === 0) {
                    countTo = null;
                  }

                  const calcExtraParam = (s1) => {
                    if (s1?.isDataset) {
                      return 'useDatasetId=' + encodeURIComponent(s1.id);
                    } else {
                      return 'useFeatureGroupId=' + encodeURIComponent(s1.id);
                    }
                  };

                  let emptySql = !Utils.isNullOrEmpty(selectedFG?.sql);
                  return (
                    <EditorElemPreview.Provider value={previewRef.current}>
                      {/*// @ts-ignore*/}
                      <SplitPane
                        split={'horizontal'}
                        minSize={Math.trunc((height / 7) * 3)}
                        defaultSize={Utils.dataNum('fge_code_hh', Math.trunc((height / 7) * 4))}
                        onChange={(v1) => {
                          Utils.dataNum('fge_code_hh', undefined, v1);
                        }}
                      >
                        <div
                          css={`
                            position: absolute;
                            top: 10px;
                            left: 0;
                            right: 0;
                            bottom: 20px;
                            border-radius: 4px;
                          `}
                          className={sd.grayPanel}
                        >
                          <div
                            css={`
                              height: 30px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              font-size: 14px;
                            `}
                          >
                            {selectedFG != null && (
                              <span
                                css={`
                                  opacity: 0.8;
                                  margin-right: 5px;
                                `}
                              >
                                FG Id:
                              </span>
                            )}
                            {selectedFG != null && (
                              <span
                                css={`
                                  opacity: 0.8;
                                  margin-right: 20px;
                                `}
                              >
                                <CopyText>{selectedFG?.featureGroupId}</CopyText>
                              </span>
                            )}

                            <span
                              css={`
                                opacity: 0.8;
                                margin-right: 5px;
                              `}
                            >
                              Tablename:
                            </span>
                            <span>
                              {useFeatureGroupId && (selectedFG?.tableName ?? selectedFG?.tablename ?? selectedFG?.name)}
                              {useDatasetId && selectedDS?.dataset?.featureGroupTableName}
                            </span>
                          </div>
                          {
                            <div
                              css={`
                                height: 30px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 14px;
                                opacity: 0.8;
                              `}
                            >
                              {(countFrom?.length || useFeatureGroupId) && (
                                <>
                                  <span
                                    css={`
                                      opacity: 0.8;
                                      margin-right: 5px;
                                    `}
                                  >
                                    From Table{countFrom?.length > 1 ? 's' : ''}:
                                  </span>
                                  <span>
                                    {countFrom?.map((s1, s1ind) => (
                                      <span key={'s' + s1ind}>
                                        {s1ind > 0 ? <span>, </span> : null}
                                        <Link useUnderline to={['/' + PartsLink.feature_groups_explorer + '/' + projectId, calcExtraParam(s1)]}>
                                          <span>{s1.name}</span>
                                        </Link>
                                      </span>
                                    )) ?? '-'}
                                  </span>
                                </>
                              )}
                              <span
                                css={`
                                  flex: 0 40px;
                                `}
                              ></span>
                              {(countTo?.length || useFeatureGroupId) && (
                                <>
                                  <span
                                    css={`
                                      opacity: 0.8;
                                      margin-right: 5px;
                                    `}
                                  >
                                    To Table{countTo?.length > 1 ? 's' : ''}:
                                  </span>
                                  <span>
                                    {countTo?.map((s1, s1ind) => (
                                      <span key={'s' + s1ind}>
                                        {s1ind > 0 ? <span>, </span> : null}
                                        <Link useUnderline to={['/' + PartsLink.feature_groups_explorer + '/' + projectId, calcExtraParam(s1)]}>
                                          <span>{s1.name}</span>
                                        </Link>
                                      </span>
                                    )) ?? '-'}
                                  </span>
                                </>
                              )}
                            </div>
                          }

                          <div
                            css={`
                              position: absolute;
                              top: ${topHH}px;
                              left: 0;
                              right: 0;
                              bottom: ${bottomHH}px;
                            `}
                          >
                            {!selectedDS && emptySql && (
                              <AutoSizer disableWidth>
                                {({ height }) => {
                                  return (
                                    <EditorElemForFeatureGroup
                                      key={'editor_' + (selectedFG?.featureGroupId ?? '')}
                                      showSmallHelp
                                      useSameSpace
                                      value={itemSelSql}
                                      onChange={onChangeEditor}
                                      projectId={projectId}
                                      featureGroupId={itemSelFeatureGroupId}
                                      refEditor={refEditorSql}
                                      height={height}
                                    />
                                  );
                                }}
                              </AutoSizer>
                            )}
                          </div>

                          <div
                            css={`
                              position: absolute;
                              left: 0;
                              right: 0;
                              height: ${bottomHH}px;
                              bottom: 0;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                            `}
                          >
                            {!!useFeatureGroupId && emptySql && (
                              <ModalConfirm
                                onConfirm={onClickDetachFG}
                                title={`Do you want to detach the Feature Group from the project?`}
                                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                                okText={'Detach'}
                                cancelText={'Cancel'}
                                okType={'danger'}
                              >
                                <Button
                                  danger
                                  type={'default'}
                                  ghost
                                  css={`
                                    margin-right: 10px;
                                  `}
                                >
                                  Detach from Project
                                </Button>
                              </ModalConfirm>
                            )}

                            {!selectedDS && emptySql && (
                              <span
                                css={`
                                  width: 30px;
                                `}
                              ></span>
                            )}
                            {!selectedDS && emptySql && (
                              <Button
                                onClick={onClickFormatSQL}
                                type={'default'}
                                ghost
                                css={`
                                  margin-right: 10px;
                                `}
                              >
                                Format SQL
                              </Button>
                            )}
                            {!selectedDS && emptySql && (
                              <Button
                                onClick={onClickPreviewSQL}
                                type={'default'}
                                ghost
                                css={`
                                  margin-right: 10px;
                                `}
                              >
                                Preview
                              </Button>
                            )}

                            {!selectedDS && emptySql && (
                              <span
                                css={`
                                  width: 10px;
                                `}
                              ></span>
                            )}
                            {!selectedDS && emptySql && (
                              <Button
                                onClick={onClickRevertSQL}
                                type={'default'}
                                ghost
                                css={`
                                  margin-right: 10px;
                                `}
                              >
                                Revert
                              </Button>
                            )}
                            {!selectedDS && emptySql && (
                              <Button
                                onClick={onClickValidateSQL}
                                ghost
                                type={'default'}
                                css={`
                                  margin-right: 10px;
                                `}
                              >
                                Validate
                              </Button>
                            )}
                            {!selectedDS && emptySql && (
                              <Button
                                onClick={onClickSaveSQL}
                                type={'primary'}
                                css={`
                                  margin-right: 10px;
                                `}
                              >
                                Save
                              </Button>
                            )}
                          </div>
                        </div>

                        <div
                          css={`
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 10px;
                            border-radius: 4px;
                          `}
                          className={sd.grayPanel}
                        >
                          <NanoScroller onlyVertical>
                            {!selectedDS && emptySql && <EditorElemPreviewGrid />}
                            <div
                              css={`
                                height: 20px;
                              `}
                            >
                              &nbsp;
                            </div>
                          </NanoScroller>
                        </div>
                      </SplitPane>
                    </EditorElemPreview.Provider>
                  );
                }}
              </AutoSizer>
            </div>
          )}
        </div>
      </SplitPane>
    </div>
  );
});

export default FeatureGroupsExplorer;
