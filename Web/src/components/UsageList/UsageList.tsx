import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./UsageList.module.css');
const sd = require('../antdUseDark.module.css');

interface IUsageListProps {
  usageList?: any;
}
const lineItemRename = { train: 'Training', batch: 'Batch Prediction', inference: 'Real-time Prediction' };

const UsageList = React.memo((props: PropsWithChildren<IUsageListProps>) => {
  const { authUser } = useSelector((state: any) => ({
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const columns: ITableExtColumn[] = [
    {
      field: 'timestamp',
      title: 'Timestamp',
      render: (text, row, index) => {
        if (!text) {
          return '-';
        } else {
          let date = moment(text);
          return date?.isValid() ? date.format('LLL') : text;
        }
      },
    },
    {
      field: 'lineItem',
      title: 'Line Item',
      render: (text, row, index) => {
        return text in lineItemRename ? lineItemRename[text] : text;
      },
    },
    {
      field: 'units',
      title: 'Units',
      render: (text, row, index) => {
        return text;
      },
    },
    {
      field: 'price',
      title: 'Amount Billed',
      render: (text, row, index) => {
        return formatter.format(text / 100) || formatter.format(0);
      },
    },
  ];

  return (
    <RefreshAndProgress isRelative isRefreshing={isProcessing}>
      <TableExt showEmptyIcon={true} defaultSort={{ field: 'timestamp' }} notsaveSortState={'billing_usage_list'} height={null} dataSource={props.usageList} columns={columns} calcKey={(r1) => r1.id} calcLink={null} />
    </RefreshAndProgress>
  );
});

export default UsageList;
