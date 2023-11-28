import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef } from 'react';
import { Provider, useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import HelpIcon from '../HelpIcon/HelpIcon';
import confirm from 'antd/lib/modal/confirm';
import { NativeButtonProps } from 'antd/lib/button/button';
const s = require('./ModalConfirmCreateNewVersion.module.css');
const sd = require('../antdUseDark.module.css');

interface IModalConfirmCreateNewVersionProps {
  onConfirm?: (newLocation?, mergeFileSchemas?, e?) => void;
  lastLocation?: string;
  showLocation?: boolean;
  mergeFileSchemasDefault?: boolean;
}

const ModalConfirmCreateNewVersion = React.memo((props: PropsWithChildren<IModalConfirmCreateNewVersionProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const newLocation = useRef(null);
  const mergeFileSchemas = useRef(null);
  const confirmUsed = useRef(null);

  useEffect(() => {
    if (Utils.isNullOrEmpty(newLocation.current)) {
      newLocation.current = props.lastLocation;
    }
    if (Utils.isNullOrEmpty(mergeFileSchemas.current)) {
      mergeFileSchemas.current = props.mergeFileSchemasDefault;
    }
  }, [props.lastLocation, props.mergeFileSchemasDefault]);

  const onConfirm = () => {
    props.onConfirm?.(newLocation.current, mergeFileSchemas.current, null);
  };

  const contentElem = useMemo(() => {
    return (
      <Provider store={Utils.globalStore()}>
        <div className={'useDark'}>
          <Checkbox
            defaultChecked={props.mergeFileSchemasDefault || false}
            onChange={(e) => {
              mergeFileSchemas.current = e.target.checked;
            }}
            style={{ color: Utils.colorA(1) }}
          >
            Merge schemas across multiple files <HelpIcon id={'dataset_merge_file_schemas_flag'} style={{ marginLeft: '4px' }} />
          </Checkbox>
        </div>
      </Provider>
    );
  }, [props.mergeFileSchemasDefault, mergeFileSchemas]);

  const titleElem = useMemo(() => {
    if (!props.showLocation) {
      return `Do you want to create a new version of this Dataset?`;
    }

    return (
      <div className={'useDark'}>
        <div
          css={`
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 10px;
          `}
        >
          Do you want to create a new version of this Dataset?
        </div>
        <div css={``}>
          <div
            css={`
              margin-bottom: 5px;
              font-size: 14px;
              font-weight: normal;
            `}
          >
            Location:
          </div>
          <Input
            defaultValue={props.lastLocation || ''}
            onChange={(e) => {
              newLocation.current = e.target.value;
              if (newLocation?.current?.includes('*')) {
                confirmUsed.current.update({ content: contentElem });
              } else {
                confirmUsed.current.update({ content: undefined });
                mergeFileSchemas.current = undefined;
              }
            }}
          />
        </div>
      </div>
    );
  }, [props.lastLocation, newLocation, props.showLocation, props.mergeFileSchemasDefault]);

  let calcButtonProps: (type1?: string, isHidden?: boolean, isOk?: boolean) => NativeButtonProps = (type1?, isHidden?, isOk?: boolean) => {
    let res: NativeButtonProps = {};

    res.style = res.style ?? {};

    res.type = 'primary';
    res.style.borderRadius = '3px';
    res.style.border = 'none';
    res.style.paddingLeft = '20px';
    res.style.paddingRight = '20px';

    let color1 = '#8a98ab';
    if (type1 === 'danger') {
      color1 = '#c4444d';
    } else if (type1 === 'primary') {
      color1 = isOk ? '#2e5bff' : null;
    }

    if (!isOk) {
      color1 = 'transparent';
      res.style = { ...res.style, border: '1px solid #8798ad' };
    }

    if (color1 != null) {
      res.style.backgroundColor = color1;
    }

    if (isHidden) {
      res.style.display = 'none';
    }

    return res;
  };

  const onClick = () => {
    if (confirmUsed.current != null) {
      confirmUsed.current.destroy();
      confirmUsed.current = null;
    }

    confirmUsed.current = confirm({
      title: titleElem,
      icon: <QuestionCircleOutlined style={{ color: 'green' }} />,
      ...(props.lastLocation?.includes('*') && { content: contentElem }),
      okText: 'Create',
      cancelText: 'Cancel',
      maskClosable: true,
      okType: 'primary',
      onOk: () => {
        onConfirm();
        mergeFileSchemas.current = undefined;
      },
      onCancel: () => {
        mergeFileSchemas.current = undefined;
      },
      okButtonProps: calcButtonProps('primary', false, true),
      cancelButtonProps: calcButtonProps(undefined, false),
    });
  };

  return <span onClick={onClick}>{props.children}</span>;
});

export default ModalConfirmCreateNewVersion;
