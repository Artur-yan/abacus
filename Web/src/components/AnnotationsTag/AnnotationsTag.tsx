import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cx from 'classnames';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import TooltipExt from '../TooltipExt/TooltipExt';
import { IAnnotationsTagProps } from './AnnotationsTagInterface';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';

const s = require('./AnnotationsTag.module.css');
const sd = require('../antdUseDark.module.css');

const deleteNotAllowedMessage = 'This label is being used to annotate text, please remove any associated annotations before deleting the label';
const deleteMessage = 'Removing label will NOT remove any existing usage of the label in any documents';

const AnnotationsTag = React.memo(({ readonly, tag, deleteEnabled, allowDelete, isSelected, onTagClick, onTagDelete, onTagDeletePromise }: PropsWithChildren<IAnnotationsTagProps>) => {
  const deleteIcon = () => {
    if (readonly) {
      return null;
    }
    return (
      <ModalConfirm
        onConfirmPromise={onTagDeletePromise.bind(null, tag)}
        title={
          <div>
            <span
              css={`
                font-size: 16px;
              `}
            >
              Are you sure you want to remove label: "{tag.label}"?
            </span>
            <br />
            <span
              css={`
                font-size: 14px;
              `}
            >
              {deleteMessage}
            </span>
          </div>
        }
        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
        okText={'Remove'}
        cancelText={'Cancel'}
        okType={'primary'}
      >
        <span role="presentation" className={s.annotationsTagDelete}>
          <FontAwesomeIcon icon={['fas', 'times']} transform={{ size: 13, x: 0, y: 0 }} style={{ color: allowDelete ? '#ffffff' : '#ffffff75' }} />
        </span>
      </ModalConfirm>
    );
  };

  return (
    <span
      role="presentation"
      onClick={!readonly ? () => onTagClick(tag) : () => {}}
      style={{ backgroundColor: tag.color }}
      className={cx({
        [s.annotationsTag]: true,
        [s.annotationsTagSelected]: isSelected && !readonly,
        [s.annotationsTagReadonly]: readonly,
      })}
    >
      <span>{tag.label}</span>
      {allowDelete && !readonly && deleteEnabled && deleteIcon()}
      {!allowDelete && !readonly && deleteEnabled && (
        <TooltipExt style={s.annotationsTagDelete} placement="bottom" overlay={<span>{deleteNotAllowedMessage}</span>}>
          {deleteIcon()}
        </TooltipExt>
      )}
    </span>
  );
});

export default AnnotationsTag;
