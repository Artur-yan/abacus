import React, { PropsWithChildren, useEffect, useMemo, useState, lazy, Suspense } from 'react';

import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import PartsLink from '../NavLeft/PartsLink';
import { useAppSelector } from '../../../core/hooks';
import { BillingModalWithStripeProps } from './types';
import Constants from '../../constants/Constants';

interface IBillingModalProps {}

const BillingModalWithStripeComponent: React.LazyExoticComponent<React.ComponentType<BillingModalWithStripeProps>> = lazy(() => import('./BillingModalWithStripe').then(({ BillingModalWithStripe }) => ({ default: BillingModalWithStripe })));

const BillingModal = React.memo((props: PropsWithChildren<IBillingModalProps>) => {
  const { paramsProp, authUser } = useAppSelector((state) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const authUser1 = useMemo(() => {
    return calcAuthUserIsLoggedIn();
  }, [authUser]);

  const [stripeAuthKey, setStripeAuthKey] = useState<string>(null);

  const forceTest = false;

  let canShow =
    forceTest ||
    (!Utils.isNullOrEmpty(paramsProp?.get('mode')) &&
      ![
        PartsLink.price_lists,
        PartsLink.root,
        PartsLink.finish_billing,
        PartsLink.type_access,
        PartsLink.main,
        PartsLink.accept_invite,
        PartsLink.signin,
        PartsLink.signup,
        PartsLink.signin_verify_account,
        PartsLink.signin_reset_password,
        PartsLink.signin_forgot_new,
        PartsLink.signin_password,
        PartsLink.profile,
      ].includes(paramsProp?.get('mode')));
  if (window['anyError'] === true) {
    canShow = false;
  }

  useEffect(() => {
    if ((authUser1?.needBilling || forceTest) && !authUser1?.isInternal && canShow && !Constants.flags.onprem) {
      REClient_.client_()._getPublicKey((err, res) => {
        if (!err && res?.result) {
          setStripeAuthKey(res?.result);
        }
      });
    }
  }, [authUser1, canShow]);

  return stripeAuthKey ? (
    <Suspense fallback={<>Loading...</>}>
      <BillingModalWithStripeComponent stripeAuthKey={stripeAuthKey} canShow forceTest />
    </Suspense>
  ) : (
    <></>
  );
});

export default BillingModal;
