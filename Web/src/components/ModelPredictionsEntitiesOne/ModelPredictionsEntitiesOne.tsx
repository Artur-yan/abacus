import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TableSortLabel from '@mui/material/TableSortLabel';
import Button from 'antd/lib/button';
import DatePicker from 'antd/lib/date-picker';
import Popover from 'antd/lib/popover';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils, { ReactLazyExt } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { memProjectById } from '../../stores/reducers/projects';
import requests from '../../stores/reducers/requests';
import { calcRectOverlapBoxes } from '../AnnotationEditorImages/CalcRectOverlap';
import { IDataListOnePdf } from '../AnnotationsEdit/IDataListOnePdf';
import DropFiles from '../DropFiles/DropFiles';
import HelpBox from '../HelpBox/HelpBox';
import { IModelPropsCommon } from '../ModelPredictionCommon/ModelPredictionCommon';
import { FilterOne } from '../ModelPredictionsRegressionOne/ModelPredictionsRegressionOne';
import { intRowIndex } from '../ModelPredictionsRegressionOne/PredEqualSmart';
import NLPEntitiesColorsList from '../NLPEntitiesColorsList/NLPEntitiesColorsList';
import NLPEntitiesTables, { nlpCalcColorToken } from '../NLPEntitiesTables/NLPEntitiesTables';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TextMax from '../TextMax/TextMax';
import TooltipExt from '../TooltipExt/TooltipExt';
const AnnotationsEdit = ReactLazyExt(() => import('../AnnotationsEdit/AnnotationsEdit'));
const s = require('./ModelPredictionsEntitiesOne.module.css');
const sd = require('../antdUseDark.module.css');
const RangePicker = DatePicker.RangePicker;

const cellHH = 54;
const tokenREMOVE = 'ccd321f488fc4478bc45638d04780878';

interface IModelPredictionsEntitiesOneProps {
  paramsProp?: any;
  projects?: any;
  requests?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;

  isSearch?: boolean;
  isLangDetection?: boolean;
  saveName?: string;
  projectId?: string;
}

interface IModelPredictionsEntitiesOneState {
  predictData?: any;
  predictText?: string;

  datasValue?: any;
  resultActual?: any;
  resultError?: string;
  isRefreshingResult?: boolean;

  searchResults?: {
    scoresAndTexts?: { score?: number; text?: string; answer?: string; context?: string }[];
    version?: string;
    hasContext?: boolean;
  };

  forceDataList?: IDataListOnePdf[];

  filterValuesPopoverVisible?: boolean;
  filterValues?: { fieldIndex?: number; value?: any }[];
  dataGridList?: any;
  dataGridListFiltered?: any;
  sortByField?: any;
  sortOrderIsAsc?: any;
  showGrid?: boolean;
  hoveredRowIndex?: any;
}

class ModelPredictionsEntitiesOne extends React.PureComponent<IModelPredictionsEntitiesOneProps & IModelPropsCommon, IModelPredictionsEntitiesOneState> {
  private unDark: any;
  private isM: boolean;
  lastCallPredictData: any;
  lastCallPredictFileDocId: any;
  refFiles = React.createRef();

  constructor(props) {
    super(props);

    this.state = {};
  }

  onDarkModeChanged = (isDark) => {
    if (!this.isM) {
      return;
    }

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

    let foundProject1 = this.memProjectId(true)(this.props.projectId, this.props.projects);
    let optionsTestDatasRes = this.props.optionsTestDatasRes;

    this.memPrediction(optionsTestDatasRes);

    this.memPredictionDocIdIsFile(this.calcIsDocIdIsFile(), this.props.paramsProp?.get('docId'));

    let reqOne = this.memRequestOne(true)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
  };

  processTextFromTokens = memoizeOne((data1) => {
    if (data1?.content != null) {
      if (_.isString(data1?.content)) {
        return data1?.content;
      } else {
        return '';
      }
    }

    let tokens = data1;
    if (data1?.tokens != null) {
      tokens = data1?.tokens;
    }
    let res = '';
    tokens?.some?.((t1, t1ind) => {
      if (t1 != null && _.isString(t1)) {
        if (t1ind > 0) {
          res += ' ';
        }

        res += t1;
      } else {
        let s1 = t1.content;
        if (s1 != null && _.isString(s1)) {
          if (t1ind > 0) {
            res += ' ';
          }

          res += s1;
        }
      }
    });
    return res ?? '';
  });

  calcIsDocIdIsFile = () => {
    return this.props.paramsProp?.get('docIdIsFile') === '1';
  };

  memPredictionDocIdIsFile = memoizeOne((docIdIsFile, docId) => {
    if (docIdIsFile === true) {
      if (Utils.isNullOrEmpty(docId)) {
        docId = null;
      } else {
        docId = decodeURIComponent(docId);
      }
      if (docId != null) {
        this.processFile(null, docId);
      }
    }
  });

  memPrediction = memoizeOne((optionsTestDatasRes) => {
    if (this.state.isRefreshingResult || !optionsTestDatasRes) {
      return;
    }

    if (this.calcIsDocIdIsFile()) {
      return;
    }

    if (this.calcRequestId() != null) {
      return;
    }

    if (this.calcRequestId() != null) {
      return;
    }
    if (optionsTestDatasRes) {
      let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
      if (testDatasList) {
        let data1 = testDatasList[0];
        if (data1) {
          this.setState({
            predictText: this.props.isLangDetection ? data1?.documents ?? '' : this.props.isSearch ? data1?.query ?? '' : this.processTextFromTokens(data1),
            predictData: data1,
          });

          this.showPrediction(data1);
          return;
        }
      }
    }

    this.showPrediction(null);
  });

  onClickPredict = (e) => {
    this.showPrediction(this.state.predictText);
  };

  componentDidUpdate(prevProps: Readonly<IModelPredictionsEntitiesOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsEntitiesOneState>, snapshot?: any): void {
    this.doMem();
  }

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  refreshUrlWithParams = () => {
    //TODO
  };

