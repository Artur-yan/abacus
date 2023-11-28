import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { DeploymentLifecycle } from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { DeployBatchAPI_calcListDeploy } from '../DeployBatchAPI/DeployBatchAPI';
import FormExt from '../FormExt/FormExt';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./PredMetricsAdd.module.css');
const sd = require('../antdUseDark.module.css');

interface IPredMetricsAddProps {}

const PredMetricsAdd = React.memo((props: PropsWithChildren<IPredMetricsAddProps>) => {
  const { projectsParam, paramsProp, authUser, deployments, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    deployments: state.deployments,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
  }));

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [FGSelId, setFGSelId] = useState(null);
  const [dataUseToSet, setDataUseToSet] = useState(null as { isRequired?: boolean; field?: string; name?: string; featureMapping?: string }[]);
  const [isCreating, setIsCreating] = useState(false);

  const projectId = paramsProp?.get('projectId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  useEffect(() => {
    DeployBatchAPI_calcListDeploy(deployments, undefined, projectId, true, true);
  }, [deployments, projectId]);

  let listDeployments = useMemo(() => {
    return DeployBatchAPI_calcListDeploy(deployments, undefined, projectId, false, true);
  }, [deployments, projectId]);

  let optionsDeploys = useMemo(() => {
    if (listDeployments) {
      return listDeployments.map((d1) => {
        return {
          label: d1.name || '-',
          value: d1.deploymentId,
        };
      });
    }
  }, [listDeployments]);

  useEffect(() => {
    let lastV = form?.getFieldValue('deployId');
    if (lastV != null) {
      return;
    }

    let idUse = listDeployments?.find((d1) => d1.status?.toUpperCase() === DeploymentLifecycle.ACTIVE)?.deploymentId ?? listDeployments?.[0]?.deploymentId;
    if (!idUse) {
      return;
    }

    form?.setFieldsValue({ deployId: optionsDeploys?.find((o1) => o1.value === idUse) });
  }, [listDeployments]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);
  const featureGroupList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, projectId, FGSelId);
  }, [featureGroupsParam, FGSelId, projectId]);
  const featureGroupOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, projectId, FGSelId);
  }, [featureGroupsParam, FGSelId, projectId]);

  const projectUseCase = foundProject1?.useCase;

  useEffect(() => {
    if (!projectUseCase) {
      setDataUseToSet(null);
      return;
    }

    REClient_.client_().describeUseCaseRequirements(projectUseCase, (err, res) => {
      let p1 = res?.result?.find((r1) => r1.datasetType?.toUpperCase() === 'PREDICTION_METRICS_INPUT');
      if (p1 != null) {
        p1 = p1?.allowedFeatureMappings;
        if (p1 != null) {
          let kk = Object.keys(p1 ?? {});
          kk = kk.sort();
          setDataUseToSet(kk.filter((k1) => k1?.toUpperCase() !== 'IGNORE').map((k1) => ({ isRequired: p1[k1]?.isRequired === true, featureMapping: k1, name: p1[k1]?.description + ' (' + k1 + ')' })));
          return;
        }
      }
      setDataUseToSet(null);
    });
  }, [projectUseCase]);

  const optionsFields = useMemo(() => {
    let res = featureGroupOne?.projectFeatureGroupSchema?.schema?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
    }
    return res;
  }, [featureGroupOne]);

  useEffect(() => {
    setDataUseToSet((list) => {
      let schema1 = featureGroupOne?.projectFeatureGroupSchema?.schema;

      let obj1: any = {};
      list?.some((r1) => {
        let schemaFound1 = schema1?.find((sc1) => sc1?.featureMapping?.toUpperCase() === r1.featureMapping?.toUpperCase());

        obj1['field' + r1.featureMapping] = schemaFound1 != null ? optionsFields?.find((o1) => o1.value === schemaFound1?.name) : null;
      });
      form?.setFieldsValue(obj1);

      return list;
    });
  }, [featureGroupOne, optionsFields]);

  const optionsFGs = useMemo(() => {
    let res = featureGroupList?.map((f1, f1ind) => ({ label: f1.tableName, value: f1.featureGroupId, data: f1 }));
    if (res != null) {
      res = _.sortBy(res, ['label']);
    }
    return res;
  }, [featureGroupList]);

  const handleSubmit = (values) => {
    let FGid = values.FGid?.value;

    setIsCreating(true);
    REClient_.client_().updateFeatureGroupDatasetType(projectId, FGid, 'PREDICTION_METRICS_INPUT', (err, res) => {
      if (err || !res?.success) {
        setIsCreating(false);
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        const doWorkCreate = () => {
          setTimeout(() => {
            let featureGroupId = FGid;
            REClient_.client_()._createPredictionMetric(featureGroupId, { predictionMetricType: 'DecilePredictionMetric' }, projectId, (err, res) => {
              if (err || !res?.success) {
                setIsCreating(false);
                REActions.addNotificationError(err || Constants.errorDefault);
              } else {
                let predictionMetricId = res?.result?.predictionMetricId;

                REClient_.client_()._runPredictionMetric(predictionMetricId, (err2, res2) => {
                  setIsCreating(false);
                  if (err2 || !res2?.success) {
                    REActions.addNotificationError(err2 || Constants.errorDefault);
                  } else {
                    StoreActions.refreshDoPredMetricsAll_(predictionMetricId, featureGroupId, projectId);

                    StoreActions._getPredMetricsByFeatureGroupId(featureGroupId);
                    StoreActions.listPredMetricsForProjectId_(projectId);

                    Location.push('/' + PartsLink.prediction_metrics_detail + '/' + projectId + '/' + predictionMetricId);
                  }
                });
              }
            });
          }, 0);
        };

        setDataUseToSet((list) => {
          list
            ?.filter((r1) => !Utils.isNullOrEmpty(values['field' + r1.featureMapping]?.value))
            ?.some((f1, f1ind) => {
              REClient_.client_().setFeatureMapping(projectId, FGid, values['field' + f1.featureMapping]?.value, f1.featureMapping, null, (err, res, isLast) => {
                if (isLast) {
                  doWorkCreate();
                }
              });
            });

          if (list == null || list?.length === 0) {
            doWorkCreate();
          }

          return list;
        });
      }
    });
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const onChangeForm = (valuesChanged) => {
    let values = form?.getFieldsValue();

    if (values != null) {
      let FGid = values.FGid?.value;
      if (!Utils.isNullOrEmpty(FGid)) {
        setFGSelId(FGid);
      } else {
        setFGSelId(null);
      }
    }
  };

  return (
    <div style={{ margin: '30px auto', maxWidth: '800px', color: Utils.colorA(1) }}>
      <RefreshAndProgress isRelative msgMsg={isCreating ? 'Creating...' : null} isMsgAnimRefresh={isCreating ? true : null} isDim={isCreating ? true : null}>
        <div style={{ color: 'white', padding: '20px 23px' }} className={sd.grayPanel}>
          <div
            css={`
              font-family: Matter;
              font-size: 24px;
              line-height: 1.33;
              color: #ffffff;
            `}
          >
            Create Prediction Metrics Job
          </div>
          <div
            css={`
              border-top: 1px solid white;
              margin-top: 10px;
              margin-bottom: 8px;
            `}
          ></div>

          {
            <FormExt
              form={form}
              onValuesChange={onChangeForm}
              css={`
                font-family: Roboto;
                font-size: 14px;
                letter-spacing: 1.31px;
                color: #ffffff;
              `}
              layout={'vertical'}
              onFinish={handleSubmit}
              initialValues={{}}
            >
              <div
                css={`
                  margin-top: 16px;
                `}
              ></div>

              {false && (
                <Form.Item rules={[{ required: true, message: 'Required!' }]} name={'deployId'} label={<span style={{ color: Utils.colorA(1) }}>Deployment:</span>}>
                  <SelectExt options={optionsDeploys ?? []} menuPortalTarget={popupContainerForMenu(null)} />
                </Form.Item>
              )}

              <div
                css={`
                  margin-top: 10px;
                  padding-top: 15px;
                  border-top: 1px solid rgba(255, 255, 255, 0.2);
                `}
              ></div>

              <Form.Item rules={[{ required: true, message: 'Required!' }]} name={'FGid'} label={<span style={{ color: Utils.colorA(1) }}>Prediction Feature Group:</span>}>
                <SelectExt options={optionsFGs ?? []} menuPortalTarget={popupContainerForMenu(null)} />
              </Form.Item>

              {dataUseToSet?.map((r1, r1ind) => (
                <Form.Item
                  key={'f' + r1.featureMapping + '_' + r1ind}
                  rules={r1.isRequired ? [{ required: true, message: 'Required!' }] : undefined}
                  name={'field' + r1.featureMapping}
                  label={<span style={{ color: Utils.colorA(1) }}>{r1.name}</span>}
                >
                  <SelectExt options={optionsFields ?? []} menuPortalTarget={popupContainerForMenu(null)} />
                </Form.Item>
              ))}

              <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                <div style={{ borderTop: '1px solid #23305e', margin: '4px -22px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <Button type="primary" htmlType="submit" style={{ marginTop: '16px', width: '100%' }}>
                    {'Create'}
                  </Button>
                </div>
              </Form.Item>
            </FormExt>
          }
        </div>
      </RefreshAndProgress>
    </div>
  );
});

export default PredMetricsAdd;
