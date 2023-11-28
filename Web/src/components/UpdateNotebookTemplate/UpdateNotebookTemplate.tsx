import { Input } from 'antd';
import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import React, { PropsWithChildren, useCallback, useMemo, useEffect } from 'react';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useNotebookTemplateTypes } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
import styles from './UpdateNotebookTemplate.module.css';

const HelpIconSpaced = (props) => <HelpIcon {...props} style={{ marginLeft: 4 }} />;

interface UpdateNotebookTemplateProps {
  isModalOpen: boolean;
  setIsModalOpen: (arg0: boolean) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  template: any;
}

const UpdateNotebookTemplate = ({ isModalOpen = false, template, setIsModalOpen, onCancel, onSuccess }: PropsWithChildren<UpdateNotebookTemplateProps>) => {
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

  const initialValues = useMemo(() => {
    return {
      templateName: template?.name,
      description: template?.description,
      templateType: notebookTemplateTypeOptions?.find?.((option) => option.value === template?.templateType),
    };
  }, [notebookTemplateTypeOptions, template]);

  const handleSubmit = useCallback(
    () =>
      new Promise((resolve) => {
        const values = _.cloneDeep(form.getFieldsValue(true));
        const { templateName, description, templateType } = values;

        const callback = (err: any, res: any) => {
          if (err || res?.error || !res?.success) {
            REActions.addNotificationError(err || res?.error || Constants.errorDefault);
          } else {
            StoreActions._listNotebookTemplates();
            StoreActions._listNotebookTemplates(templateType?.value);
            onSuccess?.();
          }
          form.resetFields();
          resolve(true);
          setIsModalOpen(false);
        };

        REClient_.client_()._updateNotebookTemplate(template?.notebookTemplateId, null, null, templateName, description, templateType.value, callback);
      }),
    [form, setIsModalOpen, template],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
    form.resetFields();
    setIsModalOpen(false);
  }, [form, onCancel, setIsModalOpen]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const requiredRule = { required: true, message: 'Required!' };
  return (
    <Modal width={640} bodyStyle={{ height: 480 }} title="Update Notebook Template" open={isModalOpen} cancelText="Cancel" okText="Update" onCancel={handleCancel} onOk={handleSubmit}>
      <div className={styles.bodyContainer}>
        <div>
          <FormExt layout="vertical" className="useDark" form={form} initialValues={initialValues}>
            <Form.Item
              name="templateName"
              rules={[requiredRule]}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Template Name:
                  <HelpIconSpaced id="notebook_template_name" />
                </span>
              }
            >
              <Input autoComplete="off" />
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
export default React.memo(UpdateNotebookTemplate);
