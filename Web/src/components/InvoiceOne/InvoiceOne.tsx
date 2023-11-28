import Button from 'antd/lib/button';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Utils from '../../../core/Utils';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./InvoiceOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IInvoiceOneProps {
  data?: any;
}

const TopTitle = styled.div`
  color: #ffffff;
  line-height: 1.33;
  font-size: 24px;
  font-family: Matter;
  font-weight: 400;
`;
const Title = styled.span`
  font-family: Roboto, sans-serif;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
`;
const Value = styled.span`
  font-family: Roboto, sans-serif;
  font-size: 15px;
  margin-left: 5px;
  white-space: nowrap;
`;
const Line = styled.div`
  margin-bottom: 8px;
  white-space: nowrap;
`;

const InvoiceOne = React.memo((props: PropsWithChildren<IInvoiceOneProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const formatter6 = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatterCount = new Intl.NumberFormat('en-US');

  const columns: ITableExtColumn[] = [
    {
      title: 'Item No.',
      field: 'number',
      isLinked: false,
      align: 'center',
    },
    {
      title: 'Description',
      field: 'item',
      render: (text, row, index) => {
        return row?.item + ' - ' + (row?.start ? moment.unix(row?.start).utc().format('MMM D, YYYY') : '-') + ' - ' + (row?.end ? moment.unix(row?.end).utc().format('MMM D, YYYY') : '-');
      },
    },
    {
      title: 'Price/unit',
      field: 'priceUnit',
      render: (text, row, index) => {
        return formatter6.format((row.price ?? 0) / ((row.units ?? 0) == 0 ? 1 : row.units) / 100);
      },
      align: 'right',
    },
    {
      title: 'Quantity',
      field: 'units',
      render: (text, row, index) => {
        return formatterCount.format(row.units);
      },
      align: 'right',
    },
    {
      title: 'Cost',
      field: 'price',
      render: (text, row, index) => {
        return formatter.format((text ?? 0) / 100);
      },
      align: 'right',
    },
  ];

  const dataList = useMemo(() => {
    if (_.isArray(props.data?.invoiceItems)) {
      return props.data?.invoiceItems?.map((i1, ind) => {
        return _.assign({ number: ind + 1 }, i1);
      });
    } else {
      return [];
    }
  }, [props.data]);

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <span>
            <Line>
              <Title>Invoice No.:</Title>
              <Value>{props.data?.invoiceId}</Value>
            </Line>
            <Line>
              <Title>Due:</Title>
              <Value>{props.data?.dueAt ? moment(props.data?.dueAt).utc().format('MMM D, YYYY') : '-'}</Value>
            </Line>
            <Line>
              <Title>Status:</Title>
              <Value>
                <span style={{ fontStyle: props.data?.lifecycle == 'PENDING' ? 'italic' : 'normal' }}>{Utils.upperFirst(props.data?.lifecycle?.replace(/_/g, ' ') ?? '')}</span>
              </Value>
            </Line>
            {props.data?.failureMessage && (
              <Line>
                <Title>Payment Failure:</Title>
                <Value>
                  <span style={{ color: 'red' }}>{props.data?.failureMessage}</span>
                </Value>
              </Line>
            )}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <span>
            <Line>
              <Title>Total:</Title>
              <Value>{formatter.format((props.data?.total ?? 0) / 100)}</Value>
            </Line>
            <Line>
              <Title>Created At:</Title>
              <Value>{props.data?.createdAt == null ? '-' : moment(props.data?.createdAt).utc().format('MMM D, YYYY')}</Value>
            </Line>
            {props.data?.paidAt == null ? (
              props.data?.invoiceUrl ? (
                <Button type={'primary'} onClick={() => window.open(props.data?.invoiceUrl, '_blank')}>
                  Pay Now
                </Button>
              ) : (
                <Line>
                  <Title>Charged On:</Title>
                  <Value>{"'-'"}</Value>
                </Line>
              )
            ) : (
              <Line>
                <Title>Charged On:</Title>
                <Value>{moment(props.data?.paidAt).utc().format('MMM D, YYYY')}</Value>
              </Line>
            )}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <TopTitle>Line Items</TopTitle>

        <div style={{ marginTop: '15px' }}>
          <TableExt defaultSort={{ field: 'number', isAsc: true }} notsaveSortState={'invoice_detail_list'} dataSource={dataList} columns={columns} calcKey={(r1) => r1.number} />
        </div>
      </div>
    </div>
  );
});

export default InvoiceOne;
