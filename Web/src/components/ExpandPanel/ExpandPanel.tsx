import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { css } from 'styled-components';
const s = require('./ExpandPanel.module.css');
const sd = require('../antdUseDark.module.css');

interface IExpandPanelProps {
  name?: string;
  isExpanded?: boolean;
  isBorderLeft?: boolean;
  titleBackColor?: string;
}

const cssSubTable = css`
  padding-left: 8px;
  margin: 0 5px 0 7px;
  border-left: 1px solid #fff;
`;
const cssTableTitle = css`
  padding: 4px 6px;
  font-weight: bold;
`;

const ExpandPanel = React.memo(({ name, isExpanded, isBorderLeft = true, titleBackColor = 'rgba(255,255,255,0.2)', children }: PropsWithChildren<IExpandPanelProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [expanded, setExpanded] = useState(isExpanded ?? false);

  const onClickExpand = (e) => {
    setExpanded((isE) => !isE);
  };

  return (
    <div css={isBorderLeft ? cssSubTable : ''}>
      <div css={cssTableTitle} onClick={onClickExpand} style={{ cursor: 'pointer', marginBottom: '4px', backgroundColor: titleBackColor ?? 'transparent' }}>
        {expanded && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faAngleDown').faAngleDown} transform={{ size: 20, x: 0, y: 0 }} style={{ marginRight: '6px', opacity: 0.8 }} />}
        {!expanded && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faAngleRight').faAngleRight} transform={{ size: 20, x: 0, y: 0 }} style={{ marginRight: '6px', opacity: 0.8 }} />}
        {name ?? ''}
      </div>
      <div
        css={`
          display: ${expanded ? 'block' : 'none'};
        `}
      >
        {children}
      </div>
    </div>
  );
});

export default ExpandPanel;
