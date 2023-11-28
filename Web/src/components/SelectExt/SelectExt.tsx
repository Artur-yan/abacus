import _ from 'lodash';
import * as React from 'react';
import Select from 'react-select';
import Creatable from 'react-select/creatable';
import * as uuid from 'uuid';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import memoizeOne from '../../libs/memoizeOne';
import SelectExtDrop from '../SelectExtDrop/SelectExtDrop';
import SelectExtSpan from '../SelectExtSpan/SelectExtSpan';
const s = require('./SelectExt.module.css');
const sd = require('../antdUseDark.module.css');

// import { MenuListComponentProps, OptionTypeBase } from "react-select";
import { FixedSizeList } from 'react-window';

class OptimizedMenuList extends React.PureComponent<any /*MenuListComponentProps<OptionTypeBase>*/> {
  private readonly height = 40;

  public render() {
    let { options, children, maxHeight, getValue } = this.props;
    const selectedValues = getValue();
    let ind1 = selectedValues ? options.indexOf(selectedValues[0]) : -1;
    let initialOffset = selectedValues && selectedValues[0] ? ind1 * this.height : 0;

    let count = children?.length || 0;
    const countVisible = maxHeight / this.height;
    if (ind1 === -1 || ind1 <= countVisible) {
      initialOffset = 0;
    }

    maxHeight = Math.min(maxHeight, count * 40);

    return (
      <FixedSizeList
        height={maxHeight}
        itemCount={count}
        itemSize={this.height}
        initialScrollOffset={initialOffset}
        width={''} // 100% width
      >
        {({ index, style }) => {
          return (
            <div className="option-wrapper" style={style}>
              {children?.[index]}
            </div>
          );
        }}
      </FixedSizeList>
    );
  }
}

import { CSSProperties } from 'react';
import { components } from 'react-select';
import { CSSProp } from 'styled-components';
import TooltipExt from '../TooltipExt/TooltipExt';

class OptimizedOption extends React.PureComponent<any /*OptionProps<OptionTypeBase>*/> {
  public render() {
    // delete this.props.innerProps.onMouseMove;
    // delete this.props.innerProps.onMouseOver;

    const { className, ...pp } = this.props ?? {};

    let res = this.props.children;

    let alreadyEllpsis = false;
    if (pp?.data?.tooltipShow != null) {
      alreadyEllpsis = true;
      res = (
        <TooltipExt zIndex={20000} title={pp?.data?.tooltipShow} placement={pp?.data?.tooltipPos}>
          <div className={sd.ellipsis}>{res}</div>
        </TooltipExt>
      );
    }

    res = (
      // @ts-ignore
      <components.Option {...pp} className={(className ?? '') + ' ' + (alreadyEllpsis ? '' : sd.ellipsis)}>
        {res}
      </components.Option>
    );

    return res;
  }
}

class OptimizedOptionNoneMouse extends React.PureComponent<any /*OptionProps<OptionTypeBase>*/> {
  public render() {
    delete this.props.innerProps.onMouseMove;
    delete this.props.innerProps.onMouseOver;

    const { className, ...pp } = this.props ?? {};

    let res = this.props.children;

    if (pp?.data?.tooltipShow != null) {
      res = (
        <TooltipExt title={pp?.data?.tooltipShow} placement={pp?.data?.tooltipPos}>
          {res}
        </TooltipExt>
      );
    }

    res = (
      // @ts-ignore
      <components.Option {...pp} className={(className ?? '') + ' ' + sd.ellipsis}>
        {res}
      </components.Option>
    );

    return res;
  }
}

interface ISelectExtProps {
  height?: number;
  allowDrag?: boolean;
  useOpen?: boolean;
  dragItemName?: string;
  disableMouseDown?: boolean;
  asText?: boolean;
  allTransparent?: boolean;
  onClose?: () => void;

  onMouseDown?: (e?) => void;
  css?: CSSProp;
  allowCreate?: boolean;
  style?: CSSProperties;
  isDisabled?: boolean;
  isSearchable?: boolean;
  menuPortalTarget?: any;
  placeholder?: any;
  onClick?: (e) => void;
  menuPlacement?: string;
  className?: string;
  filterOption?: any;
  showTooltips?: boolean;

  options?: any[];
  defaultValue?: any;
  value?: any;
  onChange?: any;

  autoSpeed?: boolean;
  isMulti?: boolean;
}

interface ISelectExtState {
  moreOptions?: any[];
  isOpen?: boolean;
  thisId?: string;
  asTextIsDropdown?: boolean;
  intValue?: any;
  filterText?: string;
}

