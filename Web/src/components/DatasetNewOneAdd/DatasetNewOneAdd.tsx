import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import _ from 'lodash';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import Constants from '../../constants/Constants';
import { memoizeOneCurry } from '../../libs/memoizeOne';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import PartsLink from '../NavLeft/PartsLink';
import PreviewFieldsRect from '../PreviewFieldsRect/PreviewFieldsRect';
const s = require('./DatasetNewOneAdd.module.css');
const sd = require('../antdUseDark.module.css');

interface IDatasetNewOneAddProps {
  paramsProp?: any;
  defDatasets?: any;
  useCases?: any;
  projects?: any;
}

interface IDatasetNewOneAddState {}

class DatasetNewOneAdd extends React.PureComponent<IDatasetNewOneAddProps, IDatasetNewOneAddState> {
  isM: boolean;

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

  componentDidUpdate(prevProps: Readonly<IDatasetNewOneAddProps>, prevState: Readonly<IDatasetNewOneAddState>, snapshot?: any) {
    this.doMem();
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

    let useCaseInfo = this.memUseCaseSchemas(true)(this.props.useCases, this.props.paramsProp?.get('useCase'));
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

  onClickUploadNew = (e) => {
    let { paramsProp } = this.props;
    if (paramsProp) {
      let projectId = paramsProp.get('projectId');
      if (projectId) {
        Location.push('/' + PartsLink.dataset_upload + '/' + projectId, undefined, this.calcParamsQueryActual());
      }
    }
  };

  onClickAttach = (e) => {
    let { paramsProp } = this.props;
    if (paramsProp) {
      let projectId = paramsProp.get('projectId');
      if (projectId) {
        Location.push('/' + PartsLink.dataset_attach + '/' + projectId, undefined, this.calcParamsQueryActual());
      }
    }
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  render() {
    const styleButton: CSSProperties = {
      width: '300px',
    };

    let { paramsProp, defDatasets, useCases } = this.props;

    let datasetTypeSel = null,
      useCase = null,
      projectId = null;
    let returnToUseCase = paramsProp ? paramsProp.get('returnToUseCase') : null;
    if (returnToUseCase === true || returnToUseCase === 'true') {
      datasetTypeSel = paramsProp && paramsProp.get('datasetType');
      useCase = paramsProp && paramsProp.get('useCase');
      projectId = paramsProp && paramsProp.get('projectId');
    }

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    let useCaseInfo = this.memUseCaseSchemas(false)(this.props.useCases, useCase);

    let showPreviewForceCustom =
      datasetTypeSel?.toUpperCase() === Constants.custom_table &&
      useCaseInfo?.list
        ?.map((s1) => {
          let u1 = useCaseInfo?.[s1];
          if (u1) {
            const dt1 = u1.dataset_type ?? u1.datasetType;
            if (dt1?.toUpperCase() === Constants.custom_table) {
              if (!u1.isCustom) {
                return true;
              }
            }
          }
        })
        ?.some((v1) => v1 === true);

    return (
      <div style={{ paddingTop: '80px', margin: '0 30px' }}>
        <table style={{ border: 0, margin: '0 auto' }}>
          <tbody>
            <tr>
              {datasetTypeSel != null && useCase != null && (showPreviewForceCustom || datasetTypeSel?.toUpperCase() !== Constants.custom_table) && (
                <td>
                  <PreviewFieldsRect hideIfEmpty showBorder datasetType={datasetTypeSel} useCase={useCase} projectId={projectId} />
                </td>
              )}
              <td>
                <div style={{ display: 'inline-block', maxWidth: '400px' }}>
                  <div style={{ textAlign: 'center', fontFamily: 'Matter', fontSize: '24px', marginBottom: '26px' }}>
                    <FontAwesomeIcon icon={['far', 'file-upload']} transform={{ size: 16, x: 0 }} style={{ opacity: 1, marginRight: '16px' }} />
                    Create Dataset
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <Button style={styleButton} type={'default'} onClick={this.onClickUploadNew}>
                      Create New
                    </Button>
                  </div>

                  <div>
                    <div style={{ position: 'relative', height: '30px', paddingTop: '5px', textAlign: 'center' }}>
                      <div style={{ position: 'absolute', top: '14px', left: 0, right: 0, height: '1px', backgroundColor: '#2e4164', color: 'white' }}></div>
                      <div className={sd.absolute} style={{ textAlign: 'center', marginTop: '4px' }}>
                        or
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <Button style={styleButton} type={'default'} onClick={this.onClickAttach}>
                        Attach Existing Dataset
                      </Button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
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
)(DatasetNewOneAdd);
