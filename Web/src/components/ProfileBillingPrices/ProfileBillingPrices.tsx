import Button from 'antd/lib/button';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useReducer, useState } from 'react';
import styled, { css } from 'styled-components';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';

const s = require('./ProfileBillingPrices.module.css');
const sd = require('../antdUseDark.module.css');

const cssTextRightTitle = css`
  font-family: Matter;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.17;
  letter-spacing: 0.03px;
  color: var(--white);
`;

const cssTextRight = css`
  display: table-cell;
  font-family: Matter;
  font-size: 16px;
  line-height: 2;
  color: #d1e4f5;
  width: 130px;
`;

const cssTextRightValue = css`
  display: table-cell;
  font-family: Roboto;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.31;
  color: #d1e4f5;
`;

const PriceTitleMobile = styled.div`
  padding: 10px 16px;
  background-color: #23305e;
  border-radius: 1px;

  display: flex;
  justify-content: center;
  align-items: center;

  color: #38bfa1;
  line-height: 1.33;
  font-size: 18px;
  font-family: Matter, sans-serif;
  font-weight: 400;
`;

const SubtitleDescMobile = styled.div`
  color: #38bfa1;
  line-height: 1.29;
  font-size: 14px;
  font-family: Matter, sans-serif;
  font-weight: 400;
  margin-bottom: 9px;
`;

const PriceContentMobile = styled.div`
  background-color: #0c121b;
  border-radius: 1px;
  padding: 13px 16px;
`;

const PriceNameMobile = styled.div`
  color: #8798ad;
  line-height: 1.38;
  font-size: 14px;
  font-family: Matter, sans-serif;
  font-weight: 600;
`;

const PriceValueMobile = styled.span`
  color: #ffffff;
  line-height: 1.38;
  font-size: 14px;
  font-family: Matter, sans-serif;
  font-weight: 400;
`;

const PriceLineMobile = styled.div`
  margin-top: ${(props) => props.top ?? 0}px;
  margin-bottom: 7px;
`;

const TopTitle = styled.div`
  color: #ffffff;
  line-height: 1.33;
  font-size: 24px;
  font-family: Matter;
  font-weight: 400;
`;

interface IProfileBillingPricesProps {
  isFull?: boolean;
  isModal?: boolean;
}

