import * as React from 'react';
const s = require('./ShowMore.module.css');
const sd = require('../antdUseDark.module.css');

interface IShowMoreProps {
  value?: any;
  max?: number;
}

interface IShowMoreState {
  showMore?: boolean;
}

class ShowMore extends React.PureComponent<IShowMoreProps, IShowMoreState> {
  constructor(props) {
    super(props);

    this.state = {
      showMore: false,
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onClickShowMore = (e) => {
    this.setState({
      showMore: !this.state.showMore,
    });
  };

  render() {
    let value = this.props.value || '';
    let max = this.props.max ?? 3;
    value = '' + value;

    let showMore = null;
    if (!this.state.showMore && value.length > max) {
      showMore = (
        <span className={sd.linkBlue} onClick={this.onClickShowMore}>
          &nbsp;more
        </span>
      );
      value = value.substring(0, max) + '...';
    }

    return (
      <span>
        {value}
        {showMore}
      </span>
    );
  }
}

export default ShowMore;
