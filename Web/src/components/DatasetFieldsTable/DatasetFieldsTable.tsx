import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import * as React from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import memoizeOne from '../../libs/memoizeOne';
import SelectWhenClick from '../SelectWhenClick/SelectWhenClick';
const s = require('./DatasetFieldsTable.module.css');

const ww = 360;
const colFirstWW = 160;

interface ICustomValueField {
  rowIndex: number;
  value: any;
}

interface IDatasetFieldsTableProps {
  datasetData?: any;
  datasetSchema?: any;
  datasetId?: string;

  canContinue?: (canContinue: boolean) => void;
}

interface ICustomValueFieldObject {
  [s: string]: ICustomValueField[];
}

interface IDatasetFieldsTableState {
  customValues?: ICustomValueFieldObject;
}

class DatasetFieldsTable extends React.PureComponent<IDatasetFieldsTableProps, IDatasetFieldsTableState> {
  private grid: any;
  private isM: boolean;
  private unDark: any;

  constructor(props: IDatasetFieldsTableProps, context: any) {
    super(props, context);

    this.state = {
      customValues: {},
    };
  }

  onDarkModeChanged = (isDark) => {
    this.grid && this.grid.forceUpdateGrids();
    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;
    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
  }

  componentWillUnmount() {
    this.isM = false;
    this.unDark();
  }

  _cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
    let cellsData = this.memCellsData(this.props.datasetId, this.props.datasetData, this.props.datasetSchema, this.state.customValues);

    let text1 = null;
    if (rowIndex === 0) {
      text1 = ['Name', 'Special Use'][columnIndex];
    } else {
      if (cellsData && cellsData.res) {
        let data1 = cellsData.res[rowIndex - 1];
        if (data1) {
          data1 = data1[columnIndex];

          if (data1) {
            if (columnIndex === 0 && data1.name) {
              let icon1: IconProp = null;
              if (data1.type === 'number') {
                icon1 = 'hashtag';
              } else if (data1.type === 'string') {
                icon1 = 'font';
              } else if (data1.type === 'boolean') {
                icon1 = ['far', 'badge-check'];
              } else if (data1.type === 'category') {
                icon1 = ['far', 'chart-pie-alt'];
              } else if (data1.type === 'array') {
                icon1 = ['far', 'layer-group'];
              } else if (data1.type === 'timestamp') {
                icon1 = ['far', 'clock'];
              }
              text1 = (
                <span>
                  {icon1 != null && <FontAwesomeIcon icon={icon1} transform={{ size: 12, x: 0, y: 2 }} style={{ width: '14px', marginRight: '2px', opacity: 1, color: Utils.colorA(0.65) }} />}
                  {Utils.upperFirst(data1.name)}
                </span>
              );
            } else if (data1.text != null) {
              text1 = data1.text;
            } else if (columnIndex === 1) {
              text1 = (
                <span style={{ display: 'inline-block' }} className={s.cellSpecialUse}>
                  {data1.isRequired === true && <FontAwesomeIcon icon={['fas', 'key']} transform={{ rotate: -45, size: 12, x: 0, y: 2 }} style={{ width: '10px', marginRight: '2px', opacity: 1, color: '#f3ea2f' }} />}
                  {data1.name && <span>{data1.name + (data1.auto_field_name ? ' (' + data1.auto_field_name + ')' : '')}</span>}
                </span>
              );

              /*              if(data1.auto_field_name) {
                text1 = <OverlayTrigger placement={'right'} overlay={<Tooltip id={'aa222'}>{'Suggested field name: '+data1.auto_field_name}</Tooltip>}>
                   {text1}
                 </OverlayTrigger>;
              }*/
            }
          } else if (columnIndex === 1) {
            text1 = (
              <span className={s.cellSpecialUseEmpty}>
                <FontAwesomeIcon icon={'chevron-down'} transform={{ size: 12, x: 0, y: 2 }} style={{ color: Utils.colorA(0.25) }} />
              </span>
            );
          }
        }
      }
    }

    if (columnIndex === 0 && rowIndex > 0) {
      text1 = <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{text1}</div>;
    }

