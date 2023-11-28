import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import * as React from 'react';
import { usePipeline } from '../../api/REUses';
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
import styles from './PipelineRunModal.module.css';

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

interface PipelineRunModalProps {
  onConfirm: (mappings: any[]) => Promise<void>;
}

const PipelineRunModal = React.memo((props: PipelineRunModalProps) => {
  const pipelineId = useAppSelector((state) => state.paramsProp?.get('pipelineId')) || null;
  const [mappings, setMappings] = React.useState([]);
  const [initialMappings, setInitialMappings] = React.useState([]);

  const onChange = (newValue) => {
    const index = _.findIndex(mappings, (mapping) => mapping?.name === newValue.name);
    const newMappings = [...mappings?.slice(0, index), newValue, ...mappings?.slice(index + 1)];
    setMappings(newMappings);
  };

  const pipeline = usePipeline(pipelineId);

  let title = (
    <div>
      <span>Are you sure you want to run this pipeline?</span>
    </div>
  );
  let cancelText = 'Cancel';

  if (mappings.length) {
    title = (
      <div>
        <div style={{ marginBottom: 16 }}>You can edit the pipline variables before running</div>
        <VariableMappingsEditor mappings={mappings} onChange={onChange} />
      </div>
    );
    cancelText = 'Cancel Run';
  }

  React.useEffect(() => {
    if (!pipeline?.pipelineVariableMappings?.length) return;
    setMappings(pipeline.pipelineVariableMappings);
    setInitialMappings(pipeline.pipelineVariableMappings);
  }, [pipeline]);

  return (
    <ModalContent
      onConfirm={() => props.onConfirm(mappings)}
      onCancel={() => setMappings(initialMappings)}
      title={title}
      icon={<QuestionCircleOutlined style={{ color: 'yellow' }} />}
      okType="primary"
      okText="Run"
      width={888}
      cancelText={cancelText}
    >
      <Button style={{ margin: 8 }} type="primary">
        Run
      </Button>
    </ModalContent>
  );
});

export default PipelineRunModal;
