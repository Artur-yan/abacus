import PropTypes from 'prop-types';
import React from 'react';
import s from './NavLeftRefresh.module.css';

class NavLeftRefresh extends React.PureComponent {
  constructor(props) {
    super();

    this.state = {
      isRefreshingAll: false,
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  isRefreshing() {
    return this.state.isRefreshingAll;
  }

  onClickText(e) {
    this.props.onClick && this.props.onClick(e);
    // this.setState({
    // isRefreshingAll: !this.state.isRefreshingAll,

    // }, () => {
    //   this.props.onClick && this.props.onClick(e);
    // });
  }

  render() {
    return (
      <div style={{ position: 'relative', textAlign: 'center', fontSize: '12px', lineHeight: '12px', color: '#fff', marginRight: '15px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}>
        <span className={s.but} style={{}} onClick={this.onClickText.bind(this)}>
          <span className={s.but2 + ' ' + (this.state.isRefreshingAll ? s.but2ref : '')}>
            <i className={'fa fa-home ' + (false && this.state.isRefreshingAll ? 'fa-spin fa-3x fa-fw' : '')} style={{ lineHeight: '13px', fontSize: '13px', opacity: 0.7, marginRight: this.state.isRefreshingAll ? '3px' : '6px' }}></i>
            {this.props.title || 'Refresh'}
          </span>
        </span>
      </div>
    );
  }
}

NavLeftRefresh.propTypes = {
  title: PropTypes.string,
  onClick: PropTypes.func,
};

export default NavLeftRefresh;
