import Form from 'antd/lib/form';
import _ from 'lodash';
import React, { PropsWithChildren, useMemo, useState, useEffect } from 'react';
import Utils from '../../../core/Utils';
import SelectExt from '../SelectExt/SelectExt';
import { useSelector } from 'react-redux';
import featureGroups from '../../stores/reducers/featureGroups';
import { FormInstance } from 'antd/es/form/Form';
import FeatureMappingSection from './FeatureMappingSection';
import { Button } from 'antd';

interface DatasetTypeSectionProps {
  datasetType?: any;
  projectId?: string;
  featureGroupList?: any[];
  form?: FormInstance<any>;
}

const DatasetTypeSection = ({ datasetType, form, projectId, featureGroupList }: PropsWithChildren<DatasetTypeSectionProps>) => {
  const { featureGroupsParam } = useSelector((state: any) => ({
    featureGroupsParam: state.featureGroups,
  }));

  const formItemName = useMemo(() => {
    return `${datasetType.datasetType}-featuregroup`;
  }, [datasetType, form]);

  const featureGroupOptions = useMemo(() => {
    const options =
      featureGroupList?.map((featureGroup) => ({
        label: featureGroup.name,
        value: featureGroup.featureGroupId,
      })) ?? [];

    return options;
  }, [featureGroupList, form]);

  const selectedFeatureGroupOption = Form.useWatch(formItemName, form);

  const featureGroupOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, projectId, selectedFeatureGroupOption?.value);
  }, [featureGroupsParam, selectedFeatureGroupOption, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, projectId, selectedFeatureGroupOption?.value);
  }, [featureGroupsParam, selectedFeatureGroupOption, projectId]);

  const featureOptions = useMemo(() => {
    const options =
      featureGroupOne?.projectFeatureGroupSchema?.schema?.map((schema) => ({
        label: schema.name,
        value: schema.name,
        key: schema.featureType,
      })) ?? [];

    return options;
  }, [featureGroupOne]);

  const featureMappings = useMemo(() => {
    const allowedFeatureMappings = datasetType?.allowedFeatureMappings ?? {};
    const mappings = Object.entries(allowedFeatureMappings).map(([key, value]: any[]) => ({
      mapping: key,
      required: value.required,
      multiple: value.multiple,
      allowedFeatureTypes: value.allowed_feature_types,
    }));
    return mappings;
  }, [datasetType]);

  return (
    <div css={'margin-right: 10px;'}>
      <Form.Item name={formItemName} style={{ marginBottom: 8 }} labelCol={{ span: 9 }} wrapperCol={{ span: 15 }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>{datasetType.name}:</span>}>
        <SelectExt options={featureGroupOptions} />
      </Form.Item>
      {featureGroupOne && featureMappings && (
        <div css={'border: 1px solid gray; padding: 15px 10px 0 10px; margin-bottom: 20px;'}>
          {featureMappings.map((featureMapping) => {
            return <FeatureMappingSection key={featureMapping.mapping} form={form} featureMapping={featureMapping} featureOptions={featureOptions} datasetType={datasetType.datasetType} />;
          })}
        </div>
      )}
    </div>
  );
};
export default React.memo(DatasetTypeSection);
