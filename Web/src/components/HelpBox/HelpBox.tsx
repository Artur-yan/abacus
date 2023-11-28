import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Link from '../Link/Link';
const s = require('./HelpBox.module.css');
const sd = require('../antdUseDark.module.css');

interface IHelpBoxProps {
  linkTo?: string;
  name?: string;
  subtitle?: string;
  subtitle2?: string;
  style?: CSSProperties;
  forceSpanUse?: boolean;
  isBig?: boolean;
  onlyIcon?: boolean;
  beforeText?: string;
  fullLinkText?: string;
}

const HelpBox = React.memo((props: PropsWithChildren<IHelpBoxProps>) => {
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

  return (
    <Link noApp to={props.linkTo} usePointer forceSpanUse={props.forceSpanUse} newWindow>
      {props.onlyIcon && <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faQuestionCircle').faQuestionCircle} transform={{ size: 20, x: 0, y: 0 }} style={{ color: '#d1e4f5' }} />}

      {!props.onlyIcon && props.isBig && (
        <span className={s.root} style={props.style ?? {}}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faQuestionCircle').faQuestionCircle} transform={{ size: 20, x: 0, y: -3 }} style={{ color: '#d1e4f5', marginRight: '8px' }} />
            <span
              css={`
                font-family: Roboto;
                font-size: 16px;
                font-weight: bold;
                letter-spacing: 1px;
                color: #ffffff;
                margin-bottom: 4px;
              `}
            >
              {props.name}
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span
              css={`
                font-family: Roboto;
                font-size: 12px;
                line-height: 1.67;
                color: #d1e4f5;
              `}
            >
              {(props.subtitle ?? '') + ' '}
              <span style={{ color: '#00f8c5' }}>{props.subtitle2}</span>
            </span>
          </div>
        </span>
      )}

      {!props.onlyIcon && !props.isBig && (
        <span className={s.root + ' ' + s.rootFlex} style={props.style ?? {}}>
          <span
            css={`
              font-family: Roboto;
              font-size: 12px;
              line-height: 1.67;
              color: #d1e4f5;
            `}
          >
            Need help{props.beforeText ?? ''}? {props.fullLinkText ? '' : 'go to'} <span style={{ color: '#00f8c5' }}>{props.fullLinkText ?? (props.name ?? '') + ' doc'}</span>
          </span>
        </span>
      )}
    </Link>
  );
});

export default HelpBox;
