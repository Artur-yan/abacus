import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Alert from 'antd/lib/alert';
import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
const s = require('./BillingCheckoutForm.module.css');
const sd = require('../antdUseDark.module.css');

const TopTitle = styled.div`
  color: white;
  line-height: 1.33;
  font-size: 24px;
  font-family: Matter, sans-serif;
  font-weight: 400;
  text-align: left;
`;

const BySubmittingYour = styled.div`
  color: #5b92b3;
  letter-spacing: 1.12px;
  font-size: 14px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  margin: 18px 0 30px 0;
  text-align: center;
`;

interface IBillingCheckoutFormProps {
  onClose?: (isDone: boolean) => void;
  onFinishConfirm?: () => void;
  hideTrial?: boolean;
  setAsDefault?: boolean;
  isModal?: boolean;
}

const BillingCheckoutForm = React.memo((props: PropsWithChildren<IBillingCheckoutFormProps>) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [clientPaymentId, setClientPaymentId] = useState(null);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    REClient_.client_()._addPaymentMethodIntent((err, res) => {
      if (err) {
        Utils.error(err);
      }

      if (!err && res?.result?.client_secret) {
        setClientSecret(res?.result?.client_secret);
      } else {
        setError(err || Constants.errorDefault);
      }
    });
  }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (processing || !clientSecret || !stripe || !formComplete || error) {
      return;
    }

    setProcessing(true);

    // let name1 = ev.target.name.value;
    const payload = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        // billing_details: {
        //   name: name1
        // }
      },
    });

    if (payload.error) {
      setError(`Card validation failed: ${payload.error.message}`);
      setProcessing(false);
      // eslint-disable-next-line no-console
      console.error(payload.error);
    } else {
      setError(null);
      Utils.log(payload?.setupIntent);

      REClient_.client_()._confirmPaymentMethodIntent((err, res) => {
        setProcessing(false);
        if (err) {
          setError(err || Constants.errorDefault);
        } else {
          if (props.setAsDefault) {
            const cardId = payload?.setupIntent?.payment_method;
            if (cardId) {
              REClient_.client_()._setDefaultPaymentMethod(cardId as any, (err, res) => {
                if (err) {
                  Utils.error(err);
                }
                setSucceeded(true);
              });
            } else {
              setSucceeded(true);
            }
          } else {
            setSucceeded(true);
          }
        }
      });
    }
  };

  const onClickFinishAll = (e) => {
    props.onFinishConfirm?.();
  };
  const renderSuccess = () => {
    return (
      <div style={{ display: succeeded ? 'block' : 'none' }}>
        <Alert message={'Your payment method is saved. You can now start your free trial.'} type="success" />

        <div style={{ marginTop: '30px' }}>
          <Button type={'primary'} htmlType={'submit'} onClick={onClickFinishAll}>
            {props.isModal ? 'Finish' : 'Start Free Trial'}
          </Button>
        </div>
      </div>
    );
  };

  const renderForm = () => {
    const options = {
      style: {
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a',
        },
      },
    };

    // const name = useRef('');
    const cardComplete = useRef(false);
    const onCardUpdated = (e) => {
      cardComplete.current = e.complete;
      setError(e.error?.message);
      setFormComplete(/*name.current && */ cardComplete.current);
    };
    const onNameUpdated = (e) => {
      // name.current = e.target.value || '';
      // setError(name.current?.length === 0 ? 'Cardholder Name is required' : null);
      // setFormComplete(/*name.current && */cardComplete.current);
    };

    let isDeclined = calcAuthUserIsLoggedIn()?.paymentError === true;

    return (
      <div style={{ display: succeeded ? 'none' : 'block' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', minWidth: '30px' }}>
          {!props.hideTrial && !Utils.isMobile() && <TopTitle>{'Start Free Trial'}</TopTitle>}
          {!props.hideTrial && !Utils.isMobile() && <div style={{ marginTop: '14px', paddingBottom: '16px', borderTop: '1px solid gray' }} />}
          {props.isModal && !Utils.isMobile() && (
            <div
              css={`
                font-family: Matter;
                font-size: 24px;
                line-height: 1.33;
                color: ${isDeclined ? '#ffc7c7' : '#ffffff'};
              `}
            >
              {isDeclined ? 'Your credit card declined, please update your credit card to continue' : 'Please enter credit card information to continue free trial'}
            </div>
          )}
          {props.isModal && !Utils.isMobile() && <div style={{ marginTop: '14px', paddingBottom: '16px', borderTop: '1px solid gray' }} />}

          {!props.hideTrial && <div style={{ fontSize: '15px', color: Utils.colorA(0.6), marginBottom: '24px', textAlign: 'center' }}>Before taking advantage of your free trial please add a payment method</div>}

          <div className="sr-combo-inputs">
            <div className="sr-combo-inputs-row">
              <CardElement className="sr-input sr-card-element" onChange={onCardUpdated} options={options} />
            </div>
          </div>

          {!props.isModal && <BySubmittingYour>We will email you when your free trial is close to being exhausted and you may cancel online at any time</BySubmittingYour>}
          {props.isModal && (
            <div
              css={`
                margin-top: 30px;
              `}
            ></div>
          )}

          {error && (
            <div
              css={`
                margin-bottom: 20px;
                margin-top: 0;
                padding-top: 0;
                color: red;
              `}
              className="message sr-field-error"
            >
              {error}
            </div>
          )}

          <Button type={'primary'} htmlType={'submit'} className="btn" disabled={processing}>
            {processing ? 'Processing…' : props.isModal ? 'Confirm' : 'Finish'}
          </Button>
        </form>
      </div>
    );
  };

  return (
    <div className="checkout-form">
      <div className="sr-payment-form">
        <div className="sr-form-row" />
        {renderSuccess()}
        {renderForm()}
      </div>
    </div>
  );
});

export default BillingCheckoutForm;
