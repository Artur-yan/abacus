import * as React from 'react';
import { CSSProperties, PropsWithChildren } from 'react';
const s = require('./DashboardStepRect.module.css');
const sd = require('../antdUseDark.module.css');

interface IDashboardStepRectProps {
  active?: boolean;
  title?: string;
  style?: CSSProperties;
  isRelative?: boolean;
  isError?: boolean;
}

const DashboardStepRect = React.memo((props: PropsWithChildren<IDashboardStepRectProps>) => {
  const titleStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    background: 'black',
    height: 39,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  } as CSSProperties;

  if (props.isError) {
    titleStyles.background = 'linear-gradient(276deg, #D64444 0%, #AE1E1E 43%, #811b1b 100%)';
  } else if (props.active) {
    titleStyles.background = 'linear-gradient(276deg, #0ccfe4 0%, #3391ed 43%, #8c54ff 100%)';
  }

  return (
    <div style={{ display: 'flex', flexFlow: 'column', position: 'relative', ...props.style }}>
      <div style={titleStyles}>
        <span style={{ fontFamily: 'Roboto', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1.13px', color: '#ffffff' }}>{props.title}</span>
      </div>
      <div style={{ minWidth: props.isRelative ? '' : '230px', flex: 1, minHeight: props.isRelative ? '' : '313px', position: 'relative', display: 'block', maxHeight: '100%' }}>{props.children}</div>
    </div>
  );
});

export default DashboardStepRect;
