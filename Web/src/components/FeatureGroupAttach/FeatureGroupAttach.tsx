import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import UtilsTS from '../../UtilsTS';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import DateOld from '../DateOld/DateOld';
import FeatureGroupDetail from '../FeatureGroupDetail/FeatureGroupDetail';
import FormExt from '../FormExt/FormExt';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExtOver from '../TooltipExtOver/TooltipExtOver';
const s = require('./FeatureGroupAttach.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupAttachProps {
  paramsProp?: any;
  featureGroups?: any;
  projects?: any;
  useCases?: any;
  defFeatureGroups?: any;
}

interface IFeatureGroupAttachState {
  featureGroupIdSel?: any;
  featureGroupIdSelTableName?: string;
  featureGroupIdSelType?: string;
  listfeatureGroups?: any;
  originalList?: any;
  filterLeftText?: string;
  fgTypeSel?: any;
  fgChecked?: any;
  isExpanded?: boolean;
}

class FeatureGroupAttach extends React.PureComponent<IFeatureGroupAttachProps, IFeatureGroupAttachState> {
  private isM: boolean;
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);

    REClient_.client_().listFeatureGroups(200, null, null, null, (err, res) => {
      if (err || !res?.success || !res?.result) {
        return;
      }
      this.setState({
        listfeatureGroups: res?.result,
        originalList: res?.result,
      });
    });
  }

  componentWillUnmount() {
    this.isM = false;
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

    this.memUseCaseSchemas(true)(this.props.useCases, this.props.paramsProp?.get('useCase'));
  };

  memFGTypesOptions = memoizeOne((fgTypesList) => {
    return fgTypesList?.map((t1) => ({ label: t1.label, value: t1.name, data: t1 }));
  });

  componentDidUpdate(prevProps: Readonly<IFeatureGroupAttachProps>, prevState: Readonly<IFeatureGroupAttachState>, snapshot?: any): void {
    this.doMem();
  }

  memDatasetList = memoizeOne((list) => {
    if (list) {
      let optionsfeatureGroups = [];
      list.some((d1: any) => {
        let name1 = d1.tableName;
        let desc1 = (
          <span>
            <span
              css={`
                opacity: 0.7;
                font-size: 12px;
                margin-left: 10px;
              `}
            >
              ID: {d1.featureGroupId}
            </span>
            <span
              css={`
                opacity: 0.7;
                font-size: 12px;
                margin-left: 10px;
              `}
            >
              <DateOld date={d1.createdAt} always />{' '}
            </span>
            <span
              css={`
                opacity: 0.7;
                font-size: 12px;
                margin-left: 10px;
              `}
            >
              {d1.description ? ' - ' + d1.description : ''}
            </span>
          </span>
        );

        let obj1 = {
          value: d1.featureGroupId,
          label: (
            <span style={{ fontWeight: 600 }}>
              {name1}
              {desc1}
            </span>
          ),
          name: name1,
          search: name1,
        };
        optionsfeatureGroups.push(obj1);
      });

      optionsfeatureGroups = optionsfeatureGroups.sort((a, b) => {
        return (a.table_name || '').toLowerCase().localeCompare((b.table_name || '').toLowerCase());
      });

      return optionsfeatureGroups;
    }
  });

  onChangeSelectDataset = (optionSel) => {
    this.setState({
      featureGroupIdSel: optionSel ? optionSel.value : null,
    });
  };

  calcParamsQueryActual = (otherProps = {}) => {
    let { paramsProp } = this.props;
    if (!paramsProp) {
      return {};
    }

    let res: any = _.assign(
      {
        useCase: paramsProp.get('useCase'),
        useCaseTag: paramsProp.get('useCaseTag'),
        datasetType: paramsProp.get('datasetType'),
        returnToUseCase: paramsProp.get('returnToUseCase'),
        isDash: paramsProp.get('isDash'),
        stepByStep: paramsProp.get('stepByStep'),
      },
      otherProps || {},
    );
    return Utils.processParamsAsQuery(res);
  };

  onClickAttachAllCancel = (e) => {
    this.setState({
      fgChecked: null,
    });
  };

  onClickAttachAll = (e) => {
    let ch = this.state.fgChecked;
    let ids = [];
    let kk = Object.keys(ch ?? {});
    kk.some((k1) => {
      let fg1 = ch?.[k1];
      let id1 = fg1?.featureGroupId;
      if (id1) {
        ids.push(id1);
      }
    });

    let projectId = this.props.paramsProp?.get('projectId');
    if (ids.length > 0 && projectId) {
      REClient_.client_()._bulkAddFeatureGroupsToProject(projectId, ids, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.getProjectsList_();
          StoreActions.getProjectsById_(projectId);
          StoreActions.listModels_(projectId);
          StoreActions.featureGroupsGetByProject_(projectId);
          ids?.some((id1) => {
            StoreActions.featureGroupsDescribe_(null, id1);
            StoreActions.featureGroupsDescribe_(projectId, id1);
          });

          Location.push('/' + PartsLink.feature_groups + '/' + projectId);
        }
      });
    }
  };

  onClickAttach = () => {
    let schemaInfo = this.memUseCaseSchemas(false)(this.props.useCases, this.props.paramsProp?.get('useCase'));
    let optionsDatasetType = this.memOptionsDatasetType(schemaInfo);

    let datasetType = this.state.featureGroupIdSelType || Constants.custom_table;
    if (optionsDatasetType == null || optionsDatasetType?.find((o1) => o1.value?.toUpperCase() === datasetType?.toUpperCase()) == null) {
      datasetType = Constants.custom_table;
    }

    let featureGroupId = this.state.featureGroupIdSel;
    if (featureGroupId) {
      let { paramsProp } = this.props;
      if (paramsProp) {
        let projectId = paramsProp.get('projectId');
        if (projectId) {
          REClient_.client_().attachFeatureGroupToProject(featureGroupId, projectId, datasetType, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              StoreActions.getProjectsList_();
              StoreActions.getProjectsById_(projectId);
              StoreActions.listModels_(projectId);
              StoreActions.featureGroupsGetByProject_(projectId);

              Location.push('/' + PartsLink.feature_groups + '/' + projectId);
            }
          });
        }
      }
    } else {
      REActions.addNotificationError('Select a Feature Group');
    }
  };

  memOptionsDatasetType = memoizeOne((schemaInfo) => {
    let res = [];
    let resAlreadyByDatasetType = {};

    if (schemaInfo) {
      schemaInfo.list?.some((sc1) => {
        if (!sc1) {
          return;
        }

        let datasetType = schemaInfo[sc1]?.dataset_type;
        let dataInfo = schemaInfo[sc1];
        if (!dataInfo) {
          return;
        }

        if (!resAlreadyByDatasetType[datasetType]) {
          resAlreadyByDatasetType[datasetType] = true;
          res.push({
            value: datasetType?.toUpperCase(),
            label: dataInfo.title,
          });
        }
      });
    }

    return res;
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  getSearchResults = async () => {
    const text = this.state.filterLeftText;

    const hasError = (res: any) => !res?.success || res?.error;

    const mapObjectToFeatureGroup = (featureGroup) => ({
      featureGroupId: featureGroup?.feature_group_id,
      tableName: featureGroup?.name,
      createdAt: featureGroup?.created_at,
    });

    const mapResultToFeatureGroups = (featureGroups) => featureGroups.map((featureGroup) => mapObjectToFeatureGroup(featureGroup));

    try {
      const searchByNamePromise = REClient_.promises_()._searchByName(text, ['FEATURE_GROUP'], 100);
      const searchByIdPromise = REClient_.promises_()._searchById(text);
      const [searchByNameResponse, searchByIdResponse] = await Promise.all([searchByNamePromise, searchByIdPromise]);

      const searchResults = [];
      // very low chance for duplicate fgs but possible
      if (!hasError(searchByNameResponse)) {
        searchResults.push(...(mapResultToFeatureGroups(searchByNameResponse?.result) || []));
      }
      if (!hasError(searchByIdResponse)) {
        const resultsById = mapObjectToFeatureGroup(searchByIdResponse?.result);
        if (resultsById?.featureGroupId) {
          searchResults.push(mapObjectToFeatureGroup(searchByIdResponse?.result));
        }
      }

      this.setState({
        listfeatureGroups: this.state.filterLeftText !== '' ? searchResults : this.state.originalList,
      });
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  getSearchResultsDebounced = _.debounce(this.getSearchResults, 256);

  onChangeFilterLeftText = (e) => {
    this.setState(
      {
        filterLeftText: e.target.value,
      },
      this.getSearchResultsDebounced,
    ); // Fix for race condition b/w setState and getSearchResults
  };

  memLeftColumns = memoizeOne((filterLeftText) => {
    return [
      {
        title: '',
        noAutoTooltip: true,
        render: (text, row, index) => {
          let findS = null;
          if (row.isFindTableName) {
          }
          if (row.isFindId) {
          }

          let isCh = this.state.fgChecked?.[row.tableName] != null;

          const onChangeCh = (e) => {
            let ch = { ...(this.state.fgChecked ?? {}) };

            let v1 = e.target.checked === true;
            if (v1) {
              ch[row.tableName] = row;
            } else {
              delete ch[row.tableName];
            }

            this.setState({
              fgChecked: ch,
            });
          };

          return (
            <div
              css={`
                display: flex;
              `}
            >
              <div
                css={`
                  width: 27px;
                  margin-left: -10px;
                `}
              >
                <Checkbox checked={isCh} onChange={onChangeCh} />
              </div>
              <div css={``}>
                <div
                  css={`
                    opacity: 0.7;
                    margin-bottom: 3px;
                    font-size: 12px;
                  `}
                >
                  {UtilsTS.highlightIsTextInside(row.featureGroupId, filterLeftText)}
                </div>
                <div
                  css={`
                    width: ${Utils.dataNum('fgattach_left_ww', 300) - 2 * 15}px;
                  `}
                >
                  <TooltipExtOver>{UtilsTS.highlightIsTextInside(row.tableName, filterLeftText)}</TooltipExtOver>
                </div>
                <div
                  css={`
                    opacity: 0.9;
                    font-size: 12px;
                    margin-top: 5px;
                  `}
                >
                  <DateOld always date={row.createdAt} />
                </div>
                <div>{findS}</div>
              </div>
            </div>
          );
        },
      },
    ] as ITableExtColumn[];
  });

  calcIsSelectedLeft = (index) => {
    if (index === -1 || index == null) {
      return false;
    }

    const leftListFiltered = this.state.listfeatureGroups;
    let f1 = leftListFiltered?.[index];
    if (f1 == null) {
      return false;
    } else {
      return f1?.featureGroupId === this.state.featureGroupIdSel;
    }
  };

  onClickRowLeft = (row, key, e) => {
    this.setState({
      featureGroupIdSel: row?.featureGroupId,
      featureGroupIdSelType: row?.featureGroupType,
      featureGroupIdSelTableName: row?.tableName,
    });
  };

  onChangeFGType = (option1) => {
    this.setState({
      featureGroupIdSelType: option1?.value ?? null,
    });
  };

  memCheckedList = memoizeOne((fgChecked) => {
    let kk = Object.keys(fgChecked ?? {});
    if (kk.length > 0) {
      return (
        <div
          css={`
            font-size: 15px;
            text-align: center;
          `}
        >
          {kk.map((k1, k1ind) => {
            return (
              <div
                key={'k' + k1ind}
                css={`
                  margin: 5px 0;
                `}
              >
                <span
                  css={`
                    opacity: 0.7;
                  `}
                >
                  Attach&nbsp;Table:&nbsp;
                </span>
                {fgChecked?.[k1]?.tableName}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  });

  onClickExpand = (e) => {
    this.setState({
      isExpanded: !this.state.isExpanded,
    });
  };

  render() {
    let optionsfeatureGroups = this.memDatasetList(this.state.listfeatureGroups);
    let optionfeatureGroupsel = optionsfeatureGroups && optionsfeatureGroups.find((o1) => o1.value === this.state.featureGroupIdSel);

    let { paramsProp } = this.props;
    let schemaInfo = this.memUseCaseSchemas(false)(this.props.useCases, paramsProp && paramsProp.get('useCase'));

    let optionsDatasetType = this.memOptionsDatasetType(schemaInfo);
    let initialDatasetType = null;
    if (optionsDatasetType && optionsDatasetType.length === 1) {
      initialDatasetType = optionsDatasetType[0];
    }

    let initValues: any = {
      datasetType: initialDatasetType,
    };

    const topLeftHH = 40;

    const leftListFiltered = this.state.listfeatureGroups;
    const columnsLeft = this.memLeftColumns(this.state.filterLeftText);

    const checkedElem = this.memCheckedList(this.state.fgChecked);
    const topElemsHH = 160 + 30;

    return (
      <div
        className={sd.absolute}
        css={`
          margin: 30px;
        `}
      >
        {/*// @ts-ignore*/}
        <SplitPane
          split={'vertical'}
          minSize={200}
          defaultSize={Utils.dataNum('fgattach_left_ww', 300)}
          onChange={(v1) => {
            Utils.dataNum('fgattach_left_ww', undefined, v1);
          }}
        >
          <div
            css={`
              border-radius: 4px;
              overflow: hidden;
            `}
            className={sd.grayPanel + ' ' + sd.absolute}
          >
            <div
              className={sd.absolute}
              css={`
                margin: 15px;
              `}
            >
              <div
                css={`
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: ${topLeftHH}px;
                `}
              >
                <Input placeholder={'Filter TableName or ID'} value={this.state.filterLeftText} onChange={this.onChangeFilterLeftText} allowClear={true} />
              </div>

              <div
                css={`
                  position: absolute;
                  top: ${topLeftHH + 5}px;
                  left: 0;
                  right: 0;
                  bottom: 0;
                `}
              >
                <AutoSizer disableWidth>
                  {({ height }) => (
                    <TableExt
                      separator1
                      calcIsSelected={checkedElem != null ? undefined : this.calcIsSelectedLeft}
                      noHeader
                      onClickCell={checkedElem != null ? undefined : this.onClickRowLeft}
                      rowHeightVirtual={90}
                      disableSort
                      dataSource={leftListFiltered}
                      columns={columnsLeft}
                      calcKey={(r1) => r1.featureGroupId}
                      height={height}
                      isVirtual
                    />
                  )}
                </AutoSizer>
              </div>
            </div>
          </div>
          <div
            css={`
              margin-left: 5px;
            `}
            className={sd.grayPanel + ' ' + sd.absolute}
          >
            {checkedElem == null && (
              <div
                css={`
                  margin: 15px 15px 0 15px;
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: ${topElemsHH - 15}px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-direction: column;
                `}
              >
                {this.state.featureGroupIdSel && (
                  <div
                    css={`
                      margin-top: 10px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span
                      css={`
                        margin-right: 5px;
                        margin-left: 20px;
                        font-size: 14px;
                      `}
                    >
                      Feature Group Name:
                    </span>
                    {
                      <span
                        css={`
                          width: 260px;
                        `}
                      >
                        <Input
                          css={`
                            &.ant-input.ant-input {
                              background-color: #424242 !important;
                            }
                          `}
                          disabled={true}
                          value={this.state.featureGroupIdSelTableName}
                        />
                      </span>
                    }
                  </div>
                )}

                {this.state.featureGroupIdSel && (
                  <div
                    css={`
                      margin-top: 10px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span
                      css={`
                        margin-right: 5px;
                        margin-left: 20px;
                        font-size: 14px;
                      `}
                    >
                      Feature Group Type:
                    </span>
                    {
                      <span
                        css={`
                          width: 160px;
                        `}
                      >
                        <SelectExt
                          isDisabled={!this.state.featureGroupIdSel}
                          options={optionsDatasetType}
                          value={optionsDatasetType?.find((o1) => o1.value == (this.state.featureGroupIdSelType || Constants.custom_table))}
                          onChange={this.onChangeFGType}
                        />
                      </span>
                    }
                  </div>
                )}

                {this.state.featureGroupIdSel && (
                  <div
                    css={`
                      margin-top: 15px;
                    `}
                  >
                    <Button onClick={this.onClickAttach} disabled={!this.state.featureGroupIdSel} type={'primary'}>
                      Attach to Project
                    </Button>
                  </div>
                )}
              </div>
            )}

            {checkedElem == null && this.state.featureGroupIdSel && (
              <div
                className={sd.absolute}
                css={`
                  margin: 15px;
                  top: ${topElemsHH}px;
                `}
              >
                <div
                  onClick={this.onClickExpand}
                  css={`
                    cursor: pointer;
                    text-align: left;
                    font-size: 14px;
                    background: #2e2918;
                    margin: 10px 0 15px 0;
                    padding: 4px 10px;
                    display: flex;
                    align-items: center;
                  `}
                >
                  <span
                    css={`
                      width: 16px;
                      display: inline-block;
                      text-align: center;
                      margin-right: 4px;
                    `}
                  >
                    {!this.state.isExpanded && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCaretRight').faCaretRight} transform={{ size: 20, x: 0, y: 0 }} />}
                    {this.state.isExpanded && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCaretDown').faCaretDown} transform={{ size: 20, x: 0, y: 0 }} />}
                  </span>
                  <span>Show Details Feature Group</span>
                </div>

                {this.state.isExpanded && (
                  <div
                    css={`
                      position: absolute;
                      top: 30px;
                      left: 0;
                      right: 0;
                      bottom: 0;
                    `}
                  >
                    <NanoScroller onlyVertical>{this.state.featureGroupIdSel && <FeatureGroupDetail projectId={'-'} featureGroupId={this.state.featureGroupIdSel} isSmall />}</NanoScroller>
                  </div>
                )}
              </div>
            )}

            {checkedElem != null && (
              <div css={``}>
                <div
                  css={`
                    margin: 15px 15px 15px 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  `}
                >
                  <Button onClick={this.onClickAttachAll} type={'primary'}>
                    Attach to Project Feature Groups
                  </Button>
                  <Button
                    css={`
                      margin-left: 20px;
                    `}
                    onClick={this.onClickAttachAllCancel}
                    ghost
                    type={'default'}
                  >
                    Cancel
                  </Button>
                </div>
                {checkedElem}
              </div>
            )}
          </div>
        </SplitPane>

        {false && (
          <div style={{ maxWidth: '600px', margin: '80px auto 0' }}>
            <FormExt layout={'vertical'} onFinish={this.onClickAttach} className="login-form" ref={this.formRef} initialValues={initValues}>
              <SelectExt isSearchable value={optionfeatureGroupsel} options={optionsfeatureGroups} onChange={this.onChangeSelectDataset} menuPortalTarget={document.getElementById('body2')} />
              <Form.Item
                name={'datasetType'}
                rules={[{ required: false }]}
                style={{ marginTop: '15px', marginBottom: '1px' }}
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Feature Group Type:&nbsp;&nbsp;&nbsp;&nbsp;</span>}
              >
                <SelectExt style={{ fontWeight: 400, color: Utils.colorA(1) }} options={optionsDatasetType} />
              </Form.Item>
              <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <Button htmlType="submit" type={'primary'}>
                  Attach to Project
                </Button>
              </div>
            </FormExt>
          </div>
        )}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    featureGroups: state.featureGroups,
    projects: state.projects,
    defFeatureGroups: state.defFeatureGroups,
    useCases: state.useCases,
  }),
  null,
)(FeatureGroupAttach);
