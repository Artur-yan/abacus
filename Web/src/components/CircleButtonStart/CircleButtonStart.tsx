import LinearProgress from '@mui/material/LinearProgress';
import * as React from 'react';
import { calcImgSrc } from '../../../core/Utils';
import Link from '../Link/Link';
const s = require('./CircleButtonStart.module.css');
const sd = require('../antdUseDark.module.css');

interface ICircleButtonStartProps {
  linkTo?: any;
  text?: string;
  enabled?: boolean;

  showProgress?: boolean;
  progressText?: string;
  onClick?: (event: Event) => void;
}

interface ICircleButtonStartState {}

class CircleButtonStart extends React.PureComponent<ICircleButtonStartProps, ICircleButtonStartState> {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    let imgCircle = '/imgs/deploysCircle2.png';
    let linkTo = this.props.linkTo;
    let colorText = '#ffffff';
    let showCircleHover = true,
      usePointer = true;
    let animCircle = '';
    let normalCircle = '';

    if (this.props.enabled ?? true) {
      normalCircle = s.normalCircle;
    } else {
      imgCircle = '/imgs/deploysCircleDisabled2.png';
      linkTo = '';
      colorText = '#8798ad';
      showCircleHover = false;
      usePointer = false;
    }

    let text1 = this.props.text || 'Start deployment';
    if (this.props.showProgress && this.props.progressText != null) {
      text1 = this.props.progressText;
      imgCircle = '/imgs/deploysCircleProgress2.png';
      linkTo = '';
      colorText = '#597fe9';
      showCircleHover = true;
      animCircle = s.animCircle;
      normalCircle = '';
      usePointer = false;
    }

    let bar1 = null;
    if (this.props.showProgress) {
      bar1 = (
        <span>
          <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
        </span>
      );
    }

    return (
      <Link to={linkTo} onClick={this.props.onClick}>
        <span style={{ position: 'relative', width: '120px', height: '120px', display: 'inline-block', cursor: usePointer ? 'pointer' : 'default' }} className={s.circleButton + ' ' + normalCircle}>
          <img src={calcImgSrc(imgCircle)} alt={''} style={{ position: 'absolute', left: '50%', marginLeft: '-60px', top: '50%', marginTop: '-60px', width: '120px', height: '120px', zIndex: 0 }} />
          {showCircleHover && (
            <div style={{ margin: '6px', borderRadius: '50%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} className={s.circleCenter + ' ' + animCircle}>
              &nbsp;
            </div>
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '5px' }}>
            <span style={{ fontFamily: 'Roboto', fontSize: '12px', fontWeight: 500, color: colorText }}>
              {text1}
              {bar1}
            </span>
          </div>
        </span>
      </Link>
    );
  }
}

export default CircleButtonStart;