class SelectExt extends React.PureComponent</*OptionProps & */ ISelectExtProps, ISelectExtState> {
  private unDark: any;
  private creator: any;
  private unOpen: any;
  private emptyList: any[];
  private refInput: any;

  constructor(props) {
    super(props);

    this.emptyList = [];

    let moreOptions = null;
    if (props.allowCreate && props.value) {
      let v1 = props.value;
      if (_.isString(v1)) {
        if (v1 === '') {
          v1 = null;
        }
      } else if (_.isObject(v1)) {
        v1 = (v1 as any).value;
      } else {
        v1 = null;
      }
      if (v1 != null) {
        let shouldAdd = false;
        if (props.options != null) {
          if (_.isString(v1)) {
            if (!props.options.find((r1) => r1.value === v1)) {
              shouldAdd = true;
            }
          } else {
            if (!props.options.find((r1) => _.isEqual(r1, v1))) {
              shouldAdd = true;
            }
          }
        } else {
          shouldAdd = true;
        }
        if (shouldAdd) {
          if (_.isString(v1)) {
            moreOptions = [{ label: v1, value: v1 }];
          } else {
            moreOptions = [v1];
          }
        }
      }
    }

    this.state = {
      isOpen: false,
      moreOptions,
      thisId: uuid.v1(),
      intValue: props.defaultValue,
    };
  }

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  componentDidMount() {
    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
    this.unOpen = REActions.openMenuDropdown.listen(this.onMenuDropDownChange);
  }

  onMenuDropDownChange = (thisId) => {
    if (this.state.thisId !== thisId) {
      this.setState({
        isOpen: false,
      });
    }
  };

  componentWillUnmount() {
    this.unDark();
    this.unOpen();
  }

  onChange = (value, action) => {
    if (action && action.action === 'create-option') {
      let oo = this.state.moreOptions;
      if (oo) {
        oo = [...oo];
      } else {
        oo = [];
      }
      oo.push(value);

      this.setState(
        {
          moreOptions: oo,
        },
        () => {
          // this.creator.selectValue(value);
          this.props.onChange && this.props.onChange(value, action);
        },
      );
    } else {
      this.props.onChange && this.props.onChange(value, action);
    }
  };

  memOptions = memoizeOne((options: any, moreOptions: any, value: any) => {
    let res = options || [];
    (moreOptions || []).some((v1) => {
      if (_.isString(v1)) {
        if (!res.find((r1) => r1.value === v1)) {
          res.push(v1);
        }
      } else {
        if (!res.find((r1) => _.isEqual(r1, v1))) {
          res.push(v1);
        }
      }
    });

    if (value != null) {
      if (_.isString(value)) {
        if (!res.find((r1) => r1.value === value)) {
          res.push(value);
        }
      } else {
        if (!res.find((r1) => _.isEqual(r1, value))) {
          res.push(value);
        }
      }
    }
    return res;
  });

  onClickCrossDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (this.state.isOpen) {
      this.setState({
        isOpen: false,
      });
    }

