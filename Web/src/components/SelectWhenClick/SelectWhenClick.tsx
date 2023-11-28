import $ from 'jquery';
import * as React from 'react';
import Select from 'react-select';
import memoizeOne from '../../libs/memoizeOne';
const s = require('./SelectWhenClick.module.css');

interface ISelectWhenClickProps {
  showElem?: any;
  selectOptions?: any;
  width?: number;
  onChangeValue?: (value: string) => void;
}

interface ISelectWhenClickState {
  isSelectShown?: boolean;
}

class SelectWhenClick extends React.PureComponent<ISelectWhenClickProps, ISelectWhenClickState> {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onClickShowElem = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState(
      {
        isSelectShown: true,
      },
      () => {
        this.refs.selectOne && $(this.refs.selectOne).focus();
      },
    );
  };

  onChangeSelectValue = (v1) => {
    if (v1) {
      v1 = v1.value;
    }

    this.setState(
      {
        isSelectShown: false,
      },
      () => {
        this.props.onChangeValue && this.props.onChangeValue(v1);
      },
    );
  };

  onCloseSelectMenu = () => {
    this.setState({
      isSelectShown: false,
    });
  };

  memOptions = memoizeOne((options) => {
    options = [...(options || [])];
    options.unshift({
      value: '',
      label: (
        <span>
          <span style={{ display: 'inline-block', width: '16px' }}></span>(None)
        </span>
      ),
    });

    return options;
  });

  render() {
    let { showElem } = this.props;
    let { isSelectShown } = this.state;
    isSelectShown = !!isSelectShown;

    const customStyles = (width = 80, height = 24) => {
      return {
        control: (provided) => ({
          ...provided,
          width: width,
          height: height,
          minHeight: height,
        }),
        dropdownIndicator: (base) => ({
          ...base,
          padding: 1,
        }),
        clearIndicator: (base) => ({
          ...base,
          padding: 2,
        }),
        multiValue: (base) => ({
          ...base,
        }),
        valueContainer: (base) => ({
          ...base,
          padding: '0px 6px',
        }),
        input: (base) => ({
          ...base,
          margin: 0,
          padding: 0,
        }),
      };
    };

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let options1 = this.memOptions(this.props.selectOptions);

    return (
      <div style={{ width: '100%', marginLeft: isSelectShown ? '10px' : '' }}>
        {/*// @ts-ignore*/}
        {isSelectShown && (
          <Select
            ref={'selectOne' as any}
            onBlur={this.onCloseSelectMenu}
            styles={customStyles((this.props.width || 80) - 2 * 10 - 6, 23)}
            options={options1}
            onChange={this.onChangeSelectValue}
            defaultMenuIsOpen={true}
            isSearchable={false}
            menuPortalTarget={popupContainerForMenu(null)}
          />
        )}
        {!isSelectShown && <div onClick={this.onClickShowElem}>{showElem}</div>}
      </div>
    );
  }
}

export default SelectWhenClick;
