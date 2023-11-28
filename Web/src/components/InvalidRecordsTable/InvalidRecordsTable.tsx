import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useRef, useState } from 'react';
import Utils from '../../../core/Utils';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TextMax from '../TextMax/TextMax';
const s = require('./InvalidRecordsTable.module.css');
const sd = require('../antdUseDark.module.css');

interface IInvalidRecordsTableProps {
  rows?: any[];
  invalidRecordCount?: number;
}

const InvalidRecordsTable = React.memo((props: PropsWithChildren<IInvalidRecordsTableProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const refTable = useRef(null);
  const [invalidRowsExpanded, setInvalidRowsExpanded] = useState({} as any);

  const cols = useMemo(() => {
    let cols = [] as ITableExtColumn[];
    cols.push({
      title: 'Row' + (props.invalidRecordCount == null ? '' : ` (Total: ${Utils.prettyPrintNumber(props.invalidRecordCount)})`),
      field: 'data',
      noAutoTooltip: true,
      render: (text1, row1, index1) => {
        if (_.isObject(text1)) {
          text1 = JSON.stringify(text1);
        }

        const onMoreClick = () => {
          setInvalidRowsExpanded((o1) => {
            o1 = { ...(o1 ?? {}) };
            o1[row1.index] = true;

            setTimeout(() => {
              refTable.current?.refreshHeights();
            }, 0);

            return o1;
          });
        };

        if (invalidRowsExpanded?.[row1.index] === true) {
          return <span>{text1}</span>;
        } else {
          return (
            <span>
              <TextMax onMore={onMoreClick} max={100}>
                {text1}
              </TextMax>
            </span>
          );
        }
      },
    });
    return cols;
  }, [props.rows, invalidRowsExpanded, props.invalidRecordCount]);

  return (
    <TableExt
      ref={(r1) => {
        refTable.current = r1;
      }}
      whiteText
      columns={cols}
      dataSource={props.rows}
    />
  );
});

export default InvalidRecordsTable;