    this.props.onChange && this.props.onChange(null, '');
  };

  onMenuOpen = (e) => {
    REActions.openMenuDropdown(this.state.thisId);
    this.setState({
      isOpen: true,
    });

    if (this.refInput != null) {
      setTimeout(() => {
        this.refInput?.focus();
      }, 0);
    }
  };

  onMenuClose = (e) => {
    this.setState({
      isOpen: false,
    });

    this.props.onClose?.();
  };

  onClickBackDrag = (e) => {
    let isOpen = !this.state.isOpen;
    if (isOpen) {
      REActions.openMenuDropdown(this.state.thisId);
    }
    this.setState({
      isOpen: isOpen,
    });

    if (this.refInput != null) {
      setTimeout(() => {
        this.refInput?.focus();
      }, 0);
    }
  };

  onDropOnAnother = (item: any) => {
    this.setState({
      isOpen: false,
    });
    this.props.onChange && this.props.onChange(null, '');
  };

  onDropThis = (item: any) => {
    let value = null;
    if (item && item.value != null) {
      value = item.value;
    }

    this.setState({
      isOpen: false,
    });
    this.props.onChange && this.props.onChange(value, '');
  };

  render() {
    const isDark = Utils.isDark();

    let props: any = { ...this.props };
    if (isDark) {
      // @ts-ignore
      props.theme = (theme) => {
        return {
          ...theme,
          colors: {
            ...theme.colors,
            neutral0: '#101720',
            neutral5: theme.colors.neutral80,
            neutral10: theme.colors.neutral70,
            neutral20: theme.colors.neutral60,
            neutral30: theme.colors.neutral50,
            neutral40: theme.colors.neutral40,
            neutral50: theme.colors.neutral30,
            neutral60: theme.colors.neutral20,
            neutral70: theme.colors.neutral10,
            neutral80: theme.colors.neutral5,
            neutral90: theme.colors.neutral0,
          },
        };
      };

      let hh = this.props.height || 32;
      // @ts-ignore
      props.styles = {
        menuPortal: (provided) => ({ ...provided, zIndex: 5100 }),
        // menu: provided => ({ ...provided, zIndex: 5200, }),
        dropdownIndicator: (base) => ({
          ...base,
          padding: 4,
        }),
        clearIndicator: (base) => ({
          ...base,
          padding: 4,
        }),
        valueContainer: (base) => ({
          ...base,
          padding: '0px 6px',
          maxHeight: hh,
        }),
        input: (base) => ({
          ...base,
          margin: 0,
          padding: 0,
        }),
        control: (base, state) =>
          _.assign(
            {
              ...base,
              borderRadius: 0,
              minHeight: hh,
            },
            props.allTransparent ? { background: 'transparent', border: 'none', boxShadow: 'none' } : {},
          ),
        indicatorsContainer: (provided) => ({
          ...provided,
          height: hh,
        }),
        option: (base, state) => {
          return {
            ...base,
            fontSize: '14px',
            height: '40px',
            color: 'white',
            backgroundColor: state.isFocused ? '#2a425c' : state.isSelected ? '#466791' : '#233347',

            ':active': {
              ...base[':active'],
              color: 'white',
              backgroundColor: '#16202d',
            },
            ':hover': {
              ...base[':hover'],
              backgroundColor: '#2a425c',
            },
          };
        },
      };
    }

    if (props.allowCreate === true) {
      let { components, options, onChange, ...props2 } = props;
      options = this.memOptions(options, this.state.moreOptions, props.value);

      props2.components = _.assign({}, components ?? {}, { MenuList: OptimizedMenuList, Option: options?.length > 1000 ? OptimizedOptionNoneMouse : OptimizedOption });

      if (props2.isSearchable === true) {
        if (props2.filterOption == null) {
          props2.filterOption = (option: { label: string; value: string; data: any }, rawInput: string): boolean => {
            if (rawInput == null || rawInput === '') {
              return true;
            }

            if (option) {
              let s1 = option.data?.search;
              if (s1 == null || !_.isString(s1)) {
                s1 = option.label;
                if (s1 == null || !_.isString(s1)) {
                  s1 = null;
                }
              }

              if (s1 != null && s1.toLowerCase().indexOf(rawInput.toLowerCase()) > -1) {
                return true;
              } else {
                return false;
              }
            }
            return false;
          };
        }
      }

      return (
        <Creatable
          menuPortalTarget={document.getElementById('body2')}
          onChange={this.onChange}
          ref={(r1) => {
            this.creator = r1;
          }}
          {...props2}
          options={options}
        ></Creatable>
      );
    } else {
      if (this.props.allowDrag) {
        props.placeholder = '';
        props.menuIsOpen = this.state.isOpen;
        props.onMenuOpen = this.onMenuOpen;
        props.onMenuClose = this.onMenuClose;
      }
      let anyTooltipUsedOri = props?.options?.some((o1) => o1?.tooltipShow != null);
      let anyTooltipUsed = anyTooltipUsedOri && props.showTooltips;
      if (this.props.useOpen || anyTooltipUsed || this.props.autoSpeed) {
        props.menuIsOpen = this.state.isOpen;
        props.onMenuOpen = this.onMenuOpen;
        props.onMenuClose = this.onMenuClose;
      }

      let { components, options, showTooltips, ...pp } = props;

      if (anyTooltipUsedOri && !props.showTooltips) {
        if (options != null) {
          options = options.map((o1) => {
            if (o1 == null) {
              return o1;
            } else {
              o1 = { ...o1 };
              delete o1.tooltipShow;
              delete o1.tooltipPos;
            }
            return o1;
          });
        }
      }

      pp.components = _.assign({}, components ?? {}, { MenuList: OptimizedMenuList, Option: options?.length > 1000 ? OptimizedOptionNoneMouse : OptimizedOption });

      if (pp.isOptionDisabled == null) {
        pp.isOptionDisabled = (option) => !!option.disabled;
      }

      if (pp.isSearchable === true || this.props.autoSpeed) {
        if (pp.filterOption == null) {
          pp.filterOption = (option: { label: string; value: string; data: any }, rawInput: string): boolean => {
            if (rawInput == null || rawInput === '') {
              return true;
            }

            if (option) {
              let s1 = option.data?.search;
              if (s1 == null || !_.isString(s1)) {
                s1 = option.label;
                if (s1 == null || !_.isString(s1)) {
                  s1 = null;
                }
              }

              if (s1 != null && Utils.searchIsTextInside(s1.toLowerCase(), rawInput.toLowerCase())) {
                // if(s1!=null && (s1.toLowerCase().indexOf(rawInput.toLowerCase())>-1)) {
                // if(s1!=null && (_.startsWith(rawInput.toLowerCase(), s1.toLowerCase()))) {
                return true;
              } else {
                return false;
              }
            }
            return false;
          };
        }
      }

      if (pp.menuPosition == null) {
        pp.menuPosition = 'fixed';
      } else {
        pp.menuPosition = pp.menuPosition === 'up' ? 'up' : 'fixed';
      }

      if (this.props.disableMouseDown) {
        pp.onMouseDown = (e) => {
          e.stopPropagation();
        };
      }

      pp.ref = (r1) => {
        this.refInput = r1;
      };

      /**
       * Show tooltip on hover in all browsers
       */
      this.refInput?.controlRef?.setAttribute?.('title', props?.value?.label);

      if (pp.defaultValue != null) {
        pp.value = this.state.intValue;
        let oldOnChange = pp.onChange;
        pp.onChange = (o1) => {
          this.setState({
            intValue: o1,
          });

          oldOnChange?.(o1);
        };
      }

      if (this.props.autoSpeed && options != null) {
        const max = 3 * 1000;
        if (options.length > max) {
          let oldOnChange = pp.onChange;
          pp.onChange = (o1) => {
            oldOnChange?.(o1);
          };

          let onInputChangeOld = pp.onInputChange;
          pp.onInputChange = (newValue, meta) => {
            onInputChangeOld?.(newValue, meta);

            this.setState({
              filterText: newValue,
            });
          };

          if (!Utils.isNullOrEmpty(this.state.filterText)) {
            let res = [];
            options.some((o1) => {
              if (pp.filterOption?.(o1, this.state.filterText)) {
                res.push(o1);
              }
              if (res.length >= max) {
                return true;
              }
            });
            options = res;
          }

          options = options.slice(0, max);
        }
      }

      let compRes = <Select {...pp} menuPortalTarget={document.getElementById('body2')} options={options ?? this.emptyList} isMulti={this.props.isMulti}></Select>;

      if (pp?.value?.tooltipShow != null && !this.props.allowDrag && !this.props.asText && !this.state.isOpen && props.showTooltips) {
        compRes = (
          <TooltipExt zIndex={20000} title={pp?.value?.tooltipShow} placement={pp?.value?.tooltipPos}>
            {compRes}
          </TooltipExt>
        );
      }

      if (this.props.allowDrag) {
        let valueSpan = null;
        let value1 = this.props.value;
        if (value1 != null) {
          valueSpan = <SelectExtSpan value={value1} onClickCrossDrag={this.onClickCrossDrag} onDropOnAnother={this.onDropOnAnother} />;
        }

        let md1 = null;
        if (this.props.disableMouseDown) {
          md1 = (e) => {
            e.stopPropagation();
          };
        }

        compRes = (
          <div style={{ position: 'relative' }} onMouseDown={md1}>
            {compRes}
            {/*// @ts-ignore*/}
            <SelectExtDrop onClick={this.onClickBackDrag} onDropThis={this.onDropThis} value={value1}>
              {valueSpan}
            </SelectExtDrop>
          </div>
        );
      }

      if (this.props.asText) {
        if (!this.state.asTextIsDropdown) {
          if (options == null || options?.length === 0) {
            return <span>-</span>;
          }
          return (
            <div
              css={`
                border: 1px solid hsl(0, 0%, 40%);
                background-color: #101720;
                height: 30px;
                display: flex;
                justify-content: center;
                align-items: center;
              `}
            >
              <span
                onClick={Utils.isNullOrEmpty(pp.value?.value) ? this.onClickAsTextShowDropdown : null}
                css={`
                  ${Utils.isNullOrEmpty(pp.value?.value) ? 'cursor: pointer;' : ''}
                `}
              >
                {pp.value?.label}
              </span>
              <span
                onClick={this.onClickAsTextShowDropdown}
                css={`
                  color: ${Constants.blue};
                  margin-left: 5px;
                  cursor: pointer;
                `}
              >
                (Edit)
              </span>
            </div>
          );
        }
      }

      return compRes;
    }
  }

  onClickAsTextShowDropdown = (e) => {
    this.setState({
      asTextIsDropdown: true,
    });
  };
}

export default SelectExt;
