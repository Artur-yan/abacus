import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Space from 'antd/lib/space';
import Spin from 'antd/lib/spin';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { calcDocStoreDefFromProject } from '../../api/DocStoreInterfaces';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./DatasetNewOneUpload.module.css');
const sd = require('../antdUseDark.module.css');

interface IDatasetNewOneProps {
  paramsProp?: any;
  projects?: any;
  useCases?: any;
  defDatasets?: any;
}

interface IDatasetNewOneState {
  isProcessing: boolean;
}

class DatasetNewOneUpload extends React.PureComponent<IDatasetNewOneProps, IDatasetNewOneState> {
  private isM: boolean;
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isProcessing: false,
    };
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

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      return null;
    } else {
      return projectId;
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let useCase1 = this.memProjectUseCase(foundProject1);
    let schemaInfo = this.memUseCaseSchemas(true)(this.props.useCases, useCase1);
  };

  componentDidUpdate(prevProps: Readonly<IDatasetNewOneProps>, prevState: Readonly<IDatasetNewOneState>, snapshot?: any): void {
    this.doMem();
  }

  handleSubmit = (values) => {
    let name = values.name;
    let datasetType = values.datasetType;
    if (datasetType) {
      if (datasetType.value) {
        datasetType = datasetType.value;
      } else {
        datasetType = 'custom';
      }
    } else {
      datasetType = '-';
    }
    let tablename = values.name;

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let docStoreDef = calcDocStoreDefFromProject(foundProject1);
    let docStoreIsDocument = values.docStoreIsDocument; // value can be 'a' or 'b'
    let docStoreExtractBoundingBoxes = !!docStoreIsDocument && docStoreDef?.extractBoundingBoxesForDataset === true;

    const doFinishWork = () => {
      let { paramsProp } = this.props;
      let projectId = null;
      if (paramsProp) {
        projectId = this.calcProjectId();
      }

      let params: any = {
        problem: paramsProp.get('problem'),
        useCase: paramsProp.get('useCase'),
        useCaseTag: paramsProp.get('useCaseTag'),
        datasetType: paramsProp.get('datasetType'),
        returnToUseCase: paramsProp.get('returnToUseCase'),
        isDash: paramsProp.get('isDash'),
        stepByStep: paramsProp.get('stepByStep'),
        tablename: tablename,
        oriDatasetId: paramsProp.get('oriDatasetId'),
        returnToUseCaseCreate: paramsProp.get('returnToUseCaseCreate'),
        isDataset: paramsProp.get('isDataset'),
        docStoreIsDocument,
        docStoreExtractBoundingBoxes,
      };
      let query = Utils.processParamsAsQuery(params);

      Location.push('/' + PartsLink.dataset_upload_step2 + '/' + (Utils.encodeRouter(name) + '/' + Utils.encodeRouter(datasetType) + '/' + (projectId || '')), undefined, query);
    };

    REClient_.client_()._checkTableName(tablename, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        if (res?.result?.exists !== true) {
          doFinishWork();
        } else {
          REActions.addNotificationError('Name already exists!');
        }
      }
    });
  };

  normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  memOptionsDatasetType = memoizeOne((schemaInfo) => {
    let res = [];
    let resAlreadyByDatasetType = {};

    if (schemaInfo) {
      schemaInfo.list?.some((sc1) => {
        if (!sc1) {
          return;
        }

        let datasetType = schemaInfo[sc1].dataset_type;

        if (!resAlreadyByDatasetType[datasetType]) {
          resAlreadyByDatasetType[datasetType] = true;
          res.push({
            value: datasetType?.toUpperCase(),
            label: schemaInfo[sc1]?.title,
          });
        }
      });
    }

    return res;
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  memProjectUseCase = memoizeOne((foundProject1) => {
    if (!foundProject1) {
      return;
    }

    return foundProject1.useCase;
  });

  memInitValue = memoizeOne((initDatasetType, formRef) => {
    if (!initDatasetType) {
      return;
    }

    if (!this.formRef?.current) {
      this.forceUpdate();
      return;
    }

    setTimeout(() => {
      if (!this.isM || !this.formRef.current) {
        return;
      }

      if (Utils.isNullOrEmpty(this.formRef.current?.getFieldValue('datasetType'))) {
        this.formRef.current?.setFieldsValue({
          datasetType: initDatasetType,
        });
      }
    }, 0);
  });

  onChangeForm = () => {
    setTimeout(() => {
      if (!this.isM || !this.formRef.current) {
        return;
      }

      let name1 = this.formRef.current?.getFieldValue('name');
      if (name1?.indexOf('%') > -1) {
        name1 = name1.replace(/%/g, '_');
        this.formRef.current?.setFieldsValue({
          name: name1,
        });
      }
    }, 0);
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  render() {
    let { paramsProp, projects, defDatasets } = this.props;
    const { Meta } = Card;

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(false)(projectId, projects);

    let useCase1 = this.memProjectUseCase(foundProject1);
    let schemaInfo = this.memUseCaseSchemas(false)(this.props.useCases, useCase1);

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
          disableDatasetType = true;
        }
      }
    }
    this.memInitValue(initialDatasetType, this.formRef?.current);

    const dummyRequest = ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess('ok');
      }, 0);
    };

    const styleRectType: CSSProperties = {
      backgroundColor: '#19232f',
      padding: '10px',
      flex: 1,
      marginRight: '10px',
      color: 'white',
      lineHeight: '1.2rem',
      textAlign: 'center',
    };

    let initialValues: any = {
      docStoreIsDocument: false,
    };
    if (projectId == null) {
      initialValues.datasetType = { label: Constants.custom_table_desc, value: Constants.custom_table };
    }

    return (
      <div style={{ margin: '30px auto', maxWidth: '600px', color: Utils.colorA(1) }}>
        <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
          {/*// @ts-ignore*/}
          <Spin spinning={this.state.isProcessing} size={'large'}>
            {(projectId == null || foundProject1 != null) && (
              <FormExt layout={'vertical'} ref={this.formRef} onFinish={this.handleSubmit} onChange={this.onChangeForm} initialValues={initialValues}>
                <Form.Item
                  name={'name'}
                  rules={[
                    { required: true, message: 'Name required!' },
                    { required: true, pattern: new RegExp(/^[A-Za-z0-9_]*$/g), message: 'The dataset name must only contain alphanumeric characters and underscores.' },
                  ]}
                  hasFeedback
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Dataset / Table Name:
                      <HelpIcon id={'datasettablename'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Input placeholder="" autoComplete={'off'} />
                </Form.Item>
                {projectId && (
                  <Form.Item
                    name={'datasetType'}
                    rules={[{ required: true, message: 'Project Dataset Type required!' }]}
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Dataset Type:
                        <HelpIcon id={'datasettypeadd'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt isDisabled={disableDatasetType || projectId == null} style={{ fontWeight: 400, color: Utils.colorA(1) }} options={optionsDatasetType} />
                  </Form.Item>
                )}
                <Form.Item
                  name={'docStoreIsDocument'}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Type of Data:
                      <HelpIcon id={'dataset_upload_type_data'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Radio.Group>
                    <Space direction="vertical">
                      <Radio value={false}>
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Tabular Data
                        </span>
                      </Radio>
                      <Radio value={'a'}>
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Tabular dataset with cloud URL paths to images
                        </span>
                      </Radio>
                      <Radio value={'b'}>
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Document folder or archive (containing images, PDFs, audio files etc.)
                        </span>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                {/*<Form.Item name={'tablename'} rules={[{ required: true, message: 'Table Name required!' }]} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Table Name:<HelpIcon id={'datasettablename'} style={{ marginLeft: '4px', }} /></span>}>*/}
                {/*  <Input placeholder="" autoComplete={'off'} />*/}
                {/*</Form.Item>*/}

                <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                    Continue
                  </Button>
                </div>
              </FormExt>
            )}
          </Spin>
        </Card>
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          {useCase1 != null && <HelpBox isBig={true} name={'Need more help adding dataset with appropriate schema?'} subtitle={'Refer to'} subtitle2={'Use-case specific schema'} linkTo={'/help/useCases/' + useCase1 + '/datasets'} />}
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    defDatasets: state.defDatasets,
    useCases: state.useCases,
  }),
  null,
)(DatasetNewOneUpload);
