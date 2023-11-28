import Input from 'antd/lib/input';
import Switch from 'antd/lib/switch';
import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useState } from 'react';
import REClient_ from '../../api/REClient';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
const styles = require('./CreateNotebookModal.module.css');
const stylesDark = require('../antdUseDark.module.css');

interface ICreateNotebookModalProps {
  onChange?: (values: any) => void;
}

const ProcessorType = {
  cpu: 'cpu',
  gpu: 'gpu',
};

const CreateNotebookModal = React.memo((props: PropsWithChildren<ICreateNotebookModalProps>) => {
  const [name, setName] = useState('');
  const [mem, setMem] = useState(16);
  const [useGpu, setUseGpu] = useState(false);
  const [memoryOptions, setMemoryOptions] = useState(null);
  const [memoryRes, setMemoryRes] = useState(null);

  useEffect(() => {
    REClient_.client_()._getNotebookMemoryOptions((err, res) => {
      setMemoryRes(res?.result ?? null);
    });
  }, []);

  useEffect(() => {
    if (memoryRes) {
      let type1 = useGpu ? ProcessorType.gpu : ProcessorType.cpu;
      let memDefault = memoryRes?.[type1]?.default ?? 16;

      setMem(memDefault);
      setMemoryOptions(memoryRes?.[type1]?.data);

      props.onChange?.({ memory: memDefault });
    }
  }, [memoryRes, useGpu]);

  const onChangeMem = (option1) => {
    let v1 = option1?.value;

    setMem(v1);
    props.onChange?.({ memory: v1 });
  };

  const onChangeGpu = (v1) => {
    setUseGpu(v1);
    props.onChange?.({ useGpu: v1 });
  };

  return (
    <div className="useDark">
      <div className={styles.title}>Do you want to create a noteboook?</div>
      <div>
        <div className={styles.label}>Name:</div>
        <Input
          placeholder="Name - Leave empty to automatically name the notebook"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            props.onChange?.({ name: e.target.value });
          }}
        />
        <div className={styles.label}>
          Set Memory Usage:
          <HelpIcon id="nb_create_memory" style={{ marginLeft: 4 }} />
        </div>
        <div>
          <span>
            <SelectExt options={memoryOptions} value={memoryOptions?.find((o1) => o1.value === mem)} onChange={onChangeMem} />
          </span>
        </div>

        <div className={styles.label}>
          GPU Enabled:
          <HelpIcon id="nb_create_gpu" style={{ marginLeft: 4 }} />
        </div>
        <Switch checked={useGpu} onChange={onChangeGpu} checkedChildren="Yes" unCheckedChildren="No" />
      </div>
    </div>
  );
});

export default CreateNotebookModal;
