import { Input } from 'antd';
import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import Switch from 'antd/lib/switch';
import _ from 'lodash';
import React, { PropsWithChildren, useCallback, useMemo, useState, useEffect } from 'react';
import REClient_ from '../../api/REClient';
import PartsLink from '../NavLeft/PartsLink';
import Location from '../../../core/Location';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
import { useAppSelector } from '../../../core/hooks';
import styles from './OpenTemplateInNotebook.module.css';

const HelpIconSpaced = (props) => <HelpIcon {...props} style={{ marginLeft: 4 }} />;

const ProcessorType = {
  cpu: 'cpu',
  gpu: 'gpu',
};

interface OpenTemplateInNotebookProps {
  isOpen: boolean;
  notebookTemplateId: string;
  onCancel?: () => void;
  onOk?: (arg0?: boolean) => void;
}

const OpenTemplateInNotebook = ({ isOpen = false, notebookTemplateId, onCancel, onOk }: PropsWithChildren<OpenTemplateInNotebookProps>) => {
  const projectId = useAppSelector((state) => state.paramsProp?.get('projectId'));

  const [form] = Form.useForm();
  const [memoryOptionsResponse, setMemoryOptionsResponse] = useState([]);

  const useGpu = Form.useWatch('useGpu', form);

  const initialValues = useMemo(() => {
    const defaultMemoryValue = memoryOptionsResponse?.[ProcessorType.cpu]?.default;
    const defaultOption = memoryOptionsResponse?.[ProcessorType.cpu]?.data?.find?.((option) => option.value === defaultMemoryValue);
    return {
      name: '',
      memory: defaultOption,
      useGpu: false,
    };
  }, [memoryOptionsResponse]);

  const memoryOptions = useMemo(() => {
    const processorType = useGpu ? ProcessorType.gpu : ProcessorType.cpu;
    return memoryOptionsResponse?.[processorType]?.data ?? [];
  }, [useGpu, memoryOptionsResponse]);

  const handleValuesChange = useCallback(
    (changedValues) => {
      if (typeof changedValues?.useGpu !== 'boolean') return;
      const processorType = changedValues?.useGpu ? ProcessorType.gpu : ProcessorType.cpu;
      const defaultMemoryValue = memoryOptionsResponse?.[processorType]?.default;
      const defaultOption = memoryOptionsResponse?.[processorType]?.data?.find?.((option) => option.value === defaultMemoryValue);
      if (defaultOption) form.setFieldValue('memory', defaultOption);
    },
    [form, memoryOptionsResponse],
  );

  const handleSubmit = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      const values = _.cloneDeep(form.getFieldsValue(true));
      const { name, useGpu, memory } = values;

      const onError = (error) => {
        resolve(false);
        onOk?.(error);
      };

      const navigateToNotebook = (notebookId) => {
        resolve(true);
        onOk?.();
        Location.push('/' + PartsLink.notebook_one + '/' + (projectId ?? '-') + '/' + notebookId);
      };

      REClient_.promisesV2()
        ._openNotebook(name, projectId, memory?.value, useGpu, notebookTemplateId)
        .then((response) => navigateToNotebook(response?.result?.notebookId))
        .catch(onError);
    });
  }, [form, onOk, projectId]);

  const handleCancel = useCallback(() => {
    form.resetFields();
    onCancel?.();
  }, [form, onCancel]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    REClient_.promisesV2()
      ._getNotebookMemoryOptions()
      .then((response) => setMemoryOptionsResponse(response.result));
  }, []);

  return (
    <Modal closable={false} width={480} bodyStyle={{ height: 312 }} title="Create Notebook" open={isOpen} cancelText="Cancel" okText="Create" onCancel={handleCancel} onOk={handleSubmit}>
      <FormExt layout="vertical" className="useDark" form={form} onValuesChange={handleValuesChange}>
        <Form.Item name="name" label={<div className={styles.label}>Name:</div>}>
          <Input placeholder="Name - Leave empty to automatically name the notebook" />
        </Form.Item>
        <Form.Item
          name="memory"
          label={
            <div className={styles.label}>
              Set Memory Usage:
              <HelpIconSpaced id="nb_create_memory" />
            </div>
          }
        >
          <SelectExt options={memoryOptions} />
        </Form.Item>
        <Form.Item
          valuePropName="checked"
          name="useGpu"
          label={
            <div className={styles.label}>
              GPU Enabled:
              <HelpIconSpaced id="nb_create_gpu" />
            </div>
          }
        >
          <Switch checkedChildren="Yes" unCheckedChildren="No" />
        </Form.Item>
      </FormExt>
    </Modal>
  );
};
export default React.memo(OpenTemplateInNotebook);
