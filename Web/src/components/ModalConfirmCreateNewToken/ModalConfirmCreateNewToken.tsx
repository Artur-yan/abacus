import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren, useMemo, useRef } from 'react';
import ModalConfirm from '../ModalConfirm/ModalConfirm';

interface IModalConfirmCreateNewTokenProps {
  onConfirm?: (name) => void;
}

const ModalConfirmCreateNewToken = React.memo((props: PropsWithChildren<IModalConfirmCreateNewTokenProps>) => {
  const nameRef = useRef(null);

  const onConfirm = (e) => {
    props.onConfirm?.(nameRef.current);
    nameRef.current = null;
  };

  const titleElem = useMemo(() => {
    return (
      <div className={'useDark'}>
        <div
          css={`
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 10px;
          `}
        >
          Do you want to create a new token?
        </div>
        <div css={``}>
          <div
            css={`
              margin-bottom: 5px;
              font-size: 14px;
              font-weight: normal;
            `}
          >
            Name:
          </div>
          <Input
            defaultValue={''}
            onChange={(e) => {
              nameRef.current = e.target.value;
            }}
          />
        </div>
      </div>
    );
  }, [nameRef]);

  return (
    <ModalConfirm onConfirm={onConfirm} title={titleElem} icon={<QuestionCircleOutlined />} okText={'Create'} cancelText={'Cancel'} okType={'primary'}>
      {props.children}
    </ModalConfirm>
  );
});

export default ModalConfirmCreateNewToken;
