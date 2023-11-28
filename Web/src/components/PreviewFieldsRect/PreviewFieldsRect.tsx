import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Card from 'antd/lib/card';
import _ from 'lodash';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import Utils from '../../../core/Utils';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import defDatasets, { calcFileDataUseByDatasetIdProjectId } from '../../stores/reducers/defDatasets';
import { calcProjectCreateState } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import { ProjectDatasetType } from '../DatasetForUseCase/ProjectDatasetType';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./PreviewFieldsRect.module.css');
const sd = require('../antdUseDark.module.css');

interface IPreviewFieldsRectProps {
  paramsProp?: any;
  defDatasets?: any;
  useCases?: any;
  projects?: any;
  style?: any;
  datasetType?: string;
  useCase?: string;
  datasetId?: string;
  projectId?: string;
  noTitle?: boolean;
  isOnlyText?: boolean;
  validate?: boolean;
  onlyInvalid?: boolean;
  allValidText?: string;
  useLinkToSchema?: boolean;
  forceSpanUse?: boolean;
  dontCheckRequiredFieldsErrors?: boolean;
  isDash?: boolean;
  isActive?: boolean;
  showBorder?: boolean;
  hideIfEmpty?: boolean;
}

interface IPreviewFieldsRectState {}

class PreviewFieldsRect extends React.PureComponent<IPreviewFieldsRectProps, IPreviewFieldsRectState> {
  private isM: boolean;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
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

