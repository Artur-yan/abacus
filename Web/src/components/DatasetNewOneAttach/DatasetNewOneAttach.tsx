import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import batchPred from '../../stores/reducers/batchPred';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import DateOld from '../DateOld/DateOld';
import FormExt from '../FormExt/FormExt';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./DatasetNewOneAttach.module.css');
const sd = require('../antdUseDark.module.css');

interface IDatasetNewOneAttachProps {
  paramsProp?: any;
  datasets?: any;
  projects?: any;
  useCases?: any;
  defDatasets?: any;
  batchPred?: any;
}

interface IDatasetNewOneAttachState {
  datasetIdSel?: any;
  listDatasets?: any;
}

class DatasetNewOneAttach extends React.PureComponent<IDatasetNewOneAttachProps, IDatasetNewOneAttachState> {
  private isM: boolean;
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);

    REClient_.client_().listDatasets(1000, null, null, (err, res) => {
      if (err || !res?.success || !res?.result) {
        //
      } else {
        this.setState({
          listDatasets: res?.result,
        });
      }
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
    let projectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let schemaInfo = this.memUseCaseSchemas(true)(this.props.useCases, this.props.paramsProp?.get('useCase'));
    let batchOne = this.memBatchOne(true)(this.props.batchPred, this.props.paramsProp?.get('batchPredId'));
  };

  memBatchOne = memoizeOneCurry((doCall, batchPredParam, batchPredId) => {
    return batchPred.memBatchDescribe(undefined, batchPredId, doCall);
  });

  componentDidUpdate(prevProps: Readonly<IDatasetNewOneAttachProps>, prevState: Readonly<IDatasetNewOneAttachState>, snapshot?: any): void {
    this.doMem();
  }

  memDatasetList = memoizeOne((list) => {
    if (list) {
      let optionsDatasets = [];
      list
        .filter((d1: any) => !!d1.featureGroupTableName)
        .some((d1, d1ind) => {
          let name1 = d1.name;

          let desc1 = (
            <span>
              <span
                css={`
                  opacity: 0.7;
                  font-size: 12px;
                  margin-left: 10px;
                `}
              >
                ID: {d1.datasetId}
              </span>

              <span
                css={`
                  opacity: 0.7;
                  font-size: 12px;
                  margin-left: 10px;
                `}
              >
                Table Name: {d1.featureGroupTableName}
              </span>

              <span
                css={`
                  opacity: 0.7;
                  font-size: 12px;
                  margin-left: 10px;
                `}
              >
                <DateOld date={d1.createdAt} always />
              </span>
            </span>
          );

          let obj1 = {
            value: d1.datasetId,
            label: (
              <span style={{ fontWeight: 600 }}>
                {name1}
                {desc1}
              </span>
            ),
            name: name1,
            search: d1.featureGroupTableName,
            tableName: d1.featureGroupTableName,
          };
          optionsDatasets.push(obj1);
        });

      optionsDatasets = optionsDatasets.sort((a, b) => {
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      });

      return optionsDatasets;
    }
  });

  onChangeSelectDataset = (optionSel) => {
    this.setState({
      datasetIdSel: optionSel ? optionSel.value : null,
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
        oriDatasetId: paramsProp.get('oriDatasetId'),
        returnToUseCaseCreate: paramsProp.get('returnToUseCaseCreate'),
        isDataset: paramsProp.get('isDataset'),
      },
      otherProps || {},
    );
    return Utils.processParamsAsQuery(res);
  };

  onClickCreateFG = (values) => {
    let datasetType = values.datasetType?.value;
    // let tableName = values.name;
    let datasetId = this.state.datasetIdSel;
    if (!datasetId) {
      REActions.addNotificationError('Dataset is required');
    } else {
      let optionsDatasets = this.memDatasetList(this.state.listDatasets, true);
      let optionDatasetSel = optionsDatasets && optionsDatasets.find((o1) => o1.value === datasetId);
      let projectId = this.props?.paramsProp?.get('projectId');
      if (projectId) {
        REClient_.client_().describeFeatureGroupByTableName(optionDatasetSel?.tableName, projectId, (err, res) => {
          if (err || !res?.result) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            let featureGroupId = res?.result?.featureGroupId;
            REClient_.client_().attachFeatureGroupToProject(featureGroupId, projectId, datasetType, (err, res) => {
              if (err) {
                REActions.addNotificationError(err);
              } else {
                StoreActions.getProjectsById_(projectId);
                StoreActions.validateProjectDatasetsReset_();
                StoreActions.getProjectDatasets_(projectId, (res, ids) => {
                  StoreActions.listDatasets_(ids);
                });
                StoreActions.featureGroupsGetByProject_(projectId);
                StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
                Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
              }
            });
          }
        });
      }
    }
  };

  onClickAttachBatchDataset = (values) => {
    const projectId = this.props.paramsProp?.get('projectId');

    const batchPredId = this.props.paramsProp?.get('batchPredId');
    const oriDatasetId = this.props.paramsProp?.get('oriDatasetId');

    let batchOne = this.memBatchOne(false)(this.props.batchPred, this.props.paramsProp?.get('batchPredId'));

    let datasetId = this.state.datasetIdSel;
    if (batchOne && datasetId && batchPredId && oriDatasetId) {
      let data1 = batchOne?.batchInputs?.datasetIdRemap ?? {};
      data1 = { ...data1 };
      data1[oriDatasetId] = datasetId;

      REClient_.client_().setBatchPredictionDatasetRemap(batchPredId, JSON.stringify(data1), (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.getProjectsById_(projectId);
          StoreActions.batchList_(projectId);
          StoreActions.batchDescribeById_(batchPredId);

          if (this.props.paramsProp?.get('returnToUseCaseCreate') === 'true') {
            let isDataset = this.props.paramsProp?.get('isDataset') === 'true';
            Location.push('/' + PartsLink.batchpred_create + '/' + projectId + '/' + batchPredId, undefined, isDataset ? 'isDataset=true' : undefined);
          } else {
            Location.push('/' + PartsLink.batchpred_datasets + '/' + projectId + '/' + batchPredId);
          }
        }
      });
    }
  };

  onClickAttach = (values) => {
    let datasetType = values.datasetType?.value;
    const batchPredId = this.props.paramsProp?.get('batchPredId');

    let datasetId = this.state.datasetIdSel;
    if (datasetId) {
      let { paramsProp } = this.props;
      if (paramsProp) {
        let projectId = paramsProp.get('projectId');
        if (projectId) {
          if (batchPredId) {
            REClient_.client_().setBatchPredictionDataset(batchPredId, datasetType, datasetId, (err, res) => {
              if (err) {
                REActions.addNotificationError(err);
              } else {
                StoreActions.getProjectsList_();
                StoreActions.getProjectsById_(projectId);
                StoreActions.listDatasets_([datasetId]);
                StoreActions.getProjectsById_(projectId);
                StoreActions.validateProjectDatasets_(projectId);
                StoreActions.getProjectDatasets_(projectId);
                StoreActions.listModels_(projectId);

                StoreActions.batchList_(projectId);
                StoreActions.batchListVersions_(batchPredId);
                StoreActions.batchDescribeById_(batchPredId);

                if (paramsProp?.get('returnToUseCaseCreate') === 'true') {
                  let isDataset = paramsProp?.get('isDataset') === 'true';
                  Location.push('/' + PartsLink.batchpred_create + '/' + projectId + '/' + batchPredId, undefined, isDataset ? 'isDataset=true' : undefined);
                } else if (this.props.paramsProp?.get('returnToUseCase')) {
                  let isDataset = paramsProp?.get('isDataset') === 'true';
                  Location.push('/' + PartsLink.batchpred_create + '/' + projectId + '/' + batchPredId, undefined, isDataset ? 'isDataset=true' : undefined);
                } else {
                  Location.push('/' + PartsLink.batchpred_detail + '/' + projectId + '/' + batchPredId);
                }
              }
            });
          } else {
            REClient_.client_().attachDatasetToProject(projectId, datasetId, datasetType, (err, res) => {
              if (err) {
                REActions.addNotificationError(err);
              } else {
                StoreActions.getProjectsList_();
                StoreActions.getProjectsById_(projectId);
                StoreActions.listDatasets_([datasetId]);
                StoreActions.getProjectsById_(projectId);
                StoreActions.validateProjectDatasets_(projectId);
                StoreActions.getProjectDatasets_(projectId);
                StoreActions.listModels_(projectId);

                if (this.props.paramsProp && this.props.paramsProp.get('returnToUseCase')) {
                  Location.push('/' + PartsLink.dataset_for_usecase + '/' + projectId, undefined, this.calcParamsQueryActual());
                } else {
                  Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
                }
              }
            });
          }
        }
      }
    } else {
      REActions.addNotificationError('Select a dataset first!');
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

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  render() {
    let { paramsProp, projects, defDatasets } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let foundProject1 = this.memProjectId(false)(projectId, projects);
    let optionsDatasets = this.memDatasetList(this.state.listDatasets);
    let optionDatasetSel = optionsDatasets && optionsDatasets.find((o1) => o1.value === this.state.datasetIdSel);

    let popupContainerForMenu = (node) => document.getElementById('body2');
    let menuPortalTarget = popupContainerForMenu(null);

    let schemaInfo = this.memUseCaseSchemas(false)(this.props.useCases, paramsProp && paramsProp.get('useCase'));
    // let reqFields = this.memProjectDatasetsReqs(defDatasets, projects, projectId, paramsProp.get('useCase') || '');

    let optionsDatasetType = this.memOptionsDatasetType(schemaInfo);
    let initialDatasetType = null;
    if (optionsDatasetType && optionsDatasetType.length === 1) {
      initialDatasetType = optionsDatasetType[0];
    }

    let disableDatasetType = false;
    if (paramsProp) {
      if (paramsProp.get('datasetType')) {
        let datasetTypeFromParam = optionsDatasetType.find((o1) => (o1.value || '').toLowerCase() === (paramsProp.get('datasetType') || '').toLowerCase());
        if (datasetTypeFromParam) {
          initialDatasetType = datasetTypeFromParam;
          disableDatasetType = false;
        }
      }
    }

    let initValues: any = {
      datasetType: initialDatasetType,
    };

    const batchPredId = this.props.paramsProp?.get('batchPredId');

    return (
      <div className={sd.absolute}>
        <div style={{ maxWidth: '600px', margin: '80px auto 0' }}>
          <FormExt layout={'vertical'} onFinish={batchPredId ? this.onClickAttachBatchDataset : this.onClickCreateFG} className="login-form" ref={this.formRef} initialValues={initValues}>
            <div style={{ color: Utils.isDark() ? 'white' : 'black', marginBottom: '6px' }}>Dataset Name:&nbsp;&nbsp;&nbsp;&nbsp;</div>
            <SelectExt value={optionDatasetSel} options={optionsDatasets} onChange={this.onChangeSelectDataset} isSearchable={true} menuPortalTarget={menuPortalTarget} />

            {!batchPredId && (
              <div style={{ marginTop: '10px' }}>
                <Form.Item
                  name={'datasetType'}
                  rules={[{ required: false, message: 'Project Dataset Type required' }]}
                  style={{ marginBottom: '1px' }}
                  label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Dataset Type:&nbsp;&nbsp;&nbsp;&nbsp;</span>}
                >
                  <SelectExt isDisabled={disableDatasetType} style={{ fontWeight: 400, color: Utils.colorA(1) }} options={optionsDatasetType} />
                </Form.Item>
              </div>
            )}

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <Button htmlType="submit" type={'primary'}>
                {batchPredId ? 'Override' : 'Attach Dataset'}
              </Button>
            </div>
          </FormExt>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    datasets: state.datasets,
    projects: state.projects,
    defDatasets: state.defDatasets,
    useCases: state.useCases,
    batchPred: state.batchPred,
  }),
  null,
)(DatasetNewOneAttach);
