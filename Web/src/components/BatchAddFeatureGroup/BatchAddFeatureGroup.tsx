import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./BatchAddFeatureGroup.module.css');
const sd = require('../antdUseDark.module.css');

interface IBatchAddFeatureGroupProps {}

const BatchAddFeatureGroup = React.memo((props: PropsWithChildren<IBatchAddFeatureGroupProps>) => {
  const { featureGroupsParam, useCasesParam, paramsProp, authUser, projects } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    projects: state.projects,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = paramsProp?.get('projectId');
  const batchPredId = paramsProp?.get('batchPredId');
  const datasetTypeParam = paramsProp?.get('datasetType');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projects, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projects, projectId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);
  const featureGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);

  useEffect(() => {
    memUseCasesSchemasInfo(true, foundProject1?.useCase);
  }, [foundProject1?.useCase, useCasesParam]);
  const schemaInfo = useMemo(() => {
    return memUseCasesSchemasInfo(false, foundProject1?.useCase);
  }, [foundProject1?.useCase, useCasesParam]);

  let optionsDatasetType = useMemo(() => {
    let res = null;
    let resAlreadyByDatasetType = {};

    if (schemaInfo) {
      res = [];
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
  }, [schemaInfo]);

  const featureGroupDescriptionsDict = useMemo(() => {
    let res: any = {};

    const ids = featureGroupsList?.map((f1) => f1.featureGroupId);
    ids?.some((id1) => {
      let d1 = featureGroups.memFeatureGroupsForId(false, projectId, id1);
      res[id1] = d1;
    });

    return res;
  }, [featureGroupsList, featureGroupsParam, projectId]);
  useEffect(() => {
    const ids = featureGroupsList?.map((f1) => f1.featureGroupId);
    ids?.some((id1) => {
      featureGroups.memFeatureGroupsForId(true, projectId, id1);
    });
  }, [featureGroupsList, featureGroupsParam, projectId]);

  const optionsFG = useMemo(() => {
    let list = featureGroupsList
      ?.map((f1) => {
        return featureGroupDescriptionsDict[f1.featureGroupId];
      })
      ?.filter((v1) => v1 != null);
    return list?.map((f1) => ({
      label: f1.tableName,
      value: f1.featureGroupId,
    }));
  }, [featureGroupsList, featureGroupDescriptionsDict]);

  const handleSubmit = (values) => {
    let fg1 = values.featureGroup?.value;
    let dt1 = values.datasetType?.value;
    if (fg1 && dt1) {
      REClient_.client_().setBatchPredictionFeatureGroup(batchPredId, dt1, fg1, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.getProjectsById_(projectId);
          StoreActions.batchList_(projectId);
          StoreActions.batchDescribeById_(batchPredId);

          if (paramsProp?.get('returnToUseCaseCreate') === 'true') {
            let isDataset = paramsProp?.get('isDataset') === 'true';
            Location.push('/' + PartsLink.batchpred_create + '/' + projectId + '/' + batchPredId, undefined, isDataset ? 'isDataset=true' : undefined);
          } else if (paramsProp?.get('returnToBatch') === 'true') {
            Location.push('/' + PartsLink.batchpred_featuregroups + '/' + projectId + '/' + batchPredId);
          } else {
            Location.push('/' + PartsLink.batchpred_detail + '/' + projectId + '/' + batchPredId);
          }
        }
      });
    }
  };

  const initValues = useMemo(() => {
    if (datasetTypeParam) {
      if (optionsDatasetType == null) {
        return null;
      } else {
        return {
          datasetType: optionsDatasetType?.find((v1) => v1.value === datasetTypeParam),
        };
      }
    } else {
      return {};
    }
  }, [datasetTypeParam, optionsDatasetType]);

  return (
    <div style={{ margin: '30px auto', maxWidth: '600px', color: Utils.colorA(1) }}>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
        {initValues != null && (
          <FormExt layout={'vertical'} onFinish={handleSubmit} className="login-form" initialValues={initValues}>
            <Form.Item
              name={'featureGroup'}
              rules={[{ required: true, message: 'Feature Group required!' }]}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Feature Group:
                  <HelpIcon id={'batchfeaturegroupadd'} style={{ marginLeft: '4px' }} />
                </span>
              }
            >
              <SelectExt style={{ fontWeight: 400, color: Utils.colorA(1) }} options={optionsFG} />
            </Form.Item>

            <Form.Item
              name={'datasetType'}
              rules={[{ required: true, message: 'Project Dataset Type required!' }]}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Dataset Type:
                  <HelpIcon id={'batchdatasettypeadd'} style={{ marginLeft: '4px' }} />
                </span>
              }
            >
              <SelectExt isDisabled={!Utils.isNullOrEmpty(datasetTypeParam)} style={{ fontWeight: 400, color: Utils.colorA(1) }} options={optionsDatasetType} />
            </Form.Item>

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                Override
              </Button>
            </div>
          </FormExt>
        )}
      </Card>
    </div>
  );
});

export default BatchAddFeatureGroup;
