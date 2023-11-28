import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import React, { PropsWithChildren, useCallback, useMemo, useState, useEffect } from 'react';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Input from 'antd/lib/input';
import REClient_ from '../../api/REClient';
import Location from '../../../core/Location';
import EditorElem from '../EditorElem/EditorElem';
import { useNotebookTemplates } from '../../api/REUses';
import StoreActions from '../../stores/actions/StoreActions';
import Constants from '../../constants/Constants';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import { useAppSelector } from '../../../core/hooks';
import styles from './PipelineCreate.module.css';

const HelpIconSpaced = (props) => <HelpIcon {...props} style={{ marginLeft: 4 }} />;

interface PipelineCreateProps {
  isModalOpen?: boolean;
  setIsModalOpen?: (arg0: boolean) => void;
}

const pipelineTemplateType = 'PIPELINE';

const PipelineCreate = ({ isModalOpen = false, setIsModalOpen }: PropsWithChildren<PipelineCreateProps>) => {
  let projectId = useAppSelector((state: any) => state.paramsProp?.get('projectId'));
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);
  const [selectedTemplateDescription, setSelectedTemplateDescription] = useState({} as any);

  const [form] = Form.useForm();

  const notebookTemplates = useNotebookTemplates(pipelineTemplateType);

  const notebookTemplateOptions = useMemo(() => {
    return notebookTemplates?.map?.((template) => ({
      label: template?.name,
      value: template?.notebookTemplateId,
      ...template,
    }));
  }, [notebookTemplates]);

  const invalidateCachePipelineList = () => {
    if (projectId) StoreActions.listPipelines(projectId);
    StoreActions.listPipelines();
  };

  const handleSubmit = async () => {
    const values = _.cloneDeep(form.getFieldsValue(true));
    let notebookId;
    let pipelineId;
    try {
      const createPipelineResponse = await REClient_.promises_().createPipeline(values.name, projectId);
      if (createPipelineResponse?.error || !createPipelineResponse?.success) {
        throw new Error(createPipelineResponse?.error);
      }
      notebookId = createPipelineResponse?.result?.notebookId;
      pipelineId = createPipelineResponse?.result?.pipelineId;
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
    if (!notebookId || !pipelineId) return;

    try {
      await REClient_.promises_()._addTemplateToNotebook(notebookId, values.notebookTemplate.value);
    } catch (error) {}

    const url = `/${PartsLink.pipeline_one}/${projectId ?? '-'}/${encodeURIComponent(pipelineId)}`;
    const params = `notebookId=${encodeURIComponent(notebookId)}`;
    invalidateCachePipelineList();
    form.resetFields();
    Location.push(url, undefined, params);
  };

  const handleCancel = useCallback(() => {
    form.resetFields();
    setIsFetchingTemplate(false);
    setSelectedTemplateDescription(false);
    setIsModalOpen?.(false);
  }, [form, setIsModalOpen]);

  const handleValuesChange = useCallback(
    (changedValues) => {
      const newTemplateValue = changedValues?.notebookTemplate;
      if (!newTemplateValue) return;
      setSelectedTemplateDescription({});
    },
    [form],
  );

  const getNotebookTemplate = (notebookTemplateId) => {
    setIsFetchingTemplate(true);
    REClient_.promises_()
      ._describeNotebookTemplate(notebookTemplateId)
      .then((response) => {
        setSelectedTemplateDescription(response?.result);
      })
      .finally(() => {
        setIsFetchingTemplate(false);
      });
  };

  const requiredRule = { required: true, message: 'Required!' };

  const selectedTemplate = Form.useWatch('notebookTemplate', form);

  useEffect(() => {
    if (!selectedTemplate?.notebookTemplateId) return;
    getNotebookTemplate(selectedTemplate?.notebookTemplateId);
  }, [selectedTemplate]);

  return (
    <Modal className="useDark" width={640} bodyStyle={{ height: 552 }} title="Create Pipeline" open={isModalOpen} onCancel={handleCancel} cancelText="Cancel" okText="Add" onOk={handleSubmit}>
      <div className={styles.bodyContainer}>
        <RefreshAndProgress refreshingPaddingTop={360} isRefreshing={isFetchingTemplate}>
          <FormExt layout="vertical" form={form} onValuesChange={handleValuesChange}>
            <Form.Item name="name" rules={[requiredRule]} style={{ marginBottom: 8 }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Name:</span>}>
              <Input autoComplete="off" placeholder="" />
            </Form.Item>
            <Form.Item
              name="notebookTemplate"
              style={{ marginBottom: 8 }}
              hasFeedback
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Pipeline Template:
                  <HelpIconSpaced id="notebook_template" />
                </span>
              }
            >
              <SelectExt options={notebookTemplateOptions} />
            </Form.Item>
          </FormExt>
          <div className={styles.templateInfoContainer}>
            <div className={styles.description}>{selectedTemplate?.description && `Description: ${selectedTemplate?.description}`}</div>
            {selectedTemplateDescription?.sourceCode && (
              <div className={styles.editorContainer}>
                <EditorElem hideExpandFGs readonly lineNumbers lang="python" validateOnCall value={selectedTemplateDescription?.sourceCode} />
              </div>
            )}
          </div>
        </RefreshAndProgress>
      </div>
    </Modal>
  );
};
export default React.memo(PipelineCreate);
