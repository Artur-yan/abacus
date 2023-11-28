import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import React, { PropsWithChildren, useCallback, useMemo, useState, useEffect } from 'react';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import EditorElem from '../EditorElem/EditorElem';
import { useNotebookTemplateTypes, useNotebookTemplates } from '../../api/REUses';
import Constants from '../../constants/Constants';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
import styles from './AddTemplateToNotebook.module.css';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';

const HelpIconSpaced = (props) => <HelpIcon {...props} style={{ marginLeft: 4 }} />;

interface AddTemplateToNotebookProps {
  isModalOpen?: boolean;
  setIsModalOpen?: (arg0: boolean) => void;
  onSuccess?: () => void;
  notebookId: string;
}

const allTemplates = 'ALL TEMPLATES';

const AddTemplateToNotebook = ({ isModalOpen = false, setIsModalOpen, notebookId, onSuccess }: PropsWithChildren<AddTemplateToNotebookProps>) => {
  const [templateType, setTemplateType] = useState(allTemplates);
  const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);
  const [selectedTemplateDescription, setSelectedTemplateDescription] = useState({} as any);

  const notebookTemplateTypes = useNotebookTemplateTypes();
  const [form] = Form.useForm();

  const notebookTemplateTypeOptions = useMemo(() => {
    const extendedTemplateTypes = [...(notebookTemplateTypes?.templateTypes || []), allTemplates];
    return extendedTemplateTypes.map((templateType) => ({
      label: templateType,
      value: templateType,
    }));
  }, [notebookTemplateTypes]);

  const notebookTemplates = useNotebookTemplates(templateType === allTemplates ? null : templateType);

  const notebookTemplateOptions = useMemo(() => {
    return notebookTemplates?.map?.((template) => ({
      label: template?.name,
      value: template?.notebookTemplateId,
      ...template,
    }));
  }, [notebookTemplates, templateType]);

  const initialValues = useMemo(() => {
    return { templateType: notebookTemplateTypeOptions?.find((option) => option.value === allTemplates) };
  }, [notebookTemplateTypeOptions]);

  const handleSubmit = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      const values = _.cloneDeep(form.getFieldsValue(true));
      if (!values?.notebookTemplate?.value) {
        REActions.addNotificationError(`Please select a notebook template file`);
        return;
      }

      REClient_.promises_()
        ._addTemplateToNotebook(notebookId, values.notebookTemplate.value)
        .then((res) => {
          if (!res?.success || res?.error) {
            throw new Error(res?.error);
          }
          onSuccess?.();
        })
        .catch((error) => {
          REActions.addNotificationError(error?.message || Constants.errorDefault);
        })
        .finally(() => {
          form.resetFields();
          resolve(true);
          setIsModalOpen?.(false);
        });
    });
  }, [form, setIsModalOpen, notebookId]);

  const requiredRule = { required: true, message: 'Required!' };

  const handleCancel = useCallback(() => {
    form.resetFields();
    setIsFetchingTemplate(false);
    setSelectedTemplateDescription(false);
    setIsModalOpen?.(false);
  }, [form, setIsModalOpen]);

  const handleValuesChange = useCallback(
    (changedValues) => {
      setSelectedTemplateDescription({});
      const newTemplateTypeValue = changedValues?.templateType?.value;
      if (!newTemplateTypeValue) return;
      setTemplateType(newTemplateTypeValue);
      if (newTemplateTypeValue !== allTemplates) form.setFieldValue('notebookTemplate', null);
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

  const selectedTemplate = Form.useWatch('notebookTemplate', form);

  useEffect(() => {
    if (!selectedTemplate?.notebookTemplateId) return;
    getNotebookTemplate(selectedTemplate?.notebookTemplateId);
  }, [selectedTemplate]);

  return (
    <Modal width={640} bodyStyle={{ height: 552 }} title="Add a Template to Notebook" open={isModalOpen} onCancel={handleCancel} cancelText="Cancel" okText="Add" onOk={handleSubmit}>
      <div className={styles.bodyContainer}>
        <RefreshAndProgress refreshingPaddingTop={360} isRefreshing={isFetchingTemplate}>
          <FormExt form={form} initialValues={initialValues} onValuesChange={handleValuesChange} layout="vertical" className="useDark">
            <Form.Item
              name="templateType"
              rules={[requiredRule]}
              style={{ marginBottom: 8 }}
              hasFeedback
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Filter Template Type:
                  <HelpIconSpaced id="notebook_template_type" />
                </span>
              }
            >
              <SelectExt options={notebookTemplateTypeOptions} />
            </Form.Item>
            <Form.Item
              name="notebookTemplate"
              rules={[requiredRule]}
              style={{ marginBottom: 8 }}
              hasFeedback
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Notebook Template:
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
export default React.memo(AddTemplateToNotebook);
