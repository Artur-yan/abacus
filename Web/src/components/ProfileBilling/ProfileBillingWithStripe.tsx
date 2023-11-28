import React, { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import BillingCheckoutForm from '../BillingCheckoutForm/BillingCheckoutForm';
import { ProfileBillingWithStripeTypes } from './types';

export const ProfileBillingWithStripe = ({ isFull, doCloseConfirm, onFinishConfirm, stripeAuthKey }: ProfileBillingWithStripeTypes) => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    if (stripeAuthKey) {
      let stripePro = loadStripe(stripeAuthKey);
      setStripePromise(stripePro);
    }
  }, [stripeAuthKey]);

  return (
    <Elements stripe={stripePromise}>
      <BillingCheckoutForm setAsDefault={isFull} hideTrial={!isFull} onClose={doCloseConfirm} onFinishConfirm={onFinishConfirm} />
    </Elements>
  );
};
