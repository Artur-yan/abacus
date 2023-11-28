import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import * as React from 'react';
import { usePipeline } from '../../api/REUses';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '../../../core/hooks';
import ModalContent from '../ModalContent/ModalContent';

import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import * as _ from 'lodash';
import { PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import Utils from '../../../core/Utils';
import SelectExt from '../SelectExt/SelectExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import styles from './PipelineEditVariableMappings.module.css';
import { faEdit } from '@fortawesome/pro-regular-svg-icons/faEdit';

interface VariableMappingsEditorRowProps {
  mapping: any;
  onChange: (item: any) => void;
}

const VariableMappingsEditorRow = React.memo(({ mapping, onChange }: PropsWithChildren<VariableMappingsEditorRowProps>) => {
  const typeOptions = [{ label: mapping?.variable_type, value: mapping?.variable_type }];
  const typeValue = typeOptions[0];

  const onChangeValueInputNumber = (value) => onChange({ ...mapping, value });
  const onChangeValueInput = (e) => onChange({ ...mapping, value: e?.target?.value });

  const errorMessage = useMemo(() => {
    if (!mapping?.is_required) return '';
    if (Utils.isNullOrEmpty(mapping?.value)) return <div className={styles.errorContainer}>Required value</div>;
    return '';
  }, [mapping?.is_required, mapping?.value]);

  const showInputNumber = ['INTEGER', 'FLOAT'].includes(mapping?.variable_type);

  return (
    <tr>
      <td>
        <Checkbox disabled checked={mapping?.is_required} />
      </td>
      <td>{mapping?.name}</td>
      <td>
        <SelectExt className={styles.fullWidth} value={typeValue} options={typeOptions} isDisabled />
      </td>
      <td>
        {showInputNumber ? <InputNumber className={styles.fullWidth} value={mapping?.value} onChange={onChangeValueInputNumber} /> : <Input className={styles.fullWidth} value={mapping?.value} onChange={onChangeValueInput} />}
        {errorMessage}
      </td>
    </tr>
  );
});

interface VariableMappingsEditorProps {
  mappings: any[];
  onChange: (newValue: any) => void;
}

const VariableMappingsEditor = React.memo(({ mappings, onChange }: PropsWithChildren<VariableMappingsEditorProps>) => {
  return (
    <Provider store={Utils.globalStore()}>
      <table className={styles.table}>
        <thead>
          <tr>
            <td>
              <TooltipExt title="Is Required">Req.</TooltipExt>
            </td>
            <td>Pipeline Variable</td>
            <td>Variable Type</td>
            <td>Value</td>
          </tr>
        </thead>
        <tbody>
          {mappings?.map?.((mapping, index) => {
            return <VariableMappingsEditorRow key={`t${index}`} mapping={mapping} onChange={onChange} />;
          })}
        </tbody>
      </table>
    </Provider>
  );
});

interface PipelineEditVariableMappingsProps {
  onConfirm: (mappings: any[]) => Promise<void>;
}

const PipelineEditVariableMappings = React.memo(({ onConfirm }: PipelineEditVariableMappingsProps) => {
  const pipelineId = useAppSelector((state) => state.paramsProp?.get('pipelineId'));
  const [mappings, setMappings] = React.useState([]);
  const [initialMappings, setInitialMappings] = React.useState([]);

  const onChange = (newValue) => {
    const index = _.findIndex(mappings, (mapping) => mapping?.name === newValue.name);
    const newMappings = [...mappings?.slice(0, index), newValue, ...mappings?.slice(index + 1)];
    setMappings(newMappings);
  };

  const pipeline = usePipeline(pipelineId);

  React.useEffect(() => {
    if (!pipeline?.pipelineVariableMappings?.length) return;
    setMappings(pipeline.pipelineVariableMappings);
    setInitialMappings(pipeline.pipelineVariableMappings);
  }, [pipeline]);

  return (
    <ModalContent
      onConfirm={() => onConfirm(mappings)}
      onCancel={() => setMappings(initialMappings)}
      title={
        <div>
          <div style={{ marginBottom: 16 }}>Edit Pipeline Variables</div>
          <VariableMappingsEditor mappings={mappings} onChange={onChange} />
        </div>
      }
      icon={<QuestionCircleOutlined style={{ color: 'yellow' }} />}
      okType="primary"
      okText="Save"
      width={888}
      cancelText="Cancel"
    >
      <TooltipExt title="Edit">
        <FontAwesomeIcon className={styles.editIcon} icon={faEdit} transform={{ size: 15, x: -3, y: 0 }} />
      </TooltipExt>
    </ModalContent>
  );
});

export default PipelineEditVariableMappings;
