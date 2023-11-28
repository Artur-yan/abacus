import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import InvoiceOne from '../InvoiceOne/InvoiceOne';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import { UserProfileSection } from '../UserProfile/UserProfile';

const s = require('./ProfileInvoices.module.css');
const sd = require('../antdUseDark.module.css');

const PriceTitle = styled.div`
  height: 59px;
  width: 357px;
  background-color: #23305e;
  border-radius: 1px;

  display: flex;
  justify-content: center;
  align-items: center;

  color: #ffffff;
  line-height: 1.33;
  font-size: 24px;
  font-family: Matter, sans-serif;
  font-weight: 400;
`;

const PriceContent = styled.div`
  width: 357px;
  background-color: #0c121b;
  border-radius: 1px;
  padding: 21px 24px;
`;

const PriceName = styled.span`
  color: #8798ad;
  line-height: 1.38;
  font-size: 16px;
  font-family: Matter, sans-serif;
  font-weight: 600;
  height: 22px;
  width: 173px;
  display: inline-block;
`;

const PriceValue = styled.span`
  color: #ffffff;
  line-height: 1.38;
  font-size: 16px;
  font-family: Matter, sans-serif;
  font-weight: 400;
  height: 22px;
  width: 113px;
`;

const PriceLine = styled.div`
  margin-top: ${(props) => props.top ?? 0}px;
  margin-bottom: 12px;
`;

const PriceDesc = styled.div`
  color: #38bfa1;
  line-height: 1.13;
  font-size: 16px;
  font-family: Matter, sans-serif;
  font-weight: 400;
  margin-top: 22px;
  cursor: pointer;
`;

const TopTitle = styled.div`
  color: #ffffff;
  line-height: 1.33;
  font-size: 24px;
  font-family: Matter;
  font-weight: 400;
  display: flex;
`;

const styleRectType: CSSProperties = {
  position: 'relative',
  backgroundColor: '#19232f',
  padding: '10px',
  flex: 1,
  marginRight: '10px',
  color: 'white',
  lineHeight: '1.2rem',
  textAlign: 'center',
  minHeight: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const SelectARegion = styled.div`
  color: #ffffff;
  letter-spacing: 1.12px;
  font-size: 12px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  line-height: 2;
`;

const OrgName = styled.div`
  color: #b2c9da;
  letter-spacing: 1.12px;
  font-size: 12px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  line-height: 2;
`;

const AllBlack = styled.div`
  color: black !important;

  h1,
  h2,
  h3,
  h4 {
    color: black !important;
  }
`;

interface IProfileInvoicesProps {
  isFull?: boolean;
}

const ProfileInvoices = React.memo((props: PropsWithChildren<IProfileInvoicesProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoicesList, setInvoicesList] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  let invoiceOptionSel = paramsProp?.get('invoiceId') ?? null;
  const refreshInvoices = () => {
    setIsProcessing(true);
    setInvoicesList(null);
    REClient_.client_()._listInvoices((err, res) => {
      setIsProcessing(false);

      if (!err && res?.result) {
        setErrorMsg(null);
        setInvoicesList(res?.result || []);
      } else {
        setErrorMsg(err || Constants.errorDefault);
      }
    });
  };

  useEffect(() => {
    refreshInvoices();
  }, []);

  let styleRoot: CSSProperties = {};
  if (props.isFull) {
    styleRoot = {
      margin: '0 auto',
      maxWidth: '920px',
    };
  }

  const onChangeSelectDate = (option1) => {
    let search = Utils.processParamsAsQuery({ invoiceId: option1?.id ?? '' });
    Location.replace('/' + PartsLink.profile + '/' + UserProfileSection.invoices, undefined, search);
  };

  let invSel = invoicesList?.find((i1) => i1.invoiceId === invoiceOptionSel);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const nonInvoices = invoicesList == null || invoicesList.length === 0;

  const columns: ITableExtColumn[] = [
    {
      title: 'Invoice Number',
      field: 'invoiceId',
      isLinked: true,
    },
    {
      title: 'Period',
      field: 'billingPeriodEnd',
      render: (text, row, index) => {
        return '' + (row?.billingPeriodStart ? moment(row?.billingPeriodStart).utc().format('MMM D, YYYY') : '-') + ' - ' + (row?.billingPeriodEnd ? moment(row?.billingPeriodEnd).utc().format('MMM D, YYYY') : '-');
      },
    },
    {
      title: 'Due At',
      field: 'dueAt',
      render: (text, row, index) => {
        return '' + (row?.dueAt ? moment(row?.dueAt).utc().format('MMM D, YYYY') : '-');
      },
    },
    {
      title: 'Status',
      field: 'lifecycle',
      render: (text, row, index) => {
        return <span style={{ fontStyle: text == 'PENDING' ? 'italic' : 'normal' }}>{Utils.upperFirst(text?.replace(/_/g, ' ') ?? '')}</span>;
      },
    },
    {
      title: 'Total',
      field: 'total',
      render: (text, row, index) => {
        return formatter.format((text ?? 0) / 100);
      },
      align: 'right',
    },
    {
      title: 'Detail',
      render: (text, row, index) => {
        if (row?.lifecycle == 'UNPAID' && row?.invoiceUrl) {
          return (
            <Button type={'primary'} onClick={() => window.open(row?.invoiceUrl, '_blank')}>
              Pay Now
            </Button>
          );
        }
        return (
          <Button type={'default'} ghost>
            Line Items
          </Button>
        );
      },
      width: '80px',
    },
  ];

  const onClickGoBack = (e) => {
    Location.push('/' + PartsLink.profile + '/' + UserProfileSection.invoices);
  };

  return (
    <div style={styleRoot}>
      <div style={{ margin: '0 30px' }}>
        <TopTitle>
          {invSel && (
            <span style={{ marginRight: '10px' }}>
              <FontAwesomeIcon onClick={onClickGoBack} icon={['far', 'arrow-left']} transform={{ size: 19, x: 0, y: 1 }} style={{ padding: '4px', cursor: 'pointer' }} />
            </span>
          )}
          <span>{invSel ? 'Invoice Detail' : nonInvoices ? 'No Invoices yet' : 'Invoices'}</span>

          <span
            css={`
              flex: 1;
            `}
          ></span>
          {!invSel && (
            <span>
              <Link to={'/api/_getInvoiceSummaryCSV'} newWindow noApp>
                <Button type={'default'}>Download CSV</Button>
              </Link>
            </span>
          )}
        </TopTitle>

        <div style={{ marginTop: '14px', paddingBottom: '30px', borderTop: '1px solid white' }} />

        {!nonInvoices && invSel && <InvoiceOne data={invSel} />}
        {!nonInvoices && !invSel && (
          <div style={{}}>
            <RefreshAndProgress msgMsg={isProcessing ? 'Processing...' : null} isMsgAnimRefresh isDim={isProcessing} isRelative>
              <TableExt
                defaultSort={{ field: 'billingPeriodEnd' }}
                notsaveSortState={'invoices_list'}
                dataSource={invoicesList}
                columns={columns}
                calcLink={(row) => ['/' + PartsLink.profile + '/' + UserProfileSection.invoices, 'invoiceId=' + Utils.encodeQueryParam(row.invoiceId)]}
                calcKey={(r1) => r1.invoiceId}
              />
            </RefreshAndProgress>
          </div>
        )}
      </div>
    </div>
  );
});

export default ProfileInvoices;