  showPrediction = (row = null) => {
    let forceNotClear = row?.pageCount != null;

    this.setState({
      isRefreshingResult: true,
    });

    this.lastCallPredictFileDocId = null;
    this.lastCallPredictData = uuid.v1();

    let uuid1 = this.lastCallPredictData;

    let data1: any = row == null || row === '' || _.isString(row) ? '' : JSON.stringify(row);
    let dataParams: any = _.isString(row) ? { data: JSON.stringify(this.props.isSearch || this.props.isLangDetection ? { [this.props.isLangDetection ? 'documents' : 'query']: row } : { content: row }) } : { data: data1 };

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    dataParams = _.assign(dataParams || {}, optionsTestDatasRes?.sendParams || {});

    REClient_.client_()._predictForUI(this.props.selectedAlgoId, dataParams, null, this.calcRequestId(), (err, res) => {
      if (this.lastCallPredictData !== uuid1) {
        return;
      }

      this.setState({
        isRefreshingResult: false,
      });

      if (err || !res || !res.result) {
        if (err === 'Requested deployment is not active') {
          StoreActions.deployList_(this.props.projectId);
        }
        if (res?.errorType !== 'DataNotFoundError') {
          REActions.addNotificationError(err || Constants.errorDefault);
        }
        this.setState({
          resultError: err || Constants.errorDefault,
        });

        this.setState(
          {
            forceDataList: null,
          },
          () => {
            if (!forceNotClear) {
              setTimeout(() => {
                this.forceClearDataIndexIfNeeded();
              }, 0);
            }
          },
        );
      } else {
        let actual = null;

        if (this.props.isLangDetection) {
          this.setState({
            searchResults: res?.result,
          });
        } else if (this.props.isSearch) {
          this.setState({
            searchResults: res?.result,
          });
        }

        this.setState({
          resultError: null,
        });

        this.setState({
          resultActual: actual,
          resultError: null,
          forceDataList: null,
        });
        let isRequestId = this.calcRequestId() != null;
        if (row == null || isRequestId) {
          let listPredicted = res?.result?.predicted;
          if (isRequestId) {
            listPredicted = null;
            let reqOne = this.memRequestOne(false)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
            if (reqOne != null) {
              let data1 = /*Utils.tryJsonParse*/ reqOne?.query?.data;
              if (data1 != null) {
                listPredicted = [data1];
              }
            }
          }

          this.setState(
            {
              resultActual: listPredicted,
            },
            () => {
              let datasValue = this.calcDataFromListTestDatas(true);
              this.setState({
                datasValue,
              });
              if (!forceNotClear) {
                setTimeout(() => {
                  this.forceClearDataIndexIfNeeded();
                }, 0);
              }
            },
          );
        } else {
          this.setState(
            {
              resultActual: res?.result,
            },
            () => {
              let datasValue = this.calcDataFromListTestDatas(true);
              let forceDataList: IDataListOnePdf[] = null;

              if (this.calcIsPdfIsFile() || (datasValue != null && this.calcIsPdfListTestData())) {
                let idRes1 = datasValue;
                if (idRes1 != null) {
                  let res1 = this.processDatasValue(idRes1);
                  forceDataList = res1?.forceDataList ?? null;

                  if (this.calcIsPdfIsFile()) {
                    datasValue = res1?.datasValue ?? null;
                  }
                }
              }

              this.setState(
                {
                  datasValue,
                  forceDataList,
                },
                () => {
                  if (forceDataList == null) {
                    if (!forceNotClear) {
                      setTimeout(() => {
                        this.forceClearDataIndexIfNeeded();
                      }, 0);
                    }
                  }
                },
              );
            },
          );
        }
      }
    });
  };

  processDatasValue = (idRes1, forceLabelsParam?, forceCalcLabels = false, isFile = false) => {
    if (idRes1 == null) {
      return null;
    }

    let testDatas = this.props.optionsTestDatasRes;
    let forceLabels = forceLabelsParam ?? testDatas?.resultTestDatas?.metrics?.labels;
    if (forceCalcLabels) {
      forceLabels = null;
    }

    let forceDataList: IDataListOnePdf[] = null;

    let pageCount = idRes1?.data?.pageCount ?? idRes1?.pageCount ?? idRes1?.page_count ?? idRes1?.predictions?.extractedFeatures?.pageCount ?? 1;
    for (let i = 0; i < pageCount; i++) {
      forceDataList ??= [];

      let forceAnnotations = null;
      let ann1 = idRes1?.actual?.annotations ?? idRes1?.predictions?.annotations;
      if (ann1 != null && _.isArray(ann1)) {
        ann1
          ?.filter((a1) => a1?.page === i)
          ?.some((a1) => {
            forceAnnotations ??= [];
            let lineBoundingBoxes = a1?.boundingBox;
            if (Number.isInteger(lineBoundingBoxes?.[0])) {
              // Backward compatibility
              lineBoundingBoxes = [lineBoundingBoxes];
            }
            lineBoundingBoxes?.some((lineBoundingBox: number[]) => {
              forceAnnotations.push({
                boundingBox: lineBoundingBox ?? [],
                displayName: a1?.displayName ?? '-',
                boundingBoxIds: null,
                textExtraction: null,
                maxProbability: a1?.maxProbability,
                minProbability: a1?.minProbability,
                meanProbability: a1?.meanProbability,
              });
            });
          });

        if (forceLabels == null) {
          let annAlready: any = {};
          forceAnnotations?.some((a1) => {
            let s1 = a1?.displayName;
            if (!Utils.isNullOrEmpty(s1) && annAlready[s1] == null) {
              forceLabels ??= [];
              forceLabels.push(s1);

              annAlready[s1] = true;
            }
          });
        }
      }

      let forceTokens = null;
      let tokens1 = idRes1?.data?.tokens ?? idRes1?.predictions?.extractedFeatures?.tokens;
      if (tokens1 != null && _.isArray(tokens1)) {
        tokens1?.some((tok1: { boundingBox?: number[]; content?: string; page?: number; startOffset?: number; endOffset?: number }) => {
          if (tok1?.page !== i) {
            return;
          }

          let bb = tok1?.boundingBox;
          if (bb == null || bb?.length < 4) {
            return;
          }

          if (!forceAnnotations?.some((a1) => calcRectOverlapBoxes(a1?.boundingBox, tok1?.boundingBox as any))) {
            return;
          }

          forceTokens ??= [];
          forceTokens.push({
            page: tok1?.page,
            content: tok1?.content,
            boundingBox: tok1?.boundingBox,
          });
        });
      }

      forceDataList.push({
        docId: idRes1?.id ?? idRes1?.doc_id,
        page: i + 1,
        isFile: isFile === true,
        filename: '',
        totalPages: pageCount,
        extractedFeatures: {
          tokens: forceTokens,
        },
        forceLabels: forceLabels ?? [],
        data: null,
        forceAnnotations: forceAnnotations ?? [],
      });
    }

    let rowText = null;
    let datasValue = null;
    let docIdPage = Utils.tryParseInt(this.props.paramsProp?.get('docIdPage'));
    if (forceDataList != null) {
      rowText = this.procRow(idRes1?.predictions) || '';

      if (docIdPage != null) {
        let fPage = forceDataList?.find((f1) => f1?.page === docIdPage);
        if (fPage != null) {
          datasValue = {
            id: fPage?.docId,
            actual: {
              annotations: idRes1?.predictions?.annotations,
              tokens: idRes1?.predictions?.tokens,
            },
            data: {
              pageCount: pageCount,
              tokens: [], //idRes1?.predictions?.tokens
            },
          };
        }
      }
    }

    return { forceDataList, datasValue, rowText, resultActual: idRes1?.predictions ?? null };
  };