    let selUseCase = this.memUseCaseSel(true)(this.props.useCases, this.props.useCase);
    let info = this.memUseCaseSchemas(true)(this.props.useCases, this.props.useCase);
    let schemaDataset = this.memSchemaForDataset(true)(this.props.defDatasets, this.props.datasetId, this.props.projectId);
    let validateList: { list: any; validOne: any } = this.memValidation(true)(this.props.defDatasets, this.props.projectId, this.props.datasetType);
  };

  componentDidUpdate(prevProps: Readonly<IPreviewFieldsRectProps>, prevState: Readonly<IPreviewFieldsRectState>, snapshot?: any): void {
    this.doMem();
  }

  memPreviewDatasetTypeRender = memoizeOne((useCases, info, datasetType, selUseCase, isOnlyText, validateList, datasetId, projectId, isDash, schemaList, isActive, validationData, schemaDataset: { name; featureMapping }[]) => {
    if (info && datasetType) {
      let dataList = [];
      let processList = (list) => {
        list &&
          list
            ?.filter((d1) => !isDash || d1.data_use != null)
            ?.some((d1) => {
              let name1 = d1.name;
              let value = d1.data_use;
              let desc1 = d1.description;
              let isRequired = !d1.optional;

              let validateMsg = null;
              if (name1 && validateList && !this.props.dontCheckRequiredFieldsErrors) {
                let validOne = validateList.validOne;
                if (validOne?.requiredColumns) {
                  let needByValidation = validOne?.requiredColumns[name1?.toUpperCase()];
                  if (needByValidation === false) {
                    validateMsg = (
                      <span style={{ marginLeft: '4px', color: '#ff6582' }}>
                        <TooltipExt title={'Missing field'}>
                          <span>(Invalid)</span>
                        </TooltipExt>
                      </span>
                    );
                  }
                }
              }

              let columnUser = null;
              if (d1.customData != null) {
                columnUser = d1.customData;
              } else if (schemaDataset && name1) {
                let schemaFound1 = schemaDataset.find((f1) => (f1.featureMapping || '').toLowerCase() === (name1 || '').toLowerCase());
                if (schemaFound1) {
                  columnUser = schemaFound1.name;
                }
              }

              let isConfirmed = null;
              if (validationData) {
                let listAll = (validationData.requiredDatasets || []).concat(validationData.optionalDatasets || []);
                let valid1 = listAll.find((v1) => (v1.datasetType || '').toLowerCase() === (datasetType || '').toLowerCase());
                if (valid1) {
                  isConfirmed = valid1.confirmed === true;
                }
              }

              dataList.push({
                name: name1,
                validateMsg,
                columnUser,
                description: desc1,
                required: <span style={{ whiteSpace: 'nowrap' }}>{isRequired ? 'Required' : 'Optional'}</span>,
                isRequired,
                isConfirmed,
              });
            });
      };

      // @ts-ignore
      let schema = Object.values(info)?.find((type) => type.dataset_type == datasetType)?.schema;
      if (schema != null) {
        schema = _.clone(schema);
      }

      let customVariablesData = null;
      // @ts-ignore
      if (Object.values(info)?.find((type) => type.dataset_type == datasetType)?.use_wizard_variables_data) {
        customVariablesData = calcProjectCreateState(projectId);
        if (customVariablesData && !_.isEmpty(customVariablesData)) {
          if (!schema) {
            schema = [];
          }
          let indTarget = schema.findIndex((s1) => s1.data_use === 'target');
          if (indTarget === -1) {
            indTarget = 0;
          } else {
            if (!Utils.isNullOrEmpty(customVariablesData.target) && schema?.[indTarget] != null) {
              schema[indTarget].name = customVariablesData.target;
            }

            indTarget++;
          }
          let count1 = customVariablesData.valuesCount ?? 0;
          new Array(count1).fill(null).some((c1, ind) => {
            let v1 = customVariablesData['value_' + ind];
            if (v1 != null && _.trim(v1) !== '') {
              schema.splice(indTarget, 0, {
                name: v1,
                customData: v1,
              });
              indTarget++;
            }
          });
        } else {
          customVariablesData = null;
        }
      }

      processList(schema);
      // processList(reqFields.get('multiUseDataUses'), false);

      let doLink = (value) => {
        if (this.props.useLinkToSchema) {
          return (
            <Link forceSpanUse={this.props.forceSpanUse} to={datasetId && projectId ? '/' + PartsLink.dataset_schema + '/' + datasetId + '/' + projectId : null}>
              {value}
            </Link>
          );
        } else {
          return value;
        }
      };

      if (isOnlyText) {
        let validateInvalidMsg = null;
        if (validateList) {
          let validOne = validateList.validOne;
          if (validOne?.invalidColumns) {
            let errorList = [];
            validOne?.invalidColumns?.some((i1) => {
              let kk = Object.keys(i1);
              kk?.some((k1) => {
                errorList.push(<div key={'err_' + k1}>* {i1[k1]}</div>);
              });
            });
            if (errorList.length > 0) {
              validateInvalidMsg = <TooltipExt title={<div>{errorList}</div>}>{doLink(<span style={{ marginLeft: '4px', color: '#ff6582' }}>&nbsp;-&nbsp;(More Errors)</span>)}</TooltipExt>;
            }
          }
        }

        let dataListShow = dataList && dataList.filter((d1) => !this.props.onlyInvalid || d1.validateMsg != null).filter((d1) => !['ignore', 'future'].includes(d1?.name?.toLowerCase()));
        let isAllValid = dataList && dataList.find((d1) => d1.validateMsg != null) == null;
        let allValid = null;
        if (isAllValid && this.props.onlyInvalid && this.props.allValidText) {
          allValid = <span style={{ color: '#4fa04b' }}>{this.props.allValidText}</span>;
        }
        return (
          <div style={{ fontFamily: 'Roboto', fontSize: '14px', lineHeight: '1.57', color: '#8798ad' }}>
            {validateInvalidMsg == null && allValid}
            {!isDash &&
              dataListShow.map((d1, d1ind) => {
                let sep = null;
                if (d1ind > 0) {
                  sep = <span>, </span>;
                }
                return (
                  <span key={'dash_text_' + d1ind + '_' + d1.name}>
                    {sep}
                    {d1.name}
                    {d1.validateMsg && doLink(d1.validateMsg)}
                  </span>
                );
              })}
            {isDash &&
              dataListShow
                .map((d1, d1ind) => {
                  if (Utils.isNullOrEmpty(d1.columnUser) && !d1.validateMsg && !d1.isRequired) {
                    return null;
                  }

                  return (
                    <div key={'dash_text_' + d1ind + '_' + d1.name} style={{ marginTop: '3px', marginBottom: '5px', paddingLeft: '12px' }}>
                      <span className={sd.styleTextGray}>
                        {d1.name}
                        {d1.isRequired ? <span>&nbsp;(Required)</span> : null}
                      </span>
                      {d1.validateMsg && doLink(d1.validateMsg)}
                      {!d1.validateMsg && <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 15, x: 0, y: 0 }} style={{ color: !d1.isConfirmed ? '#ccd491' : '#33ac2e', marginLeft: '5px', marginRight: '6px' }} />}
                      {d1.columnUser && (
                        <span style={{ marginLeft: '5px' }} className={sd.styleTextGrayLight}>
                          {d1.columnUser}
                        </span>
                      )}
                    </div>
                  );
                })
                .filter((v1) => v1 != null)}
            {validateInvalidMsg}
          </div>
        );
      } else {
        const descWW = 280;
        let dataListRender = null;
        if (dataList) {
          dataListRender = dataList.map((d1, d1ind) => {
            return (
              <div key={'fff_' + d1ind} style={{ display: 'table-row' }}>
                <span style={{ padding: '3px 24px 3px 4px', textAlign: 'left', display: 'table-cell', fontFamily: 'Matter', fontSize: '14px', fontWeight: 500 }} className={sd.linkGreen}>
                  {d1.name}
                </span>
                <span style={{ padding: '3px 18px 3px 4px', textAlign: 'left', display: 'table-cell', fontFamily: 'Matter', fontSize: '14px', color: '#fff', width: descWW + 'px' }}>{d1.description}</span>
                <span style={{ padding: '3px 4px 3px 4px', textAlign: 'left', display: 'table-cell', fontFamily: 'Matter', fontSize: '14px' }}>
                  {d1.isRequired ? <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 15, x: 0, y: 0 }} style={{ color: '#33ac2e' }} /> : null}
                </span>
              </div>
            );
          });
        }
        let headerRender = (
          <div style={{ display: 'table-row' }}>
            <span style={{ padding: '3px 24px 3px 4px', textAlign: 'left', display: 'table-cell' }} className={sd.styleTextHeader}>
              FIELD
            </span>
            <span style={{ padding: '3px 18px 3px 4px', textAlign: 'left', display: 'table-cell', width: descWW + 'px' }} className={sd.styleTextHeader}>
              DESCRIPTION
            </span>
            <span style={{ padding: '3px 4px 3px 4px', textAlign: 'left', display: 'table-cell' }} className={sd.styleTextHeader}>
              REQUIRED
            </span>
          </div>
        );

        let exampleTable = null;
        let internalType = info?.list?.filter((dataset) => (info[dataset]['dataset_type'] || '').toLowerCase() === (datasetType || '').toLowerCase())?.[0];
        let tableData = info?.[internalType]?.example;
        if (tableData) {
          let rowsExampleCount = tableData.data?.[0]?.length ?? 0;

          exampleTable = (
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  padding: '9px 5px 11px 5px',
                  fontFamily: 'Matter',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#0b121b',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                }}
              >
                <div style={{ maxWidth: descWW + 120 + 'px', margin: '0 auto' }}>{tableData?.description ?? 'Example dataset data'}</div>
              </div>

              <div style={{ display: 'table', padding: '10px 16px 18px 16px', backgroundColor: '#131b26', width: '100%', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>
                <div style={{ display: 'table-row' }}>
                  {tableData.headers?.map((h1) => {
                    return (
                      <div key={'ex_header_' + h1} style={{ padding: '3px 8px', display: 'table-cell', fontFamily: 'Roboto', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold', lineHeight: 1.57, color: '#d1e4f5' }}>
                        {h1}
                      </div>
                    );
                  })}
                </div>
                {new Array(rowsExampleCount).fill(null).map((r1, r1ind) => {
                  return (
                    <div key={'ex_row_' + r1ind} style={{ display: 'table-row' }}>
                      {tableData.data?.map((rows, colind) => {
                        return (
                          <div key={'ex_col_row_' + colind + '_' + r1ind} style={{ padding: '3px 8px', display: 'table-cell', fontFamily: 'Matter', fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
                            {rows[r1ind]}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <div
                css={`
                  font-size: 13px;
                  color: white;
                  opacity: 0.5;
                  margin-top: 6px;
                  font-weight: 300;
                `}
              >
                (Please note that this is just an example, ideally, you will have far more columns in your data)
              </div>
            </div>
          );
        }

        if (this.props.hideIfEmpty) {
          if (dataListRender == null || dataListRender.length === 0) {
            return null;
          }
        }

        return (
          <div>
            {this.props.noTitle !== true && <div style={{ color: Utils.colorA(1), paddingBottom: '8px', textAlign: 'center' }}>Expected dataset columns</div>}
            <div style={{ display: 'table' }}>
              {headerRender}
              {dataListRender}
            </div>
            {exampleTable}
          </div>
        );
      }
    }
  });

  memUseCaseSel = memoizeOneCurry((doCall, useCases, useCase) => {
    if (useCases && useCase) {
      if (useCases.get('isRefreshing')) {
        return;
      }

      if (useCases.get('neverDone')) {
        if (doCall) {
          StoreActions.getUseCases_();
        }
      } else {
        let list = useCases.get('list');
        if (list) {
          return list.find((u1) => u1.useCase === useCase);
        }
      }
    }
  });

  memValidation: (doCall) => (defDatasetsParam, projectId, datasetType) => { list: any; validOne: any } = memoizeOneCurry((doCall, defDatasetsParam, projectId, datasetType) => {
    let validationsProject = defDatasets.memValidationForProjectId(doCall, projectId);

    let validOne = null;
    if (validationsProject && datasetType) {
      let listAll = (validationsProject.requiredDatasets || []).concat(validationsProject.optionalDatasets || []);
      validOne = listAll.find((v1) => (v1.datasetType || '').toLowerCase() === (datasetType || '').toLowerCase());
    }

    return { list: validationsProject, validOne };
  });

  memSchemaToList = memoizeOne((info, datasetType) => {
    if (info && datasetType) {
      // @ts-ignore
      let data = Object.values(info)?.find((dataset) => dataset.dataset_type == datasetType);
      if (data) {
        let dataList = [];

        // @ts-ignore
        data.schema?.some((f1) => {
          dataList.push({
            name: f1.name,
            dataUse: f1.data_use,
          });
        });

        if (dataList.length === 0) {
          return null;
        } else {
          return dataList;
        }
      }
    }
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  memSchemaForDataset: (doCall) => (defDatasets, datasetId, projectId) => { name; dataType; dataUse }[] = memoizeOneCurry((doCall, defDatasets, datasetId, projectId) => {
    if (defDatasets && projectId && datasetId) {
      let dsSchema1 = calcFileDataUseByDatasetIdProjectId(undefined, datasetId, projectId);
      if (dsSchema1 == null) {
        if (defDatasets.get('isRefreshing') === 0) {
          if (doCall) {
            StoreActions.schemaGetFileDataUse_(projectId, datasetId);
          }
          return null;
        }
      } else {
        let dataList = [];
        dsSchema1?.get('schema')?.some((f1) => {
          dataList.push({
            name: f1.get('name'),
            featureMapping: f1.get('featureMapping'),
            featureType: f1.get('featureType'),
          });
        });

        if (dataList?.length === 0) {
          dataList = null;
        }
        return dataList;
      }
    }
  });

  render() {
    let { isOnlyText, paramsProp, defDatasets, useCases, projects, validate } = this.props;

    let previewSchema = null;
    if (!this.props.isDash && this.props.datasetType?.toLowerCase() === ProjectDatasetType.SECONDARY_TABLE.toLowerCase()) {
      previewSchema = (
        <div
          css={`
            width: 600px;
            color: white;
          `}
        >
          You can have any number of arbitrary columns in this table as long as there is a column in the table that maps to a column in your primary dataset. The column should be named the same way as the column in your primary dataset. For
          example: If you have 2 tables called user-profiles and user-activity. The join-key across both these tables should be user-id
        </div>
      );
    } else {
      let validateList: { list: any; validOne: any } = this.memValidation(false)(defDatasets, this.props.projectId, this.props.datasetType);

      // let reqFields = this.memPreviewDatasetType(defDatasets, this.props.datasetType, projects, this.props.projectId, this.props.useCase);
      let selUseCase = this.memUseCaseSel(false)(useCases, this.props.useCase);

      let info = this.memUseCaseSchemas(false)(useCases, this.props.useCase);
      // let datasetSchema1 = this.memDatasetSchema(defDatasets, this.props.projectId, this.props.datasetId);
      let schemaList = this.memSchemaToList(info, this.props.datasetType);
      let schemaDataset = this.memSchemaForDataset(false)(defDatasets, this.props.datasetId, this.props.projectId);
      previewSchema = this.memPreviewDatasetTypeRender(
        useCases,
        info,
        this.props.datasetType,
        selUseCase,
        isOnlyText,
        validate ? validateList : null,
        this.props.datasetId,
        this.props.projectId,
        this.props.isDash,
        schemaList,
        this.props.isActive,
        validateList?.list,
        schemaDataset,
      );
    }

    if (previewSchema == null) {
      return null;
    }

    let res = <div style={_.assign({} as CSSProperties, this.props.style || {})}>{previewSchema}</div>;

    if (this.props.showBorder) {
      res = (
        <Card
          style={{ minWidth: '380px', display: 'inline-block', marginRight: '50px', boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.24), backgroundColor: 'transparent', borderRadius: '5px' }}
          className={sd.grayPanel}
        >
          {res}
        </Card>
      );
    }

    return res;
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    defDatasets: state.defDatasets,
    useCases: state.useCases,
    projects: state.projects,
  }),
  null,
)(PreviewFieldsRect);