    if (columnIndex === 1 && rowIndex > 0) {
      let { datasetSchema } = this.props;
      if (datasetSchema) {
        let fields = datasetSchema.get('fields');
        if (fields) {
          //select
          let possibleFields = cellsData && cellsData.possibleFields;

          let options = [];
          possibleFields &&
            possibleFields.some((f1) => {
              options.push({
                value: f1.id,
                label: (
                  <span>
                    {f1.isRequired === true ? (
                      <FontAwesomeIcon icon={['fas', 'key']} transform={{ rotate: -45, size: 12, x: -2, y: 0 }} style={{ marginRight: '5px', opacity: 1, color: '#7f7724' }} />
                    ) : (
                      <span style={{ display: 'inline-block', width: '16px' }}></span>
                    )}
                    {f1.name}
                  </span>
                ),
              });

              return false;
            });
          text1 = <SelectWhenClick selectOptions={options} showElem={text1} width={ww - colFirstWW} onChangeValue={this.onChangeValueSelect.bind(this, rowIndex - 1)} />;
        }
      }
    }

    if (columnIndex === 1 || rowIndex === 0) {
      text1 = <div style={{ width: '100%', textAlign: 'center' }}>{text1}</div>;
    } else {
      text1 = <span style={{ marginLeft: '8px' }}>{text1}</span>;
    }

