import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import BillingCheckoutForm from '../BillingCheckoutForm/BillingCheckoutForm';
import Link from '../Link/Link';
import ProfileBillingPrices from '../ProfileBillingPrices/ProfileBillingPrices';
import { loadStripe } from '@stripe/stripe-js';
import StoreActions from '../../stores/actions/StoreActions';
import { useAppSelector } from '../../../core/hooks';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import { BillingModalWithStripeProps } from './types';

const s = require('./BillingModal.module.css');
const sd = require('../antdUseDark.module.css');
const { confirm } = Modal;

export const BillingModalWithStripe = ({ stripeAuthKey, canShow, forceTest }: BillingModalWithStripeProps) => {
  const confirmRef = useRef(null);
  const [stripePromise, setStripePromise] = useState(null);

  const { authUser } = useAppSelector((state) => ({
    authUser: state.authUser,
  }));

  const authUserInfo = useMemo(() => {
    return calcAuthUserIsLoggedIn();
  }, [authUser]);

  const onFinishConfirm = () => {
    StoreActions.getAuthUser_();
  };

  const showModal = () => {
    if (confirmRef.current) {
      return;
    }

    confirmRef.current = confirm({
      title: null,
      icon: null,
      okText: 'Ok',
      okType: 'primary',
      cancelText: 'Cancel',
      okButtonProps: { style: { display: 'none' } },
      cancelButtonProps: { style: { display: 'none' } },
      maskClosable: false,
      className: s.modalWin,
      centered: true,
      width: 864,
      content: (
        <div
          css={`
            height: 460px;
            display: flex;
            flex-wrap: nowrap;
            background-color: #0b131e;
          `}
        >
          <div
            css={`
              position: absolute;
              top: -8px;
              right: -10px;
              background: black;
              border-radius: 15px;
              border: 1px solid #282828;
              padding: 0 12px 2px 12px;
            `}
          >
            <Link to={'/sign_out'} noApp>
              <span
                css={`
                  font-size: 12px !important;
                  color: rgba(255, 255, 255, 0.3);
                  font-weight: 200 !important;
                  :hover {
                    color: rgba(255, 255, 255, 0.6);
                  }
                `}
                style={{ cursor: 'pointer' }}
                className={sd.styleTextBlue}
              >
                Log out
              </span>
            </Link>
          </div>

          <div
            css={`
              padding: 16px 24px;
              flex: 1;
            `}
          >
            {/*// @ts-ignore*/}
            <Elements stripe={stripePromise}>
              <BillingCheckoutForm isModal={true} setAsDefault={true} hideTrial={true} onClose={null} onFinishConfirm={onFinishConfirm} />
            </Elements>
          </div>
          <div
            css={`
              padding: 43px 60px;
              width: 391px;
              background-color: #19232f;
            `}
          >
            <ProfileBillingPrices isModal />
          </div>
        </div>
      ),
      onOk: () => {
        //
      },
      onCancel: () => {
        //
      },
    });
  };

  useEffect(() => {
    if (stripeAuthKey && stripePromise == null) {
      const stripePro = loadStripe(stripeAuthKey);
      setStripePromise(stripePro);
    }
  }, [stripeAuthKey, stripePromise]);

  useEffect(() => {
    if ((authUserInfo?.needBilling || forceTest) && !authUserInfo?.isInternal && stripePromise != null && canShow) {
      showModal();
    } else if (authUserInfo?.needBilling === false) {
      if (confirmRef.current != null) {
        confirmRef.current.destroy();
        confirmRef.current = null;
      }
    }
  }, [stripePromise, authUserInfo, canShow, forceTest]);

  useEffect(() => {
    return () => {
      if (confirmRef.current != null) {
        confirmRef.current.destroy();
        confirmRef.current = null;
      }
    };
  }, []);

  return <></>;
};
