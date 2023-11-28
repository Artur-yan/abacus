import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { css } from 'styled-components';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
const s = require('./PriceLists.module.css');
const sd = require('../antdUseDark.module.css');

interface IPriceListsExampleProps {
  leftBackLinear?: string;
  leftIconSrc?: string;
  leftTitle?: string;
  leftSubtitle?: string;
}

const PriceListsExample = React.memo((props: PropsWithChildren<IPriceListsExampleProps>) => {
  return (
    <div
      css={`
        display: flex;
        width: 100%;
        margin-bottom: 40px;
      `}
    >
      <div
        css={`
          background: ${props.leftBackLinear};
          width: 300px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-top-left-radius: 16px;
          border-bottom-left-radius: 16px;
        `}
      >
        <div
          css={`
            display: flex;
            flex-flow: column;
            text-align: center;
          `}
        >
          <div
            css={`
              text-align: center;
            `}
          >
            <span
              css={`
                background-color: white;
                border-radius: 16px;
                padding: 30px;
                display: inline-block;
              `}
            >
              <img
                src={calcImgSrc(props.leftIconSrc)}
                alt={''}
                css={`
                  width: 120px;
                `}
              />
            </span>
          </div>
          <div
            css={`
              margin-top: 10px;
              font-family: Matter;
              font-size: 20px;
              font-weight: 600;
              line-height: 1.58;
              letter-spacing: 0.6px;
              text-align: center;
              color: #ffffff;
            `}
          >
            {props.leftTitle}
          </div>
          <div
            css={`
              font-family: Matter;
              font-size: 20px;
              line-height: 1.58;
              letter-spacing: 0.6px;
              text-align: center;
              color: #ffffff;
              font-weight: 500;
            `}
          >
            {props.leftSubtitle}
          </div>
        </div>
      </div>
      <div
        css={`
          flex: 1;
          background-color: white;
          border-top-right-radius: 16px;
          border-bottom-right-radius: 16px;
          padding: 40px;
        `}
      >
        {props.children}
      </div>
    </div>
  );
});

const cssInsideTitle = css`
  font-family: Roboto;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.75px;
  color: #3c4852;
`;
const cssInsideSubitems = css`
  margin-left: 40px;
  line-height: 2;
  font-family: Matter;
  font-size: 18px;
  line-height: 2;
  letter-spacing: 0.62px;
  color: #526080;
`;
const cssInsideTotal = css`
  line-height: 2;
  font-family: Matter;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.75px;
  color: #38bfa1;
`;

const cssTitle = css`
  color: #f1f1f1;
  letter-spacing: 0.05px;
  text-align: center;
  font-size: 32px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  margin-top: 40px;
`;
const cssSubTitle = css`
  color: #f1f1f1;
  text-align: center;
  font-size: 20px;
  font-family: Matter, sans-serif;
  font-weight: 500;
  letter-spacing: 0.35px;
  margin-top: 12px;
`;
const cssHeader = css`
  color: #00f8c5;
  letter-spacing: 0.42px;
  font-size: 24px;
  font-family: Matter, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 34px;
  text-align: center;
`;
const cssText1center = css`
  color: #ffffff;
  letter-spacing: 0.78px;
  line-height: 1.78;
  font-size: 16px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  margin-top: 6px;
  text-align: center;
`;
const cssText1 = css`
  color: #ffffff;
  letter-spacing: 0.78px;
  line-height: 1.78;
  font-size: 16px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  margin-top: 6px;
`;
const cssTableHeader = css`
  color: #ffffff;
  letter-spacing: 0.02px;
  font-size: 14px;
  font-family: Roboto, sans-serif;
  font-weight: 600;
  background-color: rgba(140, 84, 255, 0.5);
  border: 2px solid rgb(19, 27, 38);
  text-transform: uppercase;
  padding: 12px 20px;
`;
const cssTableCell = css`
  color: #23305e;
  letter-spacing: 0.02px;
  font-size: 17px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  border: 2px solid rgb(19, 27, 38);
  padding: 12px 20px;
  background-color: white;
  width: 280px;
`;
const cssTableCellRight = css`
  color: #23305e;
  letter-spacing: 0.02px;
  font-size: 16px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  border: 2px solid rgb(19, 27, 38);
  padding: 12px 20px;
  background-color: white;
  width: 516px;
`;

