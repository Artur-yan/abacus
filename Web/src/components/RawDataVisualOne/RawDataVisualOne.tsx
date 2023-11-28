import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import BarGauge from 'devextreme-react/bar-gauge';
import { Font, Label, Scale, Title } from 'devextreme-react/circular-gauge';
import { Column, DataGrid, Export, FilterBuilderPopup, FilterPanel, FilterRow, GroupPanel, Grouping, HeaderFilter, RowDragging, Scrolling, SearchPanel } from 'devextreme-react/data-grid';
import * as Immutable from 'immutable';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Icon from 'react-icons-kit';
import { ic_filter_list } from 'react-icons-kit/md/ic_filter_list';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { calcFileDataUseByDatasetIdProjectId, calcFileSchemaByDatasetId } from '../../stores/reducers/defDatasets';
import projectDatasets from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import NanoScroller from '../NanoScroller/NanoScroller';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./RawDataVisualOne.module.css');
const sd = require('../antdUseDark.module.css');

const espWW = 20;
const LeftBarWW = 210;
const backBlueDark = '#101720';

interface IColOne {
  isHidden?: boolean;
  isGroup?: boolean;
  name?: string;
  dataType?: string | 'number' | 'string' | 'datetime';
}

interface IRawDataVisualOneJoinsGridProps {
  datasetId?: string;
  datasetsList?: any[];
  columnsByDatasetId?: { [id: string]: IColOne[] };

  selectedData?: any;
  selectDatasetId?: string;
  selectColumn?: string;
  selectTablename?: string;
}

const JoinsGrid = React.memo((props: PropsWithChildren<IRawDataVisualOneJoinsGridProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));

  const [dataList, setDataList] = useState(null);

  const projectId = paramsProp?.get('projectId');

  const columns = useMemo(() => {
    return props.columnsByDatasetId?.[props.selectDatasetId];
  }, [props.columnsByDatasetId, props.selectDatasetId]);

  const columnsList = useMemo(() => {
    let cols = columns;
    if (cols) {
      let res = [];
      cols?.some((c1) => {
        if (c1.isHidden) {
          return;
        }

        const name1 = c1.name;
        res.push(<Column key={'col' + name1} name={name1} dataField={name1} dataType={c1.dataType} />);
      });
      return res;
    }
  }, [columns]);

  const filterValue = useMemo(() => {
    if (props.selectedData != null && props.selectColumn != null) {
      return props.selectedData[props.selectColumn];
    }
  }, [props.selectColumn, props.selectedData]);

  useEffect(() => {
    if (filterValue == null) {
      return;
    }

    let s1 = '';
    if (_.isNumber(filterValue)) {
      s1 = '' + filterValue;
    } else {
      s1 = '"' + filterValue + '"';
    }
    let sql1 = `select * from ${props.selectTablename} where ${props.selectColumn} = ${s1}`;
    let filters1 = null;

    setDataList(null);
    REClient_.client_().get_dataset_data(projectId, props.selectDatasetId, null, 0, 100, 0, 9999, filters1, sql1, null, null, null, null, null, (err, res) => {
      if (err || !res?.success) {
        setDataList(null);
      } else {
        let resData = [];
        res?.result?.data?.some((d1) => {
          let r1 = {};
          columns?.some((c1, c1ind) => {
            r1[c1.name] = d1?.[c1ind];
          });
          resData.push(r1);
        });
        setDataList(resData);
      }
    });
  }, [props.selectDatasetId, filterValue, columns]);

  return (
    <div
      css={`
        height: 200px;
      `}
    >
      {/*// @ts-ignore*/}
      <DataGrid dataSource={dataList} allowColumnReordering={true} showBorders={true} height={200} allowColumnResizing={true} columnResizingMode={'widget'} selection={{ mode: 'single' }}>
        <Scrolling mode="virtual" />

        {columnsList}
      </DataGrid>
    </div>
  );
});

interface IRawDataVisualOneLeftBarProps {
  columns?: IColOne[];
  onColumnsChange?: (columns: IColOne[]) => void;
}

