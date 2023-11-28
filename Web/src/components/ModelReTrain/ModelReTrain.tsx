import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import { useForm } from 'antd/lib/form/Form';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import deployments, { DeploymentLifecycle } from '../../stores/reducers/deployments';
import DeploymentsList from '../DeploymentsList/DeploymentsList';
import FeatureGroupsFormItemsTraining, { formFgidPrefix } from '../FeatureGroupsFormItemsTraining/FeatureGroupsFormItemsTraining';
import FormExt from '../FormExt/FormExt';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./ModelReTrain.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelReTrainProps {}

const ModelReTrain = React.memo((props: PropsWithChildren<IModelReTrainProps>) => {
  const { paramsProp, authUser, deploymentsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    deploymentsParam: state.deployments,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [checkedKeys, setCheckedKeys] = useState(null);
  const [formRef] = useForm();

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  let modelId = paramsProp?.get('modelId');
  if (modelId === '') {
    modelId = null;
  }

  const foundProject1 = useProject(projectId);

  const listDeploymentsListAll = useMemo(() => {
    return deployments.memDeploysList(false, projectId);
  }, [deploymentsParam, projectId]);
  useEffect(() => {
    deployments.memDeploysList(true, projectId);
  }, [deploymentsParam, projectId]);

  const { manyDeploys, manyDeploysModelId } = useMemo(() => {
    let manyDeploys = false,
      manyDeploysModelId = [];
    if (listDeploymentsListAll != null) {
      let deployCount = 0;
      listDeploymentsListAll.some((d1) => {
        if ([DeploymentLifecycle.ACTIVE, DeploymentLifecycle.STOPPED].includes(d1.status)) {
          deployCount++;
          manyDeploysModelId.push(d1.modelId);
        }
      });
      if (deployCount > 1) {
        manyDeploys = true;
      }
    }
    return { manyDeploys, manyDeploysModelId };
  }, [listDeploymentsListAll]);

  const useManyDeploys = useMemo(() => {
    if (modelId == null) {
      return false;
    }
    return manyDeploys && manyDeploysModelId.filter((i1) => i1 === modelId).length > 1;
  }, [manyDeploys, manyDeploysModelId, modelId]);

  const handleSubmit = (values) => {
    let featureGroupIds = null;
    let kkv = Object.keys(values ?? {});
    kkv?.some((k1) => {
      if (_.startsWith(k1, formFgidPrefix)) {
        if (!Utils.isNullOrEmpty(values[k1]?.value)) {
          featureGroupIds = featureGroupIds ?? [];
          featureGroupIds.push(values[k1]?.value);
        }

        delete values[k1];
      }
    });

    REClient_.client_().retrainModel(modelId, checkedKeys, featureGroupIds, null, null, null, null, null, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.listModels_(projectId);
        StoreActions.getModelDetail_(modelId);
        StoreActions.modelsVersionsByModelId_(modelId);
        StoreActions.refreshDoModelAll_(modelId, projectId);
      }
    });
  };

  const onChangeChecked = (keys) => {
    setCheckedKeys(keys);
  };

  const onSetFieldsValuesFromFGs = (values) => {
    formRef?.setFieldsValue(values);
  };

  const goToDashboard = (e) => {
    // if(!Utils.isNullOrEmpty(errorFromValidateFGid)) {
    //   Location.push('/' + PartsLink.features_list + '/' + projectId + '/' + errorFromValidateFGid);
    //
    // } else {
    Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
    // }
  };

  return (
    <div style={{ margin: '30px auto', maxWidth: '800px', color: Utils.colorA(1) }}>
      <RefreshAndProgress isRelative errorButtonText={'Fix Schema Errors'} onClickErrorButton={goToDashboard}>
        <div style={{ color: 'white', padding: '20px 23px' }} className={sd.grayPanel}>
          <div
            css={`
              border-bottom: 1px solid white;
              padding-bottom: 4px;
              font-size: 20px;
            `}
          >
            Re-Train Model
          </div>
          <div
            css={`
              margin-top: 20px;
            `}
          >
            <FormExt
              css={`
                font-family: Roboto;
                font-size: 14px;
                letter-spacing: 1.31px;
                color: #ffffff;
              `}
              layout={'vertical'}
              form={formRef}
              onFinish={handleSubmit}
              initialValues={{}}
            >
              <FeatureGroupsFormItemsTraining title={`Training Feature Groups`} projectId={projectId} onSetFieldsValuesFromFGs={onSetFieldsValuesFromFGs} />

              <div
                css={`
                  border-top: 1px solid #23305e;
                  margin-bottom: 20px;
                `}
              ></div>

              {modelId != null && useManyDeploys && listDeploymentsListAll != null && (
                <div
                  css={`
                    margin-top: 20px;
                  `}
                >
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 14px;
                      padding: 10px 0;
                    `}
                  >
                    Select zero or more of the deployments below to have the retrained model automatically deployed. If none, the new model version will not be deployed.
                  </div>
                  <DeploymentsList filterByModelId={modelId} noAutoTooltip projectId={projectId} isChecked={true} onChangeChecked={onChangeChecked} />
                </div>
              )}

              <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                <div style={{ borderTop: '1px solid #23305e', margin: '4px -22px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px', width: '100%' }}>
                    {'Re-Train Model'}
                  </Button>
                </div>
              </Form.Item>
            </FormExt>
          </div>
        </div>
      </RefreshAndProgress>
    </div>
  );
});

export default ModelReTrain;