interface IPriceListsProps {
  isFull?: boolean;
}

const PriceLists = React.memo((props: PropsWithChildren<IPriceListsProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [rates, setRates] = useState(null);
  const [ratesFree, setRatesFree] = useState(null);

  useEffect(() => {
    REClient_.client_()._getRates((err, res) => {
      if (!err && res?.result) {
        setRates(res?.result ?? null);
      } else {
        Utils.error(err || 'Error');
        setRates(null);
      }
    });
    REClient_.client_()._getFreeTier((err, res) => {
      if (!err && res?.result) {
        setRatesFree(res?.result ?? null);
      } else {
        Utils.error(err || 'Error');
        setRatesFree(null);
      }
    });
  }, []);

  const formatterNum = new Intl.NumberFormat('en-US', {});
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div
      css={`
        max-width: 1000px;
        margin: 0 auto;
      `}
    >
      <div css={cssTitle}>{Constants.flags.product_name} Pricing</div>
      <div css={cssSubTitle}>
        With {Constants.flags.product_name}, you only pay for what you use. <b>There are no minimum or upfront fees.</b>
      </div>
      <div css={cssHeader}>Try {Constants.flags.product_name} for FREE!</div>
      <div css={cssText1center}>
        As part of the free tier, you can train and evaluate models and generate realtime and batch predictions. There is no limit on the number of user accounts. You are welcome to invite any number of team members to collaborate on our
        service.
        <br />
        <br />
        As part of the free-tier, we offer:
      </div>

      <div style={{ marginTop: '12px' }}>
        <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td css={cssTableHeader} style={{ textAlign: 'right' }}>
                FREE TIER CREDITS
              </td>
              <td css={cssTableHeader}>Quantity</td>
              <td css={cssTableHeader}>Description</td>
            </tr>

            <tr>
              <td css={cssTableHeader} style={{ textAlign: 'right' }}>
                Training
              </td>
              <td css={cssTableCell}>{ratesFree?.training == null ? '' : formatterNum.format(ratesFree?.training) + ' Training Hours FREE'}</td>
              <td css={cssTableCellRight}>
                One Training Hour is the equivalent of 1 hour of compute time on a machine that has 8v CPUs and 16 GiB memory. It is expected that most models will take anywhere between 3-5 Training Hours to finish training. With the free
                tier, you get 20 hours of training time for free.
              </td>
            </tr>
            <tr>
              <td css={cssTableHeader} style={{ textAlign: 'right' }}>
                Real-Time Predictions
              </td>
              <td css={cssTableCell}>{ratesFree?.deployment == null ? '' : formatterNum.format(ratesFree?.deployment) + ' QPS-Hours FREE'}</td>
              <td css={cssTableCellRight}>1 QPS-hr is the amount of compute required to serve model predictions at 1 Query-per-Second for an hour (QPS-hr). With the free tier, you get 20 free QPS-hrs.</td>
            </tr>
            <tr>
              <td css={cssTableHeader} style={{ textAlign: 'right' }}>
                Batch Predictions
              </td>
              <td css={cssTableCell}>{ratesFree?.batch == null ? '' : formatterNum.format(ratesFree?.batch) + ' predictions FREE'}</td>
              <td css={cssTableCellRight}>The number of batch predictions generated using our batch API.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div css={cssHeader} style={{ marginTop: '80px' }}>
        Pay-per-use pricing
      </div>
      <div css={cssText1center}>You only pay for what you use. You can stop your model training or your model deployments at any time.</div>

      <div style={{ marginTop: '12px' }}>
        <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td css={cssTableHeader} style={{ textAlign: 'right' }}>
                Pay-per-use pricing
              </td>
              <td css={cssTableHeader}>Quantity</td>
              <td css={cssTableHeader}>Description</td>
            </tr>

            <tr>
              <td css={cssTableHeader} style={{ textAlign: 'right' }}>
                Training
              </td>
              <td css={cssTableCell}>{rates?.train?.base?.rate == null ? '' : formatter.format((rates?.train?.base?.rate ?? 0) / 100) + ' / ' + rates?.train?.base?.unit}</td>
              <td css={cssTableCellRight}>
                One Training Hour is the equivalent of 1 hour of compute time on a machine that has 8v CPUs and 16 GiB memory. It is expected that most models will take anywhere between 3-10 Training Hours to finish training.
              </td>
            </tr>
            <tr>
              <td css={cssTableHeader} style={{ textAlign: 'right' }}>
                Real-Time Predictions
              </td>
              <td css={cssTableCell}>{rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100) + ' / ' + rates?.inference?.qps?.unit}</td>
              <td css={cssTableCellRight}>
                1 QPS-hr is the amount of compute required to serve model predictions at 1 Query-Per-Second for an hour (QPS-hr). You can generate 3600 real-time predictions every hour at a throughput of 1 QPS-hr. Apps/sites with 1 million
                monthly-active-visitors need no more than 5 QPS-hrs of compute.
              </td>
            </tr>
            <tr>
              <td css={cssTableHeader} style={{ textAlign: 'right' }}>
                Batch Predictions
              </td>
              <td css={cssTableCell}>{rates?.batch?.predictions?.rate == null ? '' : formatter.format((rates?.batch?.predictions?.rate ?? 0) / 100) + ' / ' + rates?.batch?.predictions?.unit}</td>
              <td css={cssTableCellRight}>Batch predictions are charged for every 1000 predictions that are generated.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div css={cssHeader} style={{ marginTop: '80px' }}>
        Pricing Examples
      </div>
      <div css={cssText1center}>To help you understand how much this translates in terms of your monthly bill here are some examples</div>
      <br />
      <div style={{ marginTop: '12px' }}>
        <PriceListsExample
          leftIconSrc={'/imgs/useCase_UserRecommendations.png'}
          leftBackLinear={'radial-gradient(circle at 49% 65%, #2b61ff, #2b61ff, #2b61ff, #2b5ffc 1%, #001656 65%)'}
          leftTitle={'PRICING EXAMPLE 1'}
          leftSubtitle={'Personalized Recommendations'}
        >
          <div
            css={`
              font-family: Matter;
              font-size: 24px;
              font-weight: 600;
              letter-spacing: 0.36px;
              color: #2e5bff;
            `}
          >
            Pricing example 1 - Personalized Recommendations
          </div>
          <div
            css={`
              margin-top: 10px;
              font-family: Roboto;
              font-size: 16px;
              font-weight: 500;
              line-height: 1.38;
              letter-spacing: 0.4px;
              color: #3c4852;
            `}
          >
            A e-commerce company uses Abacus.AI’s for personalized recommendations and has peak traffic of 5 queries per second and has 100K monthly purchases
          </div>
          <br />
          <br />
          <div css={cssInsideTitle}>Training costs:</div>
          <div css={cssInsideSubitems}>
            Training hours needed per model run: 3 training hrs
            <br />
            Number of times model trained: daily
            <br />
            Monthly training cost: 3 x {rates?.train?.base?.rate == null ? '' : formatter.format((rates?.train?.base?.rate ?? 0) / 100)} x 30 ={' '}
            {rates?.train?.base?.rate == null ? '' : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 30 * 3)}
          </div>
          <br />
          <div css={cssInsideTitle}>Prediction costs:</div>
          <div css={cssInsideSubitems}>
            Peak traffic: 5 queries per second
            <br />
            Peak queries: 5 queries per second
            <br />
            Buffer: +2 queries per second
            <br />
            Total provisioned QPS: 7 queries per second
            <br />
            Cost of predictions: 7 * {rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100)} per QPS-hr ={' '}
            {rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.inference?.qps?.rate ?? 0) / 100) * 7)} per QPS-hr
            <br />
            Monthly prediction cost: {rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.inference?.qps?.rate ?? 0) / 100) * 7)} x 24 x 30 ={' '}
            {rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.inference?.qps?.rate ?? 0) / 100) * 7 * 24 * 30)}
          </div>
          <br />
          <div css={cssInsideTotal}>
            <span
              css={`
                color: black;
              `}
            >
              Total monthly bill:
            </span>{' '}
            {rates?.train?.base?.rate == null ? '' : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 30 * 3)} +{' '}
            {rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.inference?.qps?.rate ?? 0) / 100) * 7 * 24 * 30)} ={' '}
            {rates?.train?.base?.rate == null || rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 30 * 3 + ((rates?.inference?.qps?.rate ?? 0) / 100) * 7 * 24 * 30)}
          </div>
        </PriceListsExample>

        <PriceListsExample leftIconSrc={'/imgs/usecase_69d038e82.png'} leftBackLinear={'radial-gradient(circle at 48% 46%, #ffc036, #db9100 68%)'} leftTitle={'PRICING EXAMPLE 2'} leftSubtitle={'Demand Forecasting'}>
          <div
            css={`
              font-family: Matter;
              font-size: 24px;
              font-weight: 600;
              letter-spacing: 0.36px;
              color: #e7a011;
            `}
          >
            Pricing example 2 - Demand Forecasting
          </div>
          <div
            css={`
              margin-top: 10px;
              font-family: Roboto;
              font-size: 16px;
              font-weight: 500;
              line-height: 1.38;
              letter-spacing: 0.4px;
              color: #3c4852;
            `}
          >
            A manufacturer uses Abacus.AI for Demand Forecasting. The manufacturer has 2000 SKUs and forecasts demand weekly
          </div>
          <br />
          <div css={cssInsideTitle}>Training costs:</div>
          <div css={cssInsideSubitems}>
            Training hrs needed per model run: 6 training hours
            <br />
            Number of times model trained: weekly
            <br />
            Monthly training cost: 6 x {rates?.train?.base?.rate == null ? '' : formatter.format((rates?.train?.base?.rate ?? 0) / 100)} x 4 ={' '}
            {rates?.train?.base?.rate == null ? '' : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 6 * 4)}
          </div>
          <br />
          <div css={cssInsideTitle}>Prediction console costs:</div>
          <div css={cssInsideSubitems}>
            Peak Traffic: 1 query per second
            <br />
            Total queries QPS: 1 query per second
            <br />
            Cost of predictions: 1* {rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100)} per QPS-hr ={' '}
            {rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100)} per QPS-hr
            <br />
            Monthly prediction cost: {rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100)} x 24 x 30 ={' '}
            {rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.inference?.qps?.rate ?? 0) / 100) * 24 * 30)}
          </div>
          <br />
          <div css={cssInsideTitle}>Batch prediction costs:</div>
          <div css={cssInsideSubitems}>
            Batch prediction cost: {rates?.batch?.predictions?.rate == null ? '' : formatter.format((rates?.batch?.predictions?.rate ?? 0) / 100)}/1000 predictions
            <br />
            Number of batch predictions in a month: 4 x 2000 = 8000
            <br />
            Monthly batch prediction cost: {rates?.batch?.predictions?.rate == null ? '' : formatter.format(((rates?.batch?.predictions?.rate ?? 0) / 100) * 8)}
          </div>
          <br />
          <div css={cssInsideTotal}>
            <span
              css={`
                color: black;
              `}
            >
              Total monthly bill:
            </span>{' '}
            {rates?.train?.base?.rate == null ? '' : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 6 * 4)} + {rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.inference?.qps?.rate ?? 0) / 100) * 24 * 30)} +{' '}
            {rates?.batch?.predictions?.rate == null ? '' : formatter.format(((rates?.batch?.predictions?.rate ?? 0) / 100) * 8)} ={' '}
            {rates?.train?.base?.rate == null || rates?.inference?.qps?.rate == null || rates?.batch?.predictions?.rate == null
              ? ''
              : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 6 * 4 + ((rates?.inference?.qps?.rate ?? 0) / 100) * 24 * 30 + ((rates?.batch?.predictions?.rate ?? 0) / 100) * 8)}
          </div>
        </PriceListsExample>

        <PriceListsExample leftIconSrc={'/imgs/hp_predicting.png'} leftBackLinear={'radial-gradient(circle at 50% 46%, #db403e, #8d13c1 95%)'} leftTitle={'PRICING EXAMPLE 3'} leftSubtitle={'Predictive Modeling'}>
          <div
            css={`
              font-family: Matter;
              font-size: 24px;
              font-weight: 600;
              letter-spacing: 0.36px;
              color: #db2d9a;
            `}
          >
            Pricing Example 3 - Predictive Modeling
          </div>
          <div
            css={`
              margin-top: 10px;
              font-family: Roboto;
              font-size: 16px;
              font-weight: 500;
              line-height: 1.38;
              letter-spacing: 0.4px;
              color: #3c4852;
            `}
          >
            A customer wants to predict the lead score for all their marketing leads from advertising campaigns.
          </div>
          <br />
          <br />
          <div css={cssInsideTitle}>Training costs:</div>
          <div css={cssInsideSubitems}>
            Training hrs needed per model run: 6 training hours
            <br />
            Number of times model trained: weekly
            <br />
            Monthly training cost: 6 x {rates?.train?.base?.rate == null ? '' : formatter.format((rates?.train?.base?.rate ?? 0) / 100)} x 4 ={' '}
            {rates?.train?.base?.rate == null ? '' : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 4 * 6)}
          </div>
          <br />
          <div css={cssInsideTitle}>Prediction console costs:</div>
          <div css={cssInsideSubitems}>
            Peak Traffic: 1 query per second
            <br />
            Total queries QPS: 1 query per second
            <br />
            Cost of predictions: 1* {rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100)} per QPS-hr ={' '}
            {rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100)} per QPS-hr
            <br />
            Monthly prediction cost: {rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100)} x 24 x 30 ={' '}
            {rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.inference?.qps?.rate ?? 0) / 100) * 24 * 30)}
          </div>
          <br />
          <div css={cssInsideTitle}>Batch prediction costs:</div>
          <div css={cssInsideSubitems}>
            Batch prediction cost: {rates?.batch?.predictions?.rate == null ? '' : formatter.format((rates?.batch?.predictions?.rate ?? 0) / 100)}/1000 predictions
            <br />
            Number of batch predictions in a month: 4 x 20000 = 80000
            <br />
            Monthly batch prediction cost: {rates?.batch?.predictions?.rate == null ? '' : formatter.format(((rates?.batch?.predictions?.rate ?? 0) / 100) * 80)}
          </div>
          <br />
          <div css={cssInsideTotal}>
            <span
              css={`
                color: black;
              `}
            >
              Total monthly bill:
            </span>{' '}
            {rates?.train?.base?.rate == null ? '' : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 4 * 6)} + {rates?.inference?.qps?.rate == null ? '' : formatter.format(((rates?.inference?.qps?.rate ?? 0) / 100) * 24 * 30)} +{' '}
            {rates?.batch?.predictions?.rate == null ? '' : formatter.format(((rates?.batch?.predictions?.rate ?? 0) / 100) * 80)} ={' '}
            {rates?.train?.base?.rate == null || rates?.inference?.qps?.rate == null || rates?.batch?.predictions?.rate == null
              ? ''
              : formatter.format(((rates?.train?.base?.rate ?? 0) / 100) * 4 * 6 + ((rates?.inference?.qps?.rate ?? 0) / 100) * 24 * 30 + ((rates?.batch?.predictions?.rate ?? 0) / 100) * 80)}
          </div>
        </PriceListsExample>
      </div>

      <div style={{ height: '80px' }}>&nbsp;</div>
    </div>
  );
});

export default PriceLists;