    return (
      <div className={s.Cell} key={key} style={style}>
        {text1}
      </div>
    );
  };

  onChangeValueSelect = (rowIndex, value1) => {
    if (!this.props.datasetId) {
      return;
    }

    if (value1 == null) {
      value1 = '';
    }

    let customValuesLast = (this.state.customValues || {}) as ICustomValueFieldObject;
    let customValuesOne: ICustomValueField[] = customValuesLast[this.props.datasetId];

    let list = [...((customValuesOne || []) as ICustomValueField[])];
    let found1 = list.find((f1: ICustomValueField) => f1.rowIndex === rowIndex);
    if (found1) {
      found1.value = value1;
    } else {
      list.push({ rowIndex, value: value1 } as ICustomValueField);
    }

    if (value1 !== '') {
      list.some((f1) => {
        if (f1.rowIndex !== rowIndex) {
          if (f1.value === value1) {
            f1.value = '';
          }
        }

        return false;
      });
    }

    customValuesLast[this.props.datasetId] = list;
    customValuesLast = { ...customValuesLast };

    this.setState(
      {
        customValues: customValuesLast,
      },
      () => {
        this.checkCanContinueValue();
      },
    );
  };

  checkCanContinueValue = (cellsData?) => {
    if (!this.props.canContinue) {
      return;
    }

    if (!cellsData) {
      cellsData = this.memCellsData(this.props.datasetId, this.props.datasetData, this.props.datasetSchema, this.state.customValues);
    }

    let canContinue = false;
    let customValues = this.state.customValues;
    if (cellsData && customValues && this.props.datasetId && cellsData.possibleFields && cellsData.res) {
      let customValuesOne: ICustomValueField[] = customValues[this.props.datasetId];

      if (customValuesOne) {
        let possibleFields = cellsData.possibleFields;
        let res = cellsData.res;

        canContinue = true;
        possibleFields.some((f1) => {
          if (!f1.isRequired) {
            return false;
          }

          let possibleFieldName1 = f1.id;
          if (possibleFieldName1) {
            //check value is assigned
            let found1 = customValuesOne.find((v1) => res[v1.rowIndex] && res[v1.rowIndex][0] && res[v1.rowIndex][0].name === possibleFieldName1 && _.trim(v1.value || '') !== '');
            if (!found1) {
              canContinue = false;
            }
          } else {
            canContinue = false;
          }

          return false;
        });
      }
    }

    this.props.canContinue && this.props.canContinue(canContinue);
  };

  memCellsData = memoizeOne((datasetId, datasetData, datasetSchema, customValues): { res: any[]; possibleFields: any[]; customValuesChanged: boolean } => {
    let res = [];
    let possibleFields = [];

    let hasSchema = false;
    if (datasetSchema) {
      let fields = datasetSchema.get('fields');
      if (fields) {
        hasSchema = true;

        fields.some((f1) => {
          f1 = f1.toJS();

          res.push([f1, null]);
        });
      }
    }

    let customValuesChanged = false;
    if (datasetData) {
      let fields = datasetData.get('fields');
      fields &&
        fields.some((f1) => {
          f1 = f1.toJS();
          possibleFields.push(f1);

          if (hasSchema) {
            //find it
            if (f1.auto_field_name != null && f1.auto_field_name !== '') {
              let itemFound1 = res.find((r1) => r1[0] && r1[0].name === f1.auto_field_name);
              if (itemFound1) {
                //customValue with this?
                if (customValues && datasetId) {
                  let customValuesOne: ICustomValueField[] = customValues[datasetId];
                  if (customValuesOne == null) {
                    customValuesOne = [];
                    customValues[datasetId] = customValuesOne;
                  }

                  let foundIndex1 = res.indexOf(itemFound1);
                  if (foundIndex1 > -1) {
                    let customFound1 = customValuesOne.find((v1) => v1.rowIndex === foundIndex1);
                    if (customFound1) {
                      // skipSet = true;
                    } else {
                      customValuesChanged = true;
                      customValuesOne.push({ rowIndex: foundIndex1, value: f1.id });
                    }
                  }
                }
              }
            }
          } else {
            res.push([{ text: '' }, f1]);
          }
        });
    }

    if (possibleFields && hasSchema && customValues) {
      let customValuesOne: ICustomValueField[] = customValues[datasetId];
      customValuesOne &&
        customValuesOne.some((cv1) => {
          let res1 = res[cv1.rowIndex];
          if (res1) {
            let found1 = possibleFields.find((f1) => f1.id === cv1.value);
            if (found1) {
              res1[1] = found1;
            }
          }

          return false;
        });
    }

    let newRes = { res, possibleFields, customValuesChanged };

    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      if (customValuesChanged) {
        this.checkCanContinueValue(newRes);
      }

      this.grid && this.grid.forceUpdateGrids();
    }, 0);

    return newRes;
  });

  render() {
    let cellsData = this.memCellsData(this.props.datasetId, this.props.datasetData, this.props.datasetSchema, this.state.customValues);

    const STYLE = {};
    const STYLE_BOTTOM_LEFT_GRID = {
      borderRight: '1px solid ' + Utils.colorA(0.3, 0.62),
      backgroundColor: Utils.colorA(0.12),
      outline: 'none',
    };
    const STYLE_BOTTOM_RIGHT_GRID = {
      outline: 'none',
    };
    const STYLE_TOP_LEFT_GRID = {
      outline: 'none',
      borderBottom: '1px solid ' + Utils.colorA(0.3, 0.62),
      borderRight: '1px solid ' + Utils.colorA(0.3, 0.62),
      fontWeight: 400,
      color: Utils.colorA(0.7),
    };
    const STYLE_TOP_RIGHT_GRID = {
      outline: 'none',
      borderBottom: '1px solid ' + Utils.colorA(0.3, 0.62),
      fontWeight: 400,
      color: Utils.colorA(0.7),
    };

    return (
      <div style={{ position: 'absolute', width: ww + 'px', left: '50%', top: 0, bottom: 0, marginTop: '10px', marginBottom: '10px', marginLeft: '-' + ww / 2 + 'px', borderRadius: '2px' }} className={s.root}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, right: 0, margin: '3px' }}>
          <AutoSizer>
            {({ width, height }) => (
              <MultiGrid
                ref={(r1) => {
                  this.grid = r1;
                }}
                cellRenderer={this._cellRenderer}
                columnWidth={({ index }) => {
                  return index === 0 ? colFirstWW : ww - colFirstWW;
                }}
                columnCount={2}
                fixedColumnCount={1}
                fixedRowCount={1}
                height={height}
                rowHeight={26}
                rowCount={1 + (cellsData && cellsData.res ? cellsData.res.length : 0)}
                style={STYLE}
                styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                styleTopRightGrid={STYLE_TOP_RIGHT_GRID}
                styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRID}
                width={width}
                hideTopRightGridScrollbar
                hideBottomLeftGridScrollbar
              />
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }
}

export default DatasetFieldsTable;
