import * as React from 'react';
// const s = require('./DevDataGrid.module.css');
// const sd = require('../antdUseDark.module.css');
import { Column, DataGrid, FilterBuilderPopup, FilterPanel, FilterRow, HeaderFilter, MasterDetail, Scrolling, SearchPanel } from 'devextreme-react/data-grid';
import { PropsWithChildren, useCallback, useMemo, useReducer } from 'react';
import MasterDetailSection from '../MasterDetailSection/MasterDetailSection';
// import {SelectionChangedInfo} from "devextreme/ui/data_grid";

interface IDevDataGridProps {
  showFilters?: boolean;
  columnsNested?: any;
  listNames?: any;
  columnsList?: any[];
  refInt?: any;
  onSelectionChanges?: (rows: any[]) => void;
}

const DevDataGrid = React.memo((props: PropsWithChildren<IDevDataGridProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const columnsList = useMemo(() => {
    return props.columnsList?.map((pp1) => <Column {...pp1} />);
  }, [props.columnsList]);

  let showNested = useMemo(() => {
    if (props.columnsNested != null && Object.keys(props.columnsNested ?? {}).length > 0) {
      return (
        <MasterDetail
          enabled={true}
          // component={MasterDetailSection}
          render={(propsInt) => <MasterDetailSection data={propsInt} columnsNested={props.columnsNested} listNestedNames={props.listNames} />}
        />
      );
    }
  }, [props.columnsNested, props.listNames]);

  const pp2 = useMemo(() => {
    let res: any = { ...(props ?? {}) };
    delete res.refInt;
    delete res.showFilters;
    delete res.columnsNested;
    delete res.listNames;
    delete res.columnsList;
    return res;
  }, [props]);

  const onSelectionChanged = useCallback((e: any) => {
    props.onSelectionChanges?.(e.selectedRowsData);
  }, []);

  return (
    <DataGrid {...pp2} ref={props.refInt} onSelectionChanged={onSelectionChanged}>
      <Scrolling mode="virtual" />

      {/*<ColumnChooser enabled={true} />*/}
      {props.showFilters ? <HeaderFilter visible={true} /> : null}
      {props.showFilters && <FilterPanel visible={true} />}
      {props.showFilters && <FilterBuilderPopup />}
      {props.showFilters && <FilterRow visible={true} />}
      {props.showFilters && <SearchPanel visible={true} />}

      {showNested}
      {columnsList}
    </DataGrid>
  );
});

export default DevDataGrid;
