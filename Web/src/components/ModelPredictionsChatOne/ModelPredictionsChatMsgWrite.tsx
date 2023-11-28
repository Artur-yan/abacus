import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren, useState } from 'react';
const s = require('./ModelPredictionsChatOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelPredictionsChatMsgWriteProps {
  onSubmitMessage?: (msg?: string) => void;
}

const ModelPredictionsChatMsgWrite = React.memo((props: PropsWithChildren<IModelPredictionsChatMsgWriteProps>) => {
  const [text, setText] = useState('');

  const onChangeText = (e) => {
    setText(e.target.value ?? '');
  };

  const onClickSubmit = () => {
    setText((s1) => {
      props.onSubmitMessage?.(s1);
      return '';
    });
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onClickSubmit();
    }
  };

  return (
    <div
      css={`
        margin-top: -8px;
        display: flex;
        width: 100%;
        max-width: 900px;
      `}
    >
      <span
        css={`
          flex: 1;
        `}
      >
        <div>
          <Input.TextArea onKeyDown={onKeyDown} value={text} onChange={onChangeText} style={{ width: '100%', minHeight: '80px' }} />
        </div>
        <div
          css={`
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            margin-left: 5px;
            margin-top: 3px;
          `}
        >
          Press Shift+Enter for new line
        </div>
      </span>
      <span
        css={`
          margin-left: 12px;
          margin-top: 4px;
        `}
      >
        <Button type={'primary'} onClick={onClickSubmit}>
          <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faPaperPlane').faPaperPlane} transform={{ size: 15, x: 0, y: 0 }} />
        </Button>
      </span>
    </div>
  );
});

export default ModelPredictionsChatMsgWrite;
