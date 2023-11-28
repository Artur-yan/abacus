/* eslint-disable */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import s from './ButtonLineSeps.module.css';

class ButtonLineSeps extends React.PureComponent {
  constructor(props) {
    super();

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    let { data, isSelected, isTitle, widths, inPadding, allowSort, isFirst, betweenPadding, hoverNum } = this.props;
    data = data || [];

    let calcTextAlign = (ind) => {
      let { textAlign } = this.props;
      if (!textAlign || ind >= textAlign.length) {
        return '';
      }
      return textAlign[ind] || '';
    };

    let padd = '3px';
    if (this.props.padding) {
      padd = this.props.padding;
    } else if (this.props.extraPaddingVertical) {
      padd = 3 + this.props.extraPaddingVertical + 'px ' + padd + ' ' + (3 + this.props.extraPaddingVertical) + 'px ' + padd;
    }

    let lineClass = s.siteLine;
    let lineSelClass = s.siteLineSel;

    if (hoverNum) {
      if (hoverNum === -1) {
        lineClass = '';
        lineSelClass = '';
      }
      if (hoverNum === 2) {
        lineClass = s.siteLine2;
        lineSelClass = s.siteLineSel2;
      }
    }

    let color1 = '#e7e7e7';

    return (
      <div
        onMouseOver={(e) => {
          if (this.isHover_) return;
          this.isHover_ = true;
          this.props.onHover && this.props.onHover(true, e);
        }}
        onMouseOut={(e) => {
          this.isHover_ = false;
          this.props.onHover && this.props.onHover(false, e);
        }}
        style={_.extend({ borderBottom: !this.props.isLast ? (isTitle ? '1px solid ' + color1 : '1px dashed ' + color1) : '', borderTop: isFirst ? '1px dashed ' + color1 : '' }, this.props.style || {})}
      >
        <div style={{ display: 'block', cursor: isTitle ? 'default' : 'pointer' }} onClick={this.props.onClick} className={lineClass + ' ' + (isSelected ? lineSelClass : '') + ' ' + (isTitle ? s.siteLineNon : '')}>
          <div style={{ padding: padd, display: 'flex', flexWrap: 'wrap', aaflexDirection: 'row', aaalignContent: 'flex-start', aaflexFlow: 'row nowrap' }}>
            {data.map((d1, ind) => {
              let showCaret = allowSort && isTitle && this.props.noSortIndex && this.props.noSortIndex.indexOf(ind) === -1;

              let elem1 = d1;
              let style1 = {
                // display: 'inline-block',
                textAlign: calcTextAlign(ind),
                // whiteSpace: isTitle ? 'nowrap' : 'normal',
                // minWidth: 0,
              };
              let styleIn = {};
              if (inPadding && ind < inPadding.length && inPadding.length > 0 && inPadding[ind]) {
                styleIn.padding = inPadding[ind];
              }
              if (betweenPadding) {
                if (ind < data.length - 1) {
                  style1.marginRight = betweenPadding + 'px';
                }
              }

              let useEllips = this.props.useEllipsis;
              let usedWidth = false;
              if (widths && ind < widths.length && widths.length > 0 && widths[ind] != null) {
                let ww1 = widths[ind];
                let useVert = false;
                if (_.isArray(ww1)) {
                  useVert = ww1[1] === true;
                  ww1 = ww1[0];
                }
                if (ww1 < 0) {
                  style1.flex = -ww1;
                  // style1.overflow = 'hidden';
                  // style1.display = 'inline-flex';
                  // styleIn.width = 'auto';
                  style1.minWidth = 0;
                  style1.margin = 'auto 0';
                } else {
                  useEllips = false;
                  styleIn.width = ww1 + 'px';
                  // styleIn.display = 'inline-block';
                  style1.flex = 0;
                  elem1 = <div style={styleIn}>{elem1}</div>;
                  if (useVert) {
                    style1.margin = 'auto 0';
                  }
                }
                usedWidth = true;
              }

              return (
                <div key={'sep_' + ind} style={style1} className={useEllips ? s.ellips : ''}>
                  {elem1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

ButtonLineSeps.propTypes = {
  useEllipsis: PropTypes.bool,
  data: PropTypes.array,
  textAlign: PropTypes.array,
  inPadding: PropTypes.array,
  isLast: PropTypes.bool,
  isFirst: PropTypes.bool,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
  isTitle: PropTypes.bool,
  noSortIndex: PropTypes.array,
  widths: PropTypes.array,
  allowSort: PropTypes.bool,
  padding: PropTypes.number,
  extraPaddingVertical: PropTypes.number,
  betweenPadding: PropTypes.number,
  style: PropTypes.object,
  onHover: PropTypes.func,
  hoverNum: PropTypes.number,
};

export default ButtonLineSeps;