  doPredictResult = (e) => {};

  calcRequestId = () => {
    let requestId = this.props.paramsProp?.get('requestId');
    if (requestId === '') {
      requestId = null;
    }
    return requestId;
  };

  memRequestOne = memoizeOneCurry((doCall, requestsParam, deployId, requestId) => {
    return requests.memRequestById(doCall, undefined, deployId, requestId);
  });

  onChangePredictText = (e) => {
    this.setState({
      predictText: e.target.value,
    });
  };

  cellRenderer = (
    columnsGrid,
    {
      columnIndex, // Horizontal (column) index of cell
      isScrolling, // The Grid is currently being scrolled
      isVisible, // This cell is visible within the grid (eg it is not an overscanned cell)
      key, // Unique key within array of cells
      parent, // Reference to the parent Grid (instance)
      rowIndex, // Vertical (row) index of cell
      style, // Style object to be applied to cell (to position it);
      // This must be passed through to the rendered cell element.
    },
  ) => {
    let content: any = '';

    let getValue = (row, col) => {
      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];

      if (this.state.dataGridList != null) {
        testDatasList = this.state.dataGridList;
      }
      if (this.state.dataGridListFiltered != null) {
        testDatasList = this.state.dataGridListFiltered;
      }

      if (testDatasList) {
        let data1 = testDatasList[row];
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            if (col == null && !this.props.isSearch && !this.props.isLangDetection) {
              let actual1 = optionsTestDatasRes.resultTestDatas?.ids?.[data1?.[intRowIndex] ?? row]?.actual;
              return { value: '', data1, actual: actual1 };
            } else {
              let field1 = this.getFieldFromIndex(col + (this.props.isSearch || this.props.isLangDetection ? 0 : 0));
              return { value: field1 ? data1[field1.key] : null, data1 };
            }
          }
        }
      }
      return { value: '', data1: null };
    };

    let isSortType = false;
    let data1 = null;
    if (rowIndex === 0) {
      if (columnIndex === 0) {
        content = '';
      } else if (columnIndex === 1 && !this.props.isSearch && !this.props.isLangDetection) {
        content = 'Target';

        // let pred1 = this.state.resultPredicted;
        // if(pred1!=null) {
        //   if(_.isArray(pred1)) {
        //     pred1 = pred1[0];
        //   }
        //   if(_.isObject(pred1)) {
        //     let kk = Object.keys(pred1);
        //     if(kk!=null && kk.length>0) {
        //       content = kk[0];
        //     }
        //   }
        // }
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - (this.props.isSearch || this.props.isLangDetection ? 1 : 2));
        content = 'Col: ' + columnIndex;
        if (field1) {
          if (field1) {
            content = field1.key || '-';
            // if(_.isString(content)) {
            //   content = Utils.prepareHeaderString(content);
            // }
          }
        }
      }

      if (columnIndex > 0) {
        if (content != null && content !== '') {
          let alreadyFilter = false;
          if (this.state.filterValues != null && !Utils.isNullOrEmpty(this.state.filterValues.find((v1) => v1.fieldIndex === columnIndex)?.value)) {
            alreadyFilter = true;
          }

          let overlayFilter = (
            <div>
              <FilterOne
                defaultValue={() => {
                  let res = '';

                  let ff = this.state.filterValues;
                  if (ff != null) {
                    let f1 = ff.find((v1) => v1.fieldIndex === columnIndex);
                    if (f1 != null) {
                      res = f1.value ?? '';
                    }
                  }

                  return res;
                }}
                onClear={this.onClickSetFilter.bind(this, columnIndex, '')}
                onCancel={() => {
                  this.setState({ filterValuesPopoverVisible: null });
                }}
                onSet={this.onClickSetFilter.bind(this, columnIndex)}
              />
            </div>
          );

          const popupContainerForMenu = (node) => document.getElementById('body2');
          let filter1 = (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <TooltipExt title={'Attribute Search'}>
                <Popover
                  destroyTooltipOnHide={true}
                  open={this.state.filterValuesPopoverVisible === columnIndex}
                  onOpenChange={(isV) => {
                    this.setState({ filterValuesPopoverVisible: isV ? columnIndex : null });
                  }}
                  placement={'bottom'}
                  overlayClassName={sd.popback}
                  getPopupContainer={popupContainerForMenu}
                  content={overlayFilter}
                  trigger={['click']}
                >
                  <span
                    css={`
                      opacity: 0.64;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                  >
                    <FontAwesomeIcon
                      icon={require('@fortawesome/pro-solid-svg-icons/faFilter').faFilter}
                      transform={{ size: 18, x: 0, y: 0 }}
                      style={{ marginLeft: '7px', cursor: 'pointer', color: alreadyFilter ? Constants.blue : 'white' }}
                    />
                  </span>
                </Popover>
              </TooltipExt>
            </span>
          );

          let sortByField = this.state.sortByField;
          isSortType = true;
          content = (
            <TableSortLabel active={sortByField === columnIndex} direction={this.state.sortOrderIsAsc ? 'asc' : 'desc'} onClick={this.onSortHeaderClick.bind(this, columnIndex)}>
              {content}
              {filter1}
            </TableSortLabel>
          );
        }
      }
    } else {
      if (columnIndex === 0) {
        content = '' + rowIndex;
        let v1 = getValue(rowIndex - 1, 1);
        if (v1) {
          data1 = v1.data1;
        }
      } else if (columnIndex === 1 && !this.props.isSearch && !this.props.isLangDetection) {
        let vdata = getValue(rowIndex - 1, 1);
        if (vdata) {
          data1 = vdata.data1;
        }
        let v1 = getValue(rowIndex - 1, null);
        content = v1?.actual ?? '';
      } else {
        let v1 = getValue(rowIndex - 1, columnIndex - (this.props.isSearch || this.props.isLangDetection ? 1 : 2));
        content = '';
        if (this.props.isSearch || this.props.isLangDetection) {
          content = this.props.isLangDetection ? v1?.data1?.documents : v1?.data1?.query;
          data1 = v1?.data1;
        } else if (v1) {
          content = v1.value;
          data1 = v1.data1;
        }

        if (content == null) {
          if (isScrolling) {
            content = '...';
          }
        } else {
          let field1 = this.getFieldFromIndex(columnIndex - (this.props.isSearch || this.props.isLangDetection ? 0 : 1));
          if (field1) {
            let dataType = this.calcTypeFromField(field1);
            if (dataType === 'TIMESTAMP') {
              let dt1 = moment(content);
              if (dt1.isValid()) {
                content = dt1.format('YYYY-MM-DD HH:mm:ss');
              }
            } else if (['number', 'float', 'numeric', 'NUMERICAL', 'numerical'].includes(dataType)) {
              content = Utils.roundDefault(content);
            }
          }
        }
      }
    }

    let styleF = _.assign({}, style || {}, { overflow: 'hidden', padding: '0 3px', cursor: rowIndex === 0 ? '' : 'pointer' } as CSSProperties);
    styleF.backgroundColor = rowIndex === 0 ? '#23305e' : '#19232f';
    styleF.borderBottom = '1px solid #0b121b';
    if (this.state.hoveredRowIndex === rowIndex) {
      styleF.backgroundColor = '#284192';
      styleF.cursor = 'pointer';
    }

    if (_.isString(content) || _.isNumber(content)) {
      content = <div className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}>{content}</div>;
    } else if (_.isArray(content) || _.isObject(content)) {
      if (!Utils.isElement(content)) {
        content = JSON.stringify(content ?? '');
        content = <TextMax max={90}>{content}</TextMax>;
        //'[Object]';
      }
    }

    return (
      <div key={key} style={styleF} className={s.Cell + ' '} onClick={isSortType ? null : this.onRowClick.bind(this, data1)} onMouseEnter={this.onRowMouseEnter.bind(this, rowIndex === 0 ? null : rowIndex)}>
        {content}
      </div>
    );
  };

  onSortHeaderClick = (columnIndex, e) => {
    let sortOrderIsAsc = this.state.sortOrderIsAsc;
    if (columnIndex === this.state.sortByField) {
      sortOrderIsAsc = !sortOrderIsAsc;
    } else {
      sortOrderIsAsc = true;
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    if (testDatasList) {
      const getValue = (row?, columnIndex?) => {
        let data1 = row;
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            if (columnIndex === 1) {
              let actual1 = optionsTestDatasRes.resultTestDatas?.ids?.[row[intRowIndex]]?.actual;
              return { value: actual1, data1, actual: actual1 };
            } else {
              let field1 = this.getFieldFromIndex(columnIndex - 2);
              return { value: field1 ? data1[field1.key] : null, data1 };
            }
          }
        }
      };

      testDatasList = testDatasList.map((d1, d1ind) => {
        d1[intRowIndex] = d1ind;
        return d1;
      });

      const sortDo = (list) => {
        return list?.sort((a, b) => {
          let va = getValue(a, columnIndex)?.value;
          let vb = getValue(b, columnIndex)?.value;

          if (_.isString(va) || _.isString(vb)) {
            va = va == null ? '' : '' + va;
            vb = vb == null ? '' : '' + vb;
          } else if (_.isNumber(va) || _.isNumber(vb)) {
            va = va == null ? 0 : va;
            vb = vb == null ? 0 : vb;
          }

          let asc1 = sortOrderIsAsc ? 1 : -1;
          if (va == null || vb == null) {
            return 0;
          } else if (_.isNumber(va) && _.isNumber(vb)) {
            if (va === vb) {
              return 0;
            } else if (va < vb) {
              return -1 * asc1;
            } else {
              return asc1;
            }
          } else {
            let va2 = _.trim('' + va).toLowerCase();
            let vb2 = _.trim('' + vb).toLowerCase();
            if (va2 === vb2) {
              return 0;
            } else {
              return va2.localeCompare(vb2) * asc1;
            }
          }
        });
      };

      let listSorted = sortDo(testDatasList);
      let dataGridListFiltered = sortDo(this.state.dataGridListFiltered);

      this.setState({
        sortByField: columnIndex,
        sortOrderIsAsc,
        dataGridList: listSorted,
        dataGridListFiltered: dataGridListFiltered,
      });

      this.forceUpdate();
    }
  };

  onClickSetFilter = (columnIndex, value, e) => {
    let ff = [...(this.state.filterValues ?? [])];

    let f1 = ff.find((v1) => v1.fieldIndex === columnIndex);
    if (f1 == null) {
      ff.push({
        fieldIndex: columnIndex,
        value: value,
      });
    } else {
      f1.value = value;
    }
    ff = ff.filter((v1) => !Utils.isNullOrEmpty(v1.value));

    let notFilters = (ff?.length ?? 0) === 0;

    let dataGridListFiltered = null;
    if (!notFilters) {
      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
      let list = testDatasList;
      if (this.state.dataGridList) {
        list = this.state.dataGridList;
      }
      list.some((d1, d1ind) => {
        if (d1[intRowIndex] == null) {
          d1[intRowIndex] = d1ind;
        }
      });
      dataGridListFiltered = list.filter((v1) => {
        let res = true;
        ff?.some((f1) => {
          let value;
          if (f1.fieldIndex === 1) {
            value = optionsTestDatasRes.resultTestDatas?.ids?.[v1[intRowIndex]]?.actual;
          } else {
            let field1 = this.getFieldFromIndex(f1.fieldIndex - 2);
            if (field1?.key) {
              value = v1?.[field1.key];
            }
          }

          if (_.isNumber(value)) {
            let n1 = _.isNumber(f1.value) ? f1.value : Utils.tryParseFloat(f1.value);
            if (n1 != null) {
              if (value !== n1) {
                res = false;
              }
            }
          } else {
            value = '' + value;
            value = value.toLowerCase();
            if (value.indexOf(('' + f1.value).toLowerCase()) === -1) {
              res = false;
            }
          }
        });
        return res;
      });
    }

    this.setState({
      filterValues: ff,
      filterValuesPopoverVisible: null,
      dataGridListFiltered,
    });
  };

  calcColumnsSearch = () => {
    const ww = [160];

    let resultColumns: string[];
    let resultFields: string[];
    if (this.props.isLangDetection) {
      resultColumns = ['Confidence', 'Language Code'];
      resultFields = ['strength', 'language'];
    } else if (this.state.searchResults?.version === '2') {
      if (this.state.searchResults?.hasContext) {
        resultColumns = ['Search score', 'Result', 'Context'];
        resultFields = ['score', 'answer', 'context'];
      } else {
        resultColumns = ['Search score', 'Result'];
        resultFields = ['score', 'answer'];
      }
    } else {
      resultColumns = ['Search score', 'Result'];
      resultFields = ['score', 'text'];
    }

    return resultColumns?.map((c1, c1ind) => ({ width: ww[c1ind], title: c1, dataType: 'STRING', key: resultFields?.[c1ind] ?? c1 }));
  };

  getFieldFromIndex = (index) => {
    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;

    if (this.props.isSearch || this.props.isLangDetection) {
      columnsDisplay = this.calcColumnsSearch().slice(1);
    }

    if (columnsDisplay) {
      return columnsDisplay[index];
    }
  };

  calcTypeFromField = (field1) => {
    if (field1) {
      let dataType = field1.dataType;
      if (dataType != null) {
        return dataType;
      }
    }
    return null;
  };

  onClickExperimentClose = (e) => {
    this.setState({
      showGrid: false,
      hoveredRowIndex: null,
    });
  };

  onClickExperiment = (e) => {
    this.setState({
      showGrid: true,
      hoveredRowIndex: null,
    });
  };

  onClickClearFilters = (e) => {
    this.setState({
      filterValues: [],
      dataGridListFiltered: null,
    });
  };

  gridColumnWidth = ({ index }) => {
    if (index === 0) {
      return 80;
    }
    // if(index===1) {
    return 410;
    // }

    // let field1 = this.getFieldFromIndex(index-2);
    // if(field1) {
    //   let type1 = this.calcTypeFromField(field1);
    //
    //   if(type1==='array') {
    //     return 200;
    //   } else if(type1==='string' || type1==='CATEGORICAL') {
    //     return 240;
    //   } else if(type1==='number' || type1==='numeric' || type1?.toUpperCase()==='NUMERICAL') {
    //     return 160;
    //   } else if(type1==='TIMESTAMP') {
    //     return 200;
    //   } else {
    //     return 120;
    //   }
    // }
    //
    // return 100;
  };

  onRowMouseChangeIndex = (rowIndex) => {
    if (this.state.hoveredRowIndex !== rowIndex) {
      this.setState({
        hoveredRowIndex: rowIndex,
      });
    }
  };

  onRowMouseEnter = (rowIndex, e) => {
    this.onRowMouseChangeIndex(rowIndex);
  };

  onRowMouseLeave = (e) => {
    this.onRowMouseChangeIndex(null);
  };

  procRow = (row) => {
    if (this.props.isLangDetection) {
      return row?.documents;
    }
    if (this.props.isSearch) {
      return row?.query;
    }

    if (row?.content != null && _.isString(row?.content)) {
      return row?.content;
    } else {
      return row?.tokens?.map((t1) => (_.isString(t1) ? t1 : t1?.content ?? ''))?.join(row?.addTokenSpaces === false ? '' : ' ') ?? '';
    }
  };

  forceClearDataIndexIfNeeded = (ind = null) => {
    let actualInd = Utils.tryParseInt(this.props.paramsProp?.get('dataIndex'));

    let alsoRemove: any = {};
    if (ind == null) {
      if (!Utils.isNullOrEmpty(this.props.paramsProp?.get('docId'))) {
        alsoRemove = {
          docId: null,
          docIdPage: null,
          docIdIsFile: null,
        };
      }
    }

    if (actualInd != ind) {
      setTimeout(() => {
        Location.push(window.location.pathname, undefined, Utils.processParamsAsQuery(_.assign({ dataIndex: ind }, alsoRemove ?? {}), window.location.search));
      }, 0);
    }
  };

  onRowClick = (row) => {
    let s1 = this.procRow(row);

    this.setState(
      {
        forceDataList: null,
        showGrid: false,
        hoveredRowIndex: null,
        predictText: s1,
      },
      () => {
        setTimeout(() => {
          this.forceClearDataIndexIfNeeded();

          this.showPrediction(row);
        }, 0);
      },
    );
  };

  calcDataFromListTestDatas = (returnObj = false) => {
    return this.calcDataFromListTestDatasInt(this.state.predictText, returnObj);
  };

  calcDataFromListTestDatasInt = memoizeOne((predictText, returnObj) => {
    if (Utils.isNullOrEmpty(predictText)) {
      return null;
    }

    let predictText1 = _.trim(predictText ?? '');

    let useDataId = null;
    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
    if (testDatasList) {
      let kk = Object.keys(rangeDateByTestDataId);
      kk.some((k1) => {
        let all1 = rangeDateByTestDataId[k1];
        let data1 = all1.data;
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            if (all1 && predictText1 && predictText1 === _.trim(this.procRow(data1) ?? '')) {
              if (returnObj) {
                useDataId = all1;
              } else {
                useDataId = all1.id;
              }
              return true;
            }
          }
        }
      });
    }

    return useDataId;
  });

  onClickRowAPI = (e) => {
    let useDataId = this.calcDataFromListTestDatas();
    if (Utils.isNullOrEmpty(useDataId)) {
      REActions.addNotificationError('Data not found!');
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let deployId = this.props.paramsProp?.get('deployId');
    Location.push('/' + PartsLink.deploy_predictions_api + '/' + projectId + '/' + deployId, undefined, 'fromPredDash=true&useDataTokens=true&useDataId=' + encodeURIComponent(useDataId ?? ''));
  };

  memColumns = memoizeOne((columnsDisplay: { key: string; dataType: string }[]) => {
    if (columnsDisplay && columnsDisplay.length > 0) {
      let fields = columnsDisplay;
      let res = [];

      fields &&
        fields.some((f1, k1ind) => {
          let colIndex = k1ind;
          let field1 = f1;

          let render1;
          if (f1.key === 'context') {
            render1 = (text, row, index) => {
              return _.isObject(text) ? JSON.stringify(text) : text;
            };
          } else if (['score', 'strength'].includes(f1.key)) {
            render1 = (text, row, index) => {
              return Utils.decimals(text, 3);
            };
          }

          res.push({
            title: (f1 as any).title ?? f1.key,
            field: f1.key,
            width: (f1 as any).width ?? (this.props.isSearch || this.props.isLangDetection ? null : this.gridColumnWidth({ index: colIndex })),
            render: render1,
          } as ITableExtColumn);
        });

      return res;
    }
  });

  memDataActual = memoizeOne((datasValue) => {
    if (datasValue == null) {
      return datasValue;
    } else {
      let res = {
        annotations: datasValue?.actual?.annotations,
        tokens: datasValue?.actual?.tokens,
        addTokenSpaces: false,
      };
      if (res?.annotations == null || res?.tokens == null) {
        res = null;
      }
      return res;
    }
  });

  processFileInProgress = false;
  processFile = (file1, docId?) => {
    if (this.lastCallPredictFileDocId != null && this.lastCallPredictFileDocId === docId) {
      return;
    }
    if (this.processFileInProgress) {
      return;
    }

    this.setState({
      isRefreshingResult: true,
    });

    this.lastCallPredictFileDocId = docId;
    this.lastCallPredictData = uuid.v1();
    this.processFileInProgress = true;

    let uuid1 = this.lastCallPredictData;
    REClient_.client_()._getEntitiesFromPDF(this.props.selectedAlgoId, file1, docId, true, (err, res) => {
      this.processFileInProgress = false;
      if (this.lastCallPredictData !== uuid1) {
        return;
      }

      this.setState({
        isRefreshingResult: false,
      });

      if (err || !res || !res.result) {
        if (err === 'Requested deployment is not active') {
          StoreActions.deployList_(this.props.projectId);
        }
        if (res?.errorType !== 'DataNotFoundError') {
          REActions.addNotificationError(err || Constants.errorDefault);
        }
        this.setState({
          resultError: err || Constants.errorDefault,
        });

        this.setState(
          {
            forceDataList: null,
          },
          () => {
            this.forceClearDataIndexIfNeeded();
          },
        );
      } else {
        let res1 = this.processDatasValue(res?.result, undefined, true, true);
        let forceDataList = res1?.forceDataList;
        let datasValue = res1?.datasValue;

        let docIdProcessed = forceDataList?.[0]?.docId;
        this.lastCallPredictFileDocId = docIdProcessed || null;

        this.setState(
          {
            forceDataList,
            searchResults: null,
            datasValue,
            resultActual: res1?.resultActual ?? null,
            resultError: null,
            predictText: res1?.rowText || '',
          },
          () => {
            this.forceClearDataIndexIfNeeded(0);
          },
        );
      }
    });
  };

  onClickAddFilePdf = (e) => {
    // @ts-ignore
    this.refFiles.current?.openDialog?.();
  };

  onDropFiles = (filesList) => {
    if (filesList == null || filesList.length === 0) {
      return;
    }

    let f1 = filesList?.[0];
    if (f1 != null) {
      this.processFile(f1);
    }
  };

  calcIsPdfListTestData = () => {
    if (this.props.isLangDetection || this.props.isSearch) {
      return false;
    }

    let testDatas = this.props.optionsTestDatasRes;
    return testDatas?.resultTestDatas?.ids?.[0]?.data?.pageCount != null;
  };

  calcIsPdfIsFile = () => {
    return this.props.paramsProp?.get('docIdIsFile') === '1';
  };

  render() {
    let { projects, projectId } = this.props;

    let foundProject1 = this.memProjectId(false)(projectId, projects);

    let isRefreshing = false;
    if (projects) {
      isRefreshing = projects.get('isRefreshing');
    }
    if (!foundProject1) {
      isRefreshing = true;
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');
    let menuPortalTarget = popupContainerForMenu(null);

    let optionsAlgo = this.props.optionsAlgo;
    let algoSelectValue = null;
    if (this.props.selectedAlgoId) {
      algoSelectValue = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;
    if (this.props.isSearch || this.props.isLangDetection) {
      columnsDisplay = this.calcColumnsSearch();
    }

    let isPdf = this.calcIsPdfListTestData();

    let topHH = 50;
    let topHHinside = 50;

    const onChangeSelectDeployment = (optionSel) => {
      if (!optionSel) {
        return;
      }

      let projectId = this.props.paramsProp?.get('projectId');
      let deployId = optionSel?.value;
      if (projectId && deployId) {
        Location.push('/' + PartsLink.model_predictions + '/' + projectId + '/' + deployId);
      }
    };
    let optionsDeploys = this.props.optionsAlgo;
    let optionsDeploysSel = null;
    if (this.props.selectedAlgoId) {
      optionsDeploysSel = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }
    let deploymentSelect = (
      <span style={{ verticalAlign: 'middle', width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt isDisabled={this.calcRequestId() != null} value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    //
    const marginGrid = 30;

    let columns = this.memColumns(columnsDisplay);
    let columnsGrid = columns;
    if (this.props.isSearch || this.props.isLangDetection) {
      columnsGrid = columnsGrid.slice(1, 999);
    }

    const borderAAA = Constants.lineColor(); //Utils.colorA(0.3);
    const STYLE = {
      backgroundColor: Constants.navBackDarkColor(),
      // border: '1px solid '+Utils.colorA(0.2),
      outline: 'none',
      overflow: 'hidden',
      fontSize: '14px',
      fontFamily: 'Matter',
    };
    const STYLE_BOTTOM_LEFT_GRID = {
      // borderRight: '1px solid '+borderAAA,
    };
    const STYLE_TOP_LEFT_GRID = {
      borderBottom: '1px solid ' + borderAAA,
      // borderRight: '1px solid '+borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    const STYLE_TOP_RIGHT_GRID = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      textTransform: 'uppercase',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    const STYLE_BOTTOM_RIGHT_GRID = {
      outline: 'none',
      backgroundColor: '#19232f',
    };

    let dataActual = this.calcIsPdfIsFile() ? null : this.memDataActual(this.state.datasValue);

    let searchListData = Utils.emptyStaticArray();
    if (this.props.isSearch || this.props.isLangDetection) {
      if (this.props.isLangDetection) {
        searchListData = (this.state.searchResults as any)?.predicted;
        if (searchListData != null && !_.isArray(searchListData)) {
          searchListData = [searchListData];
        }
      } else {
        searchListData = this.state.searchResults?.scoresAndTexts;
      }
      if (searchListData == null || !_.isArray(searchListData)) {
        searchListData = Utils.emptyStaticArray();
      }
    }

    let testDataIsNotEmpty = false;
    if (testDatasList?.length > 0) {
      testDataIsNotEmpty = true;
    }

    let isNER = !this.props.isSearch && !this.props.isLangDetection;
    let contentGrids = null;
    let topButtons = (
      <>
        <div
          css={`
            position: absolute;
            top: 0;
            height: 50px;
            left: 0;
            right: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          {isNER && (
            <span
              css={`
                margin-left: 14px;
                margin-right: 12px;
              `}
            >
              <Button type={'primary'} onClick={this.onClickAddFilePdf}>
                Predict - Upload PDF
              </Button>
            </span>
          )}
          {testDataIsNotEmpty && (
            <Button onClick={this.onClickExperiment} type={'primary'}>
              Experiment with Test Data
            </Button>
          )}
          {testDataIsNotEmpty && !this.props.isLangDetection && (
            <Button
              onClick={this.onClickRowAPI}
              css={`
                margin-left: ${testDataIsNotEmpty ? 10 : 0}px;
              `}
              type={'primary'}
            >
              Prediction API
            </Button>
          )}
        </div>
        {isNER && (
          <div
            css={`
              text-align: center;
              position: absolute;
              top: 50px;
              left: 0;
              right: 0;
              opacity: 0.7;
            `}
          >
            Drag and Drop a PDF file over this area to predict annotations on it
          </div>
        )}
      </>
    );

    if (!this.state.showGrid) {
      contentGrids = (width, height) => (
        <>
          {/*// @ts-ignore*/}
          <SplitPane
            split={'horizontal'}
            minSize={160}
            defaultSize={Utils.dataNum('entities_one_hh' + this.props.saveName, Math.trunc((height / 5) * 2))}
            onChange={(v1) => {
              Utils.dataNum('entities_one_hh' + this.props.saveName, undefined, v1);
            }}
          >
            <div
              css={`
                margin-bottom: 5px;
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
              `}
            >
              {(this.props.isSearch || this.props.isLangDetection) && (
                <div
                  css={`
                    position: absolute;
                    top: 11px;
                    left: 0;
                    font-size: 18px;
                    font-family: Matter;
                  `}
                >
                  {this.props.isLangDetection ? 'Enter text here:' : foundProject1?.useCase?.toUpperCase() === 'NLP_QA' ? 'Ask a question here:' : 'Search query here:'}
                </div>
              )}

              {topButtons}
              <div
                css={`
                  position: absolute;
                  top: ${50 + (isNER ? 30 : 0)}px;
                  bottom: 0;
                  left: 0;
                  right: 0;
                `}
              >
                <textarea
                  maxLength={1000000}
                  value={this.state.predictText}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      this.onClickPredict(e);
                      e.preventDefault();
                    }
                  }}
                  onChange={this.onChangePredictText}
                  css={`
                    resize: none;
                    width: 100%;
                    color: white;
                    background: rgba(0, 0, 0, 0.2);
                    font-size: 14px;
                    padding: 5px 10px;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                  `}
                />
              </div>
            </div>
            <div
              css={`
                margin-top: 5px;
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
              `}
            >
              <div
                css={`
                  font-family: Matter;
                  font-size: 18px;
                  margin: 6px 0;
                  display: flex;
                  justify-content: space-between;
                `}
              >
                <span
                  css={`
                    margin-top: 4px;
                  `}
                >
                  {this.props.isLangDetection && <span>Languages Detected:</span>}
                  {!this.props.isLangDetection && <span>{this.props.isSearch ? 'Search ' : ''}Result:</span>}
                </span>
                <span>
                  <Button onClick={this.onClickPredict} type={'primary'}>
                    {this.props.isLangDetection ? 'Detect' : this.props.isSearch ? 'Search' : 'Predict'}
                  </Button>
                </span>
              </div>
              <div
                css={`
                  position: absolute;
                  top: 50px;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  font-size: 14px;
                  font-family: Matter;
                `}
              >
                <RefreshAndProgress msgMsg={this.state.isRefreshingResult ? 'Retrieving Results' : null} isDim={this.state.isRefreshingResult} msgHideContent={true} msgTop={50} isMsgAnimRefresh={true}>
                  {!this.props.isSearch && !this.props.isLangDetection && (
                    // @ts-ignore
                    <SplitPane
                      split={'vertical'}
                      minSize={160}
                      primary={'second'}
                      defaultSize={Utils.dataNum('entities_one_ww_row2' + this.props.saveName, 360)}
                      onChange={(v1) => {
                        Utils.dataNum('entities_one_ww_row2' + this.props.saveName, undefined, v1);
                      }}
                    >
                      <div
                        css={`
                          position: absolute;
                          top: 0;
                          left: 0;
                          right: 15px;
                          bottom: 0;
                        `}
                      >
                        <NanoScroller onlyVertical>
                          <NLPEntitiesTables data={this.state.resultActual} calcColor={nlpCalcColorToken} />

                          {dataActual != null && (
                            <div
                              css={`
                                margin-top: 10px;
                              `}
                            >
                              <div
                                css={`
                                  font-family: Matter;
                                  font-size: 18px;
                                  margin: 6px 0;
                                  display: flex;
                                  justify-content: space-between;
                                `}
                              >
                                <span
                                  css={`
                                    margin-top: 4px;
                                  `}
                                >
                                  Actual:
                                </span>
                              </div>
                              <NLPEntitiesTables data={dataActual} dataExtraBefore={this.state.resultActual} calcColor={nlpCalcColorToken} />
                            </div>
                          )}
                        </NanoScroller>
                      </div>
                      <div
                        css={`
                          position: absolute;
                          top: 0;
                          right: 0;
                          left: 15px;
                          bottom: 0;
                        `}
                      >
                        <NLPEntitiesColorsList data={this.state.resultActual} dataExtra={[dataActual]} calcColor={nlpCalcColorToken} showEmptyMsg />
                      </div>
                    </SplitPane>
                  )}

                  {(this.props.isSearch || this.props.isLangDetection) && (
                    <div css={``}>
                      <TableExt disableSort isVirtual showEmptyIcon={true} height={height} dataSource={searchListData} columns={columns} />
                    </div>
                  )}
                </RefreshAndProgress>
              </div>
            </div>
          </SplitPane>
        </>
      );

      if (this.state.forceDataList != null || this.calcIsPdfIsFile()) {
        let contentPdfRender = (
          <React.Suspense>
            <AnnotationsEdit forceRefreshing={this.state.isRefreshingResult} isPredDash forceDataList={this.state.forceDataList} />
          </React.Suspense>
        );

        let contentGridsOri = contentGrids;
        if (false && this.calcIsDocIdIsFile()) {
          contentGrids = (width, height) => (
            <div
              css={`
                position: relative;
                height: ${height}px;
                width: ${width}px;
              `}
            >
              {topButtons}
              <div
                css={`
                  position: absolute;
                  top: 50px;
                  left: 0;
                  right: 0;
                  height: ${height - 40}px;
                `}
              >
                {contentPdfRender}
              </div>
            </div>
          );
        } else {
          contentGrids = (width, height) => (
            <>
              <DropFiles key={'dropFilesPdf'} ref={this.refFiles} useBorder onDrop={this.onDropFiles} accepts={['.pdf']} style={{ height: height - 4 + 'px' }}>
                {/*// @ts-ignore*/}
                <SplitPane
                  split={'vertical'}
                  minSize={160}
                  defaultSize={Utils.dataNum('entities_one_pdf_hh' + this.props.saveName, Math.trunc((width / 7) * 3))}
                  onChange={(v1) => {
                    Utils.dataNum('entities_one_pdf_hh' + this.props.saveName, undefined, v1);
                  }}
                >
                  <div
                    css={`
                      border-right: 2px dotted rgba(255, 255, 255, 0.17);
                      padding-right: 12px;
                    `}
                    className={sd.absolute}
                  >
                    {contentPdfRender}
                  </div>
                  <div
                    css={`
                      position: absolute;
                      top: 0;
                      bottom: 0;
                      left: 12px;
                      right: 0;
                    `}
                  >
                    {contentGridsOri?.(width, height)}
                  </div>
                </SplitPane>
              </DropFiles>
            </>
          );
        }
      } else if (isNER) {
        let contentGridsOri = contentGrids;
        contentGrids = (width, height) => (
          <>
            <DropFiles key={'dropFilesPdf'} ref={this.refFiles} useBorder onDrop={this.onDropFiles} accepts={['.pdf']} style={{ height: height - 4 + 'px' }}>
              {contentGridsOri?.(width, height)}
            </DropFiles>
          </>
        );
      }
    }

    //
    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <RefreshAndProgress errorMsg={null} isRefreshing={isRefreshing} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <AutoSizer>
            {({ height, width }) => {
              return (
                <div style={{ height: height + 'px', width: width + 'px', position: 'relative' }}>
                  <div className={sd.titleTopHeaderAfter} style={{ height: topHH, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <span onClick={this.onClickExperimentClose} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
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

                  {isRefreshing !== true && (
                    <div style={{ position: 'absolute', top: topHH + 15 + 'px', left: 0, right: 0, bottom: 0 }}>
                      {
                        <div style={{ display: this.state.showGrid ? 'block' : 'none', zIndex: 3, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '0 0 0 0' }} className={sd.grayPanel}>
                          <div style={{ textAlign: 'center', paddingTop: '20px', height: topHHinside + 'px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ opacity: 0.8, fontSize: '21px' }}>Click a test row to generate predictions</span>
                            <span
                              css={`
                                font-size: 21px;
                                cursor: pointer;
                                margin-left: 15px;
                                color: ${Constants.blue};
                              `}
                              onClick={this.onClickClearFilters}
                            >
                              (Clear all filters)
                            </span>
                          </div>

                          <div
                            onMouseLeave={this.onRowMouseLeave}
                            style={{ position: 'absolute', top: topHHinside + marginGrid + 'px', left: marginGrid + 'px', right: marginGrid + 'px', height: height - topHH - topHHinside - marginGrid * 2 + 'px' }}
                          >
                            <MultiGrid
                              ref={'gridRef'}
                              cellRenderer={this.cellRenderer.bind(this, columnsGrid)}
                              className={s.gridAfter}
                              classNameTopRightGrid={sd.hideScrollbar}
                              classNameTopLeftGrid={sd.hideScrollbar}
                              classNameBottomLeftGrid={sd.hideScrollbar}
                              classNameBottomRightGrid={sd.hideScrollbarY}
                              enableFixedColumnScroll
                              enableFixedRowScroll
                              hideTopRightGridScrollbar
                              hideBottomLeftGridScrollbar
                              fixedRowCount={1}
                              fixedColumnCount={1}
                              overscanRowCount={40}
                              overscanColumnCount={5}
                              style={STYLE}
                              styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                              styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                              styleTopRightGrid={STYLE_TOP_RIGHT_GRID}
                              styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRID}
                              columnCount={(columnsGrid ? columnsGrid.length : 0) + 1 + (this.props.isSearch || this.props.isLangDetection ? 0 : 1)}
                              columnWidth={this.gridColumnWidth}
                              height={height - topHH - topHHinside - marginGrid * 2 - 10}
                              rowCount={(this.state.dataGridListFiltered?.length ?? (testDatasList ? testDatasList.length : 0)) + 1}
                              rowHeight={cellHH}
                              width={width - marginGrid * 2}
                            />
                          </div>
                        </div>
                      }

                      {contentGrids?.(width, height - topHH)}
                    </div>
                  )}
                </div>
              );
            }}
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
    algorithms: state.algorithms,
    defDatasets: state.defDatasets,
    schemaPredictions: state.schemaPredictions,
    requests: state.requests,
  }),
  null,
)(ModelPredictionsEntitiesOne);
