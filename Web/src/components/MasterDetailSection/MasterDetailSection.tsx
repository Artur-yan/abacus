import { Item, TabPanel } from 'devextreme-react/tab-panel';
import * as React from 'react';
import { PropsWithChildren, useReducer } from 'react';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./MasterDetailSection.module.css');
const sd = require('../antdUseDark.module.css');

interface IMasterDetailSectionProps {
  data?: any;
  listNestedNames?: string[];
  columnsNested?: { [field: string]: ITableExtColumn[] };
}

const MasterDetailSection = React.memo((props: PropsWithChildren<IMasterDetailSectionProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const renderTab = (tabName) => {
    return (
      <div
        css={`
          padding: 20px;
        `}
      >
        <TableExt useDevExp columns={props.columnsNested?.[tabName] ?? []} height={300} dataSource={props.data?.data?.[tabName] ?? []} />
      </div>
    );
  };

  return (
    <div>
      {/*// @ts-ignore*/}
      <TabPanel deferRendering={false}>
        {props.listNestedNames?.map((n1, n1ind) => {
          return (
            <Item
              key={'it' + n1}
              tabRender={(pp) => (
                <span
                  css={`
                    padding: 10px 10px;
                    font-size: 14px;
                  `}
                >
                  {n1}
                </span>
              )}
              render={renderTab.bind(null, n1)}
            />
          );
        })}
      </TabPanel>
    </div>
  );
});

export default MasterDetailSection;
