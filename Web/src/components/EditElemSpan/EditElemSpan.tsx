import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import Utils from '../../../core/Utils';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./EditElemSpan.module.css');
const sd = require('../antdUseDark.module.css');

interface IEditElemSpanProps {
  value?: any;
  onNullShow?: any;
  suffix?: string;
  onEdit?: () => void;
  onSet?: () => void;
  onCancel?: () => void;
  setText?: string;
}

const EditElemSpan = React.memo((props: PropsWithChildren<IEditElemSpanProps>) => {
  // const { paramsProp, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [isEditing, setIsEditing] = useState(false);

  const onClickEdit = (e) => {
    props.onEdit?.();
    setIsEditing(true);
  };

  const onClickCancel = (e) => {
    props.onCancel?.();
    setIsEditing(false);
  };

  const onClickSet = (e) => {
    props.onSet?.();
    setIsEditing(false);
  };

  let valueShow = props.value;
  if (valueShow == null) {
    valueShow = props.onNullShow;
  }

  return (
    <span>
      {isEditing && props.children}
      {isEditing && (
        <Button
          onClick={onClickSet}
          css={`
            margin-left: 8px;
          `}
          size={'small'}
          type={'primary'}
        >
          {props.setText ?? 'Set'}
        </Button>
      )}
      {isEditing && (
        <Button
          onClick={onClickCancel}
          css={`
            margin-left: 8px;
          `}
          size={'small'}
          type={'primary'}
        >
          Cancel
        </Button>
      )}

      {!isEditing && <span>{valueShow}</span>}
      {!isEditing && (
        <span
          onClick={onClickEdit}
          css={`
            margin-left: 6px;
            opacity: 0.3;
            :hover {
              opacity: 1;
            }
          `}
        >
          <TooltipExt title={'Edit'}>
            <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '4px' }} />
          </TooltipExt>
        </span>
      )}
      {!Utils.isNullOrEmpty(props.suffix) && (
        <span
          css={`
            margin-left: 4px;
          `}
        >
          {props.suffix}
        </span>
      )}
    </span>
  );
});

export default EditElemSpan;