const LeftBar = React.memo((props: PropsWithChildren<IRawDataVisualOneLeftBarProps>) => {
  const gridNonGroup = useRef(null);
  const gridGroup = useRef(null);
  const [filterText, setFilterText] = useState('');

  const columnsGroup = useMemo(() => {
    return props.columns?.filter((c1) => c1.isGroup) ?? [];
  }, [props.columns]);
  const columnsNonGroup = useMemo(() => {
    return props.columns?.filter((c1) => !c1.isGroup) ?? [];
  }, [props.columns]);

  const onChangeHidden = (params) => {
    if (params?.data == null || props.columns == null) {
      return;
    }

    let isHidden = params?.data?.isHidden === true;

    let cols = [...(props.columns ?? [])];
    params.data.isHidden = !isHidden;
    props.onColumnsChange?.(cols);
  };

  const gridCellRender = (params) => {
    let isHidden = params?.data?.isHidden === true;

    return (
      <span>
        <span
          css={`
            margin: 0 8px 0 3px;
          `}
        >
          <Checkbox checked={!isHidden} onChange={onChangeHidden.bind(null, params)} />
        </span>
        {params?.data?.name ?? '-'}
      </span>
    );
  };

  const onChangeFilterText = (e) => {
    let v1 = e.target.value;
    setFilterText(v1);

    const f1 = ['name', 'contains', v1];

    gridNonGroup.current?.instance?.filter(f1);
    gridGroup.current?.instance?.filter(f1);
  };

  const calcIndex = (cols, index, isGroup) => {
    let res = null;
    let ind = -1;
    cols?.some((c1, c1ind) => {
      if ((c1.isGroup === true) == (isGroup === true)) {
        ind++;

        if (ind === index) {
          res = c1ind;
          return true;
        }
      }
    });
    return res;
  };

  const onReorder = (isGroupParam, { fromComponent, fromData, fromIndex, itemData, itemElement, toComponent, toData, toIndex }) => {
    if (!props.columns) {
      return;
    }

    let cols = [...(props.columns ?? [])];

    let indFrom = calcIndex(cols, fromIndex, isGroupParam);
    let indTo = calcIndex(cols, toIndex, isGroupParam);

    if (indFrom != null && indTo != null) {
      let p1 = cols.splice(indFrom, 1)?.[0];
      cols.splice(indTo, 0, p1);
      props.onColumnsChange?.(cols);
    }
  };

  const onAdd = (isGroupParam, { fromComponent, fromData, fromIndex, itemData, itemElement, toComponent, toData, toIndex }) => {
    if (!props.columns) {
      return;
    }

    let cols = [...(props.columns ?? [])];

    let indFrom = calcIndex(cols, fromIndex, !isGroupParam);
    let indTo = calcIndex(cols, toIndex, isGroupParam);

    if (indFrom != null) {
      let p1 = cols.splice(indFrom, 1)?.[0];

      p1.isGroup = isGroupParam;

      cols.splice(indTo ?? 0, 0, p1);
      props.onColumnsChange?.(cols);
    }
  };

  //DnD https://github.com/DevExpress/DevExtreme/issues/9339
  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: ${LeftBarWW}px;
      `}
      className={'leftBar'}
    >
      <NanoScroller onlyVertical>
        <div css={``}>
          <Input placeholder={'Filter'} value={filterText} onChange={onChangeFilterText} prefix={<Icon icon={ic_filter_list} size={18} />} />
        </div>

        <div
          css={`
            margin-top: ${espWW}px;
          `}
        >
          <div
            css={`
              font-family: Matter;
              font-weight: 400;
              font-size: 18px;
              color: #ffffff;
              margin-bottom: 6px;
            `}
          >
            Group By
          </div>
          <div
            css={`
              margin-top: ${6}px;
              border: 1px solid #686868;
            `}
          >
            {/*// @ts-ignore*/}
            <DataGrid dataSource={columnsGroup} showBorders={false} width={LeftBarWW - 2} showColumnHeaders={false} ref={gridGroup}>
              <RowDragging onAdd={onAdd.bind(null, true)} onReorder={onReorder.bind(null, true)} group={'sharedLeftBar'} data={'grid1'} allowReordering={true} boundary={'.leftBar'} dropFeedbackMode={'push'} />
              <Column cellRender={gridCellRender} />
            </DataGrid>
          </div>
        </div>

        <div
          css={`
            margin-top: ${espWW}px;
          `}
        >
          <div
            css={`
              font-family: Matter;
              font-weight: 400;
              font-size: 18px;
              color: #ffffff;
              margin-bottom: 6px;
            `}
          >
            Columns
          </div>
          <div
            css={`
              margin-top: ${6}px;
              border: 1px solid #686868;
            `}
          >
            {/*// @ts-ignore*/}
            <DataGrid dataSource={columnsNonGroup} showBorders={false} width={LeftBarWW - 2} showColumnHeaders={false} ref={gridNonGroup}>
              <RowDragging onAdd={onAdd.bind(null, false)} onReorder={onReorder.bind(null, false)} group={'sharedLeftBar'} data={'grid2'} allowReordering={true} boundary={'.leftBar'} dropFeedbackMode={'push'} />
              <Column cellRender={gridCellRender} />
            </DataGrid>
          </div>
        </div>
      </NanoScroller>
    </div>
  );
});

interface IRawDataVisualOneJoinsProps {
  datasetId?: string;
  datasetsList?: any[];
  columnsByDatasetId?: { [id: string]: IColOne[] };
  onUseJoin?: (datasetId?: string, column?: string) => void;
  selectDatasetId?: string;
  selectColumn?: string;
}

const JoinsPanel = React.memo((props: PropsWithChildren<IRawDataVisualOneJoinsProps>) => {
  const joinsToUse: { [datasetId: string]: { datasetName?: string; datasetId?: string; column?: string }[] } = useMemo(() => {
    let res = null;
    if (props.datasetId && props.datasetsList && props.columnsByDatasetId) {
      let cols = props.columnsByDatasetId[props.datasetId];
      if (cols) {
        let kk = Object.keys(props.columnsByDatasetId ?? {});
        kk.some((k1) => {
          if (k1 === props.datasetId) {
            return;
          }

          let cols2 = props.columnsByDatasetId[k1];
          let inTwo = [];
          cols.some((kkCols1) => {
            if (cols2?.find((c1) => c1.name === kkCols1.name) != null) {
              inTwo.push({
                datasetId: k1,
                datasetName: props.datasetsList?.find((d1) => d1?.dataset?.datasetId === k1)?.dataset?.name,
                column: kkCols1.name,
              });
            }
          });
          if (inTwo.length > 0) {
            res = res ?? {};
            res[k1] = res[k1] ?? [];
            res[k1] = inTwo;
          }
        });
      }
      return res;
    }
  }, [props.datasetId, props.datasetsList, props.columnsByDatasetId]);

  let joinsToUseKK = Object.keys(joinsToUse ?? {});

  const onClickUse = (datasetId, column, e) => {
    props.onUseJoin?.(datasetId, column);
  };

  return (
    <div css={``}>
      <div
        css={`
          font-family: Matter;
          font-weight: 400;
          font-size: 18px;
          color: #ffffff;
          margin-bottom: 6px;
        `}
      >
        Joins
      </div>
      <div
        css={`
          margin-top: ${6}px;
          border: 1px solid #686868;
          padding-left: 4px;
        `}
      >
        <span
          onClick={onClickUse.bind(null, null, null)}
          css={`
            display: inline-flex;
            margin: 8px 5px;
            padding: 7px 9px;
            cursor: pointer;
            background: ${props.selectDatasetId == null && props.selectColumn == null ? Constants.blue : 'rgba(255,255,255,0.1)'};
            border-radius: 3px;
          `}
        >
          None
        </span>
        {_.flatten(
          joinsToUseKK?.map((k1, k1ind) => {
            let res = joinsToUse[k1]?.map((j1, j1ind) => {
              let isSel = props.selectDatasetId === j1.datasetId && props.selectColumn === j1.column;
              return (
                <span
                  onClick={onClickUse.bind(null, j1.datasetId, j1.column)}
                  key={'jo' + k1ind + '_' + j1ind}
                  css={`
                    display: inline-flex;
                    margin: 8px 5px;
                    padding: 7px 9px;
                    cursor: pointer;
                    background: ${isSel ? Constants.blue : 'rgba(255,255,255,0.1)'};
                    border-radius: 3px;
                  `}
                >
                  {j1.datasetName + ':'}
                  <span
                    css={`
                      opacity: 0.8;
                      margin-left: 5px;
                    `}
                  >
                    {j1.column}
                  </span>
                </span>
              );
            });
            return res ?? [];
          }),
        )}
      </div>
    </div>
  );
});

interface IRawDataVisualOneProps {}

const RawDataVisualOne = React.memo((props: PropsWithChildren<IRawDataVisualOneProps>) => {
  const { paramsProp, authUser, projectsParam, projectDatasetsParam, defDatasetsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    projectsParam: state.projects,
    defDatasetsParam: state.defDatasets,
    projectDatasetsParam: state.projectDatasets,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredGrid, forceUpdateGrid] = useReducer((x) => x + 1, 0);

  const [isDownloading, setIsDownloading] = useState(false);
  const [dataList, setDataList] = useState(null);
  const [errorDownload, setErrorDownload] = useState(null);
  const [progress, setProgress] = useState(null as { actual: number; total: number; start: number });
  const [downloadMaxRows, setDownloadMaxRows] = useState(null);
  const [downloadStart, setDownloadStart] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [columns, setColumns] = useState(null as IColOne[]);

  const [joinDatasetId, setJoinDatasetId] = useState(null);
  const [joinColumn, setJoinColumn] = useState(null);

  const projectId = paramsProp?.get('projectId');
  const datasetId = paramsProp?.get('datasetId');
  const featureGroupId = paramsProp?.get('featureGroupId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  useEffect(() => {
    projectDatasets.memDatasetsByProjectId(true, undefined, projectId);
  }, [projectId, projectDatasetsParam]);
  const datasetsList = useMemo(() => {
    return projectDatasets.memDatasetsByProjectId(false, undefined, projectId);
  }, [projectId, projectDatasetsParam]);

  const memDatasetSchema = (doCall, defDatasetsParam, projectId, datasetId, batchPredId, modelVersion) => {
    if (defDatasetsParam && projectId && datasetId) {
      let dsSchema1 = calcFileSchemaByDatasetId(datasetId);
      if (dsSchema1 == null) {
        if (defDatasetsParam.get('isRefreshing') === 0) {
          if (doCall) {
            StoreActions.schemaGetFileSchema_(datasetId);
          }
        }
      } else {
        return dsSchema1;
      }
    }
  };

  const datasetListIds = useMemo(() => {
    let ids = datasetsList?.map((d1) => d1?.dataset?.datasetId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
    ids = ids ?? [];
    if (!ids.includes(datasetId)) {
      ids.push(datasetId);
    }
    return ids;
  }, [datasetId, datasetsList]);

  useEffect(() => {
    if (projectId && datasetListIds?.length > 0) {
      datasetListIds?.some((id1) => {
        memDatasetSchema(true, defDatasetsParam, projectId, id1, undefined, undefined);
      });
    }
  }, [datasetListIds, projectId, defDatasetsParam]);
  const schemaDataset = useMemo(() => {
    if (projectId && datasetListIds?.length > 0) {
      let res = {};
      datasetListIds?.some((id1) => {
        let r1 = memDatasetSchema(false, defDatasetsParam, projectId, id1, undefined, undefined);
        if (r1 && Immutable.isImmutable(r1)) {
          r1 = r1.toJS();
        }
        res[id1] = r1;
      });
      return res;
    }
  }, [datasetListIds, projectId, defDatasetsParam]);

  const columnsByDatasetId = useMemo(() => {
    let columnsByDatasetId = {};

    let kk = Object.keys(schemaDataset ?? {});
    kk.some((k1) => {
      let columns = [];

      let schema = schemaDataset?.[k1];
      schema = schema?.schema;
      if (schema) {
        schema?.some((s1, s1ind) => {
          let type1 = 'string';
          switch (s1.featureType?.toUpperCase()) {
            case 'NUMERICAL':
              type1 = 'number';
              break;
            case 'TIMESTAMP':
              type1 = 'datetime';
              break;
          }

          let name1 = s1.name ?? s1.originalName;

          columns.push({
            name: name1,
            dataType: type1,
          } as IColOne);
        });
      }

      columnsByDatasetId[k1] = columns;
    });

    return columnsByDatasetId;
  }, [schemaDataset, datasetId]);

  const columnsList = useMemo(() => {
    setTimeout(() => {
      forceUpdateGrid();
    }, 0);

    return columns?.map((c1, c1ind) => {
      if (c1.isHidden) {
        return;
      }

      const name1 = c1.name;
      return <Column key={'col' + name1} name={name1} dataField={name1} dataType={c1.dataType} grouped={c1.isGroup === true} />;
    });
  }, [columns]);

  const selectTablename = useMemo(() => {
    return 'abcdef';
  }, [datasetId, datasetsList]);

  const columnsTmp = columnsByDatasetId?.[datasetId];
  useEffect(() => {
    setColumns(columnsTmp);
  }, [columnsTmp]);

  const onColumnsChange = (cols) => {
    setColumns([...(cols ?? [])]);
  };

  const dataListUse = useMemo(() => {
    if (schemaDataset?.[datasetId] && dataList) {
      let schema = schemaDataset?.[datasetId];
      if (Immutable.isImmutable(schema)) {
        schema = schema.toJS();
      }
      schema = schema?.schema;

      return dataList?.map((d1, d1ind) => {
        let res = {};

        schema?.some((s1, s1ind) => {
          res[s1?.name] = d1[s1ind];
        });

        return res;
      });
    }
  }, [schemaDataset, datasetId, dataList]);

  useEffect(() => {
    if (projectId) {
      setErrorDownload(null);
      setDataList(null);

      if (datasetId) {
        let maxRows = 10000;
        setDownloadMaxRows(maxRows);

        const rowsCount = 10000;
        let resDataList = [];
        // const doWork = (start = 0) => {
        //   const doFinishWork = () => {
        //     setDataList(resDataList);
        //     setIsDownloading(false);
        //   };
        //
        //   setDownloadStart(start);
        //   if(start>=maxRows) {
        //     doFinishWork();
        //     return;
        //   }
        //
        //   REClient_.client_().get_dataset_data(projectId, datasetId, null, null, start, start+rowsCount-1, 0, 1000, null, (err, res) => {
        //     if(err || !res?.success || !res?.result?.data || res?.result?.data?.length===0) {
        //       setDataList(resDataList);
        //
        //     } else {
        //       resDataList = resDataList.concat(res?.result?.data);
        //
        //       if(res?.result?.data?.length<rowsCount) {
        //         doFinishWork();
        //         return;
        //       }
        //
        //       doWork(start+rowsCount);
        //     }
        //
        //   }, (bytes, total) => {
        //     setProgress({ actual: bytes, total: total, start, });
        //   });
        // };

        // doWork(0);
        setIsDownloading(true);

        REClient_.client_()._getFullDataPreview(
          projectId,
          datasetId,
          null,
          (bytes: number, total: number) => {
            setProgress({ actual: bytes, total: total, start: 0 });
          },
          (err, res) => {
            setIsDownloading(false);

            if (err || !res?.success) {
              setErrorDownload(err || Constants.errorDefault);
            } else {
              setDataList(res?.result?.data);
            }
          },
        );
      } else if (featureGroupId) {
      }
    }
  }, [projectId, datasetId, featureGroupId]);

  const valuesDownload = useMemo(() => {
    let perc = (100 / (downloadMaxRows || 1)) * downloadStart;
    if (downloadMaxRows === 0 || downloadStart === 0) {
      perc = 0;
    }
    return [perc];
  }, [downloadMaxRows, downloadStart]);

  const optionsDatasets = useMemo(() => {
    return datasetsList?.map((d1) => ({ label: d1?.dataset?.name, value: d1?.dataset?.datasetId }));
  }, [datasetsList]);
  const datasetSelectValue = optionsDatasets?.find((v1) => v1.value === datasetId);

  const showRowsCount = true;
  const columnsCount = columnsList?.length ?? '-';
  const rowsCount = dataList?.length ?? '-';

  const onChangeSelectDataset = (option1) => {};
  let popupContainerForMenu = (node) => document.getElementById('body2');

  let joinsHH = 100;
  if (joinDatasetId && joinColumn) {
    joinsHH += 200;
  }

  const onUseJoin = (datasetId, column) => {
    setJoinDatasetId(datasetId);
    setJoinColumn(column);
  };

  const onRowSelectionChanged = (rowsData) => {
    let selectedRowsData = rowsData?.selectedRowsData;
    if (selectedRowsData?.length > 0) {
      let data1 = selectedRowsData[0];
      setSelectedData(data1);
    }
  };

  return (
    <div>
      {/*// @ts-ignore*/}
      {isDownloading && (
        <BarGauge startValue={0} endValue={100} values={valuesDownload} style={{ marginTop: '50px' }} relativeInnerRadius={0.6}>
          <Scale startValue={0} endValue={100} tickInterval={10} tick={{ visible: true }} />
          <Label overlappingBehavior={'none'} visible={true} format={{ type: 'fixedPoint', precision: 1 }} customizeText={({ valueText }) => `${valueText} %`} />
          {/*// @ts-ignore*/}
          <Title text={'Downloading Data...'}>
            <Font size={18} color={'white'} />
          </Title>
        </BarGauge>
      )}

      {!isDownloading && dataList != null && (
        <div
          css={`
            margin: 30px;
          `}
          className={sd.absolute}
        >
          <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH - 24 + 'px', display: 'flex' }}>
            <span>Raw Data&nbsp;&nbsp;</span>
            {
              <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', display: 'inline-block', fontSize: '12px' }}>
                <SelectExt value={datasetSelectValue} options={optionsDatasets} onChange={onChangeSelectDataset} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
              </span>
            }

            {showRowsCount && (
              <span style={{ marginLeft: '20px', marginRight: '20px' }} className={s.tagItem}>
                <span>
                  <span
                    css={`
                      @media screen and (max-width: 1400px) {
                        display: none;
                      }
                    `}
                  >
                    Number of{' '}
                  </span>
                  Rows: <b>{rowsCount ? Utils.prettyPrintNumber(rowsCount - 1) : 0}</b>
                </span>
              </span>
            )}
            <span
              className={s.tagItem}
              css={`
                ${showRowsCount ? '' : 'margin-left: 20px;'}
              `}
            >
              <span
                css={`
                  @media screen and (max-width: 1400px) {
                    display: none;
                  }
                `}
              >
                Number of{' '}
              </span>
              Columns: <b>{columnsCount}</b>
            </span>
          </div>
          <div
            css={`
              position: absolute;
              left: 0;
              top: ${topAfterHeaderHH}px;
              right: 0;
              bottom: 0;
              .dx-datagrid,
              .dx-editor-cell .dx-texteditor,
              .dx-editor-cell .dx-texteditor .dx-texteditor-input,
              .dx-toolbar {
                background-color: ${backBlueDark};
              }
              .dx-menu.dx-filter-menu {
                margin-left: 1px;
                margin-top: 1px;
                height: 98%;
                padding-top: 0;
              }
              .dx-filter-menu.dx-menu .dx-menu-item .dx-menu-item-content {
                padding-top: 0 !important;
              }
            `}
          >
            <AutoSizer>
              {({ width, height }) => (
                <div>
                  <LeftBar columns={columns} onColumnsChange={onColumnsChange} />

                  <div
                    css={`
                      position: absolute;
                      left: ${LeftBarWW + espWW}px;
                      top: 0;
                      bottom: ${joinsHH}px;
                      right: 0;
                    `}
                  >
                    {/*// @ts-ignore*/}
                    <DataGrid
                      key={'grid' + ignoredGrid}
                      dataSource={dataListUse}
                      allowColumnReordering={true}
                      showBorders={true}
                      width={width - (LeftBarWW + espWW)}
                      height={height - joinsHH}
                      allowColumnResizing={true}
                      columnResizingMode={'widget'}
                      selection={{ mode: 'single' }}
                      onSelectionChanged={onRowSelectionChanged}
                      // onContentReady={this.onContentReady}
                    >
                      <GroupPanel visible={true} />
                      <SearchPanel visible={true} highlightCaseSensitive={true} />
                      <Grouping autoExpandAll={true} />

                      <HeaderFilter visible={true} />
                      <FilterRow visible={true} />

                      <FilterPanel visible={true} />
                      <FilterBuilderPopup />

                      <Scrolling mode="virtual" />

                      <Export enabled={true} allowExportSelectedData={true} />

                      {columnsList}
                    </DataGrid>
                  </div>

                  <div
                    css={`
                      position: absolute;
                      bottom: 0;
                      left: ${LeftBarWW + espWW}px;
                      right: 0;
                      height: ${joinsHH}px;
                    `}
                  >
                    <JoinsPanel columnsByDatasetId={columnsByDatasetId} datasetsList={datasetsList} datasetId={datasetId} onUseJoin={onUseJoin} selectDatasetId={joinDatasetId} selectColumn={joinColumn} />
                    {joinDatasetId && joinColumn && (
                      <JoinsGrid
                        selectTablename={selectTablename}
                        selectedData={selectedData}
                        columnsByDatasetId={columnsByDatasetId}
                        datasetsList={datasetsList}
                        datasetId={datasetId}
                        selectDatasetId={joinDatasetId}
                        selectColumn={joinColumn}
                      />
                    )}
                  </div>
                </div>
              )}
            </AutoSizer>
          </div>
        </div>
      )}
    </div>
  );
});

export default RawDataVisualOne;
