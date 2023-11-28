import Inbox from '@ant-design/icons/InboxOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Form, { FormInstance } from 'antd/lib/form';
import Upload, { UploadChangeParam } from 'antd/lib/upload';
import * as React from 'react';
import { PropsWithChildren, RefObject, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import Constants from '../../constants/Constants';
const styles = require('./FormItemFileUpload.module.css');
const sd = require('../antdUseDark.module.css');

interface IFormItemFileUploadProps {
  name?: string;
  noRequired?: boolean;
  formRefInstance?: FormInstance;
  formRef?: RefObject<FormInstance>;
  onChangeFile?: (v1) => void;
  accept?: string;
  isSmall?: boolean;
  noForm?: boolean;
  dark?: boolean;
  noMsgClick?: boolean;
  hideList?: boolean;
  label?: string;
}

const CONSTANTS = {
  WARNING_MESSAGE: 'Selected file type may not be supported',
};

const defaultAllowedTypes = '.jsonl.gz,.csv.gz,.gz,.json,.csv,.jsonl,.ndjson,.jsonlines,.parquet,.xls,.tsv,.xlsx,.odf,.ods,.odt,.zip,.tar,.tar.gz,.tgz,.pdf';

const FormItemFileUpload = React.memo(
  React.forwardRef((props: PropsWithChildren<IFormItemFileUploadProps>, ref: any) => {
    const {
      paramsProp,
      authUser,
      alerts: alertsParam,
    } = useSelector((state: any) => ({
      paramsProp: state.paramsProp,
      authUser: state.authUser,
      alerts: state.alerts,
    }));
    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

    const [fileList, setFileList] = useState([]);
    const [isAllowedFileType, setAllowedFileType] = useState(true);

    const rules = props.noRequired ? [] : [{ required: true, message: 'File required!' }];

    const dummyRequest = ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess('ok');
      }, 0);
    };

    const normFile = (e) => {
      if (Array.isArray(e)) {
        return e;
      }
      return e && e.fileList;
    };

    const onChangeFileList = (info: UploadChangeParam) => {
      if (props.formRef || props.formRefInstance) {
        const form1 = props.formRefInstance ?? props.formRef?.current;

        setTimeout(() => {
          let ff = form1?.getFieldValue(props.name ?? 'files');
          ff = ff ? [...ff] : [];
          if (ff.length > 1) {
            let f1 = ff[ff.length - 1];
            ff = [f1];
            form1?.setFieldsValue({ [props.name ?? 'files']: ff });

            setFileList(ff);

            props.onChangeFile?.(f1?.originFileObj ?? f1);
          } else {
            const f1 = info.file;
            props.onChangeFile?.(f1?.originFileObj ?? f1);
          }
        }, 0);
      } else {
        const f1 = info.file;
        setFileList([f1]);

        props.onChangeFile?.(f1?.originFileObj ?? f1);
      }
    };

    const showUploadList = props.hideList
      ? false
      : {
          showRemoveIcon: true,
          removeIcon: <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTrash').faTrash} transform={{ size: 15, x: -3, y: 0 }} style={{}} />,
        };

    const checkIsValidFileType = (file) => {
      const allowedTypes = props.accept ?? Constants.flags.read_default_ext ?? defaultAllowedTypes;
      const isValidFileType = allowedTypes?.split(',')?.find((type) => file.name?.includes(type));
      if (isValidFileType === undefined) {
        setAllowedFileType(false);
      } else {
        setAllowedFileType(true);
      }
    };

    // @ts-ignore
    const inside = (
      <Upload.Dragger
        fileList={fileList}
        name="files"
        multiple={false}
        beforeUpload={(file) => checkIsValidFileType(file)}
        customRequest={dummyRequest as any}
        onChange={onChangeFileList}
        showUploadList={showUploadList}
        className={props.dark ? styles.dropper : ''}
        style={{}}
        onRemove={() => setAllowedFileType(true)}
      >
        <p ref={ref} className="ant-upload-drag-icon" style={{ margin: props.isSmall ? 0 : '5px', lineHeight: props.isSmall ? 1 : null }}>
          <Inbox style={{ fontSize: props.isSmall ? '16px' : null }} />
          {!isAllowedFileType ? (
            <p className={styles.fileWarning}>
              <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTriangleExclamation').faTriangleExclamation} />
              {CONSTANTS.WARNING_MESSAGE}
            </p>
          ) : (
            <></>
          )}
        </p>
        <p className="ant-upload-hint" style={{ fontSize: (props.isSmall ? 11 : 14) + 'px', padding: '0 20px', color: props.dark ? Utils.colorAall(1) : null }}>
          {props.noMsgClick ? 'D' : 'Click or d'}rag file to this area to upload
        </p>
      </Upload.Dragger>
    );

    if (props.noForm) {
      return inside;
    }

    const label1 = props.label != null && props.label !== '' ? <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>{props.label || 'Location:'}</span> : null;

    return (
      <Form.Item rules={rules} getValueFromEvent={normFile} valuePropName={'fileList'} name={props.name ?? 'files'} label={label1}>
        {inside}
      </Form.Item>
    );
  }),
);

export default FormItemFileUpload;
