import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ObjectUsageList.module.css');
const sd = require('../antdUseDark.module.css');

interface IObjectUsageListProps {
  usageList?: any;
  type?: string;
}

const ObjectUsageList = React.memo((props: PropsWithChildren<IObjectUsageListProps>) => {
  const { authUser } = useSelector((state: any) => ({
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const formatter6 = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  const columns: ITableExtColumn[] = [
    {
      field: 'date',
      title: 'Start Date',
      render: (text, row, index) => {
        let date = text ? moment(text) : moment();
        return date?.isValid() ? date.utc().format('LL') : text;
      },
    },
    {
      field: 'name',
      title: props.type == 'training' ? 'Project' : props.type == 'deployments' ? 'Deployment' : 'Batch Prediction',
      render: (text, row, index) => {
        if (row?.deleted) {
          return text + ' (Deleted)';
        }
        if (props.type == 'training') {
          return (
            <Link className={sd.linkBlue} to={['/' + PartsLink.project_dashboard + '/' + row['id']]}>
              {text}
            </Link>
          );
        } else if (props.type == 'deployments') {
          return (
            <Link className={sd.linkBlue} to={['/' + PartsLink.deploy_detail + '/' + row['projectId'] + '/' + row['id']]}>
              {text}
            </Link>
          );
        } else {
          return (
            <Link className={sd.linkBlue} to={['/' + PartsLink.deploy_batch + '/' + row['projectId'], 'showList=true']}>
              {text}
            </Link>
          );
        }
      },
    },
    {
      field: 'units',
      title: props.type == 'training' ? 'Training-hours' : props.type == 'deployments' ? 'QPS-hours' : 'Predictions',
      render: (text, row, index) => {
        return text;
      },
    },
    {
      field: 'rate',
      title: 'Price/Unit',
      render: (text, row, index) => {
        return formatter6.format(text / 100) || formatter.format(0);
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
      <TableExt showEmptyIcon={true} defaultSort={{ field: 'date' }} notsaveSortState={'billing_object_usage_list'} height={null} dataSource={props.usageList} columns={columns} calcKey={(r1) => r1.id} calcLink={null} />
    </RefreshAndProgress>
  );
});

export default ObjectUsageList;
