import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useMemo, useReducer } from 'react';
import Utils from '../../../core/Utils';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./CopyText.module.css');
const sd = require('../antdUseDark.module.css');

interface ICopyTextProps {
  hideIcon?: boolean;
  style?: CSSProperties;
  className?: string;
  noNoWrap?: boolean;
  noText?: boolean;
  text?: any;
  tooltipText?: any;
  iconColor?: string;
  opacityFirst?: number;
  opacitySecond?: number;
  isValueTrunacted?: boolean;
}

const CopyText = React.memo((props: PropsWithChildren<ICopyTextProps>) => {
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const onClickCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();

    let s1 = '' + props.children;
    if (!Utils.isNullOrEmpty(s1)) {
      UtilsWeb.copyToClipboard(s1);
      REActions.addNotification('Copied to clipboard!');
    }
  };

  let style1 = useMemo(() => {
    let res = props.style ?? {};
    res = { ...res };
    if (!props.noNoWrap) {
      res.whiteSpace = 'nowrap';
    }
    if (props.isValueTrunacted) {
      res.display = 'flex';
    }
    return res;
  }, [props.style, props.noNoWrap]);

  const iconStyle1 = useMemo(() => {
    let res: any = { marginLeft: '5px', color: props.iconColor };
    if (props.opacityFirst != null) {
      res['--fa-primary-opacity'] = props.opacityFirst;
    }
    if (props.opacitySecond != null) {
      res['--fa-secondary-opacity'] = props.opacitySecond;
    }
    return res;
  }, [props.iconColor, props.opacityFirst, props.opacitySecond]);

  return (
    <span style={style1} className={props.className ?? ''}>
      {!props.noText && props.children ? (
        <span className="copyTextWrapper" css={props.isValueTrunacted ? `display: flex; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;` : null}>
          {props.children}
        </span>
      ) : null}
      {props.text}
      {!props.hideIcon && props.children != null && _.isString(props.children) ? (
        <TooltipExt title={'Copy to clipboard'}>
          {props.tooltipText && <span onClick={onClickCopy}>{props.tooltipText}</span>}
          <FontAwesomeIcon style={iconStyle1} onClick={onClickCopy} className={s.icon + ' ' + sd.styleTextBlueBright} icon={['fad', 'clipboard']} transform={{ size: 15, x: 0, y: 0 }} />
        </TooltipExt>
      ) : null}
    </span>
  );
});

export default CopyText;