const ProfileBillingPrices = React.memo((props: PropsWithChildren<IProfileBillingPricesProps>) => {
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [rates, setRates] = useState(null);
  const [ratesFree, setRatesFree] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    REClient_.client_()._getCurrentUsage(undefined, undefined, undefined, (err, res) => {
      if (!err && res?.result) {
        setUsage(res?.result);
        let dt1 = moment(res?.result?.start).utc();
        if (!dt1.isValid()) {
          dt1 = null;
        }
        // setStartBillDate(dt1);
        // setTotals(res?.result?.totals || {});
      } else {
        setUsage(null);
        // setTotals({});
      }
    });
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

  let styleRoot: CSSProperties = {};
  if (props.isFull) {
    styleRoot = {
      margin: '30px auto',
      maxWidth: '920px',
    };
  }

  const formatterNum = new Intl.NumberFormat('en-US', {});
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  if (props.isModal) {
    return (
      <div>
        <div css={cssTextRightTitle}>Remaining Free Trial Credits</div>
        <div>
          <div
            css={`
              margin-top: 20px;
              display: table;
            `}
          >
            <span css={cssTextRight}>Training Hours:</span>
            <span css={cssTextRightValue}>{formatterNum.format(usage?.estimatedCreditsRemaining?.training ?? 0)} Hrs</span>
          </div>
          <div
            css={`
              margin-top: 7px;
              display: table;
            `}
          >
            <span css={cssTextRight}>Predictions:</span>
            <span css={cssTextRightValue}>{formatterNum.format(usage?.estimatedCreditsRemaining?.deployment ?? 0)} QPS-Hrs</span>
          </div>
        </div>

        <div
          css={`
            margin-top: 30px;
          `}
        ></div>
        <div css={cssTextRightTitle}>{Constants.flags.product_name} Pricing</div>
        <div>
          <div
            css={`
              margin-top: 20px;
              display: table;
            `}
          >
            <span css={cssTextRight}>Training Hours:</span>
            <span css={cssTextRightValue}>{rates?.train?.base?.rate == null ? '' : formatter.format((rates?.train?.base?.rate ?? 0) / 100) + ' / ' + rates?.train?.base?.unit}</span>
          </div>
          <div
            css={`
              margin-top: 7px;
              display: table;
            `}
          >
            <span css={cssTextRight}>Predictions:</span>
            <span css={cssTextRightValue}>
              {rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100) + ' / ' + rates?.inference?.qps?.unit}{' '}
              <Link newWindow usePointer to={'/app/price_lists'}>
                (Learn more)
              </Link>
            </span>
          </div>
        </div>

        <div
          css={`
            margin-top: 30px;
            font-family: Roboto;
            font-size: 16px;
            font-weight: 500;
            line-height: 1.81;
            text-align: center;
          `}
          className={sd.linkBlue}
        >
          <Link newWindow usePointer to={'/app/price_lists'}>
            Detailed Pricing Information
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styleRoot}>
      <div style={{ margin: '20px 30px 0 30px' }}>
        <TopTitle>{'Pricing'}</TopTitle>

        <div style={{ marginTop: '14px', paddingBottom: '30px', borderTop: '1px solid white' }} />

        <div style={{ display: 'flex' }}>
          <div>
            <div style={{ display: 'flex' }}>
              <div style={{ flex: 1 }}>
                <PriceTitleMobile>Start Free Trial</PriceTitleMobile>
                <PriceContentMobile>
                  <SubtitleDescMobile>With the free trial you can train models and generate Predictions for FREE!</SubtitleDescMobile>
                  <PriceLineMobile>
                    <PriceNameMobile>Training:</PriceNameMobile>
                    <PriceValueMobile>{ratesFree?.training == null ? '' : formatterNum.format(ratesFree?.training) + ' Training Hours FREE'}</PriceValueMobile>
                  </PriceLineMobile>
                  <PriceLineMobile>
                    <PriceNameMobile>Real-time Predictions:</PriceNameMobile>
                    <PriceValueMobile>{ratesFree?.deployment == null ? '' : formatterNum.format(ratesFree?.deployment) + ' QPS-Hours FREE'}</PriceValueMobile>
                  </PriceLineMobile>
                  <PriceLineMobile>
                    <PriceNameMobile>Batch Predictions:</PriceNameMobile>
                    <PriceValueMobile>{ratesFree?.batch == null ? '' : formatterNum.format(ratesFree?.batch) + ' Predictions FREE'}</PriceValueMobile>
                  </PriceLineMobile>
                </PriceContentMobile>

                <div style={{ marginTop: '30px' }}></div>

                <PriceTitleMobile>Pay-per Use</PriceTitleMobile>
                <PriceContentMobile>
                  <SubtitleDescMobile>After Free Trial, you will be charged pay-per-use. No upfront pricing.</SubtitleDescMobile>
                  <PriceLineMobile>
                    <PriceNameMobile>Training:</PriceNameMobile>
                    <PriceValueMobile>{rates?.train?.base?.rate == null ? '' : formatter.format((rates?.train?.base?.rate ?? 0) / 100) + ' / training ' + rates?.train?.base?.unit}</PriceValueMobile>
                  </PriceLineMobile>
                  <PriceLineMobile>
                    <PriceNameMobile>Real-time Predictions:</PriceNameMobile>
                    <PriceValueMobile>{rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100) + ' / ' + rates?.inference?.qps?.unit}</PriceValueMobile>
                  </PriceLineMobile>
                  <PriceLineMobile>
                    <PriceNameMobile>Batch Predictions:</PriceNameMobile>
                    <PriceValueMobile>{rates?.batch?.predictions?.rate == null ? '' : formatter.format((rates?.batch?.predictions?.rate ?? 0) / 100) + ' / ' + rates?.batch?.predictions?.unit}</PriceValueMobile>
                  </PriceLineMobile>

                  <PriceLineMobile>
                    <PriceNameMobile>SLA</PriceNameMobile>
                    <PriceValueMobile>{Constants.flags.sla}</PriceValueMobile>
                  </PriceLineMobile>
                </PriceContentMobile>
              </div>
            </div>
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <Link to={['/' + PartsLink.finish_billing, 'prices=1']}>
                <Button type={'primary'} style={{ width: '80%' }}>
                  Continue
                </Button>
              </Link>
            </div>
            <div style={{ marginTop: '30px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProfileBillingPrices;
