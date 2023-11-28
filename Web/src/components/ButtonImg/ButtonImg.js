/* eslint-disable */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import s from './ButtonImg.module.css';

class ButtonImg extends React.PureComponent {
  constructor(props) {
    super();

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    let sizeIcon = this.props.sizeIcon || 16;
    let leftIcon = null;
    if (_.isString(this.props.leftIcon)) {
      leftIcon = <img src={this.props.leftIcon} style={{ display: 'block', width: sizeIcon + 'px', height: sizeIcon + 'px', borderRadius: this.props.borderRadius ? this.props.borderRadius + 'px' : '0' }} />;
    } else {
      leftIcon = this.props.leftIcon;
    }

    let hh = this.props.height || 20;

    return (
      <div style={_.extend({}, this.props.style || {})} className={s.box + ' ' + (this.props.isSelected ? s.boxSel : '')}>
        <div style={{ display: 'table', height: hh + 'px', margin: '2px' }}>
          {leftIcon && <div style={{ textAlign: 'center', width: sizeIcon + 'px', display: 'table-cell', verticalAlign: 'middle' }}>{leftIcon}</div>}
          <div style={{ paddingLeft: leftIcon ? '4px' : '0', display: 'table-cell', verticalAlign: 'middle', fontSize: '13px', lineHeight: '15px' }}>{this.props.text}</div>
        </div>
      </div>
    );
  }
}

ButtonImg.propTypes = {
  leftIcon: PropTypes.any,
  text: PropTypes.string,
  style: PropTypes.object,
  sizeIcon: PropTypes.number,
  borderRadius: PropTypes.number,
  isSelected: PropTypes.bool,
  height: PropTypes.number,
};

export default ButtonImg;
