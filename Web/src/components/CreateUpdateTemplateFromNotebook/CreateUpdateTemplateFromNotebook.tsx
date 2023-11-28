import { Input } from 'antd';
import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useNotebookTemplateTypes, useNotebookTemplates } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
import styles from './CreateUpdateTemplateFromNotebook.module.css';

const HelpIconSpaced = (props) => <HelpIcon {...props} style={{ marginLeft: 4 }} />;

interface CreateUpdateTemplateFromNotebookProps {
  isModalOpen: boolean;
  isEditMode: boolean;
  setIsModalOpen: (arg0: boolean) => void;
  notebookId: string;
  onCancel?: () => void;
}

const CreateUpdateTemplateFromNotebook = ({ isModalOpen = false, isEditMode = false, setIsModalOpen, notebookId, onCancel }: PropsWithChildren<CreateUpdateTemplateFromNotebookProps>) => {
  const notebookTemplateTypes = useNotebookTemplateTypes();
  const [form] = Form.useForm();

  const notebookTemplateTypeOptions = useMemo(() => {
    return (
      notebookTemplateTypes?.templateTypes?.map?.((templateType) => ({
        label: templateType,
        value: templateType,
      })) || []
    );
  }, [notebookTemplateTypes]);

  const notebookTemplates = useNotebookTemplates();

  const notebookTemplateOptions = useMemo(() => {
    return notebookTemplates?.map?.((template) => ({
      label: template?.name,
      value: template?.notebookTemplateId,
      ...template,
    }));
  }, [notebookTemplates]);

  const handleValuesChange = useCallback(
    (changedValues) => {
      if (!isEditMode || !changedValues?.template) return;
      const { description, filename, templateType } = changedValues.template;
      form.setFieldValue('description', description);
      form.setFieldValue('filename', filename);
      form.setFieldValue(
        'templateType',
        notebookTemplateTypeOptions.find((notebookTemplateTypeOption) => notebookTemplateTypeOption?.value === templateType),
      );
    },
    [form, isEditMode],
  );

  const handleSubmit = useCallback(
    () =>
      new Promise((resolve) => {
        const values = _.cloneDeep(form.getFieldsValue(true));
        const { filename, template, description, templateType } = values;

        const callback = (err: any, res: any) => {
          if (err || res?.error || !res?.success) {
            REActions.addNotificationError(err || res?.error || Constants.errorDefault);
            form.resetFields();
            resolve(true);
            setIsModalOpen(false);
            return;
          }
          StoreActions._listNotebookTemplates();
          StoreActions._listNotebookTemplates(templateType?.value);
          form.resetFields();
          resolve(true);
          setIsModalOpen(false);
        };

        if (isEditMode) {
          return REClient_.client_()._updateNotebookTemplate(template?.value, notebookId, filename, template?.label, description, templateType.value, callback);
        }
        REClient_.client_()._createNotebookTemplate(notebookId, filename, template, description, templateType.value, callback);
      }),
    [form, setIsModalOpen, isEditMode],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
    form.resetFields();
    setIsModalOpen(false);
  }, [form, onCancel, setIsModalOpen]);

  const requiredRule = { required: true, message: 'Required!' };
  return (
    <Modal width={640} bodyStyle={{ height: 480 }} title={isEditMode ? 'Update Notebook Template' : 'Create Notebook Template'} open={isModalOpen} cancelText="Cancel" okText="Update" onCancel={handleCancel} onOk={handleSubmit}>
      <div className={styles.bodyContainer}>
        <div>
          <FormExt layout="vertical" className="useDark" form={form} onValuesChange={handleValuesChange}>
            <Form.Item
              name="template"
              rules={[requiredRule]}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Template Name:
                  <HelpIconSpaced id="notebook_template_name" />
                </span>
              }
            >
              {isEditMode ? <SelectExt options={notebookTemplateOptions} /> : <Input autoComplete="off" placeholder={''} />}
            </Form.Item>
            <Form.Item
              name="filename"
              rules={[requiredRule]}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Python File Name:
                  <HelpIconSpaced id="notebook_template_python_filename" />
                </span>
              }
            >
              <Input autoComplete="off" placeholder={''} />
            </Form.Item>
            <Form.Item
              name="templateType"
              rules={[requiredRule]}
              style={{ marginBottom: 8 }}
              hasFeedback
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Template Type:
                  <HelpIconSpaced id="notebook_template_type" />
                </span>
              }
            >
              <SelectExt options={notebookTemplateTypeOptions} />
            </Form.Item>
            <Form.Item name="description" label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Description:</span>}>
              <Input autoComplete="off" placeholder={''} />
            </Form.Item>
          </FormExt>
        </div>
      </div>
    </Modal>
  );
};
export default React.memo(CreateUpdateTemplateFromNotebook);
