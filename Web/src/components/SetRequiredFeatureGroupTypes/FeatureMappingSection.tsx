import Form from 'antd/lib/form';
import _ from 'lodash';
import React, { PropsWithChildren, useMemo, useState, useEffect } from 'react';
import Utils from '../../../core/Utils';
import SelectExt from '../SelectExt/SelectExt';
import { FormInstance } from 'antd/es/form/Form';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';
import { FIELD_NAMES } from './SetRequiredFeatureGroupTypes';

interface FeatureMappingSectionProps {
  datasetType?: string;
  featureMapping?: any;
  featureOptions?: any[];
  form?: FormInstance<any>;
}

const FeatureMappingSection = ({ form, datasetType, featureMapping, featureOptions }: PropsWithChildren<FeatureMappingSectionProps>) => {
  const formItemName = useMemo(() => {
    const itemName = `${datasetType}-featurename-${featureMapping.mapping}`;
    const fieldNames = form.getFieldValue(FIELD_NAMES);
    if (!fieldNames?.includes(itemName)) {
      if (fieldNames) {
        fieldNames.push(itemName);
      } else {
        form.setFieldValue(FIELD_NAMES, [itemName]);
      }
    }
    return itemName;
  }, [datasetType, featureMapping]);

  const requiredRule = { required: true, message: 'Required!' };

  const validatorFunc = (_, option) => {
    if (!option) {
      return Promise.reject('Select a feature name of valid type');
    } else if (!featureMapping.allowedFeatureTypes?.length) {
      return Promise.resolve();
    } else {
      if (featureMapping.allowedFeatureTypes?.includes(option.key)) {
        return Promise.resolve();
      } else {
        const errorMessage = `${option.key} is not a valid type`;
        return Promise.reject(errorMessage);
      }
    }
  };

  return (
    <div>
      <Form.Item
        name={formItemName}
        rules={featureMapping.required ? [requiredRule, { validator: validatorFunc }] : null}
        labelCol={{ span: 10 }}
        wrapperCol={{ span: 14 }}
        style={{ marginBottom: 8 }}
        hasFeedback
        label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>{featureMapping.mapping}:</span>}
      >
        {featureMapping.multiple ? <TagsSelectExt addName={'Add'} options={featureOptions ?? Utils.emptyStaticArray()} /> : <SelectExt options={featureOptions} />}
      </Form.Item>
    </div>
  );
};
export default React.memo(FeatureMappingSection);
