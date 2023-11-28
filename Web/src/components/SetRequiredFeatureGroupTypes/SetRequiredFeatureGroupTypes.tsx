import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import React, { PropsWithChildren, useCallback, useMemo, useEffect } from 'react';
import Utils from '../../../core/Utils';
import FormExt from '../FormExt/FormExt';
import styles from './SetRequiredFeatureGroupTypes.module.css';
import { calcReqFeaturesByUseCase } from '../../stores/reducers/defDatasets';
import StoreActions from '../../stores/actions/StoreActions';
import { useSelector } from 'react-redux';
import DatasetTypeSection from './DatasetTypeSection';
import REClient_ from '../../api/REClient';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import { Button } from 'antd';

interface SetRequiredFeatureGroupTypesProps {
  projectId?: string;
  projectOne?: any;
  featureGroupList?: any[];
  isModalOpen?: boolean;
  setIsModalOpen?: (arg0: boolean) => void;
}

export const FIELD_NAMES = 'field-names';

const SetRequiredFeatureGroupTypes = ({ projectId, projectOne, featureGroupList, isModalOpen = false, setIsModalOpen }: PropsWithChildren<SetRequiredFeatureGroupTypesProps>) => {
  const { defDatasetsParam, projectsParam } = useSelector((state: any) => ({
    projectsParam: state.projects,
    defDatasetsParam: state.defDatasets,
  }));

  const memRequFeatures = (doCall, defDatasets, projects, projectId, projectFound1) => {
    if (projects && projectId && defDatasets) {
      if (projectFound1) {
        let useCase = projectFound1.useCase;
        if (!Utils.isNullOrEmpty(useCase)) {
          let reqFields = calcReqFeaturesByUseCase(undefined, useCase);
          if (reqFields) {
            const reqFieldsAll = reqFields?.toJS();
            return reqFieldsAll;
          } else {
            if (defDatasets.get('isRefreshing') === 0) {
              if (doCall) {
                StoreActions.featuresByUseCase_(useCase);
              }
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    memRequFeatures(true, defDatasetsParam, projectsParam, projectId, projectOne);
  }, [defDatasetsParam, projectsParam, projectId, projectOne]);
  const datasetTypes = useMemo(() => {
    return memRequFeatures(false, defDatasetsParam, projectsParam, projectId, projectOne) ?? [];
  }, [defDatasetsParam, projectsParam, projectId, projectOne]);

  const [form] = Form.useForm();

  const initialValues = useMemo(() => {
    return {};
  }, []);

  const handleSubmit = useCallback(
    (values) => {
      const formItemNames = form.getFieldValue(FIELD_NAMES);
      const featureGroupTypeMappings = [];
      datasetTypes?.forEach((datasetType) => {
        const featureGroupType = datasetType.datasetType;
        const featureGroupId = form.getFieldValue(`${featureGroupType}-featuregroup`)?.value;
        if (featureGroupId && featureGroupType) {
          const featureMappings = [];
          formItemNames?.forEach((field) => {
            if (field.startsWith(`${featureGroupType}-featurename-`)) {
              const featureMapping = field.substring(`${featureGroupType}-featurename-`.length);
              const featureNameValue = form.getFieldValue(field);
              if (featureNameValue) {
                if (_.isArray(featureNameValue)) {
                  featureNameValue.forEach((featureName) => {
                    featureMappings.push({ featureMapping, featureName });
                  });
                } else {
                  const featureName = featureNameValue.value;
                  featureMappings.push({ featureMapping, featureName });
                }
              }
            }
          });

          featureGroupTypeMappings.push({
            feature_group_id: featureGroupId,
            feature_group_type: featureGroupType,
            feature_mappings: featureMappings,
          });
        }
      });

      if (featureGroupTypeMappings.length > 0) {
        REClient_.client_()._bulkSetProjectFeatureGroupTypesAndFeatureMappings(projectId, featureGroupTypeMappings, (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            if (res?.success) {
              REActions.addNotification('Applied the feature mappings.');

              StoreActions.featureGroupsGetByProject_(projectId);
              featureGroupTypeMappings?.forEach((item) => {
                StoreActions.featureGroupsDescribe_(projectId, item.feature_group_id);
              });

              form.resetFields();
              setIsModalOpen?.(false);
            }
          }
        });
      } else {
        form.resetFields();
        setIsModalOpen?.(false);
      }
    },
    [datasetTypes, form, setIsModalOpen],
  );

  const handleCancel = useCallback(() => {
    form.resetFields();
    setIsModalOpen?.(false);
  }, [form, setIsModalOpen]);

  const handleValuesChange = useCallback((changedValues) => {}, [form]);

  return (
    <Modal
      width={640}
      bodyStyle={{ height: 500 }}
      title="Set Feature Group Type and Feature Mapping"
      open={isModalOpen}
      onCancel={handleCancel}
      cancelText="Cancel"
      okText="Update"
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => {
            form
              .validateFields()
              .then((values) => {
                handleSubmit(values);
              })
              .catch((info) => {});
          }}
        >
          Update
        </Button>,
      ]}
    >
      <div className={styles.bodyContainer}>
        <FormExt form={form} initialValues={initialValues} onValuesChange={handleValuesChange} layout="horizontal" className="useDark">
          {datasetTypes &&
            datasetTypes.map((datasetType) => {
              return <DatasetTypeSection key={datasetType.datasetType} datasetType={datasetType} form={form} projectId={projectId} featureGroupList={featureGroupList} />;
            })}
        </FormExt>
      </div>
    </Modal>
  );
};
export default React.memo(SetRequiredFeatureGroupTypes);
