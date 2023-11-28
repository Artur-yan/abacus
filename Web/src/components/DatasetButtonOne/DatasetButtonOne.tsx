import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
const s = require('./DatasetButtonOne.module.css');

interface IDatasetButtonOneProps {
  id?: any;
  name?: string;
  isRequired?: boolean;
  isSelected?: boolean;
  onClick?: (e: any) => void;
}

interface IDatasetButtonOneState {}

class DatasetButtonOne extends React.PureComponent<IDatasetButtonOneProps, IDatasetButtonOneState> {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onClickRoot = (e) => {
    this.props.onClick && this.props.onClick(e);
  };

  render() {
    let { id, name, isRequired, isSelected } = this.props;

    return (
      <div onClick={this.onClickRoot} className={s.root + ' ' + (isSelected ? s.selected : '')} style={{ textAlign: 'left', fontSize: '13px' }}>
        <span className="fa-layers fa-fw">
          <FontAwesomeIcon icon={['far', 'database']} transform={{ size: 15, x: -1, y: -0.5 }} style={{ marginRight: '5px', opacity: 0.7 }} />
          {isRequired && <FontAwesomeIcon icon={['fas', 'key']} transform={{ rotate: -45, size: 12, x: -7, y: 4 }} style={{ marginRight: '5px', opacity: 1, color: '#f3ea2f' }} />}
        </span>
        <span>
          {name}
          {isSelected ? ' >' : ''}
        </span>
      </div>
    );
  }
}

export default DatasetButtonOne;
