import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./BillingList.module.css');
const sd = require('../antdUseDark.module.css');

interface IBillingListProps {
  refreshCardsId?: string;
}

const BillingList = React.memo((props: PropsWithChildren<IBillingListProps>) => {
  const { authUser } = useSelector((state: any) => ({
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [cardsList, setCardsList] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const retrieveCards = () => {
    if (isProcessing) {
      return;
    }
    REClient_.client_()._listPaymentMethods((err, res) => {
      if (!err && res?.result) {
        setCardsList(res?.result || []);
      } else {
        setCardsList([]);
      }
    });
  };

  useEffect(() => {
    retrieveCards();
  }, [props.refreshCardsId]);

  const removeCardById = (id) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    REClient_.client_()._deletePaymentMethod(id, (err, res) => {
      setIsProcessing(false);
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Payment Method Removed');
        StoreActions.getAuthUser_();
        retrieveCards();
      }
    });
  };

  const setDefaultCardAPI = (id) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    REClient_.client_()._setDefaultPaymentMethod(id, (err, res) => {
      setIsProcessing(false);
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Default Payment Method Changed');
        retrieveCards();
      }
    });
  };

  const columns: ITableExtColumn[] = [
    {
      title: 'Default',
      render: (text, row, index) => {
        if (row.default) {
          return (
            <span>
              <Button style={{ marginBottom: '4px', marginRight: '5px', color: '#70c15b', borderColor: '#70c15b' }} type={'primary'} ghost>
                Default
              </Button>
            </span>
          );
        } else {
          return (
            <span style={{ width: '110px', display: 'inline-block' }}>
              <span className={s.setDefault}>
                <Button onClick={() => setDefaultCardAPI(row.id)} style={{ transition: '1s all', marginBottom: '4px', marginRight: '5px' }} type={'default'} ghost>
                  Set<span className={s.setDefaultName}>&nbsp;Default</span>
                </Button>
              </span>
            </span>
          );
        }
      },
    },
    {
      field: 'created',
      title: 'Created At',
      render: (text, row, index) => {
        if (!text) {
          return '-';
        } else {
          return moment.unix(text).utc().format('LLL');
        }
      },
    },
    {
      field: ['card', 'brand'],
      title: 'Brand',
      isLinked: true,
      render: (text, row, index) => {
        return Utils.upperFirst(text) || '-';
      },
    },
    {
      field: ['card', 'last4'],
      title: 'Last 4 Digits',
      render: (text, row, index) => {
        return text || '-';
      },
    },
    {
      field: ['card', 'exp_year'],
      title: 'Expiration',
      render: (text, row, index) => {
        return (row.card?.exp_month ?? '-') + '/' + (row.card?.exp_year ?? '-');
      },
    },
    {
      field: ['billing_details', 'name'],
      title: 'Cardholder',
    },
    {
      noAutoTooltip: true,
      noLink: true,
      title: 'Actions',
      render: (text, row, index) => {
        return (
          <span>
            {!row.default && (
              <ModalConfirm
                onConfirm={() => removeCardById(row.id)}
                title={`Are you sure you want to remove the card ending in ${row.card?.last4}?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Delete'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button style={{ marginBottom: '4px', marginRight: '5px' }} danger ghost>
                  Remove
                </Button>
              </ModalConfirm>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <RefreshAndProgress isRelative msgMsg={isProcessing ? 'Processing...' : null} isMsgAnimRefresh isDim={isProcessing}>
      <TableExt showEmptyIcon={true} defaultSort={{ field: 'created' }} notsaveSortState={'billing_cards_list'} height={null} dataSource={cardsList} columns={columns} calcKey={(r1) => r1.id} calcLink={null} />
    </RefreshAndProgress>
  );
});

export default BillingList;
